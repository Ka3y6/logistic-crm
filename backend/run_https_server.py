import os

from django.core.management import execute_from_command_line

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "logistic_crm.settings")

    # Запускаем сервер с поддержкой HTTPS
    execute_from_command_line(
        ["manage.py", "runserver_plus", "--cert-file", "cert.pem", "--key-file", "key.pem", "0.0.0.0:8000"]
    )
