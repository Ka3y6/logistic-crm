from rest_framework import serializers
from .models import Request
from api.serializers import UserSerializer

class RequestSerializer(serializers.ModelSerializer):
    processed_by = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Request
        fields = [
            'id', 'name', 'phone', 'email', 'comment', 'status',
            'status_display', 'created_at', 'updated_at',
            'source_domain', 'processed_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'processed_by']

class RequestCreateSerializer(serializers.ModelSerializer):
    message = serializers.CharField(source='comment', write_only=True)

    class Meta:
        model = Request
        fields = ['name', 'phone', 'email', 'message', 'source_domain'] 