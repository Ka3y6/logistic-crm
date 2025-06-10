# Logistic CRM

Полноценное веб-приложение для управления логистикой на Django + React с SSL сертификатами.

## Архитектура проекта

- **Backend**: Django REST API (Python)
- **Frontend**: React (Node.js)
- **База данных**: MariaDB (Docker контейнер)
- **Веб-сервер**: Nginx с SSL
- **WSGI сервер**: Gunicorn
- **Домен**: https://crm.greatline.by

## 1. Подготовка сервера

### Установка необходимых пакетов
```bash
sudo apt update
sudo apt install -y python3-venv python3-dev default-libmysqlclient-dev build-essential nginx docker.io docker-compose
```

### Настройка Docker
```bash
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

## 2. Настройка проекта

### Клонирование репозитория
```bash
cd /opt
sudo git clone <repository-url> logistic-crm
sudo chown -R $USER:$USER /opt/logistic-crm
cd logistic-crm
```

## 3. Настройка базы данных (MariaDB в Docker)

### Запуск MariaDB контейнера
```bash
docker-compose up -d mariadb
```

### Проверка запуска базы данных
```bash
docker ps
docker logs mariadb
```

### Подключение к базе данных (опционально)
```bash
docker exec -it mariadb mysql -u root -p
# Пароль: root
```

Создание пользователя и базы данных (если нужно):
```sql
CREATE DATABASE IF NOT EXISTS logistic_crm;
CREATE USER IF NOT EXISTS 'greatline_root'@'%' IDENTIFIED BY 'c64s6KPa';
GRANT ALL PRIVILEGES ON logistic_crm.* TO 'greatline_root'@'%';
FLUSH PRIVILEGES;
```

## 4. Настройка бэкенда

### Создание виртуального окружения
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### Установка зависимостей
```bash
pip install -r requirements.txt
pip install mysqlclient  # Клиент для MySQL/MariaDB
```

### Настройка переменных окружения
Создайте файл `.env` в директории `backend`:
```bash
nano .env
```

Содержимое файла:
```env
DEBUG=False
SECRET_KEY=your-secret-key-here
DB_NAME=logistic_crm
DB_USER=greatline_root
DB_PASSWORD=c64s6KPa
DB_HOST=185.135.83.113
DB_PORT=3306
ALLOWED_HOSTS=localhost,127.0.0.1,185.135.83.113,crm.greatline.by
```

### Миграции базы данных
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
```

### Создание суперпользователя
```bash
python manage.py createsuperuser
```

## 5. Настройка Gunicorn

### Создание конфигурационного файла
```bash
nano gunicorn_config.py
```

Содержимое файла:
```python
import multiprocessing

# Базовые настройки
bind = "0.0.0.0:8000"
workers = 4
worker_class = "gunicorn.workers.sync.SyncWorker"
timeout = 120
keepalive = 5

# Настройки логирования
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
loglevel = "info"

# Настройки безопасности
forwarded_allow_ips = "*"
proxy_protocol = True
proxy_allow_ips = "*"
```

### Создание systemd сервиса
```bash
sudo nano /etc/systemd/system/gunicorn.service
```

Содержимое файла:
```ini
[Unit]
Description=Gunicorn daemon for Django project
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/logistic-crm/backend
Environment="PATH=/opt/logistic-crm/backend/venv/bin"
ExecStart=/opt/logistic-crm/backend/venv/bin/gunicorn --config /opt/logistic-crm/backend/gunicorn_config.py logistic_crm.wsgi:application
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Создание директорий для логов и настройка прав
```bash
sudo mkdir -p /var/log/gunicorn
sudo chown -R www-data:www-data /var/log/gunicorn
sudo chown -R www-data:www-data /opt/logistic-crm
```

## 6. Настройка SSL сертификатов

### Установка Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Получение SSL сертификата
```bash
sudo certbot certonly --standalone -d crm.greatline.by
```

### Проверка сертификата
```bash
sudo certbot certificates
ls -l /etc/letsencrypt/live/crm.greatline.by/
```

## 7. Настройка Nginx

### Создание конфигурации сайта
```bash
sudo nano /etc/nginx/sites-available/logistic-crm
```

Содержимое файла:
```nginx
server {
    listen 80;
    server_name crm.greatline.by;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name crm.greatline.by;

    # SSL настройки
    ssl_certificate /etc/letsencrypt/live/crm.greatline.by/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.greatline.by/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Корневая директория для React приложения
    root /opt/logistic-crm/frontend/build;
    index index.html;

    # Настройки для React Router
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        
        # CORS заголовки
        add_header Access-Control-Allow-Origin "https://crm.greatline.by" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization, X-Requested-With, X-CSRFToken" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }

    # Проксирование API запросов к Django
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS заголовки для API
        add_header Access-Control-Allow-Origin "https://crm.greatline.by" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization, X-Requested-With, X-CSRFToken" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }

    # WebSocket поддержка
    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Статические файлы React
    location /static/ {
        alias /opt/logistic-crm/frontend/build/static/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Медиа файлы Django
    location /media/ {
        alias /opt/logistic-crm/backend/media/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Настройки безопасности
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Настройки для больших файлов
    client_max_body_size 100M;

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;
    gzip_disable "MSIE [1-6]\.";
}
```

### Активация конфигурации
```bash
sudo ln -s /etc/nginx/sites-available/logistic-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 8. Настройка фронтенда

### Установка Node.js и npm
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Настройка React приложения
```bash
cd /opt/logistic-crm/frontend
npm install
```

### Обновление конфигурации API
Убедитесь, что в файле `src/config.js` указан правильный домен:
```javascript
const config = {
  API_URL: 'https://crm.greatline.by'
};

export default config;
```

### Настройка прокси (src/setupProxy.js)
```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://crm.greatline.by',
      changeOrigin: true,
      secure: true,
      onProxyRes: function(proxyRes, req, res) {
        proxyRes.headers['Access-Control-Allow-Origin'] = 'https://crm.greatline.by';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      }
    })
  );
};
```

### Сборка React приложения
```bash
npm run build
```

## 9. Запуск и настройка сервисов

### Запуск Gunicorn
```bash
sudo systemctl daemon-reload
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
```

### Проверка статуса сервисов
```bash
sudo systemctl status nginx
sudo systemctl status gunicorn
sudo docker ps
```

### Проверка портов
```bash
sudo netstat -tlnp | grep :8000
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :3306
```

## 10. Проверка работоспособности

### Проверка компонентов
```bash
# Проверка фронтенда
curl -I https://crm.greatline.by

# Проверка API
curl -I https://crm.greatline.by/api/

# Проверка базы данных
docker exec -it mariadb mysql -u root -p -e "SHOW DATABASES;"
```

### Проверка логов
```bash
# Логи Gunicorn
sudo tail -f /var/log/gunicorn/error.log
sudo tail -f /var/log/gunicorn/access.log

# Логи Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Логи Docker
docker logs mariadb
```

## 11. Обслуживание и обновление

### Обновление проекта
```bash
cd /opt/logistic-crm
git pull

# Обновление бэкенда
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart gunicorn

# Обновление фронтенда
cd ../frontend
npm install
npm run build
```

### Обновление SSL сертификатов
```bash
sudo certbot renew --dry-run
```

### Резервное копирование

#### База данных
```bash
docker exec mariadb mysqldump -u root -proot logistic_crm > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Файлы проекта
```bash
tar -czf logistic-crm-backup-$(date +%Y%m%d_%H%M%S).tar.gz /opt/logistic-crm
```

## 12. Устранение неполадок

### Общие команды диагностики
```bash
# Проверка статуса всех сервисов
sudo systemctl status nginx gunicorn

# Проверка доступности портов
sudo ss -tulpn | grep -E ':80|:443|:8000|:3306'

# Проверка процессов
ps aux | grep -E 'nginx|gunicorn|python'

# Проверка дискового пространства
df -h

# Проверка памяти
free -h
```

### Частые проблемы

1. **502 Bad Gateway**: Проверьте статус Gunicorn и логи
2. **403 Forbidden**: Проверьте права доступа к файлам
3. **Ошибки базы данных**: Проверьте запуск MariaDB контейнера
4. **CORS ошибки**: Проверьте настройки CORS в Django и Nginx
5. **SSL ошибки**: Проверьте валидность сертификатов

### Команды для перезапуска всех сервисов
```bash
# Перезапуск базы данных
docker-compose restart mariadb

# Перезапуск Gunicorn
sudo systemctl restart gunicorn

# Перезапуск Nginx
sudo systemctl restart nginx

# Проверка всех сервисов
sudo systemctl status nginx gunicorn
docker ps
```

## 13. Полезные ссылки

- Основное приложение: https://crm.greatline.by/
- API: https://crm.greatline.by/api/
- Админка Django: https://crm.greatline.by/admin/
- PhpMyAdmin (если запущен): http://your-server:8080

## 14. Переменные окружения в Django settings.py

Убедитесь что в `backend/logistic_crm/settings.py` настроены:

```python
# Разрешенные хосты
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,185.135.83.113,crm.greatline.by').split(',')

# База данных
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'logistic_crm',
        'USER': 'greatline_root',
        'PASSWORD': 'c64s6KPa',
        'HOST': '185.135.83.113',
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'connect_timeout': 10,
            'use_unicode': True,
            'client_flag': 0
        },
        'CONN_MAX_AGE': 60,
        'CONN_HEALTH_CHECKS': True
    }
}

# CORS настройки
CORS_ALLOWED_ORIGINS = [
    "https://crm.greatline.by",
]
CORS_ALLOW_CREDENTIALS = True
```

## 15. Контакты и поддержка

Для технической поддержки обращайтесь к разработчикам проекта. 