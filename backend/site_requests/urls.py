from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import RequestViewSet, submit_feedback

router = DefaultRouter()
router.register(r"requests", RequestViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("submit-feedback/", submit_feedback, name="submit-feedback"),
]
