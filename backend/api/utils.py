import re
from typing import Dict, List, Optional, Tuple

def normalize_phone(phone: str) -> Optional[str]:
    """
    Нормализует номер телефона к формату +375XXXXXXXXX
    
    Args:
        phone: Номер телефона в любом формате
        
    Returns:
        Нормализованный номер телефона или None, если номер не удалось нормализовать
    """
    if not phone:
        return None
        
    # Удаляем все нецифровые символы
    digits = re.sub(r'\D', '', phone)
    
    # Если номер начинается с 80, заменяем на +375
    if digits.startswith('80'):
        digits = '375' + digits[2:]
    
    # Если номер начинается с 375, добавляем +
    if digits.startswith('375'):
        return '+' + digits
        
    # Если номер начинается с кода оператора (25, 29, 33, 44)
    if len(digits) == 9 and digits.startswith(('25', '29', '33', '44')):
        return '+375' + digits
        
    # Если номер начинается с 8 и кодом оператора
    if len(digits) == 11 and digits.startswith('8') and digits[1:3] in ('25', '29', '33', '44'):
        return '+375' + digits[1:]
    
    # Если номер начинается с +7, заменяем на +375
    if digits.startswith('7'):
        return '+375' + digits[1:]
        
    # Если номер начинается с 9 и имеет 10 цифр (российский формат)
    if len(digits) == 10 and digits.startswith('9'):
        return '+375' + digits
        
    # Если номер начинается с 7 и имеет 10 цифр (российский формат)
    if len(digits) == 10 and digits.startswith('7'):
        return '+375' + digits
        
    # Если номер начинается с 8 и имеет 10 цифр (российский формат)
    if len(digits) == 10 and digits.startswith('8'):
        return '+375' + digits
        
    # Если номер имеет 9 цифр и начинается с кода оператора
    if len(digits) == 9 and digits.startswith(('25', '29', '33', '44')):
        return '+375' + digits
        
    # Если номер имеет 7 цифр и начинается с кода оператора
    if len(digits) == 7 and digits.startswith(('25', '29', '33', '44')):
        return '+375' + digits
        
    return None

def parse_contacts(contacts_str: str) -> List[Dict[str, str]]:
    """
    Парсит строку с контактами и возвращает список контактов
    
    Args:
        contacts_str: Строка с контактами в формате:
            "Имя: Иван Иванов, Телефон: +375291234567, Email: ivan@example.com"
            или
            "Иван Иванов +375291234567 ivan@example.com"
            
    Returns:
        Список словарей с контактами, где каждый словарь содержит:
        - name: имя контакта
        - phone: нормализованный номер телефона
        - email: email адрес
    """
    if not contacts_str:
        return []
        
    contacts = []
    
    # Пробуем найти контакты в формате "Имя: X, Телефон: Y, Email: Z"
    name_match = re.search(r'(?:Имя|ФИО|Контактное лицо|Контакт):\s*([^,]+)', contacts_str, re.IGNORECASE)
    phone_match = re.search(r'(?:Телефон|Тел|Моб|Мобильный|Тел\.|Тел:):\s*([^,]+)', contacts_str, re.IGNORECASE)
    email_match = re.search(r'(?:Email|Почта|E-mail|E-mail:):\s*([^,\s]+)', contacts_str, re.IGNORECASE)
    
    if name_match or phone_match or email_match:
        contact = {}
        if name_match:
            contact['name'] = name_match.group(1).strip()
        if phone_match:
            phone = normalize_phone(phone_match.group(1).strip())
            if phone:
                contact['phone'] = phone
        if email_match:
            contact['email'] = email_match.group(1).strip()
        if contact:
            contacts.append(contact)
    else:
        # Пробуем найти контакты в свободном формате
        # Ищем email адреса
        emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', contacts_str)
        
        # Ищем телефоны
        phones = []
        phone_patterns = [
            r'\+375\d{9}',  # +375XXXXXXXXX
            r'80\d{9}',     # 80XXXXXXXXX
            r'375\d{9}',    # 375XXXXXXXXX
            r'(?:25|29|33|44)\d{7}',  # XX0000000
            r'\+7\d{10}',   # +7XXXXXXXXXX
            r'8\d{10}',     # 8XXXXXXXXXX
            r'9\d{9}',      # 9XXXXXXXXX
            r'7\d{9}',      # 7XXXXXXXXX
            r'8\d{9}',      # 8XXXXXXXXX
            r'\d{10}',      # XXXXXXXXXX
            r'375\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}',  # 375 XX XXX XX XX
            r'80\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}',   # 80 XX XXX XX XX
            r'\+\s*375\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}',  # +375 XX XXX XX XX
            r'\+\s*7\s*\d{3}\s*\d{3}\s*\d{2}\s*\d{2}',    # +7 XXX XXX XX XX
            r'8\s*\d{3}\s*\d{3}\s*\d{2}\s*\d{2}',         # 8 XXX XXX XX XX
            r'7\s*\d{3}\s*\d{3}\s*\d{2}\s*\d{2}',         # 7 XXX XXX XX XX
            r'9\s*\d{3}\s*\d{3}\s*\d{2}\s*\d{2}',         # 9 XXX XXX XX XX
            r'(?:25|29|33|44)\s*\d{3}\s*\d{2}\s*\d{2}',   # XX XXX XX XX
            r'(?:25|29|33|44)\s*\d{7}',                   # XX XXXXXXX
            r'(?:25|29|33|44)\d{7}'                       # XXXXXXXXX
        ]
        
        for pattern in phone_patterns:
            found_phones = re.findall(pattern, contacts_str)
            for phone in found_phones:
                # Удаляем все пробелы из номера перед нормализацией
                phone = re.sub(r'\s+', '', phone)
                normalized = normalize_phone(phone)
                if normalized and normalized not in phones:
                    phones.append(normalized)
        
        # Ищем имена (слова, начинающиеся с заглавной буквы)
        names = re.findall(r'[А-Я][а-я]+(?:\s+[А-Я][а-я]+)*', contacts_str)
        
        # Создаем контакты
        max_contacts = max(len(emails), len(phones), len(names))
        for i in range(max_contacts):
            contact = {}
            if i < len(names):
                contact['name'] = names[i]
            if i < len(phones):
                contact['phone'] = phones[i]
            if i < len(emails):
                contact['email'] = emails[i]
            if contact:
                contacts.append(contact)
    
    return contacts

def extract_contact_info(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Извлекает информацию о контакте из текста
    
    Args:
        text: Текст, содержащий информацию о контакте
        
    Returns:
        Кортеж (имя, телефон, email)
    """
    if not text:
        return None, None, None
        
    contacts = parse_contacts(text)
    if not contacts:
        return None, None, None
        
    # Берем первый контакт
    contact = contacts[0]
    return (
        contact.get('name'),
        contact.get('phone'),
        contact.get('email')
    ) 