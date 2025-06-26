from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AISettingsViewSet, AssistantQueryView

router = DefaultRouter()
router.register(r"settings", AISettingsViewSet, basename="ai-settings")

app_name = "ai_assistant"

urlpatterns = [
    path("query/", AssistantQueryView.as_view(), name="assistant-query"),
    path("", include(router.urls)),
]
