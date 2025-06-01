#!/bin/bash

# Переходим в директорию проекта
cd /opt/logistic-crm

# Получаем изменения из репозитория
git pull origin main

# Перезапускаем только Django сервер в контейнере backend
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py collectstatic --noinput
docker-compose restart backend

# Перезапускаем только dev сервер во фронтенде
docker-compose restart frontend

echo "Проект успешно обновлен!" 