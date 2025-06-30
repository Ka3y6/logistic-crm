import json  # Для парсинга аргументов инструментов
import logging

from asgiref.sync import async_to_sync
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, viewsets
from rest_framework.authentication import (
    SessionAuthentication,
    TokenAuthentication,  # Добавлен TokenAuthentication
)
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import AISettings
from .openrouter_client import OpenRouterClient
from .serializers import AISettingsSerializer
from .tools import TOOL_FUNCTIONS  # Импортируем словарь с функциями инструментов

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class AssistantQueryView(APIView):
    authentication_classes = [JWTAuthentication, TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]

    # Метод для получения данных из запроса, теперь нативный async
    async def _get_request_data_async(self, request):
        user_email = request.user.email if request.user and hasattr(request.user, "email") else "anonymous"
        # Предполагаем, что request.body - это байтовая строка, уже загруженная DRF.
        # json.loads - CPU-bound, синхронная операция, что нормально в async def.
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            logger.error("Ошибка декодирования JSON из request.body")
            # Можно вернуть специальное значение или возбудить исключение,
            # которое будет обработано в _handle_ai_interaction_async
            raise ValueError("Invalid JSON in request body")

        user_message = data.get("message")
        history = data.get("history", [])
        return user_email, user_message, history

    async def _handle_ai_interaction_async(self, request):
        """Основной сценарий: получает сообщение пользователя, обращается к AI и формирует ответ."""
        try:
            # 1. Разбираем входные данные
            user_email, user_message, history = await self._get_request_data_async(request)
            if not user_message:
                return {"error": "Сообщение не предоставлено"}, 400

            logger.info("Получено сообщение от пользователя %s: %s", user_email, user_message)

            # 2. Запрашиваем первичный ответ AI
            client = OpenRouterClient(user=request.user)
            ai_response = await client.generate_response(prompt=user_message, history=history)

            # 3. Обрабатываем ответ AI
            return await self._process_ai_response(client, ai_response, history, request)

        except ValueError as ve:
            logger.warning("_handle_ai_interaction_async ValueError: %s", ve)
            return {"error": str(ve)}, 400
        except Exception as exc:
            logger.exception("Unhandled error in _handle_ai_interaction_async")
            return {"error": f"An unexpected server error occurred: {exc}"}, 500

    # ----------------------- helpers ----------------------- #

    async def _process_ai_response(self, client, ai_response, history, request):
        """Разбирает тип ответа AI и действует соответствующим образом."""
        resp_type = ai_response.get("type")

        if resp_type == "tool_calls":
            return await self._process_tool_calls_and_finalize(client, ai_response["content"], history, request)

        if resp_type == "text":
            actual_message = ai_response["content"].split("\n")[0].strip()
            return {"message": actual_message}, 200

        if resp_type == "error":
            logger.error("Ошибка от AI клиента: %s", ai_response.get("content"))
            return {"error": ai_response.get("content", "Неизвестная ошибка AI")}, 500

        logger.error("Неожиданный тип ответа от AI: %s", ai_response)
        return {"error": "Неожиданный ответ от AI"}, 500

    async def _process_tool_calls_and_finalize(self, client, tool_calls, history, request):
        """Выполняет инструменты, затем делает финальный запрос к AI."""

        tool_results_for_next_call = []

        for call in tool_calls:
            tool_name = call.get("function", {}).get("name")
            tool_args_str = call.get("function", {}).get("arguments")
            tool_call_id = call.get("id")

            if not (tool_name and tool_args_str and tool_call_id):
                logger.error("Неполные данные для вызова инструмента: %s", call)
                tool_results_for_next_call.append((tool_call_id, json.dumps({"status": "error"})))
                continue

            try:
                tool_args = json.loads(tool_args_str)
            except json.JSONDecodeError:
                logger.error("Ошибка парсинга аргументов инструмента %s: %s", tool_name, tool_args_str)
                tool_results_for_next_call.append((tool_call_id, json.dumps({"status": "error"})))
                continue

            if tool_name not in TOOL_FUNCTIONS:
                logger.warning("Неизвестный инструмент: %s", tool_name)
                tool_results_for_next_call.append((tool_call_id, json.dumps({"status": "error"})))
                continue

            try:
                tool_result = await TOOL_FUNCTIONS[tool_name](request.user, **tool_args)
                tool_results_for_next_call.append(
                    (tool_call_id, json.dumps({"status": "success", "result": tool_result}))
                )
            except Exception as e:
                logger.error("Ошибка выполнения инструмента %s: %s", tool_name, e)
                tool_results_for_next_call.append((tool_call_id, json.dumps({"status": "error", "message": str(e)})))

        # Обновляем историю для финального запроса
        history_with_user = list(history)
        history_with_user.append({"role": "assistant", "content": None, "tool_calls": tool_calls})

        ai_final = await client.generate_response(
            prompt=None, history=history_with_user, tool_results=tool_results_for_next_call
        )

        if ai_final.get("type") == "text":
            msg = ai_final["content"].split("\n")[0].strip()
            return {"message": msg}, 200

        # Если AI опять вернул tool_calls или ошибку – даём fallback на результат первого инструмента
        if tool_results_for_next_call:
            try:
                first_tool_result = json.loads(tool_results_for_next_call[0][1])
                if first_tool_result.get("status") == "success" and first_tool_result.get("result"):
                    return {"message": first_tool_result["result"]}, 200
            except Exception as e:
                logger.error("Не удалось извлечь результат инструмента: %s", e)

        return {"error": ai_final.get("content", "Неизвестная ошибка AI")}, 500

    # Метод post теперь вызывает _handle_ai_interaction_async через async_to_sync
    def post(self, request, *args, **kwargs):
        logger.info(f"AssistantQueryView post method called. User: {request.user}, Auth: {request.auth}")
        logger.info(f"Headers: {request.headers}")

        if not request.user.is_authenticated:
            logger.warning("User is not authenticated")
            return JsonResponse({"error": "Требуется аутентификация"}, status=401)

        try:
            response_data, status_code = async_to_sync(self._handle_ai_interaction_async)(request)
        except Exception as e:
            logger.exception("Error in AssistantQueryView post method")
            response_data = {"error": f"A top-level server error occurred: {str(e)}"}
            status_code = 500

        if response_data is None:
            logger.error("Critical: response_data is None")
            response_data = {"error": "Internal server error: No response data provided by handler."}
            status_code = 500

        return JsonResponse(response_data, status=status_code)


# Если бы это было обычное Django view, а не DRF APIView, можно было бы сделать так:
# from django.http import JsonResponse
# async def my_async_view(request):
#     data, status = await AssistantQueryView()._handle_ai_interaction_async(request) # Прямой await
#     return JsonResponse(data, status=status)


class AISettingsViewSet(viewsets.ModelViewSet):
    queryset = AISettings.objects.all()
    serializer_class = AISettingsSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication, TokenAuthentication, SessionAuthentication]

    def get_queryset(self):
        logger.info(f"AISettingsViewSet get_queryset called. User: {self.request.user}")
        logger.info(f"Auth header: {self.request.headers.get('Authorization')}")
        logger.info(f"All headers: {dict(self.request.headers)}")
        logger.info(f"User is authenticated: {self.request.user.is_authenticated}")
        logger.info(f"User auth: {self.request.auth}")

        if not self.request.user.is_authenticated:
            logger.warning("User is not authenticated in get_queryset")
            return AISettings.objects.none()

        try:
            return AISettings.objects.filter(user=self.request.user)
        except Exception as e:
            logger.error(f"Error in get_queryset: {str(e)}")
            return AISettings.objects.none()

    def perform_create(self, serializer):
        logger.info(f"AISettingsViewSet perform_create called. User: {self.request.user}")
        logger.info(f"Auth header: {self.request.headers.get('Authorization')}")
        logger.info(f"All headers: {dict(self.request.headers)}")
        logger.info(f"User is authenticated: {self.request.user.is_authenticated}")
        logger.info(f"User auth: {self.request.auth}")

        try:
            # Проверяем, есть ли уже настройки у пользователя
            existing_settings = AISettings.objects.filter(user=self.request.user).first()
            if existing_settings:
                logger.info(f"Updating existing settings for user {self.request.user}")
                # Если настройки уже существуют, обновляем их
                serializer.update(existing_settings, serializer.validated_data)
            else:
                logger.info(f"Creating new settings for user {self.request.user}")
                # Если настроек нет, создаем новые
                serializer.save(user=self.request.user)
        except Exception as e:
            logger.error(f"Error in perform_create: {str(e)}")
            raise

    @action(detail=False, methods=["get"])
    def current(self, request):
        logger.info(f"AISettingsViewSet current called. User: {request.user}")
        logger.info(f"Auth header: {request.headers.get('Authorization')}")
        logger.info(f"All headers: {dict(request.headers)}")
        logger.info(f"User is authenticated: {request.user.is_authenticated}")
        logger.info(f"User auth: {request.auth}")

        if not request.user.is_authenticated:
            logger.warning("User is not authenticated in current")
            return Response({"error": "Требуется аутентификация"}, status=401)

        try:
            settings = self.get_queryset().first()
            if not settings:
                logger.warning(f"No settings found for user {request.user}")
                return Response(
                    {
                        "error": "Настройки не найдены",
                        "message": "Пожалуйста, создайте настройки AI ассистента с вашим API ключом",
                    },
                    status=404,
                )
            serializer = self.get_serializer(settings)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in current: {str(e)}")
            return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_response(request):
    try:
        prompt = request.data.get("prompt")
        if not prompt:
            return Response({"error": "Промпт не указан"}, status=status.HTTP_400_BAD_REQUEST)

        # Получаем настройки AI для пользователя
        ai_settings = AISettings.objects.filter(user=request.user).first()
        if not ai_settings:
            return Response({"error": "Настройки AI не найдены"}, status=status.HTTP_404_NOT_FOUND)

        # Создаем клиент OpenRouter
        client = OpenRouterClient(
            api_key=ai_settings.api_key,
            model=ai_settings.model,
            base_url=ai_settings.base_url,
            max_tokens=ai_settings.max_tokens,
            temperature=ai_settings.temperature,
        )

        # Генерируем ответ
        response = client.generate_response(prompt)
        return Response({"response": response})

    except Exception as e:
        logger.error(f"Error generating AI response: {str(e)}")
        return Response({"error": "Ошибка при генерации ответа"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
