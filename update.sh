#!/bin/bash

# Переход в директорию проекта
cd /opt/logistic-crm

# Получаем последние изменения
echo "Загрузка последних изменений из репозитория..."
git pull origin main

# Очищаем старые образы и volumes
echo "Очистка старых Docker-образов..."
docker system prune -af --volumes

# Пересоздаем и запускаем контейнеры с обновлением
echo "Пересоздание и запуск контейнеров..."
docker-compose down
DOCKER_BUILDKIT=1 docker-compose up --build -d

# Проверяем статус контейнеров
echo "Проверка статуса контейнеров..."
docker ps

echo "Проект успешно обновлен!" 