from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.utils.translation import gettext_lazy as _
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class CustomTokenAuthentication(TokenAuthentication):
    keyword = 'Token'

    def authenticate(self, request):
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        logger.info(f"Auth header: {auth}")
        logger.info(f"All headers: {request.META}")

        if not auth:
            return None

        parts = auth.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            return None

        token = parts[1]
        return self.authenticate_credentials(token)

    def authenticate_credentials(self, key):
        try:
            token = self.get_model().objects.select_related('user').get(key=key)
            if not token.user.is_active:
                raise AuthenticationFailed(_('User inactive or deleted.'))
            return (token.user, token)
        except self.get_model().DoesNotExist:
            raise AuthenticationFailed(_('Invalid token.')) 