from rest_framework import serializers

from .models import AISettings


class AISettingsSerializer(serializers.ModelSerializer):
    api_key = serializers.CharField(required=True, allow_blank=False, write_only=True)

    class Meta:
        model = AISettings
        fields = ["id", "user", "api_key", "model", "base_url", "max_tokens", "temperature", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at", "user"]

    def validate_api_key(self, value):
        if not value:
            raise serializers.ValidationError("API ключ обязателен для работы AI ассистента")
        return value
