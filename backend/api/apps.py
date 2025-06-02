from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Импортируем модели здесь, чтобы зарегистрировать сигналы
        import api.models
