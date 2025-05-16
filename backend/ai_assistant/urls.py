from django.urls import path
from . import views

urlpatterns = [
    path('query/', views.AssistantQueryView.as_view(), name='assistant_query'),
] 