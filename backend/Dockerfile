# Используем официальный образ Python
FROM python:3.9-slim

# Устанавливаем переменные окружения
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем скрипт для миграций
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Обновляем pip с явным указанием версии setuptools
RUN pip install --no-cache-dir --upgrade pip setuptools==69.2.0 wheel

# Копируем файл зависимостей и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем остальной код проекта
COPY . .

# Открываем порт, на котором будет работать Django (если нужно, но docker-compose уже это делает)
# EXPOSE 8000

# Используем entrypoint для миграций и запуска сервера
ENTRYPOINT ["/entrypoint.sh"] 