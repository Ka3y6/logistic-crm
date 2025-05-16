# Используем официальный образ Python
FROM python:3.9-slim

# Устанавливаем переменные окружения
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Устанавливаем системные зависимости
# Для Debian/Ubuntu. Если ваш базовый образ другой, команды могут отличаться.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libmariadb-dev \
    pkg-config \
    curl \
    # или libmysqlclient-dev, если libmariadbclient-dev не найдется или будут проблемы
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файл зависимостей и устанавливаем их
# Сначала копируем только requirements.txt, чтобы использовать кэш Docker при изменениях кода, но не зависимостей
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Копируем остальной код проекта
COPY . .

# Открываем порт, на котором будет работать Django (если нужно, но docker-compose уже это делает)
# EXPOSE 8000

# Команда для запуска приложения (будет переопределена в docker-compose.yml)
# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"] 