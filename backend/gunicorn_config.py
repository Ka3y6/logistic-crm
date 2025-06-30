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
