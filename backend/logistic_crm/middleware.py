import logging

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Логируем информацию о запросе
        logger.info(f"Request path: {request.path}")
        logger.info(f"Request method: {request.method}")
        logger.info(f"Request headers: {dict(request.headers)}")
        logger.info(f"Request user: {request.user}")
        
        # Проверяем наличие атрибута auth
        if hasattr(request, 'auth'):
            logger.info(f"Request auth: {request.auth}")
        else:
            logger.info("Request auth: Not available")

        response = self.get_response(request)

        # Логируем информацию об ответе
        logger.info(f"Response status: {response.status_code}")
        logger.info(f"Response headers: {dict(response.headers)}")

        return response 

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Логируем информацию о запросе
        logger.info(f"Request path: {request.path}")
        logger.info(f"Request method: {request.method}")
        logger.info(f"Request headers: {dict(request.headers)}")
        logger.info(f"Request user: {request.user}")
        
        # Проверяем наличие атрибута auth
        if hasattr(request, 'auth'):
            logger.info(f"Request auth: {request.auth}")
        else:
            logger.info("Request auth: Not available")

        response = self.get_response(request)

        # Логируем информацию об ответе
        logger.info(f"Response status: {response.status_code}")
        logger.info(f"Response headers: {dict(response.headers)}")

        return response 