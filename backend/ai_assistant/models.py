from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

# Create your models here.


class AISettings(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="ai_settings", verbose_name="Пользователь", null=True, blank=True
    )
    api_key = models.CharField(max_length=255, verbose_name="API ключ")
    model = models.CharField(max_length=100, default="google/gemini-flash-1.5-8b", verbose_name="Модель")
    base_url = models.CharField(max_length=255, default="https://openrouter.ai/api/v1", verbose_name="Базовый URL")
    max_tokens = models.IntegerField(default=500, verbose_name="Максимальное количество токенов")
    temperature = models.FloatField(default=0.7, verbose_name="Температура")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Настройки AI"
        verbose_name_plural = "Настройки AI"
        unique_together = ["user"]

    def __str__(self):
        return f"AI Settings for {self.user.email if self.user else 'System'} (Updated: {self.updated_at})"
