FROM python:3.11-slim

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Установка рабочей директории
WORKDIR /app

# Создание необходимых директорий
RUN mkdir -p /app/static /app/media

# Копирование файлов зависимостей
COPY requirements.txt .

# Установка Python зависимостей
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir mysqlclient

# Копирование проекта
COPY . .

# Создание томов
VOLUME ["/app/static", "/app/media"]

# Запуск миграций и сбора статических файлов
CMD ["sh", "-c", "python manage.py migrate && python manage.py collectstatic --noinput && python manage.py runserver 0.0.0.0:8000"] 