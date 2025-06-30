import logging

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware:  # noqa: D101
    """Простое логирование входящих запросов и исходящих ответов."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):  # noqa: D401
        # Пропускаем подробное логирование запросов к заглушке /ws (webpack ping)
        if request.path == "/ws":
            return self.get_response(request)

        # Записываем данные о запросе
        logger.info("Request path: %s", request.path)
        logger.info("Request method: %s", request.method)
        logger.info("Request headers: %s", dict(request.headers))
        logger.info("Request user: %s", request.user)

        if hasattr(request, "auth"):
            logger.info("Request auth: %s", request.auth)

        response = self.get_response(request)

        # Записываем данные об ответе
        logger.info("Response status: %s", response.status_code)
        logger.info("Response headers: %s", dict(response.headers))

        return response
