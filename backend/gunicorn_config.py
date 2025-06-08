import multiprocessing

# Базовые настройки
bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "gthread"
threads = 2
timeout = 120
keepalive = 5

# Настройки логирования
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Настройки безопасности
forwarded_allow_ips = "*"
proxy_protocol = True
proxy_allow_ips = "*" 