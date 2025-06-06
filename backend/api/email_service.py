import imaplib
import smtplib
import ssl
import email
from email.header import decode_header, make_header
from email.message import EmailMessage
from email.utils import parsedate_to_datetime
import logging
import socket # Для обработки ошибок подключения
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import re # Добавляем re для очистки имен папок
from django.utils import timezone # Импортируем timezone
from imapclient import IMAPClient  # Добавляем импорт IMAPClient

from .models import UserProfile
from .encryption_utils import decrypt_data

logger = logging.getLogger(__name__)

# Типы ошибок для возврата
ERR_TYPE_CONNECTION = "connection_error"
ERR_TYPE_AUTHENTICATION = "authentication_error"
ERR_TYPE_MAILBOX = "mailbox_error"
ERR_TYPE_OPERATION = "operation_error"
ERR_TYPE_CONFIG = "config_error"
ERR_TYPE_UNKNOWN = "unknown_error"

# Стандартные имена ящиков, которые могут требовать префикс
PREFIXABLE_MAILBOXES = ['Sent', 'Trash', 'Drafts', 'Junk', 'Archive']
# Возможные префиксы (можно добавить другие, например, '/')
INBOX_PREFIX = 'INBOX.'
# Список ящиков, которые следует пропускать (например, системные папки, не являющиеся стандартными IMAP)
# Начнем с пустого списка, чтобы ничего не пропускать по умолчанию
SKIPPED_MAILBOXES = set()

# Gmail specific mailbox names
GMAIL_MAILBOXES = {
    'Sent': '[Gmail]/Отправленные',
    'Trash': '[Gmail]/Корзина',
    'Drafts': '[Gmail]/Черновики',
    'Spam': '[Gmail]/Спам',
    'Starred': '[Gmail]/Помеченные',
    'Important': '[Gmail]/Важное',
    'All Mail': '[Gmail]/Вся почта'
}

# Попробуем определить атрибуты и разделитель
MAILBOX_LIST_REGEX = re.compile(r'\\((?P<flags>.*?)\\) \"(?P<delimiter>.*)\" \"?(?P<name>[^"]+)\"?')

def _get_user_credentials(user) -> Optional[Tuple[Dict[str, str], Optional[Tuple[str, str]]]]:
    """Получает и расшифровывает учетные данные. Возвращает (credentials, error)."""
    try:
        profile = UserProfile.objects.get(user=user)
        if not profile.email_integration_enabled:
            msg = f"Интеграция с почтой отключена для пользователя {user.email}"
            logger.info(msg)
            return None, (ERR_TYPE_CONFIG, msg)

        imap_password = decrypt_data(profile.imap_password_encrypted) if profile.imap_password_encrypted else None
        smtp_password = decrypt_data(profile.smtp_password_encrypted) if profile.smtp_password_encrypted else None

        # Проверяем наличие всех данных
        required_fields = {
            'imap_host': profile.imap_host, 'imap_port': profile.imap_port, 
            'imap_user': profile.imap_user, 'imap_password': imap_password,
            'smtp_host': profile.smtp_host, 'smtp_port': profile.smtp_port, 
            'smtp_user': profile.smtp_user, 'smtp_password': smtp_password
        }
        missing_fields = [k for k, v in required_fields.items() if not v]
        if missing_fields:
            msg = f"Не все учетные данные почты настроены для пользователя {user.email}. Отсутствуют: {', '.join(missing_fields)}"
            logger.warning(msg)
            return None, (ERR_TYPE_CONFIG, msg)

        # Проверяем настройки для Gmail
        if profile.imap_host and 'gmail.com' in profile.imap_host.lower():
            if not profile.imap_host == 'imap.gmail.com':
                logger.warning(f"Для Gmail рекомендуется использовать imap.gmail.com, текущий хост: {profile.imap_host}")
            if not profile.imap_port == 993:
                logger.warning(f"Для Gmail рекомендуется использовать порт 993, текущий порт: {profile.imap_port}")
            if not profile.imap_use_ssl:
                logger.warning("Для Gmail рекомендуется использовать SSL")
            if not profile.imap_user.endswith('@gmail.com'):
                logger.warning(f"Для Gmail рекомендуется использовать полный email адрес, текущий пользователь: {profile.imap_user}")

        # Возвращаем словарь и None для ошибки
        return required_fields, None

    except UserProfile.DoesNotExist:
        msg = f"Профиль пользователя не найден для {user.email}"
        logger.warning(msg)
        return None, (ERR_TYPE_CONFIG, msg)
    except Exception as e:
        msg = f"Ошибка при получении/дешифровании учетных данных для {user.email}: {e}"
        logger.error(msg, exc_info=True)
        return None, (ERR_TYPE_UNKNOWN, msg)

def _decode_email_header(header_value: str) -> str:
    """Декодирует заголовок письма (Subject, From и т.д.)."""
    try:
        decoded_parts = decode_header(header_value)
        return str(make_header(decoded_parts))
    except Exception:
        # Если декодирование не удалось, возвращаем как есть (может быть ASCII)
        return header_value

def _select_mailbox(mail, mailbox_name: str, user_email: str) -> Tuple[Optional[str], Optional[Tuple[str, str]]]:
    """Выбирает почтовый ящик, возвращает (selected_mailbox_name, error)."""
    if not mailbox_name:
        return None, (ERR_TYPE_CONFIG, "Не указано имя почтового ящика")

    logger.info(f"Начало выбора папки '{mailbox_name}' для {user_email}")

    # Сначала пробуем стандартное имя
    try:
        logger.debug(f"Попытка выбора папки '{mailbox_name}' для {user_email}")
        typ, data = mail.select(mailbox_name)
        if typ == "OK":
            logger.info(f"Выбрана папка {mailbox_name}")
            return mailbox_name, None
    except imaplib.IMAP4.error as e:
        logger.debug(f"Не удалось выбрать папку '{mailbox_name}': {e}")

    # Если это Gmail, пробуем специальные имена папок
    if mailbox_name in GMAIL_MAILBOXES:
        gmail_name = GMAIL_MAILBOXES[mailbox_name]
        try:
            logger.debug(f"Попытка выбора Gmail папки '{gmail_name}' для {user_email}")
            typ, data = mail.select(gmail_name)
            if typ == "OK":
                logger.info(f"Выбрана Gmail папка {gmail_name}")
                return gmail_name, None
        except imaplib.IMAP4.error as e:
            logger.debug(f"Не удалось выбрать Gmail папку '{gmail_name}': {e}")

    # Пробуем с префиксом INBOX
    if mailbox_name in PREFIXABLE_MAILBOXES:
        prefixed_name = f"{INBOX_PREFIX}{mailbox_name}"
        try:
            logger.debug(f"Попытка выбора папки с префиксом '{prefixed_name}' для {user_email}")
            typ, data = mail.select(prefixed_name)
            if typ == "OK":
                logger.info(f"Выбрана папка с префиксом {prefixed_name}")
                return prefixed_name, None
        except imaplib.IMAP4.error as e:
            logger.debug(f"Не удалось выбрать папку с префиксом '{prefixed_name}': {e}")

    # Пробуем с префиксом /
    try:
        prefixed_name = f"/{mailbox_name}"
        logger.debug(f"Попытка выбора папки с префиксом '{prefixed_name}' для {user_email}")
        typ, data = mail.select(prefixed_name)
        if typ == "OK":
            logger.info(f"Выбрана папка с префиксом {prefixed_name}")
            return prefixed_name, None
    except imaplib.IMAP4.error as e:
        logger.debug(f"Не удалось выбрать папку с префиксом '{prefixed_name}': {e}")

    error_msg = f"Не удалось выбрать папку {mailbox_name} ни в одном варианте"
    logger.error(error_msg)
    return None, (ERR_TYPE_MAILBOX, error_msg)

def fetch_emails(user, mailbox='INBOX', limit=20, offset=0):
    """
    Получение писем для пользователя с расширенной обработкой ошибок.
    """
    try:
        logger.info(f"Начало fetch_emails для {user.email}, mailbox={mailbox}")
        
        # Получаем профиль пользователя
        profile = UserProfile.objects.get(user=user)
        
        # Проверяем наличие необходимых настроек
        if not all([profile.imap_host, profile.imap_port, profile.imap_user, profile.imap_password_encrypted]):
            logger.error(f"Неполные настройки IMAP для пользователя {user.email}")
            return [], (ERR_TYPE_CONFIG, "Неполные настройки почтового сервера"), 0
        
        # Расшифровываем пароль
        decrypted_password = decrypt_data(profile.imap_password_encrypted)
        if not decrypted_password:
            logger.error(f"Не удалось расшифровать пароль для {user.email}")
            return [], (ERR_TYPE_AUTHENTICATION, "Ошибка расшифровки учетных данных"), 0
        
        # Список возможных вариантов имени ящика
        mailbox_variants = []
        
        # Определяем, является ли это Gmail папкой
        is_gmail = '[Gmail]' in mailbox
        
        if is_gmail:
            # Если это Gmail папка, пробуем разные варианты
            gmail_folder = mailbox.replace('[Gmail]/', '')
            mailbox_variants = [
                mailbox,  # Оригинальное имя с [Gmail]/
                gmail_folder,  # Имя без [Gmail]/
                f"INBOX.{gmail_folder}",  # С префиксом INBOX
                f"/{gmail_folder}",  # С префиксом слэша
                f"[Gmail]/{gmail_folder}",  # С пробелом после [Gmail]
                f"[Gmail]/{gmail_folder.replace(' ', '')}",  # Без пробелов
            ]
        else:
            # Для других почтовых сервисов
            mailbox_variants = [
                mailbox,  # Оригинальное имя
                f"INBOX.{mailbox}",  # С префиксом INBOX
                f"/{mailbox}",  # С префиксом слэша
                mailbox.replace(' ', ''),  # Без пробелов
                f"Sent",  # Стандартное имя для отправленных
                f"Sent Items",  # Альтернативное имя
                f"Отправленные",  # Русское имя
                f"INBOX.Sent",  # С префиксом INBOX
                f"INBOX.Sent Items",
                f"INBOX.Отправленные"
            ]
        
        logger.info(f"Варианты имен папок для {user.email}: {mailbox_variants}")
        
        # Устанавливаем соединение с IMAP
        with IMAPClient(profile.imap_host, port=profile.imap_port, ssl=profile.imap_use_ssl) as client:
            try:
                logger.info(f"Подключение к IMAP серверу {profile.imap_host}:{profile.imap_port}")
                client.login(profile.imap_user, decrypted_password)
                logger.info(f"Успешная аутентификация для {user.email}")
                
                # Получаем список доступных папок
                folders = client.list_folders()
                logger.info(f"Доступные папки для {user.email}: {[f[2] for f in folders]}")
                
            except Exception as e:
                logger.error(f"Ошибка аутентификации для {user.email}: {e}")
                return [], (ERR_TYPE_AUTHENTICATION, str(e)), 0
            
            # Пробуем выбрать ящик из вариантов
            selected_mailbox = None
            for variant in mailbox_variants:
                try:
                    logger.info(f"Попытка выбора папки '{variant}' для {user.email}")
                    client.select_folder(variant)
                    selected_mailbox = variant
                    logger.info(f"Успешно выбрана папка '{variant}' для {user.email}")
                    break
                except Exception as e:
                    logger.warning(f"Не удалось выбрать папку '{variant}': {e}")
            
            if not selected_mailbox:
                error_msg = f"Не удалось выбрать папку {mailbox} ни в одном варианте"
                logger.error(error_msg)
                return [], (ERR_TYPE_MAILBOX, error_msg), 0
            
            logger.info(f"Выбрана папка {selected_mailbox}")
            
            # Получаем общее количество писем
            messages = client.search(['ALL'])
            total_count = len(messages)
            logger.info(f"Найдено {total_count} писем в папке {selected_mailbox}")
            
            # Получаем только последние письма, отсортированные по дате
            # Используем IMAP SORT для сортировки на стороне сервера
            try:
                # Пробуем использовать SORT, если сервер поддерживает
                sorted_messages = client.sort(['REVERSE DATE'], ['ALL'])
                # Берем только нужный диапазон писем
                start_idx = offset
                end_idx = min(offset + limit, total_count)
                messages_to_fetch = sorted_messages[start_idx:end_idx]
            except Exception as e:
                logger.warning(f"Сервер не поддерживает SORT, используем локальную сортировку: {e}")
                # Если SORT не поддерживается, получаем все письма и сортируем локально
                messages = client.search(['ALL'])
                # Получаем даты только для нужного диапазона
                start_idx = max(0, total_count - (offset + limit))
                end_idx = total_count - offset
                messages_to_fetch = messages[start_idx:end_idx]
                
                # Получаем даты для выбранных сообщений
                message_dates = {}
                for msg_id in messages_to_fetch:
                    try:
                        raw_email = client.fetch(msg_id, ['INTERNALDATE'])
                        date = raw_email[msg_id][b'INTERNALDATE']
                        message_dates[msg_id] = date
                    except Exception as e:
                        logger.warning(f"Не удалось получить дату для письма {msg_id}: {e}")
                        message_dates[msg_id] = datetime.min
                
                # Сортируем по дате в обратном порядке
                messages_to_fetch = sorted(messages_to_fetch, key=lambda x: message_dates.get(x, datetime.min), reverse=True)
            
            logger.info(f"Запрашиваем {len(messages_to_fetch)} писем (offset={offset}, limit={limit})")
            
            # Получаем детали писем
            email_data = []
            for msg_id in messages_to_fetch:
                try:
                    # Получаем только необходимые поля
                    raw_email = client.fetch(msg_id, ['RFC822.HEADER', 'RFC822.TEXT'])
                    email_obj = email.message_from_bytes(raw_email[msg_id][b'RFC822.HEADER'] + b'\r\n\r\n' + raw_email[msg_id][b'RFC822.TEXT'])
                    
                    # Извлекаем содержимое письма
                    body_content = _extract_email_body(email_obj)
                    
                    # Парсим email
                    email_details = {
                        'id': msg_id,
                        'subject': _decode_email_header(email_obj.get('Subject', 'Без темы')),
                        'from': _decode_email_header(email_obj.get('From', 'Неизвестный отправитель')),
                        'date': email_obj.get('Date', ''),
                        'body_plain': body_content['plain'],
                        'body_html': body_content['html'],
                        'attachments': body_content['attachments'],
                        'mailbox': selected_mailbox
                    }
                    email_data.append(email_details)
                except Exception as e:
                    logger.warning(f"Не удалось обработать письмо {msg_id}: {e}")
            
            logger.info(f"Успешно получено {len(email_data)} писем для {user.email}, mailbox: {selected_mailbox}")
            return email_data, None, total_count
    
    except UserProfile.DoesNotExist:
        logger.error(f"Профиль пользователя не найден: {user.email}")
        return [], (ERR_TYPE_CONFIG, "Профиль пользователя не настроен"), 0
    except Exception as e:
        logger.error(f"Неожиданная ошибка при получении писем для {user.email}: {e}")
        return [], (ERR_TYPE_CONNECTION, str(e)), 0

def _connect_and_login(credentials: Dict[str, str]) -> Tuple[Optional[imaplib.IMAP4_SSL], Optional[Tuple[str, str]]]:
    """Подключается и логинится. Возвращает (connection, error)."""
    try:
        logger.info(f"Подключение к IMAP {credentials['imap_host']}:{credentials['imap_port']} для {credentials['imap_user']}")
        context = ssl.create_default_context()
        mail = imaplib.IMAP4_SSL(credentials['imap_host'], credentials['imap_port'], ssl_context=context)
        typ, login_response = mail.login(credentials['imap_user'], credentials['imap_password'])
        if typ != 'OK':
             # IMAP4.error обычно не срабатывает на неудачный логин, проверяем ответ
             msg = f"Ошибка аутентификации IMAP для {credentials['imap_user']}: {login_response[0].decode()}"
             logger.error(msg)
             try: mail.shutdown() # Используем shutdown вместо logout, если логин не удался
             except: pass
             return None, (ERR_TYPE_AUTHENTICATION, msg)
        logger.info(f"Успешный вход IMAP для {credentials['imap_user']}")
        return mail, None
    except (imaplib.IMAP4.error, smtplib.SMTPAuthenticationError) as e: # Добавляем ошибку аутентификации SMTP, хотя она здесь не должна быть
         msg = f"Ошибка аутентификации IMAP для {credentials.get('imap_user', '?')}: {e}"
         logger.error(msg)
         return None, (ERR_TYPE_AUTHENTICATION, msg)
    except (socket.gaierror, socket.timeout, ConnectionRefusedError, OSError) as e:
        msg = f"Ошибка подключения к IMAP серверу {credentials.get('imap_host', '?')} для {credentials.get('imap_user', '?')}: {e}"
        logger.error(msg)
        return None, (ERR_TYPE_CONNECTION, msg)
    except ssl.SSLError as e:
        msg = f"Ошибка SSL при подключении к IMAP для {credentials.get('imap_user', '?')}: {e}"
        logger.error(msg)
        return None, (ERR_TYPE_CONNECTION, msg)
    except Exception as e:
        msg = f"Неизвестная ошибка при подключении/логине IMAP для {credentials.get('imap_user', '?')}: {e}"
        logger.error(msg, exc_info=True)
        return None, (ERR_TYPE_UNKNOWN, msg)

def set_email_flags(user, email_ids: List[str], flags: List[str], mailbox: str = "INBOX", add: bool = True) -> Tuple[bool, Optional[Tuple[str, str]]]:
    """Устанавливает флаги. Возвращает (success, error)."""
    credentials, error = _get_user_credentials(user)
    if error:
        return False, error

    mail = None
    try:
        mail, error = _connect_and_login(credentials)
        if error:
            return False, error
        
        # Используем новую функцию выбора ящика
        success, error_info = _select_mailbox(mail, mailbox, user.email)
        if not success:
            if mail: mail.logout()
            return False, error_info

        ids_string = ",".join(email_ids)
        flags_string = "(" + " ".join(flags) + ")"
        command = "+FLAGS.SILENT" if add else "-FLAGS.SILENT"
        
        typ, response = mail.store(ids_string, command, flags_string)
        
        if typ == "OK":
            if mail: mail.logout()
            return True, None
        else:
            error_message = "Unknown error"
            try: error_message = response[0].decode()
            except: pass
            msg = f"Ошибка IMAP при установке флагов для {ids_string} ({user.email}): {error_message}"
            logger.error(msg)
            if mail: mail.logout()
            return False, (ERR_TYPE_OPERATION, msg)

    except Exception as e:
        msg = f"Неизвестная ошибка при установке флагов для {user.email}: {e}"
        logger.error(msg, exc_info=True)
        if mail: 
            try: mail.logout() 
            except Exception: pass
        return False, (ERR_TYPE_UNKNOWN, msg)

def delete_email(user, email_ids: List[str], mailbox: str = "INBOX") -> Tuple[bool, Optional[Tuple[str, str]]]:
    """Удаляет письма (помечает \\Deleted и делает expunge). Возвращает (success, error)."""
    # TODO: Реализовать перемещение в Корзину вместо expunge
    credentials, error = _get_user_credentials(user)
    if error:
        return False, error

    mail = None
    try:
        mail, error = _connect_and_login(credentials)
        if error:
            return False, error
        
        # Используем новую функцию выбора ящика
        success, error_info = _select_mailbox(mail, mailbox, user.email)
        if not success:
            if mail: mail.logout()
            return False, error_info

        ids_string = ",".join(email_ids)
        logger.info(f"Пометка писем {ids_string} как удаленных в {mailbox} для {user.email}")
        typ, response = mail.store(ids_string, '+FLAGS.SILENT', '(\\Deleted)') # Добавляем .SILENT
        
        if typ != "OK":
            error_message = "Unknown error"
            try: error_message = response[0].decode()
            except: pass
            msg = f"Ошибка IMAP при пометке писем {ids_string} как удаленные ({user.email}): {error_message}"
            logger.error(msg)
            if mail: mail.logout()
            return False, (ERR_TYPE_OPERATION, msg)
        
        logger.info(f"Выполнение EXPUNGE в {mailbox} для {user.email}")
        typ_expunge, response_expunge = mail.expunge()
        
        if typ_expunge != "OK":
            error_message = "Unknown error"
            try: error_message = response_expunge[0].decode()
            except: pass
            msg = f"Ошибка IMAP при выполнении EXPUNGE для {mailbox} ({user.email}): {error_message}"
            logger.warning(msg) # Логируем как warning, т.к. пометка могла пройти успешно
            # Все равно считаем условно успешным, если пометка прошла
        
        if mail: mail.logout()
        return True, None

    except Exception as e:
        msg = f"Неизвестная ошибка при удалении писем для {user.email}: {e}"
        logger.error(msg, exc_info=True)
        if mail: 
            try: mail.logout() 
            except Exception: pass
        return False, (ERR_TYPE_UNKNOWN, msg)

def send_email(user, to: str, subject: str, body: str, documents: List[int] = None) -> Tuple[bool, Optional[Tuple[str, str]]]:
    """Отправляет письмо через SMTP и сохраняет копию в папку Sent через IMAP."""
    credentials, error = _get_user_credentials(user)
    if error:
        return False, error

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = credentials['smtp_user']
    msg['To'] = to
    
    # Устанавливаем HTML-контент
    msg.add_alternative(body, subtype='html')
    
    # Добавляем прикрепленные документы
    if documents:
        from documents.models import Document
        for doc_id in documents:
            try:
                doc = Document.objects.get(id=doc_id)
                with open(doc.file.path, 'rb') as f:
                    msg.add_attachment(
                        f.read(),
                        maintype='application',
                        subtype='octet-stream',
                        filename=doc.name
                    )
            except Document.DoesNotExist:
                logger.warning(f"Документ с ID {doc_id} не найден")
            except Exception as e:
                logger.error(f"Ошибка при прикреплении документа {doc_id}: {e}")
    
    error_info = None
    success = False
    smtp_server = None # Для закрытия соединения в finally

    try:
        # --- SMTP Отправка --- 
        logger.info(f"Подключение к SMTP {credentials['smtp_host']}:{credentials['smtp_port']} для {credentials['smtp_user']}")
        context = ssl.create_default_context()
        port = int(credentials['smtp_port'])
        host = credentials['smtp_host']
        smtp_user = credentials['smtp_user']
        smtp_password = credentials['smtp_password']

        if port == 465:
            smtp_server = smtplib.SMTP_SSL(host, port, context=context)
            smtp_server.login(smtp_user, smtp_password)
            smtp_server.send_message(msg)
        elif port == 587:
            smtp_server = smtplib.SMTP(host, port)
            smtp_server.starttls(context=context)
            smtp_server.login(smtp_user, smtp_password)
            smtp_server.send_message(msg)
        else: # Пробуем без явного шифрования
            smtp_server = smtplib.SMTP(host, port)
            try: # Попытка STARTTLS
                smtp_server.starttls(context=context)
                smtp_server.login(smtp_user, smtp_password)
            except smtplib.SMTPNotSupportedError:
                try: # Попытка логина без STARTTLS
                    smtp_server.login(smtp_user, smtp_password)
                except smtplib.SMTPNotSupportedError:
                    err_msg = f"SMTP сервер {host}:{port} не поддерживает STARTTLS или вход без шифрования."
                    logger.error(err_msg)
                    # Закрываем соединение перед выходом
                    try: smtp_server.quit() 
                    except Exception: pass
                    return False, (ERR_TYPE_CONNECTION, err_msg)
            smtp_server.send_message(msg)

        logger.info(f"Письмо от {smtp_user} к {to} успешно отправлено через SMTP.")
        success = True # Отправка SMTP прошла успешно
        # Закрываем SMTP соединение после отправки
        try: smtp_server.quit()
        except Exception: pass
        smtp_server = None

    except smtplib.SMTPAuthenticationError as e:
        m = f"Ошибка аутентификации SMTP для {user.email}: {e}"
        logger.error(m)
        error_info = (ERR_TYPE_AUTHENTICATION, m)
    except (socket.gaierror, socket.timeout, ConnectionRefusedError, OSError) as e:
        m = f"Ошибка подключения к SMTP серверу {credentials.get('smtp_host', '?')} для {user.email}: {e}"
        logger.error(m)
        error_info = (ERR_TYPE_CONNECTION, m)
    except ssl.SSLError as e:
        m = f"Ошибка SSL при подключении к SMTP для {user.email}: {e}"
        logger.error(m)
        error_info = (ERR_TYPE_CONNECTION, m)
    except smtplib.SMTPException as e:
        m = f"Общая ошибка SMTP для {user.email}: {e}"
        logger.error(m)
        error_info = (ERR_TYPE_OPERATION, m)
    except Exception as e:
        m = f"Неизвестная ошибка при отправке письма (SMTP) для {user.email}: {e}"
        logger.error(m, exc_info=True)
        error_info = (ERR_TYPE_UNKNOWN, m)
    finally:
        # Гарантированно закрываем SMTP соединение, если оно еще открыто
        if smtp_server:
            try: smtp_server.quit() 
            except Exception: pass

    # --- IMAP Сохранение в Отправленные (если SMTP прошло успешно) --- 
    if success: # 'success' здесь означает успех SMTP
        imap_mail = None
        try:
            # Подключаемся к IMAP для сохранения копии
            logger.debug(f"Попытка подключения к IMAP для сохранения копии письма от {user.email}")
            imap_mail, imap_error = _connect_and_login(credentials)
            if imap_error:
                 # Не считаем критической ошибкой, если не удалось сохранить копию
                 logger.warning(f"Не удалось подключиться к IMAP для сохранения копии отправленного письма ({user.email}): {imap_error}")
                 # Возвращаем успех SMTP и исходную ошибку SMTP (если была), иначе None
                 return success, error_info 
            
            # Пытаемся выбрать папку Sent (с префиксом, если нужно)
            sent_mailbox_name_to_try = 'Sent' # Стандартное имя для попытки
            logger.debug(f"Попытка выбора папки '{sent_mailbox_name_to_try}' (или с префиксом) для сохранения копии ({user.email})")
            
            # Используем обновленную _select_mailbox, которая возвращает имя
            selected_sent_mailbox, select_error = _select_mailbox(imap_mail, sent_mailbox_name_to_try, user.email)
            
            if not selected_sent_mailbox:
                # Если выбрать папку Sent (даже с префиксом) не удалось
                # select_error уже содержит детали ошибки
                logger.warning(f"Не удалось выбрать папку '{sent_mailbox_name_to_try}' (или с префиксом) для сохранения копии ({user.email}): {select_error}")
                # Не сохраняем, но SMTP мог пройти успешно
            else:
                # Папка выбрана (имя в selected_sent_mailbox), сохраняем письмо
                logger.debug(f"Папка '{selected_sent_mailbox}' выбрана. Попытка APPEND для сохранения копии ({user.email})")
                try:
                    # Устанавливаем флаг \Seen. Дату не передаем, сервер установит сам.
                    # msg.as_bytes() - получаем байтовое представление письма
                    imap_status, append_response = imap_mail.append(selected_sent_mailbox, # Используем имя выбранного ящика
                                                                     '(\\Seen)', 
                                                                     None, # Передаем None вместо даты
                                                                     msg.as_bytes())
                    if imap_status == 'OK':
                        logger.info(f"Копия письма для {to} успешно сохранена в '{selected_sent_mailbox}' ({user.email})")
                    else:
                        append_error_msg = "Unknown error"
                        try: append_error_msg = append_response[0].decode() 
                        except: pass
                        logger.warning(f"Команда APPEND не удалась для '{selected_sent_mailbox}' ({user.email}): {append_error_msg}")
                except Exception as append_exc:
                     logger.warning(f"Исключение во время APPEND в '{selected_sent_mailbox}' ({user.email}): {append_exc}", exc_info=True)

            # Закрываем IMAP соединение
            logger.debug(f"Закрытие IMAP соединения после попытки сохранения копии ({user.email})")
            if imap_mail:
                 try: imap_mail.logout() 
                 except: pass
        
        except Exception as imap_exc:
             # Общая ошибка при работе с IMAP для сохранения
             logger.warning(f"Не удалось сохранить копию отправленного письма ({user.email}) из-за общей ошибки IMAP: {imap_exc}", exc_info=True)
             if imap_mail:
                 try: imap_mail.logout() 
                 except: pass
                 
    # Возвращаем результат операции SMTP и ошибку SMTP (если была)
    return success, error_info 

def list_mailboxes(user) -> Tuple[Optional[List[Dict]], Optional[Tuple[str, str]]]:
    """Подключается к IMAP, получает список почтовых ящиков. Возвращает (mailboxes_list, error)."""
    credentials, error = _get_user_credentials(user)
    if error:
        return None, error

    mailboxes_list = []
    mail = None
    try:
        mail, error = _connect_and_login(credentials)
        if error:
            return None, error

        # Получаем список всех ящиков
        logger.debug(f"Запрос списка ящиков для {user.email}") # Добавим лог перед запросом
        typ, data = mail.list()
        if typ != 'OK':
            msg = f"Ошибка получения списка ящиков для {user.email}: {data}"
            logger.error(msg)
            mail.logout()
            return None, (ERR_TYPE_OPERATION, msg)

        # Логируем необработанный ответ сервера
        logger.debug(f"Необработанный ответ mail.list() для {user.email}: {data}")

        for line in data:
            if isinstance(line, bytes):
                try:
                    line_str = line.decode('utf-8', errors='replace') # Используем replace для безопасности
                    logger.debug(f"Обработка строки ящика для {user.email}: {line_str!r}") # Логируем саму строку
                    match = MAILBOX_LIST_REGEX.match(line_str)
                    if match:
                        group_dict = match.groupdict()
                        name = group_dict['name']
                        flags_str = group_dict['flags']
                        delimiter = group_dict['delimiter']
                        logger.debug(f"  -> Распарсено: name='{name}', flags='{flags_str}', delimiter='{delimiter}'") # Лог успешного парсинга

                        # Очищаем имя от префикса INBOX., если он есть
                        if name.startswith(INBOX_PREFIX):
                             display_name = name[len(INBOX_PREFIX):]
                        else:
                             display_name = name
                             
                        # Пропускаем системные/нежелательные ящики по флагам или имени
                        flags = set(flags_str.lower().split())
                        skip_reason = None
                        if '\\noselect' in flags:
                            skip_reason = "'\\noselect' flag"
                        elif '\\nonexistent' in flags:
                             skip_reason = "'\\nonexistent' flag"
                        elif name.lower() in SKIPPED_MAILBOXES:
                             skip_reason = f"имя '{name.lower()}' в SKIPPED_MAILBOXES"
                             
                        if skip_reason:
                            logger.debug(f"  -> Пропущен ящик '{name}' из-за: {skip_reason} (флаги: {flags})")
                            continue

                        mailbox_data = {
                            "name": name, # Оригинальное имя для использования в IMAP командах
                            "display_name": display_name, # Имя для отображения пользователю
                            "delimiter": delimiter,
                            "flags": list(flags) # Преобразуем обратно в список для JSON-сериализации
                        }
                        mailboxes_list.append(mailbox_data)
                        logger.debug(f"  -> Добавлен ящик: {mailbox_data}") # Лог добавленного ящика

                    else:
                        logger.warning(f"  -> Не удалось распарсить строку списка ящиков для {user.email}: {line_str!r}")
                except Exception as e:
                     logger.error(f"Ошибка при обработке строки ящика '{line!r}' для {user.email}: {e}", exc_info=True) # Лог ошибки обработки строки
            elif line is not None:
                logger.warning(f"Получена не байтовая или None строка в списке ящиков для {user.email}: {line!r}")


        logger.info(f"Получен и обработан список из {len(mailboxes_list)} ящиков для {user.email} после фильтрации") # Обновленный лог
        if mail: mail.logout()
        
        # Сортируем: сначала INBOX, потом остальные по display_name
        def sort_key(mailbox):
            if mailbox['name'] == 'INBOX':
                return (0, '') # INBOX всегда первый
            # Убираем префикс для сортировки, если он есть, чтобы Drafts и INBOX/Drafts были рядом
            sort_name = mailbox['display_name'].lower() 
            return (1, sort_name)

        mailboxes_list.sort(key=sort_key)
        logger.debug(f"Отсортированный список ящиков для {user.email}: {mailboxes_list}") # Лог после сортировки
        
        return mailboxes_list, None # Успех

    except imaplib.IMAP4.error as e:
        msg = f"Операционная ошибка IMAP при получении списка папок для {user.email}: {e}"
        logger.error(msg)
        error_info = (ERR_TYPE_OPERATION, msg)
    except ssl.SSLError as e:
        msg = f"Ошибка SSL при получении списка папок для {user.email}: {e}"
        logger.error(msg)
        error_info = (ERR_TYPE_CONNECTION, msg)
    except Exception as e:
        msg = f"Неизвестная ошибка при получении списка папок для {user.email}: {e}"
        logger.error(msg, exc_info=True)
        error_info = (ERR_TYPE_UNKNOWN, msg)
    finally:
        if mail:
            try: mail.logout() 
            except Exception: pass
    
    return None, error_info # Возвращаем ошибку

def _extract_email_body(email_obj):
    """
    Извлекает текстовое содержимое письма с расширенной обработкой.
    
    :param email_obj: Объект письма из библиотеки email
    :return: Словарь с содержимым письма
    """
    body_plain = None
    body_html = None
    attachments = []

    try:
        if email_obj.is_multipart():
            for part in email_obj.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get('Content-Disposition', ''))
                
                charset = part.get_content_charset() or 'utf-8'

                # Обработка текстового содержимого
                if content_type == 'text/plain' and body_plain is None:
                    try:
                        payload = part.get_payload(decode=True)
                        body_plain = payload.decode(charset, errors='replace').strip()
                    except Exception as e:
                        logger.warning(f"Ошибка декодирования plain text: {e}")

                # Обработка HTML содержимого
                elif content_type == 'text/html' and body_html is None:
                    try:
                        payload = part.get_payload(decode=True)
                        body_html = payload.decode(charset, errors='replace').strip()
                    except Exception as e:
                        logger.warning(f"Ошибка декодирования HTML: {e}")

                # Обработка вложений
                if 'attachment' in content_disposition.lower():
                    filename = part.get_filename()
                    if filename:
                        try:
                            filename = _decode_email_header(filename)
                            attachments.append({
                                'filename': filename,
                                'size': len(part.get_payload(decode=True)),
                                'content_type': content_type
                            })
                        except Exception as e:
                            logger.warning(f"Ошибка обработки вложения: {e}")

        else:
            # Обработка простого (не мультипарт) письма
            content_type = email_obj.get_content_type()
            charset = email_obj.get_content_charset() or 'utf-8'

            try:
                payload = email_obj.get_payload(decode=True)
                if content_type == 'text/plain':
                    body_plain = payload.decode(charset, errors='replace').strip()
                elif content_type == 'text/html':
                    body_html = payload.decode(charset, errors='replace').strip()
            except Exception as e:
                logger.warning(f"Ошибка декодирования простого письма: {e}")

        # Возвращаем словарь с содержимым
        return {
            'plain': body_plain or '',
            'html': body_html or '',
            'attachments': attachments
        }

    except Exception as e:
        logger.error(f"Критическая ошибка при извлечении содержимого письма: {e}", exc_info=True)
        return {
            'plain': 'Не удалось извлечь содержимое письма',
            'html': '',
            'attachments': []
        }