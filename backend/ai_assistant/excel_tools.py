import pandas as pd
import logging
from typing import Dict, List, Optional, Any
from django.apps import apps
import requests
import os
import json
from django.conf import settings
import re

logger = logging.getLogger(__name__)

# Определяем схему инструмента для анализа Excel
ANALYZE_EXCEL_TOOL_SCHEMA = {
    "type": "object",
    "properties": {
        "data": {
            "type": "array",
            "items": {
                "type": "object"
            },
            "description": "Данные из Excel файла"
        },
        "model_name": {
            "type": "string",
            "description": "Название модели Django для анализа"
        }
    },
    "required": ["data", "model_name"]
}

def analyze_data_with_ai(data, model_name):
    """
    Анализирует данные с помощью ИИ для определения структуры и маппинга полей.
    
    Args:
        data: DataFrame с данными из Excel
        model_name: Название модели Django
        
    Returns:
        dict: Результат анализа с маппингом полей
    """
    try:
        # Получаем модель Django
        model = apps.get_model('api', model_name)
        
        # Подготавливаем данные для анализа
        sample_data = data.head(5).to_dict('records')
        columns_info = {col: str(data[col].dtype) for col in data.columns}
        
        # Формируем промпт для ИИ
        prompt = f"""
        Проанализируй структуру данных и определи соответствие колонок полям модели {model_name}.
        
        Поля модели:
        {[f.name for f in model._meta.fields]}
        
        Информация о колонках:
        {json.dumps(columns_info, indent=2)}
        
        Пример данных:
        {json.dumps(sample_data, indent=2)}
        
        Определи:
        1. Какие колонки соответствуют каким полям модели
        2. Какие колонки содержат контактную информацию
        3. Какие колонки можно игнорировать
        4. Какие поля модели остались неиспользованными
        
        Верни результат в формате JSON:
        {{
            "mappings": {{"column_name": "field_name"}},
            "contact_data": {{"column_name": "contact_type"}},
            "ignored_columns": ["column_name"],
            "unused_fields": ["field_name"]
        }}
        """
        
        # Получаем API ключ и referer из настроек
        api_key = os.environ.get('OPENROUTER_API_KEY')
        referer = os.environ.get('OPENROUTER_REFERER', 'http://localhost:3000')
        
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY не найден в переменных окружения")
        
        # Отправляем запрос к OpenRouter API
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'HTTP-Referer': referer,
                'Content-Type': 'application/json'
            },
            json={
                'model': 'anthropic/claude-3-opus',
                'messages': [{'role': 'user', 'content': prompt}]
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Ошибка API OpenRouter: {response.text}")
        
        # Парсим ответ
        result = response.json()
        ai_response = result['choices'][0]['message']['content']
        
        try:
            analysis_result = json.loads(ai_response)
            return {
                'status': 'success',
                'result': analysis_result
            }
        except json.JSONDecodeError:
            raise Exception("Не удалось распарсить ответ ИИ")
            
    except Exception as e:
        logger.error(f"Ошибка при анализе данных: {str(e)}")
        return {
            'status': 'error',
            'error': str(e)
        }

def parse_contacts(cell_value):
    """
    Разбивает строку с контактами на отдельные контакты и определяет их тип.
    Поддерживает разделители: перевод строки, точка с запятой, табуляция, несколько пробелов.
    """
    contacts = []
    if not isinstance(cell_value, str):
        return contacts

    # Разбиваем по переводам строк, точкам с запятой, табуляции, нескольким пробелам
    parts = re.split(r'[\n;\t]| {2,}', cell_value)
    for part in parts:
        part = part.strip()
        if not part:
            continue
        # Поиск email
        emails = re.findall(r'[\w\.-]+@[\w\.-]+', part)
        for email in emails:
            contacts.append({'type': 'email', 'value': email})
        # Поиск телефона
        phones = re.findall(r'(\+?\d[\d\s\-]{7,}\d)', part)
        for phone in phones:
            contacts.append({'type': 'phone', 'value': phone})
        # Поиск Skype
        skype_match = re.search(r'Skype:?\s*([^\s]+)', part, re.IGNORECASE)
        if skype_match:
            contacts.append({'type': 'skype', 'value': skype_match.group(1)})
        # Если явно не определили тип, но строка похожа на email
        if not emails and not phones and not skype_match and '@' in part:
            contacts.append({'type': 'email', 'value': part})
    return contacts

def process_excel_with_ai(file_path, model_name):
    """
    Обрабатывает Excel файл с помощью ИИ.
    
    Args:
        file_path: Путь к Excel файлу
        model_name: Название модели Django
        
    Returns:
        dict: Результат обработки
    """
    try:
        # Читаем Excel файл
        df = pd.read_excel(file_path)
        
        # Анализируем структуру
        analysis_result = analyze_data_with_ai(df, model_name)
        
        if analysis_result['status'] == 'error':
            return analysis_result
            
        # Получаем модель Django
        model = apps.get_model('api', model_name)
        
        # Обрабатываем каждую строку
        processed_count = 0
        updated_count = 0
        created_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                data = {}
                for col, field in analysis_result['result']['mappings'].items():
                    if col in row and pd.notna(row[col]):
                        data[field] = row[col]
                
                instance = None
                if 'id' in data:
                    instance = model.objects.filter(id=data['id']).first()
                
                if instance:
                    for field, value in data.items():
                        setattr(instance, field, value)
                    instance.save()
                    updated_count += 1
                else:
                    instance = model.objects.create(**data)
                    created_count += 1

                # --- Новый блок: обработка контактов ---
                contact_model = None
                try:
                    contact_model = apps.get_model('api', f'{model_name}Contact')
                except Exception:
                    pass
                if contact_model:
                    # Явно перебираем все колонки с 'контакт' в названии
                    for col in row.index:
                        if 'контакт' in col.lower() and pd.notna(row[col]):
                            logging.info(f"[IMPORT] Парсим контакты из колонки '{col}': {row[col]}")
                            contacts = parse_contacts(row[col])
                            for contact in contacts:
                                logging.info(f"[IMPORT] Сохраняем контакт: {contact}")
                                contact_model.objects.create(
                                    **{f'{model_name.lower()}_id': instance.id},
                                    contact_type=contact['type'],
                                    value=contact['value']
                                )
                # --- Новый блок: обработка менеджера ---
                manager_col = None
                for col in row.index:
                    if 'менеджер' in col.lower():
                        manager_col = col
                        break
                if manager_col and pd.notna(row[manager_col]):
                    if hasattr(instance, 'manager_name'):
                        instance.manager_name = row[manager_col]
                        instance.save()

                processed_count += 1
            except Exception as e:
                errors.append(f"Ошибка в строке {index + 2}: {str(e)}")
                
        return {
            'status': 'success',
            'processed': processed_count,
            'updated': updated_count,
            'created': created_count,
            'errors': errors
        }
        
    except Exception as e:
        logger.error(f"Ошибка при обработке Excel файла: {str(e)}")
        return {
            'status': 'error',
            'error': str(e)
        }

def process_contacts_for_row(row, model_name, instance):
    """
    Обрабатывает контактную информацию для строки данных.
    
    Args:
        row: Строка данных из Excel
        model_name: Название модели Django
        instance: Экземпляр модели
        
    Returns:
        None
    """
    try:
        # Определяем модель контактов
        contact_model = apps.get_model('api', f'{model_name}Contact')
        
        # Группируем контакты по типу
        contacts_by_type = {}
        for col, contact_type in row.items():
            if pd.notna(contact_type) and isinstance(contact_type, str):
                if contact_type not in contacts_by_type:
                    contacts_by_type[contact_type] = []
                contacts_by_type[contact_type].append(col)
        
        # Обрабатываем каждый тип контактов
        for contact_type, columns in contacts_by_type.items():
            for col in columns:
                if pd.notna(row[col]):
                    # Ищем существующий контакт
                    contact = contact_model.objects.filter(
                        **{f'{model_name.lower()}_id': instance.id},
                        contact_type=contact_type,
                        value=row[col]
                    ).first()
                    
                    if not contact:
                        # Создаем новый контакт
                        contact_model.objects.create(
                            **{f'{model_name.lower()}_id': instance.id},
                            contact_type=contact_type,
                            value=row[col]
                        )
                        
    except Exception as e:
        logger.error(f"Ошибка при обработке контактов: {str(e)}")
        raise 