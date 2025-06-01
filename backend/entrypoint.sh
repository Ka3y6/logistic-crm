#!/bin/bash

# Выход при ошибке
set -e

# Выполняем миграции
echo "Applying database migrations..."
python manage.py migrate

# Создаем суперпользователя, если его нет (опционально)
echo "Creating superuser if not exists..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword')
    print('Superuser created')
else:
    print('Superuser already exists')
"

# Запускаем сервер Django
echo "Starting Django development server..."
python manage.py runserver 0.0.0.0:8000 