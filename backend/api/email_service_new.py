import imaplib
import email
from email.header import decode_header
from datetime import datetime
import logging
from django.conf import settings
from .models import UserProfile
from .utils import decrypt_data
from .exceptions import EmailError, ERR_TYPE_CONFIG, ERR_TYPE_AUTHENTICATION, ERR_TYPE_CONNECTION, ERR_TYPE_MAILBOX, ERR_TYPE_OPERATION

logger = logging.getLogger(__name__)

def fetch_emails(user_email, mailbox='INBOX', limit=25, offset=0):
    try:
        # Получаем профиль пользователя
        profile = UserProfile.objects.get(user__email=user_email)
        
        # Проверяем, включена ли интеграция с почтой
        if not profile.email_integration_enabled:
            raise EmailError(ERR_TYPE_CONFIG, "Интеграция с почтой не включена")

        # Получаем настройки IMAP
        imap_host = profile.imap_host
        imap_port = profile.imap_port
        imap_user = profile.imap_user
        imap_password = decrypt_data(profile.imap_password_encrypted) if profile.imap_password_encrypted else None
        imap_use_ssl = profile.imap_use_ssl

        if not all([imap_host, imap_port, imap_user, imap_password]):
            raise EmailError(ERR_TYPE_CONFIG, "Неполная конфигурация IMAP")

        # Подключаемся к IMAP серверу
        logger.info(f"Подключение к IMAP серверу {imap_host}:{imap_port}")
        imap_server = imaplib.IMAP4_SSL(imap_host, imap_port) if imap_use_ssl else imaplib.IMAP4(imap_host, imap_port)
        
        # Аутентифицируемся
        try:
            imap_server.login(imap_user, imap_password)
            logger.info(f"Успешная аутентификация для {user_email}")
        except imaplib.IMAP4.error as e:
            logger.error(f"Ошибка аутентификации IMAP для {user_email}: {str(e)}")
            raise EmailError(ERR_TYPE_AUTHENTICATION, f"Ошибка аутентификации: {str(e)}")

        # Получаем список доступных папок
        try:
            folders = [folder.decode() for folder in imap_server.list()[1]]
            logger.info(f"Доступные папки для {user_email}: {folders}")
        except Exception as e:
            logger.error(f"Ошибка получения списка папок для {user_email}: {str(e)}")
            raise EmailError(ERR_TYPE_OPERATION, f"Ошибка получения списка папок: {str(e)}")

        # Определяем правильное название папки
        mailbox_variants = []
        
        # Для Gmail
        if isinstance(user_email, str) and 'gmail.com' in user_email.lower():
            mailbox_variants = [
                mailbox,
                f'[Gmail]/{mailbox}',
                f'INBOX.{mailbox}',
                f'INBOX/{mailbox}'
            ]
        # Для других серверов
        else:
            # Стандартные варианты для папки "Отправленные"
            if 'отправлен' in mailbox.lower():
                mailbox_variants = [
                    'INBOX.Sent',
                    'INBOX.Sent Items',
                    'Sent',
                    'Sent Items',
                    'Отправленные',
                    'INBOX.Отправленные'
                ]
            # Стандартные варианты для папки "Входящие"
            elif 'inbox' in mailbox.lower():
                mailbox_variants = ['INBOX']
            # Стандартные варианты для папки "Черновики"
            elif 'draft' in mailbox.lower():
                mailbox_variants = [
                    'INBOX.Drafts',
                    'Drafts',
                    'Черновики',
                    'INBOX.Черновики'
                ]
            # Стандартные варианты для папки "Корзина"
            elif 'trash' in mailbox.lower():
                mailbox_variants = [
                    'INBOX.Trash',
                    'Trash',
                    'Корзина',
                    'INBOX.Корзина'
                ]
            # Для остальных папок
            else:
                mailbox_variants = [
                    f'INBOX.{mailbox}',
                    mailbox,
                    f'INBOX/{mailbox}'
                ]

        logger.info(f"Варианты имен папок для {user_email}: {mailbox_variants}")

        # Пробуем выбрать папку
        selected_mailbox = None
        for variant in mailbox_variants:
            try:
                logger.info(f"Попытка выбора папки '{variant}' для {user_email}")
                status, data = imap_server.select(variant)
                if status == 'OK':
                    selected_mailbox = variant
                    logger.info(f"Успешно выбрана папка '{variant}' для {user_email}")
                    break
            except imaplib.IMAP4.error as e:
                logger.warning(f"Не удалось выбрать папку '{variant}': {str(e)}")
                continue

        if not selected_mailbox:
            logger.error(f"Не удалось выбрать папку {mailbox} ни в одном варианте")
            raise EmailError(ERR_TYPE_MAILBOX, f"Не удалось выбрать папку {mailbox} ни в одном варианте")

        # Получаем список писем
        try:
            status, messages = imap_server.search(None, 'ALL')
            if status != 'OK':
                raise EmailError(ERR_TYPE_OPERATION, "Ошибка поиска писем")

            # Получаем список ID писем
            email_ids = messages[0].split()
            total_emails = len(email_ids)
            logger.info(f"Найдено {total_emails} писем в папке {selected_mailbox}")

            # Применяем пагинацию
            start_idx = max(0, total_emails - offset - limit)
            end_idx = max(0, total_emails - offset)
            email_ids = email_ids[start_idx:end_idx]
            logger.info(f"Запрашиваем {len(email_ids)} писем (offset={offset}, limit={limit})")

            # Получаем письма
            emails = []
            for email_id in email_ids:
                try:
                    status, msg_data = imap_server.fetch(email_id, '(RFC822)')
                    if status != 'OK':
                        continue

                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)
                    
                    # Получаем заголовки
                    subject = decode_header(msg.get('Subject', ''))[0]
                    subject = subject[0].decode(subject[1] or 'utf-8') if isinstance(subject[0], bytes) else subject[0]
                    
                    from_addr = decode_header(msg.get('From', ''))[0]
                    from_addr = from_addr[0].decode(from_addr[1] or 'utf-8') if isinstance(from_addr[0], bytes) else from_addr[0]
                    
                    date = msg.get('Date', '')
                    try:
                        date = datetime.strptime(date, '%a, %d %b %Y %H:%M:%S %z').isoformat()
                    except:
                        date = datetime.now().isoformat()

                    # Получаем тело письма
                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_type() == "text/plain":
                                try:
                                    body = part.get_payload(decode=True).decode()
                                except:
                                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                                break
                    else:
                        try:
                            body = msg.get_payload(decode=True).decode()
                        except:
                            body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')

                    emails.append({
                        'id': email_id.decode(),
                        'subject': subject,
                        'from': from_addr,
                        'date': date,
                        'body': body,
                        'mailbox': selected_mailbox
                    })
                except Exception as e:
                    logger.error(f"Ошибка при обработке письма {email_id}: {str(e)}")
                    continue

            logger.info(f"Успешно получено {len(emails)} писем для {user_email}, mailbox: {selected_mailbox}")
            return {
                'emails': emails,
                'total': total_emails,
                'mailbox': selected_mailbox
            }

        except Exception as e:
            logger.error(f"Ошибка при получении писем: {str(e)}")
            raise EmailError(ERR_TYPE_OPERATION, f"Ошибка при получении писем: {str(e)}")

    except EmailError as e:
        raise e
    except Exception as e:
        logger.error(f"Неожиданная ошибка при получении писем: {str(e)}")
        raise EmailError(ERR_TYPE_UNKNOWN, f"Неожиданная ошибка: {str(e)}")
    finally:
        try:
            imap_server.logout()
        except:
            pass 