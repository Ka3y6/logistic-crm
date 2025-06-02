# Logistic CRM

## Требования
- Docker
- Docker Compose

## Настройка

1. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

2. Отредактируйте `.env` с вашими настройками:
```
# Общие настройки
SERVER_HOST=localhost  # Хост вашего сервера
SERVER_PORT=80         # Порт для nginx

# База данных
DB_HOST=localhost      # Хост базы данных
DB_PORT=3306           # Порт базы данных
DB_NAME=logistic_crm   # Имя базы данных
DB_USER=your_user      # Пользователь базы данных
DB_PASSWORD=your_pass  # Пароль базы данных

# Backend
DJANGO_SECRET_KEY=ваш_секретный_ключ
DJANGO_DEBUG=False     # Отключите в продакшене

# Frontend
FRONTEND_PORT=3000

# API
API_URL=http://${SERVER_HOST}:8000/api

# Безопасность
ALLOWED_HOSTS=${SERVER_HOST},backend,db
CORS_ALLOWED_ORIGINS=http://${SERVER_HOST}:3000
```

## Запуск

### Разработка
```bash
docker-compose up --build
```

### Продакшен
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

## Миграции
```bash
docker-compose exec backend python manage.py migrate
```

## Создание суперпользователя
```bash
docker-compose exec backend python manage.py createsuperuser
```

## Безопасность
- Всегда используйте надежные пароли
- Никогда не коммитьте `.env` файл
- Регулярно обновляйте зависимости 