from django.urls import path

from .views import HighlightListView, HighlightSaveView

# ... (другие импорты)

urlpatterns = [
    # ... (другие URL)
    path("highlights/", HighlightListView.as_view(), name="highlight-list"),
    path("highlights/save/", HighlightSaveView.as_view(), name="highlight-save"),
]
