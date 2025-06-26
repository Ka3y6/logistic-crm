from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CalendarTaskViewSet,
    CargoViewSet,
    CarrierViewSet,
    ClientViewSet,
    DocumentViewSet,
    EmailActionView,
    EmailMessageListView,
    EmailMessageSendView,
    FinancialReportView,
    InvoiceViewSet,
    NotificationViewSet,
    OrderViewSet,
    PaymentViewSet,
    TableHighlightViewSet,
    TaskViewSet,
    UserProfileEmailSettingsView,
    UserSettingsViewSet,
    UserViewSet,
    VehicleViewSet,
    csrf_token,
    get_csrf_token,
    login_view,
    system_config,
    validate_token,
)

router = DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"orders", OrderViewSet)
router.register(r"clients", ClientViewSet)
router.register(r"cargos", CargoViewSet)
router.register(r"vehicles", VehicleViewSet)
router.register(r"tasks", TaskViewSet)
router.register(r"documents", DocumentViewSet)
router.register(r"payments", PaymentViewSet)
router.register(r"invoices", InvoiceViewSet)
router.register(r"notifications", NotificationViewSet)
router.register(r"carriers", CarrierViewSet)
router.register(r"user-settings", UserSettingsViewSet, basename="user-settings")
router.register(r"calendar/tasks", CalendarTaskViewSet, basename="calendar-tasks")
router.register(r"highlights", TableHighlightViewSet, basename="highlights")

urlpatterns = [
    path("csrf/", get_csrf_token, name="csrf-token"),
    path("csrf-token/", csrf_token, name="csrf-token-json"),
    path("login/", login_view, name="login"),
    path("validate-token/", validate_token, name="validate-token"),
    path("", include(router.urls)),
    path("financial-report/", FinancialReportView.as_view(), name="financial-report"),
    path("orders/<int:pk>/generate-contract/", DocumentViewSet.as_view({"post": "generate_contract"})),
    path("orders/<int:pk>/generate_document/", OrderViewSet.as_view({"post": "generate_document"})),
    path("system/config/", system_config, name="system-config"),
    path("profile/email-settings/", UserProfileEmailSettingsView.as_view(), name="user-profile-email-settings"),
    path("email/messages/", EmailMessageListView.as_view(), name="email-messages-list"),
    path("email/messages/send/", EmailMessageSendView.as_view(), name="email-message-send"),
    path("email/messages/action/", EmailActionView.as_view(), name="email-message-action"),
]
