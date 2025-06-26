import os

import django
from django.contrib.auth import get_user_model

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "logistic_crm.settings")
django.setup()

User = get_user_model()


def create_users():
    # Создаем администратора
    try:
        admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="admin123",
            role="admin",
            first_name="Admin",
            last_name="User",
        )
        print(f"Администратор успешно создан: {admin.email}")
    except Exception as e:
        print(f"Ошибка при создании администратора: {str(e)}")

    # Создаем менеджера
    try:
        manager = User.objects.create_user(
            username="manager",
            email="manager@example.com",
            password="manager123",
            role="manager",
            first_name="Manager",
            last_name="User",
        )
        print(f"Менеджер успешно создан: {manager.email}")
    except Exception as e:
        print(f"Ошибка при создании менеджера: {str(e)}")

    # Создаем клиента
    try:
        client = User.objects.create_user(
            username="client",
            email="client@example.com",
            password="client123",
            role="client",
            first_name="Client",
            last_name="User",
        )
        print(f"Клиент успешно создан: {client.email}")
    except Exception as e:
        print(f"Ошибка при создании клиента: {str(e)}")


if __name__ == "__main__":
    create_users()
