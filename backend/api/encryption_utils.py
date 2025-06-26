import base64
import logging
import os
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings

logger = logging.getLogger(__name__)

# Загружаем ключ один раз при загрузке модуля
ENCRYPTION_KEY = os.environ.get("EMAIL_ENCRYPTION_KEY")
FERNET_INSTANCE = None

if ENCRYPTION_KEY:
    try:
        # Ключ должен быть URL-safe base64 encoded
        key_bytes = base64.urlsafe_b64decode(ENCRYPTION_KEY.encode())
        if len(key_bytes) != 32:
            logger.error("EMAIL_ENCRYPTION_KEY должен быть длиной 32 байта после декодирования base64.")
        else:
            FERNET_INSTANCE = Fernet(ENCRYPTION_KEY.encode())
    except (ValueError, TypeError) as e:
        logger.error(
            f"Недопустимый формат EMAIL_ENCRYPTION_KEY: {e}. Убедитесь, что это правильный base64 ключ Fernet."
        )
else:
    logger.warning(
        "Переменная окружения EMAIL_ENCRYPTION_KEY не установлена. Шифрование почтовых паролей не будет работать."
    )


def encrypt_data(data: str) -> Optional[bytes]:
    """Шифрует строку и возвращает байты."""
    if not FERNET_INSTANCE:
        logger.error("Шифрование невозможно: ключ Fernet не инициализирован.")
        return None
    if not isinstance(data, str):
        logger.error("Данные для шифрования должны быть строкой.")
        return None
    try:
        return FERNET_INSTANCE.encrypt(data.encode("utf-8"))
    except Exception as e:
        logger.error(f"Ошибка шифрования: {e}")
        return None


def decrypt_data(encrypted_data: bytes) -> Optional[str]:
    """Расшифровывает байты и возвращает строку."""
    if not FERNET_INSTANCE:
        logger.error("Дешифрование невозможно: ключ Fernet не инициализирован.")
        return None

    # Преобразуем входные данные в байты, если это объект памяти или что-то другое
    if not isinstance(encrypted_data, bytes):
        try:
            encrypted_data = bytes(encrypted_data)
        except Exception as e:
            logger.error(f"Не удалось преобразовать данные в байты: {e}")
            return None

    try:
        decrypted_bytes = FERNET_INSTANCE.decrypt(encrypted_data)
        return decrypted_bytes.decode("utf-8")
    except InvalidToken:
        logger.error("Ошибка дешифрования: Неверный токен или ключ.")
        return None
    except Exception as e:
        logger.error(f"Ошибка дешифрования: {e}")
        return None
