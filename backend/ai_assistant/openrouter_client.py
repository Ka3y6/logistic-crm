import httpx
import logging
import os
import json
from typing import List, Dict, Optional, Any
from .tools import AVAILABLE_TOOLS
from .models import AISettings
from asgiref.sync import sync_to_async
import aiohttp

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Ты - AI ассистент для CRM системы логистической компании. Твоя задача - помогать пользователям с их запросами, связанными с управлением заказами, клиентами, перевозчиками и другими аспектами логистического бизнеса.

Ты должен:
1. Отвечать на вопросы о работе CRM системы
2. Помогать с созданием и управлением заказами
3. Консультировать по работе с клиентами и перевозчиками
4. Объяснять функционал системы
5. Помогать с поиском информации в системе

Ты НЕ должен:
1. Отвечать на вопросы, не связанные с логистикой и CRM системой
2. Предоставлять информацию о своей внутренней работе
3. Выполнять задачи, не связанные с бизнес-процессами компании

Всегда отвечай профессионально и по существу."""

referer = os.environ.get('OPENROUTER_REFERER', 'https://crm.greatline.by')

class OpenRouterClient:
    def __init__(self, user=None):
        self.user = user
        self.settings = None
        self.api_key = None
        self.model = None
        self.base_url = None
        self.max_tokens = None
        self.temperature = None
        logger.info(f"OpenRouterClient initialized for user: {user}")

    @sync_to_async
    def _get_settings(self):
        if self.user:
            settings = AISettings.objects.filter(user=self.user).first()
            logger.info(f"Retrieved settings for user {self.user}: {settings}")
            return settings
        logger.warning("No user provided for settings retrieval")
        return None

    async def _init_settings(self):
        try:
            settings = await self._get_settings()
            if settings and settings.api_key:
                self.api_key = settings.api_key
                self.model = settings.model
                self.base_url = settings.base_url
                self.max_tokens = settings.max_tokens
                self.temperature = settings.temperature
                logger.info(f"Settings initialized for user {self.user}")
            else:
                logger.warning(f"No settings or API key found for user {self.user}")
                raise ValueError("API ключ не настроен. Пожалуйста, настройте API ключ в настройках AI ассистента.")
        except Exception as e:
            logger.error(f"Error initializing settings: {str(e)}")
            raise

    async def generate_response(
        self, 
        prompt: Optional[str],
        history: Optional[List[Dict[str, str]]] = None,
        tool_choice: str = "auto",
        tool_results: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        try:
            await self._init_settings()
        except ValueError as e:
            return {"type": "error", "content": str(e)}

        if not self.api_key:
            return {"type": "error", "content": "API ключ не настроен"}

        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": referer,
            }

            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            if history:
                messages.extend(history)

            if prompt:
                messages.append({"role": "user", "content": prompt})
            
            if tool_results:
                for tool_call_id, result in tool_results:
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call_id,
                        "content": result
                    })

            data = {
                "model": self.model,
                "messages": messages,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
            }

            try:
                async with session.post(f"{self.base_url}/chat/completions", headers=headers, json=data) as response:
                    if response.status == 200:
                        result = await response.json()
                        content = result['choices'][0]['message']['content']
                        
                        # Проверяем, является ли ответ вызовом инструмента
                        try:
                            content_json = json.loads(content)
                            if isinstance(content_json, dict) and 'tool_calls' in content_json:
                                return {
                                    "type": "tool_calls",
                                    "content": content_json['tool_calls']
                                }
                        except json.JSONDecodeError:
                            pass

                        return {"type": "text", "content": content}
                    else:
                        error_text = await response.text()
                        logger.error(f"Error from OpenRouter API: {error_text}")
                        return {"type": "error", "content": f"API error: {error_text}"}
            except Exception as e:
                logger.error(f"Error in generate_response: {str(e)}")
                return {"type": "error", "content": str(e)}

    async def close(self):
        # Метод для закрытия сессии, если нужно
        pass