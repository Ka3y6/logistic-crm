import json  # Для парсинга аргументов инструментов
import logging
import os

from api.permissions import IsAdminUser  # Добавляем импорт
from asgiref.sync import async_to_sync, sync_to_async  # Добавлен async_to_sync
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, viewsets
from rest_framework.authentication import TokenAuthentication  # Добавлен TokenAuthentication
from rest_framework.authentication import SessionAuthentication
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
        client = None  # Объявляем client здесь, чтобы finally мог его использовать
        response_data = None
        status_code = 200

        try:
            user_email, user_message, history = await self._get_request_data_async(request)

            if not user_message:
                return {"error": "Сообщение не предоставлено"}, 400

            logger.info(f"Получено сообщение от пользователя {user_email}: {user_message}")
            logger.info(f"История чата: {history}")

            client = OpenRouterClient(user=request.user)

            ai_response = await client.generate_response(prompt=user_message, history=history)

            current_history_for_model = list(history)
            current_history_for_model.append({"role": "user", "content": user_message})

            if ai_response.get("type") == "tool_calls":
                logger.info(f"AI запросил вызов инструментов: {ai_response['content']}")

                assistant_message_with_tool_calls = {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": ai_response["content"],
                }
                current_history_for_model.append(assistant_message_with_tool_calls)

                tool_results_for_next_call = []

                for tool_call in ai_response["content"]:
                    tool_name = tool_call.get("function", {}).get("name")
                    tool_args_str = tool_call.get("function", {}).get("arguments")
                    tool_call_id = tool_call.get("id")

                    if not tool_name or not tool_args_str or not tool_call_id:
                        logger.error(f"Неполные данные для вызова инструмента: {tool_call}")
                        tool_results_for_next_call.append(
                            (
                                tool_call_id,
                                json.dumps({"status": "error", "message": "Incomplete tool call data from AI."}),
                            )
                        )
                        continue

                    try:
                        tool_args = json.loads(tool_args_str)
                    except json.JSONDecodeError:
                        logger.error(f"Ошибка парсинга аргументов инструмента {tool_name}: {tool_args_str}")
                        tool_results_for_next_call.append(
                            (tool_call_id, json.dumps({"status": "error", "message": "Invalid tool arguments format."}))
                        )
                        continue

                    if tool_name in TOOL_FUNCTIONS:
                        try:
                            tool_result = await TOOL_FUNCTIONS[tool_name](request.user, **tool_args)
                            tool_results_for_next_call.append(
                                (tool_call_id, json.dumps({"status": "success", "result": tool_result}))
                            )
                        except Exception as e:
                            logger.error(f"Ошибка выполнения инструмента {tool_name}: {e}")
                            tool_results_for_next_call.append(
                                (tool_call_id, json.dumps({"status": "error", "message": str(e)}))
                            )
                    else:
                        logger.warning(f"Неизвестный инструмент: {tool_name}")
                        tool_results_for_next_call.append(
                            (tool_call_id, json.dumps({"status": "error", "message": f"Unknown tool: {tool_name}"}))
                        )

                logger.info(f"Отправка результатов инструментов AI: {tool_results_for_next_call}")
                ai_final_response = await client.generate_response(
                    prompt=None, history=current_history_for_model, tool_results=tool_results_for_next_call
                )

                # Обработка ответа после вызова инструментов
                if ai_final_response.get("type") == "text":
                    actual_message = ai_final_response["content"].split("\n")[0].strip()
                    response_data = {"message": actual_message}
                elif ai_final_response.get("type") == "tool_calls":  # Если AI снова запросил инструменты
                    logger.warning(
                        f"AI попытался вызвать инструменты снова после получения результатов: {ai_final_response.get('content')}"
                    )
                    # Формируем ответ на основе результатов ПРЕДЫДУЩЕГО успешного вызова инструмента
                    final_user_message = "Действие выполнено, но AI запросил дополнительный вызов инструмента."
                    if (
                        tool_results_for_next_call
                        and isinstance(tool_results_for_next_call, list)
                        and len(tool_results_for_next_call) > 0
                    ):
                        try:
                            first_tool_result_str = tool_results_for_next_call[0][1]
                            first_tool_result_json = json.loads(first_tool_result_str)
                            if first_tool_result_json.get("status") == "success" and first_tool_result_json.get(
                                "result"
                            ):
                                final_user_message = first_tool_result_json["result"]
                        except Exception as e_parse_tool_result:
                            logger.error(
                                f"Ошибка при извлечении сообщения из результата предыдущего инструмента: {str(e_parse_tool_result)}"
                            )
                    response_data = {"message": final_user_message}
                    # status_code остается 200
                # Если тип ответа "error" или любой другой неожиданный тип, но инструмент УЖЕ был выполнен
                elif tool_results_for_next_call:  # Проверяем, были ли результаты инструментов (значит, первый шаг был)
                    logger.warning(
                        f"Финальный ответ от AI не текст и не tool_calls, но инструменты были выполнены. Тип ответа: {ai_final_response.get('type')}, Контент: {ai_final_response.get('content')}"
                    )
                    final_user_message = "Задача успешно обработана, но AI не дал финального подтверждения."
                    # Пытаемся извлечь сообщение из первого успешного результата инструмента
                    try:
                        first_tool_result_str = tool_results_for_next_call[0][1]
                        first_tool_result_json = json.loads(first_tool_result_str)
                        if first_tool_result_json.get("status") == "success" and first_tool_result_json.get("result"):
                            final_user_message = first_tool_result_json["result"]
                        elif first_tool_result_json.get("result"):
                            final_user_message = first_tool_result_json["result"]
                    except Exception as e_parse_tool_result_fallback:
                        logger.error(
                            f"Ошибка при извлечении сообщения из результата (fallback): {str(e_parse_tool_result_fallback)}"
                        )
                    response_data = {"message": final_user_message}
                    status_code = 200  # Важно, так как основная операция (создание задачи) удалась
                else:  # Если инструментов не было ИЛИ финальный ответ - ошибка без предыдущих инструментов
                    error_content = ai_final_response.get(
                        "content", "Неизвестная ошибка AI после вызова инструмента (или без него)"
                    )
                    response_data = {"error": error_content}
                    logger.error(
                        f"Финальный ответ от AI - ошибка: {error_content}. Тип: {ai_final_response.get('type')}"
                    )
                    status_code = 500

            elif ai_response.get("type") == "text":
                logger.info(f"Получен текстовый ответ от AI: {ai_response['content']}")
                actual_message = ai_response["content"].split("\n")[0].strip()
                response_data = {"message": actual_message}

            elif ai_response.get("type") == "error":
                logger.error(f"Ошибка от AI клиента: {ai_response.get('content')}")
                response_data = {"error": ai_response.get("content", "Неизвестная ошибка AI")}
                status_code = 500

            else:
                logger.error(f"Неожиданный тип ответа от AI: {ai_response}")
                response_data = {"error": "Неожиданный ответ от AI"}
                status_code = 500

            return response_data, status_code

        except ValueError as ve:  # Обработка конкретных ожидаемых ошибок
            logger.warning(f"ValueError в _handle_ai_interaction_async: {str(ve)}")
            if "User message not provided" in str(ve) or "Invalid JSON" in str(
                ve
            ):  # Уже установлено в _get_request_data_async или проверке user_message
                response_data = {"error": str(ve)}
                status_code = 400
            else:
                response_data = {"error": f"Ошибка обработки данных: {str(ve)}"}
                status_code = 400  # или 500 в зависимости от контекста
            return response_data, status_code
        except Exception as e:  # Общая обработка непредвиденных ошибок
            logger.exception("Error processing assistant query in _handle_ai_interaction_async")
            response_data = {"error": f"An unexpected server error occurred: {str(e)}"}
            status_code = 500
            return response_data, status_code
        finally:
            if client:
                await client.close()  # Гарантированное асинхронное закрытие клиента

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
