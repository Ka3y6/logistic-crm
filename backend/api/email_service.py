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

def _select_mailbox(mail: imaplib.IMAP4_SSL, mailbox: str, user_email: str) -> Tuple[Optional[str], Optional[Tuple[str, str]]]:
    """Выбирает почтовый ящик, пробуя префикс INBOX., если нужно. 
    Возвращает (selected_mailbox_name, error).
    """
    selected_mailbox_name = None # Инициализируем
    logger.info(f"Выбор ящика '{mailbox}' для {user_email}")
    status, select_info = mail.select(mailbox)
    effective_mailbox = mailbox # Имя, которое пытаемся выбрать
    
    # Если не удалось и это стандартный ящик, пробуем с префиксом
    if status != "OK" and mailbox in PREFIXABLE_MAILBOXES:
        prefixed_mailbox = f"{INBOX_PREFIX}{mailbox}"
        logger.info(f"Не удалось выбрать '{mailbox}', пробую '{prefixed_mailbox}' для {user_email}")
        status, select_info = mail.select(prefixed_mailbox)
        effective_mailbox = prefixed_mailbox # Обновляем имя, которое пытались выбрать

    if status != "OK":
        # Если и с префиксом не удалось, или это был не стандартный ящик
        error_message = "Unknown error" # Значение по умолчанию
        try:
           error_message = select_info[0].decode()
        except (IndexError, AttributeError):
           pass # Оставляем значение по умолчанию
           
        msg = f"Не удалось выбрать ящик '{mailbox}' (или с префиксом '{effective_mailbox}') для {user_email}: {error_message}"
        logger.error(msg)
        return None, (ERR_TYPE_MAILBOX, msg)

    # Если мы дошли сюда, значит статус == "OK"
    selected_mailbox_name = effective_mailbox # Запоминаем имя, которое сработало
    logger.info(f"Ящик '{selected_mailbox_name}' успешно выбран для {user_email}")
    return selected_mailbox_name, None

def fetch_emails(user, mailbox: str = "INBOX", limit: int = 20, offset: int = 0) -> Tuple[Optional[List[Dict]], Optional[Tuple[str, str]]]:
    """Подключается к IMAP, получает письма. Возвращает (emails_list, error). 
       Поддерживает limit и offset для пагинации.
    """
    logger.debug(f"Начало fetch_emails для {user.email}, запрошенный ящик: '{mailbox}', лимит: {limit}, смещение: {offset}") # Добавили offset в лог
    credentials, error = _get_user_credentials(user)
    if error:
        return None, error

    emails_list = []
    mail = None
    total_emails_in_mailbox = 0 # Инициализируем общее количество
    try:
        mail, error = _connect_and_login(credentials)
        if error:
            return None, error
        
        logger.debug(f"Вызов _select_mailbox для {user.email}, запрошенный ящик: '{mailbox}'")
        selected_mailbox_name, error_info = _select_mailbox(mail, mailbox, user.email) 
        logger.debug(f"Результат _select_mailbox: selected_mailbox_name='{selected_mailbox_name}', error_info={error_info}")
        
        if not selected_mailbox_name:
            if mail: mail.logout()
            return None, error_info 

        # Ищем все письма
        logger.debug(f"Поиск писем (search ALL) в '{selected_mailbox_name}' для {user.email}") 
        status, messages = mail.search(None, "ALL")
        logger.debug(f"Результат mail.search в '{selected_mailbox_name}': status='{status}', messages={messages}")
        if status != "OK":
            err_msg_text = f"Ошибка поиска писем для {user.email} в ящике '{selected_mailbox_name}': {messages}"
            logger.error(err_msg_text)
            mail.logout()
            return None, (ERR_TYPE_OPERATION, err_msg_text)

        email_ids = messages[0].split()
        total_emails_in_mailbox = len(email_ids)
        logger.debug(f"В ящике '{selected_mailbox_name}' найдено ID писем: {total_emails_in_mailbox}")
        
        # Применяем срез на основе offset и limit
        email_ids.reverse() # Теперь email_ids[0] - самый новый
        start_index = offset
        end_index = offset + limit
        ids_to_fetch = email_ids[start_index:end_index]
        
        logger.debug(f"Будут получены письма с индексами {start_index}-{end_index-1} (ID: {ids_to_fetch})")

        for email_id in ids_to_fetch: # Итерируемся по выбранному срезу
            # Получаем полное тело письма
            status, msg_data = mail.fetch(email_id, '(RFC822)')
            if status != 'OK':
                 logger.warning(f"Не удалось получить RFC822 для письма {email_id.decode()} в {selected_mailbox_name}")
                 continue

            body_plain = None
            body_html = None
            raw_email = None

            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    # response_part[1] содержит полное тело письма в байтах
                    raw_email = response_part[1]
                    break # Нашли тело, выходим из внутреннего цикла
            
            if raw_email:
                msg = email.message_from_bytes(raw_email)

                # Извлекаем заголовки как и раньше
                subject = _decode_email_header(msg.get("Subject", "Без темы"))
                from_ = _decode_email_header(msg.get("From", "Неизвестный отправитель"))
                # Получаем To для возможного Reply All (хотя фронтенд это пока не использует)
                to_ = _decode_email_header(msg.get("To", "")) 
                date_str = msg.get("Date")
                date_iso = None # Добавим ISO формат для фронтенда
                local_date = "Неизвестная дата"
                if date_str:
                    try:
                        dt_aware = parsedate_to_datetime(date_str)
                        if dt_aware:
                             date_iso = dt_aware.isoformat()
                             # Форматируем для отображения
                             local_date = email.utils.formatdate(timezone.localtime(dt_aware).timestamp(), localtime=True) 
                    except Exception as date_exc:
                        logger.warning(f"Ошибка парсинга даты '{date_str}': {date_exc}")
                        # Пробуем старый метод как fallback
                        try:
                             date_tuple = email.utils.parsedate_tz(date_str)
                             if date_tuple:
                                local_date = email.utils.formatdate(email.utils.mktime_tz(date_tuple), localtime=True)
                        except Exception:
                            pass # Оставляем "Неизвестная дата"
                
                # Парсим тело письма для plain text и html
                if msg.is_multipart():
                    for part in msg.walk():
                        content_type = part.get_content_type()
                        content_disposition = str(part.get('Content-Disposition'))
                        charset = part.get_content_charset() or 'utf-8' # Фоллбэк на utf-8

                        # Пропускаем вложения и нетекстовые части
                        if 'attachment' in content_disposition:
                            continue

                        if content_type == 'text/plain' and body_plain is None:
                            try:
                                body_plain = part.get_payload(decode=True).decode(charset, errors='replace')
                            except Exception as decode_exc:
                                logger.warning(f"Ошибка декодирования text/plain части письма {email_id.decode()}: {decode_exc}")
                        elif content_type == 'text/html' and body_html is None:
                            try:
                                body_html = part.get_payload(decode=True).decode(charset, errors='replace')
                            except Exception as decode_exc:
                                logger.warning(f"Ошибка декодирования text/html части письма {email_id.decode()}: {decode_exc}")

                else: # Если письмо не multipart
                    content_type = msg.get_content_type()
                    charset = msg.get_content_charset() or 'utf-8'
                    if content_type == 'text/plain':
                         try:
                            body_plain = msg.get_payload(decode=True).decode(charset, errors='replace')
                         except Exception as decode_exc:
                            logger.warning(f"Ошибка декодирования non-multipart text/plain письма {email_id.decode()}: {decode_exc}")
                    elif content_type == 'text/html':
                         try:
                             body_html = msg.get_payload(decode=True).decode(charset, errors='replace')
                         except Exception as decode_exc:
                            logger.warning(f"Ошибка декодирования non-multipart text/html письма {email_id.decode()}: {decode_exc}")

                # Используем plain text для превью, если есть, иначе html, иначе пусто
                content_preview_source = body_plain if body_plain else body_html if body_html else ""
                content_preview = (content_preview_source[:100] + '...') if len(content_preview_source) > 100 else content_preview_source
                            
                emails_list.append({
                    "id": email_id.decode(), 
                    "from": from_,
                    "to": to_, # Добавляем поле To
                    "subject": subject,
                    "date": local_date, # Отформатированная локальная дата
                    "date_iso": date_iso, # ISO дата для возможной сортировки/форматирования на фронте
                    "content_preview": content_preview,
                    "body_plain": body_plain, # Добавляем body_plain
                    "body_html": body_html, # Добавляем body_html
                    "is_read": False, # TODO: Получать статус прочитанности
                    "is_starred": False, # TODO: Получать флаг \Flagged
                    "attachments": [], # TODO: Реализовать получение вложений
                    "mailbox": selected_mailbox_name # Добавляем имя ящика, где нашли письмо
                })
            else:
                 logger.warning(f"Не удалось получить тело письма (RFC822) для ID {email_id.decode()}")

        logger.info(f"Получено {len(emails_list)} писем из '{selected_mailbox_name}' для {user.email}") # Обновили лог
        if mail: mail.logout()
        # Возвращаем список писем и общее количество для пагинации
        return emails_list, None, total_emails_in_mailbox # Успех

    except imaplib.IMAP4.error as e:
        current_mailbox = selected_mailbox_name if 'selected_mailbox_name' in locals() and selected_mailbox_name else mailbox
        msg = f"Операционная ошибка IMAP для {user.email} в ящике '{current_mailbox}': {e}"
        logger.error(msg)
        error_info = (ERR_TYPE_OPERATION, msg)
    except ssl.SSLError as e:
        current_mailbox = selected_mailbox_name if 'selected_mailbox_name' in locals() and selected_mailbox_name else mailbox
        msg = f"Ошибка SSL во время операции IMAP для {user.email} в ящике '{current_mailbox}': {e}"
        logger.error(msg)
        error_info = (ERR_TYPE_CONNECTION, msg)
    except Exception as e:
        current_mailbox = selected_mailbox_name if 'selected_mailbox_name' in locals() and selected_mailbox_name else mailbox
        msg = f"Неизвестная ошибка при получении писем для {user.email} в ящике '{current_mailbox}': {e}"
        logger.error(msg, exc_info=True)
        error_info = (ERR_TYPE_UNKNOWN, msg)
    finally:
        if mail:
            try: mail.logout() 
            except Exception: pass
    
    # Возвращаем None для списка, ошибку и 0 для total_count при ошибке
    return None, error_info, 0 

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