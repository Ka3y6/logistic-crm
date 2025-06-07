from django.apps import AppConfig

class RequestsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'site_requests'
    verbose_name = 'Заявки с сайта' 