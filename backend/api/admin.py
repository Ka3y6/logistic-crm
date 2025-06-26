from django.contrib import admin

from .models import (
    Cargo,
    Carrier,
    CarrierContact,
    Client,
    ClientContact,
    CustomUser,
    Document,
    Invoice,
    Notification,
    Order,
    Payment,
    Task,
    UserActionLog,
    Vehicle,
)


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ("email", "username", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("email", "username")


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("company_name", "business_scope", "created_at")
    search_fields = ("company_name", "business_scope")
    list_filter = ("created_at",)


@admin.register(ClientContact)
class ClientContactAdmin(admin.ModelAdmin):
    list_display = ("client", "contact_type", "name", "phone", "email")
    list_filter = ("contact_type",)
    search_fields = ("name", "phone", "email")


@admin.register(Carrier)
class CarrierAdmin(admin.ModelAdmin):
    list_display = ("company_name", "location", "created_at")
    search_fields = ("company_name", "location")
    list_filter = ("created_at",)


@admin.register(CarrierContact)
class CarrierContactAdmin(admin.ModelAdmin):
    list_display = ("carrier", "contact_type", "name", "phone", "email")
    list_filter = ("contact_type",)
    search_fields = ("name", "phone", "email")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("contract_number", "client", "carrier", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("contract_number", "client__company_name", "carrier__company_name")


@admin.register(Cargo)
class CargoAdmin(admin.ModelAdmin):
    list_display = ("weight", "volume", "cargo_value")
    search_fields = ("tnved_code",)


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("name", "document_type", "is_signed", "created_at")
    list_filter = ("document_type", "is_signed")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "priority", "assignee", "created_at")
    list_filter = ("status", "priority", "created_at")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("amount", "payment_date", "method")
    list_filter = ("method", "payment_date")


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("total", "issued_date", "due_date", "is_paid")
    list_filter = ("is_paid", "issued_date")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "notification_type", "is_read", "sent_at")
    list_filter = ("notification_type", "is_read")
    search_fields = ("user__email", "message")


@admin.register(UserActionLog)
class UserActionLogAdmin(admin.ModelAdmin):
    list_display = ("user", "action", "model_name", "timestamp")
    list_filter = ("action", "model_name", "timestamp")
    search_fields = ("user__email", "action", "model_name")


admin.site.register(Vehicle)
