from rest_framework.authentication import TokenAuthentication, get_authorization_header
from rest_framework import exceptions
from django.utils.translation import gettext_lazy as _
import logging
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)

class AsyncSafeTokenAuthentication(TokenAuthentication):
    """
    Custom TokenAuthentication.
    'authenticate' method is async.
    It calls the synchronous 'authenticate_credentials' method in an async-safe manner.
    """

    # This method remains synchronous and uses synchronous ORM calls.
    # It's wrapped by sync_to_async when called from authenticate.
    def authenticate_credentials(self, key):
        model = self.get_model()
        if not model:
            logger.error("Token model not found in AsyncSafeTokenAuthentication (get_model() returned None).")
            raise exceptions.AuthenticationFailed(_('Token model not configured.'))
        
        logger.info(f"Attempting synchronous ORM call in authenticate_credentials for key: {key[:10]}...")
        try:
            token = model.objects.select_related('user').get(key=key)
            logger.info(f"Synchronous ORM call successful for token key: {key[:10]}. User: {token.user}")
        except model.DoesNotExist:
            logger.warning(f"Token not found for key (sync ORM): {key[:10]}...")
            raise exceptions.AuthenticationFailed(_('Invalid token.'))
        except exceptions.AuthenticationFailed: # Re-raise DRF's own exceptions
            raise
        except Exception as e:
            logger.exception(f"Unexpected error during ORM call in authenticate_credentials for key {key[:10]}: {e}")
            raise # Re-raise other exceptions to be caught as server errors

        if not token.user.is_active:
            logger.warning(f"User {token.user} associated with token {key[:10]} is inactive.")
            raise exceptions.AuthenticationFailed(_('User inactive or deleted.'))

        return (token.user, token)

    async def authenticate(self, request):
        logger.info(f"AsyncSafeTokenAuthentication.authenticate (async def) called for request: {request.path}")
        auth = get_authorization_header(request).split()

        if not auth or auth[0].lower() != self.keyword.lower().encode():
            logger.debug(f"Authorization header not found or keyword '{self.keyword}' mismatch for request: {request.path}")
            return None # No authentication attempt

        if len(auth) == 1:
            logger.warning(f"Invalid token header (no credentials provided) for request: {request.path}")
            # DRF's TokenAuthentication raises AuthenticationFailed here.
            # raise exceptions.AuthenticationFailed(_('Invalid token header. No credentials provided.'))
            # However, returning None allows other authenticators if any. For consistency with how
            # DRF's request._authenticate loop handles exceptions vs None, raising is often clearer if this
            # authenticator is meant to be definitive for 'Token' type.
            # For now, let's stick to raising, as it's more explicit about failure.
            msg = _('Invalid token header. No credentials provided.')
            raise exceptions.AuthenticationFailed(msg)
            
        elif len(auth) > 2:
            logger.warning(f"Invalid token header (token string contains spaces) for request: {request.path}")
            msg = _('Invalid token header. Token string should not contain spaces.')
            raise exceptions.AuthenticationFailed(msg)

        try:
            key = auth[1].decode()
        except UnicodeError:
            logger.warning(f"Invalid token header (token string non-Unicode) for request: {request.path}")
            msg = _('Invalid token header. Token string should not contain invalid characters.')
            raise exceptions.AuthenticationFailed(msg)
        
        logger.debug(f"Attempting to authenticate with key: {key[:10]}... using sync_to_async(authenticate_credentials)")
        try:
            # self.authenticate_credentials is a synchronous method.
            # We run it in a separate thread using sync_to_async to avoid blocking the event loop.
            user, token_obj = await sync_to_async(self.authenticate_credentials, thread_sensitive=True)(key)
            logger.info(f"Authentication successful for key {key[:10]}. User: {user}")
            return user, token_obj
        except exceptions.AuthenticationFailed as e:
            # This exception was raised by authenticate_credentials
            logger.info(f"AuthenticationFailed for key {key[:10]} from authenticate_credentials: {str(e)}")
            raise # Re-raise for DRF to handle (e.g. to return a 401/403 or allow other auths)
        except Exception as e:
            # Catch any other unexpected error from sync_to_async or authenticate_credentials
            logger.error(f"Unexpected error during sync_to_async(authenticate_credentials) for key {key[:10]}: {str(e)}", exc_info=True)
            # It's generally better to raise AuthenticationFailed for unknown errors during auth.
            raise exceptions.AuthenticationFailed(_('An unexpected error occurred during token validation.'))

    # authenticate_header is inherited from TokenAuthentication and should be fine.
    # def authenticate_header(self, request):
    #     return self.keyword 