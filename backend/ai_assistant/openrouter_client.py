import httpx
import logging
import os
import json
from typing import List, Dict, Optional, Any
from .tools import AVAILABLE_TOOLS # Импортируем доступные инструменты

logger = logging.getLogger(__name__)

class OpenRouterClient:
    def __init__(self, api_key: Optional[str] = None, site_url: Optional[str] = None, app_name: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OpenRouter API key is required.")
        
        self.site_url = site_url or "http://localhost:3000" # Пример, если нужно
        self.app_name = app_name or "Logistic CRM AI Assistant"
        
        # Меняем модель на Claude 3 Haiku
        self.model = "google/gemini-flash-1.5-8b"
        
        self.base_url = "https://openrouter.ai/api/v1"
        self.client = httpx.AsyncClient(
            base_url="https://openrouter.ai/api/v1",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "HTTP-Referer": self.site_url,
                "X-Title": self.app_name,
            }
        )
        logger.info(f"OpenRouterClient initialized with model: {self.model}")

    async def generate_response(
        self, 
        prompt: Optional[str],
        history: Optional[List[Dict[str, str]]] = None,
        tool_choice: str = "auto",
        tool_results: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        messages = [
            {
                "role": "system",
                "content": """Вы - полезный ассистент для CRM системы.

ВАШИ ЗАДАЧИ:
1. На приветствия и общие вопросы отвечайте кратко и дружелюбно (только текстом).
2. Если пользователь просит создать задачу (например, "создай задачу", "добавь задачу", "напомни мне"), ваша цель - вызвать функцию `create_task_tool`.

КАК СОЗДАВАТЬ ЗАДАЧИ:
1. Проанализируйте запрос пользователя на наличие:
   - Явного указания на создание задачи.
   - Названия задачи (title).
   - Даты выполнения (deadline, формат **СТРОГО YYYY-MM-DD**). Если пользователь указывает относительную дату (например, "завтра", "послезавтра", "в пятницу"), **ВЫ ДОЛЖНЫ самостоятельно преобразовать её в точный формат YYYY-MM-DD** перед вызовом функции.
   - Описания (description, необязательно).
   - Приоритета (priority: low, medium, high, необязательно, по умолчанию medium).
2. Если **название** и **дата** задачи ПОНЯТНЫ из запроса (дата должна быть преобразована вами в YYYY-MM-DD):
   - Вызовите функцию `create_task_tool` с извлеченными параметрами. Ответьте **ТОЛЬКО** JSON-объектом для вызова функции. НЕ добавляйте никакого другого текста!
3. Если **название** ОТСУТСТВУЕТ или НЕПОНЯТНО:
   - Задайте **только** вопрос: "Как назвать задачу?". НЕ показывайте JSON, НЕ объясняйте формат, НЕ спрашивайте другие детали.
4. Если **название** ПОНЯТНО, но **дата** ОТСУТСТВУЕТ или НЕПОНЯТНА:
   - Задайте **только** вопрос: "На какую дату создать задачу?". НЕ показывайте JSON, НЕ объясняйте формат, НЕ спрашивайте другие детали.
5. После получения недостающей информации в следующем сообщении пользователя, вызовите `create_task_tool` с полными данными. Ответьте **ТОЛЬКО** JSON-объектом.

ФОРМАТ ВЫЗОВА ФУНКЦИИ (ДЛЯ ВАС, НЕ ПОКАЗЫВАТЬ ПОЛЬЗОВАТЕЛЮ):
{ "tool_calls": [ { "id": "call_123", "type": "function", "function": { "name": "create_task_tool", "arguments": "{\"title\": \"Название\", \"description\": \"Описание\", \"deadline\": \"YYYY-MM-DD\", \"priority\": \"medium\"}" } } ] }

ПРИМЕРЫ ДИАЛОГОВ (ДЛЯ ВАС, НЕ ПОКАЗЫВАТЬ ПОЛЬЗОВАТЕЛЮ):
Запрос 1: "Привет"
Ваш ответ 1: "Здравствуйте! Чем могу помочь?"

Запрос 2: "Создай задачу Тест на 14.05.2025"
Ваш ответ 2: { "tool_calls": [ { "id": "call_...", "type": "function", "function": { "name": "create_task_tool", "arguments": "{\"title\": \"Тест\", \"description\": \"\", \"deadline\": \"2025-05-14\", \"priority\": \"medium\"}" } } ] }

Запрос 3: "Напомни мне позвонить клиенту завтра"
Ваш ответ 3: { "tool_calls": [ { "id": "call_...", "type": "function", "function": { "name": "create_task_tool", "arguments": "{\"title\": \"Позвонить клиенту\", \"description\": \"\", \"deadline\": \"[YYYY-MM-DD соответствующая 'завтра']\", \"priority\": \"medium\"}" } } ] }

Запрос 4: "Создай задачу на пятницу"
Ваш ответ 4: "Как назвать задачу?"

Запрос 5 (после ответа 4): "Проверить отчеты"
Ваш ответ 5: { "tool_calls": [ { "id": "call_...", "type": "function", "function": { "name": "create_task_tool", "arguments": "{\"title\": \"Проверить отчеты\", \"description\": \"\", \"deadline\": \"[YYYY-MM-DD соответствующая 'ближайшая пятница']\", \"priority\": \"medium\"}" } } ] }

Запрос 6: "Нужно сделать отчет"
Ваш ответ 6: "На какую дату создать задачу \"Сделать отчет\"?"

Запрос 7 (после ответа 6): "На послезавтра"
Ваш ответ 7: { "tool_calls": [ { "id": "call_...", "type": "function", "function": { "name": "create_task_tool", "arguments": "{\"title\": \"Сделать отчет\", \"description\": \"\", \"deadline\": \"[YYYY-MM-DD соответствующая 'послезавтра']\", \"priority\": \"medium\"}" } } ] }"""
            }
        ]
        
        if history:
            for item in history:
                if item.get("role") == "tool_result": 
                    continue
                messages.append({"role": item["role"], "content": item["content"], **({"tool_calls": item["tool_calls"]} if "tool_calls" in item else {})})

        if prompt:
            messages.append({"role": "user", "content": prompt})
        
        if tool_results:
            for tool_call_id, tool_output_content_str in tool_results:
                messages.append({
                    "role": "tool_result", 
                    "tool_call_id": tool_call_id,
                    "content": tool_output_content_str 
                })

        payload = {
            "model": self.model,
            "messages": messages,
            "tools": AVAILABLE_TOOLS,
            "tool_choice": tool_choice,
            "max_tokens": 500
        }
        
        logger.debug(f"Sending payload to OpenRouter: {payload}")

        try:
            response = await self.client.post(f"{self.base_url}/chat/completions", json=payload, timeout=120.0)
            response.raise_for_status()
            data = response.json()
            logger.debug(f"Received response from OpenRouter: {data}")

            choice = data.get("choices", [{}])[0]
            message = choice.get("message", {})
            finish_reason = choice.get("finish_reason") # Получаем finish_reason
            
            # Добавляем подробное логирование
            logger.info(f"OpenRouter response choice: {choice}")
            logger.info(f"OpenRouter response message: {message}")
            logger.info(f"OpenRouter finish_reason: {finish_reason}") # Логируем finish_reason

            # Проверяем finish_reason
            if finish_reason is None or finish_reason == "":
                logger.error(f"OpenRouter returned empty or null finish_reason. Raw data: {data}")
                return {"type": "error", "content": "AI model returned an incomplete response (null finish_reason)."}

            if message.get("tool_calls"):
                # Модель запросила вызов инструмента напрямую
                logger.info(f"Tool calls detected directly in message: {message['tool_calls']}")
                # Убедимся, что arguments - это строка, если это словарь (хотя модель должна возвращать строку)
                for tool_call in message['tool_calls']:
                    if "function" in tool_call and "arguments" in tool_call["function"]:
                        if isinstance(tool_call["function"]["arguments"], dict):
                            tool_call["function"]["arguments"] = json.dumps(tool_call["function"]["arguments"])
                return {"type": "tool_calls", "content": message["tool_calls"]}
            
            elif message.get("content"):
                raw_content_for_text_fallback = message["content"] # Сохраняем для случая, если это просто текст
                content_str = message["content"].strip()
                
                logger.debug(f"Original content_str for parsing: '{content_str}'")

                # Удаляем возможную markdown-обертку для JSON
                if content_str.startswith("```json"):
                    content_str = content_str[len("```json"):].strip()
                elif content_str.startswith("```"): # Если просто ``` без 'json'
                    content_str = content_str[len("```"):].strip()
                
                if content_str.endswith("```"):
                    content_str = content_str[:-len("```")].strip()
                
                logger.debug(f"content_str after stripping markdown: '{content_str}'")

                parsed_tool_calls_list = None # Инициализируем
                try:
                    # Пытаемся распарсить всю очищенную строку как JSON
                    potential_json_data = json.loads(content_str)
                    if isinstance(potential_json_data, dict) and "tool_calls" in potential_json_data:
                        # Проверяем, что "tool_calls" это список
                        if isinstance(potential_json_data["tool_calls"], list):
                            parsed_tool_calls_list = potential_json_data["tool_calls"]
                            # Дополнительная проверка аргументов, как раньше
                            for tool_call in parsed_tool_calls_list:
                                if "function" in tool_call and "arguments" in tool_call["function"]:
                                    if isinstance(tool_call["function"]["arguments"], dict):
                                        logger.warning("Found 'arguments' as dict in parsed content, converting to JSON string.")
                                        tool_call["function"]["arguments"] = json.dumps(tool_call["function"]["arguments"])
                        else:
                            logger.warning(f"'tool_calls' in parsed content is not a list: {potential_json_data['tool_calls']}")
                    else:
                        logger.debug(f"Parsed content JSON does not contain 'tool_calls' key or is not a dict. Parsed data: {potential_json_data}")
                
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse content_str as JSON: '{content_str[:200]}...'")
                except Exception as e_parse: # Ловим другие возможные ошибки при этом хрупком парсинге
                    logger.error(f"Unexpected error during direct JSON parsing of content_str: {str(e_parse)}")
                    # Продолжаем, parsed_tool_calls_list остается None

                if parsed_tool_calls_list:
                    logger.info(f"Successfully extracted and parsed tool_calls from content: {parsed_tool_calls_list}")
                    return {"type": "tool_calls", "content": parsed_tool_calls_list}
                else:
                    # Если tool_calls не были успешно извлечены, считаем весь оригинальный контент текстом.
                    # views.py затем возьмет первую строку этого текста.
                    logger.info(f"No valid tool_calls JSON extracted from content. Treating as text. Full content (first 200 chars): {raw_content_for_text_fallback[:200]}...")
                    return {"type": "text", "content": raw_content_for_text_fallback}
            else:
                # Неожиданный ответ
                logger.warning(f"Unexpected response structure from OpenRouter (no tool_calls and no content): {data}")
                logger.warning(f"Message structure: {message}")
                return {"type": "error", "content": "No content or tool_calls in response."}

        except httpx.HTTPStatusError as e:
            error_content = e.response.text
            try:
                error_json = e.response.json()
                error_message = error_json.get("error", {}).get("message", error_content)
            except:
                error_message = error_content
            
            logger.error(f"HTTP error from OpenRouter: {e.response.status_code} - {error_message}")
            logger.error(f"Request payload was: {payload}")
            return {"type": "error", "content": f"API Error: {e.response.status_code} - {error_message}"}
        except httpx.RequestError as e:
            logger.error(f"Request error to OpenRouter: {str(e)}")
            return {"type": "error", "content": f"Request Error: {str(e)}"}
        except Exception as e:
            logger.exception("An unexpected error occurred in OpenRouterClient")
            return {"type": "error", "content": f"Unexpected error: {str(e)}"}

    async def close(self):
        logger.info(f"{self.__class__.__name__}: close() called. Attempting to close httpx.AsyncClient.")
        try:
            if hasattr(self, 'client') and isinstance(self.client, httpx.AsyncClient) and not self.client.is_closed:
                await self.client.aclose()
                logger.info(f"{self.__class__.__name__}: httpx.AsyncClient closed successfully.")
        except Exception as e:
            logger.warning(f"{self.__class__.__name__}: Error closing client: {str(e)}") 