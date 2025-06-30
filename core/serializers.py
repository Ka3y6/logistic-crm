from rest_framework import serializers

from .models import Highlight

# ... (возможно, другие импорты и сериализаторы) ...


class HighlightSerializer(serializers.ModelSerializer):
    # user = serializers.HiddenField(default=serializers.CurrentUserDefault()) # Можно так, если во ViewSet

    class Meta:
        model = Highlight
        fields = ["id", "table_name", "row_id", "column_id", "color"]  # 'user' будет добавлен во view


# ... (возможно, другие сериализаторы) ...
