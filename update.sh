#!/bin/bash

# Переход в директорию проекта
cd /c/xampp/htdocs/logistic-crm

# Получаем последние изменения
git pull origin main

# Пересоздаем и запускаем контейнеры с обновлением
docker-compose down
docker-compose up --build -d

echo "Проект успешно обновлен!" 