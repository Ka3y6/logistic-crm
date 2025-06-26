from django.conf import settings
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.core.validators import FileExtensionValidator, MinValueValidator, RegexValidator
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class CustomUser(AbstractUser):
    class RoleChoices(models.TextChoices):
        ADMIN = "admin", _("Administrator")
        MANAGER = "manager", _("Manager")
        CLIENT = "client", _("Client")

    email = models.EmailField(
        _("email address"), unique=True, error_messages={"unique": _("Пользователь с таким email уже существует.")}
    )

    role = models.CharField(_("role"), max_length=20, choices=RoleChoices.choices, default=RoleChoices.CLIENT)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    groups = models.ManyToManyField(
        Group,
        verbose_name=_("groups"),
        blank=True,
        related_name="customuser_groups",
        related_query_name="customuser",
    )

    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=_("user permissions"),
        blank=True,
        related_name="customuser_permissions",
        related_query_name="customuser",
    )

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        ordering = ["-date_joined"]

    def __str__(self):
        return self.email


class Client(models.Model):
    company_name = models.CharField(max_length=255, verbose_name="Наименование компании")
    business_scope = models.CharField(max_length=255, verbose_name="Сфера деятельности", blank=True, null=True)
    address = models.TextField(verbose_name="Адрес", blank=True, null=True)
    bank_details = models.TextField(verbose_name="Банковские реквизиты", blank=True, null=True)
    unp = models.CharField(max_length=9, verbose_name="УНП", blank=True, null=True)
    unn = models.CharField(max_length=9, verbose_name="УНН", blank=True, null=True)
    okpo = models.CharField(max_length=10, verbose_name="ОКПО", blank=True, null=True)
    comments = models.TextField(verbose_name="Комментарии", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, verbose_name="Создатель")

    class Meta:
        verbose_name = "Клиент"
        verbose_name_plural = "Клиенты"
        ordering = ["-created_at"]

    def __str__(self):
        return self.company_name

    @property
    def has_active_order(self):
        return self.order_set.filter(status__in=["new", "in_progress", "pending"]).exists()


class ClientContact(models.Model):
    CONTACT_TYPES = [
        ("manager", "Менеджер"),
        ("director", "Директор"),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="contacts")
    contact_type = models.CharField(_("Тип контакта"), max_length=20, choices=CONTACT_TYPES, default="manager")
    name = models.CharField(_("Имя"), max_length=100, blank=True, null=True)
    phone = models.CharField(
        _("Мобильный телефон"),
        max_length=20,
        blank=True,
        null=True,
        validators=[
            RegexValidator(regex=r"^\+375\d{9}$", message="Номер телефона должен быть в формате: '+375000000000'.")
        ],
    )
    email = models.EmailField(_("Email"), blank=True, null=True)
    skype = models.CharField(_("Skype"), max_length=100, blank=True, null=True)
    telegram = models.CharField(_("Telegram"), max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.get_contact_type_display()} - {self.name}"


class Vehicle(models.Model):
    license_plate = models.CharField(
        _("license plate"),
        max_length=20,
        unique=True,
        validators=[
            RegexValidator(
                regex=r"^[АВЕКМНОРСТУХABEKMHOPCTYX]\d{3}[АВЕКМНОРСТУХABEKMHOPCTYX]{2}\d{2,3}$",
                message="Номерной знак должен быть в формате: 'А123БВ77'.",
            )
        ],
    )


class Carrier(models.Model):
    company_name = models.CharField(_("Наименование компании"), max_length=255, blank=True, null=True)
    working_directions = models.TextField(
        _("Направления работы"), help_text="Укажите направления работы перевозчика", blank=True, null=True
    )
    location = models.CharField(
        _("Расположение"), max_length=255, help_text="Город/регион расположения", blank=True, null=True
    )
    fleet = models.TextField(_("Автопарк"), help_text="Информация об автопарке перевозчика", blank=True, null=True)
    comments = models.TextField(_("Комментарии"), blank=True, null=True)
    known_rates = models.TextField(
        _("Известные тарифы"), blank=True, null=True, help_text="Информация о тарифах перевозчика"
    )
    vehicle_number = models.CharField(
        _("Номер ТС или контейнера"),
        max_length=50,
        blank=True,
        null=True,
        help_text="Номер транспортного средства или контейнера",
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, verbose_name="Создатель")

    def __str__(self):
        return self.company_name or "Без названия"


class CarrierContact(models.Model):
    CONTACT_TYPES = [
        ("manager", "Менеджер"),
        ("director", "Директор"),
    ]

    carrier = models.ForeignKey(Carrier, on_delete=models.CASCADE, related_name="contacts")
    contact_type = models.CharField(_("Тип контакта"), max_length=20, choices=CONTACT_TYPES, default="manager")
    name = models.CharField(_("Имя"), max_length=100, blank=True, null=True)
    phone = models.CharField(
        _("Мобильный телефон"),
        max_length=20,
        blank=True,
        null=True,
        validators=[
            RegexValidator(regex=r"^\+375\d{9}$", message="Номер телефона должен быть в формате: '+375000000000'.")
        ],
    )
    email = models.EmailField(_("Email"), blank=True, null=True)
    skype = models.CharField(_("Skype"), max_length=100, blank=True, null=True)
    telegram = models.CharField(_("Telegram"), max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.get_contact_type_display()} - {self.name}"


class Cargo(models.Model):
    weight = models.PositiveIntegerField(
        _("weight (kg)"), validators=[MinValueValidator(1, message="Вес должен быть больше 0.")]
    )
    volume = models.DecimalField(
        _("volume (m³)"),
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0.01, message="Объем должен быть больше 0.")],
    )
    tnved_code = models.CharField(_("код ТН ВЭД"), max_length=20, blank=True, help_text="Код товарной номенклатуры")
    transport_conditions = models.TextField(
        _("условия перевозки"), blank=True, help_text="Температурный режим, требования к транспорту и т.д."
    )
    cargo_value = models.DecimalField(
        _("стоимость груза"), max_digits=10, decimal_places=2, default=0, help_text="Страховая стоимость груза"
    )

    def __str__(self):
        return f"Груз #{self.id} ({self.weight} кг)"


class Task(models.Model):
    STATUS_CHOICES = [("todo", "To Do"), ("in_progress", "In Progress"), ("done", "Done")]

    PRIORITY_CHOICES = [("low", "Low"), ("medium", "Medium"), ("high", "High")]

    title = models.CharField(max_length=200, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="todo", null=True, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium", null=True, blank=True)
    start = models.DateTimeField(null=True, blank=True)
    end = models.DateTimeField(null=True, blank=True)
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tasks", null=True, blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def clean(self):
        if self.start and self.end and self.start > self.end:
            raise ValidationError("Дата окончания не может быть раньше начала")


class Order(models.Model):
    STATUS_CHOICES = [
        ("new", "Новый"),
        ("in_progress", "В работе"),
        ("completed", "Завершен"),
        ("cancelled", "Отменен"),
    ]

    TRANSPORT_TYPE_CHOICES = [
        ("truck", "Грузовой автомобиль"),
        ("train", "Железнодорожный транспорт"),
        ("ship", "Морской транспорт"),
        ("air", "Авиатранспорт"),
    ]

    DANGER_LEVEL_CHOICES = [
        ("none", "Не опасный"),
        ("class1", "Класс 1"),
        ("class2", "Класс 2"),
        ("class3", "Класс 3"),
        ("class4", "Класс 4"),
        ("class5", "Класс 5"),
        ("class6", "Класс 6"),
        ("class7", "Класс 7"),
        ("class8", "Класс 8"),
        ("class9", "Класс 9"),
    ]

    # Основные связи
    client = models.ForeignKey(Client, on_delete=models.CASCADE, verbose_name="Клиент", null=True, blank=True)
    carrier = models.ForeignKey(Carrier, on_delete=models.PROTECT, verbose_name="Перевозчик", null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new", verbose_name="Статус")
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, verbose_name="Создатель")

    # 1. Документы и реквизиты
    contract_number = models.CharField(max_length=50, verbose_name="Номер договора", null=True, blank=True)
    transport_order_number = models.CharField(
        max_length=50, verbose_name="Транспортный заказ номер", null=True, blank=True
    )
    invoice_number = models.CharField(max_length=50, verbose_name="Номер счета на оплату", null=True, blank=True)
    invoice_date = models.DateField(verbose_name="Дата составления счета", null=True, blank=True)
    act_number = models.CharField(max_length=50, verbose_name="Номер акта выполненных работ", null=True, blank=True)
    act_date = models.DateField(verbose_name="Дата составления акта", null=True, blank=True)
    carrier_contract_number = models.CharField(
        max_length=50, verbose_name="Номер контракта с перевозчиком", null=True, blank=True
    )
    cmr_number = models.CharField(max_length=50, verbose_name="Номер CMR/коносамента", null=True, blank=True)

    # 2. Параметры груза
    cargo_quantity = models.PositiveIntegerField(verbose_name="Количество единиц груза", null=True, blank=True)
    cargo_name = models.CharField(max_length=255, verbose_name="Наименование груза", null=True, blank=True)
    tnved_code = models.CharField(max_length=20, verbose_name="Код ТНВЭД", null=True, blank=True)
    cargo_danger = models.CharField(
        max_length=20, choices=DANGER_LEVEL_CHOICES, default="none", verbose_name="Опасность груза"
    )
    cargo_weight = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Вес брутто (кг)", null=True, blank=True
    )
    cargo_dimensions = models.CharField(max_length=100, verbose_name="Габариты груза", null=True, blank=True)
    cargo_volume = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Объем груза (м³)", null=True, blank=True
    )

    # 3. Финансы
    payment_currency = models.CharField(max_length=10, verbose_name="Валюта расчетов", null=True, blank=True)
    payment_due_date = models.DateField(verbose_name="Срок оплаты счетов", null=True, blank=True)
    demurrage_amount = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Сумма за простой транспорта", null=True, blank=True
    )
    price_usd = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Цена в долларах", null=True, blank=True
    )
    service_cost = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Общая стоимость услуг", null=True, blank=True
    )
    cost_without_vat = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Стоимость услуг без НДС", null=True, blank=True
    )
    vat_rate = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Ставка НДС", null=True, blank=True)
    cost_with_vat = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Итоговая стоимость с НДС", null=True, blank=True
    )
    carrier_rate = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Стоимость услуг перевозчика", null=True, blank=True
    )
    client_rate = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Стоимость услуг для клиента", null=True, blank=True
    )
    margin_income = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Маржинальный доход", null=True, blank=True
    )
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена", null=True, blank=True)
    payment_status = models.CharField(
        max_length=20,
        choices=[("pending", "Ожидает оплаты"), ("paid", "Оплачено")],
        default="pending",
        verbose_name="Статус оплаты",
    )

    # 4. Перевозчик и логистика
    carrier_currency = models.CharField(
        max_length=10, verbose_name="Валюта расчетов с перевозчиком", null=True, blank=True
    )
    transport_type = models.CharField(
        max_length=20, choices=TRANSPORT_TYPE_CHOICES, verbose_name="Тип транспорта", null=True, blank=True
    )
    route = models.TextField(verbose_name="Маршрут", null=True, blank=True)
    delivery_terms = models.TextField(verbose_name="Условия поставки по INCOTERMS", null=True, blank=True)

    # 5. Сроки
    delivery_deadline = models.DateField(verbose_name="Приблизительный срок доставки", null=True, blank=True)
    loading_date = models.DateTimeField(verbose_name="Дата загрузки", null=True, blank=True)
    departure_date = models.DateTimeField(verbose_name="Дата отправки", null=True, blank=True)
    unloading_date = models.DateTimeField(verbose_name="Дата выгрузки", null=True, blank=True)
    contract_date = models.DateField(verbose_name="Дата заключения договора", null=True, blank=True)

    # 6. Контакты и адреса
    shipper_address = models.TextField(verbose_name="Адрес грузоотправителя", null=True, blank=True)
    shipper_contacts = models.TextField(verbose_name="Контактные данные грузоотправителя", null=True, blank=True)
    consignee_okpo = models.CharField(max_length=10, verbose_name="ОКПО грузополучателя", null=True, blank=True)
    loading_address = models.TextField(verbose_name="Адрес загрузки", null=True, blank=True)
    unloading_address = models.TextField(verbose_name="Адрес выгрузки", null=True, blank=True)
    shipper = models.CharField(max_length=255, verbose_name="Грузоотправитель", null=True, blank=True)
    destination = models.CharField(max_length=255, verbose_name="Пункт назначения", null=True, blank=True)

    # Системные поля
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        verbose_name = "Заказ"
        verbose_name_plural = "Заказы"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Заказ №{self.contract_number} от {self.contract_date}"


# Остальные модели (Document, UserActionLog, Payment, Invoice, Notification) без изменений


class Document(models.Model):
    DOCUMENT_TYPES = [
        ("contract", "Договор"),
        ("invoice", "Счет"),
        ("act", "Акт выполненных работ"),
    ]

    file = models.FileField(_("файл"), upload_to="documents/", validators=[FileExtensionValidator(["pdf", "docx"])])
    name = models.CharField(_("название"), max_length=255)
    document_type = models.CharField(_("тип документа"), max_length=20, choices=DOCUMENT_TYPES)
    is_signed = models.BooleanField(_("подписано"), default=False)
    created_at = models.DateTimeField(_("дата создания"), auto_now_add=True)
    order = models.ForeignKey("Order", on_delete=models.CASCADE, related_name="documents")


class UserActionLog(models.Model):
    ACTION_CHOICES = [
        ("create", "Создание"),
        ("update", "Обновление"),
        ("delete", "Удаление"),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=50)
    object_id = models.PositiveIntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict)


class Payment(models.Model):
    PAYMENT_METHODS = [
        ("cash", "Наличные"),
        ("card", "Карта"),
        ("bank_transfer", "Банковский перевод"),
    ]

    amount = models.DecimalField(_("сумма"), max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    payment_date = models.DateTimeField(_("дата оплаты"), auto_now_add=True)
    method = models.CharField(_("способ оплаты"), max_length=20, choices=PAYMENT_METHODS, default="bank_transfer")

    def __str__(self):
        return f"Платеж #{self.id} ({self.amount} руб.)"


class Invoice(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="invoices", verbose_name="Клиент")
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="invoices", verbose_name="Заказ")
    total = models.DecimalField(
        _("итоговая сумма"), max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)]
    )
    issued_date = models.DateTimeField(_("дата выставления"), auto_now_add=True)
    due_date = models.DateTimeField(_("срок оплаты"), help_text="Дата, до которой должен быть оплачен счет")
    is_paid = models.BooleanField(_("оплачен"), default=False)

    def __str__(self):
        return f"Счет #{self.id} ({self.total} руб.)"


class Notification(models.Model):
    class NotificationTypes(models.TextChoices):
        EMAIL = "email", _("Email")
        SMS = "sms", _("SMS")
        TELEGRAM = "telegram", _("Telegram")

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField(_("сообщение"))
    notification_type = models.CharField(
        _("тип уведомления"), max_length=20, choices=NotificationTypes.choices, default=NotificationTypes.EMAIL
    )
    sent_at = models.DateTimeField(_("дата отправки"), auto_now_add=True)
    is_read = models.BooleanField(_("прочитано"), default=False)

    def __str__(self):
        return f"Уведомление #{self.id} ({self.notification_type})"


class UserSettings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="settings")
    theme_settings = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Settings for {self.user.username}"


class CalendarTask(models.Model):
    TASK_TYPES = [("loading", "Загрузка"), ("departure", "Отправка"), ("unloading", "Выгрузка"), ("other", "Другое")]

    PRIORITY_CHOICES = [("low", "Низкий"), ("medium", "Средний"), ("high", "Высокий")]

    title = models.CharField(max_length=255, verbose_name="Название")
    description = models.TextField(blank=True, verbose_name="Описание")
    deadline = models.DateTimeField(verbose_name="Срок выполнения")
    priority = models.CharField(_("Приоритет"), max_length=10, choices=PRIORITY_CHOICES, default="medium")
    type = models.CharField(_("Тип задачи"), max_length=20, choices=TASK_TYPES, default="other")
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="calendar_tasks", verbose_name=_("Заказ"), null=True, blank=True
    )
    created_by = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="created_tasks", verbose_name=_("Создатель"), default=1
    )
    assignee = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="assigned_tasks",
        verbose_name=_("Исполнитель"),
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Задача календаря")
        verbose_name_plural = _("Задачи календаря")

    def __str__(self):
        return self.title

    def clean(self):
        if self.deadline and self.deadline < timezone.now():
            raise ValidationError(_("Срок выполнения не может быть в прошлом"))


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    email_integration_enabled = models.BooleanField(default=False, verbose_name="Интеграция с почтой включена")

    # IMAP Settings
    imap_host = models.CharField(max_length=255, blank=True, null=True, verbose_name="IMAP Хост")
    imap_port = models.IntegerField(blank=True, null=True, verbose_name="IMAP Порт")
    imap_user = models.CharField(max_length=255, blank=True, null=True, verbose_name="IMAP Пользователь")
    # Мы будем хранить зашифрованный пароль. BinaryField подходит для этого.
    imap_password_encrypted = models.BinaryField(blank=True, null=True, verbose_name="IMAP Пароль (зашифрован)")
    imap_use_ssl = models.BooleanField(default=True, verbose_name="Использовать SSL для IMAP")

    # SMTP Settings (часто совпадают с IMAP, но лучше хранить отдельно)
    smtp_host = models.CharField(max_length=255, blank=True, null=True, verbose_name="SMTP Хост")
    smtp_port = models.IntegerField(blank=True, null=True, verbose_name="SMTP Порт")
    smtp_user = models.CharField(max_length=255, blank=True, null=True, verbose_name="SMTP Пользователь")
    smtp_password_encrypted = models.BinaryField(blank=True, null=True, verbose_name="SMTP Пароль (зашифрован)")

    def __str__(self):
        return f"Профиль пользователя {self.user.username}"

    class Meta:
        verbose_name = "Профиль пользователя"
        verbose_name_plural = "Профили пользователей"


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.profile.save()
    except UserProfile.DoesNotExist:
        UserProfile.objects.create(user=instance)


class TableHighlight(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="table_highlights",
        verbose_name=_("Пользователь"),
    )
    table_name = models.CharField(max_length=100, verbose_name=_("Имя таблицы"))
    row_id = models.IntegerField(verbose_name=_("ID строки"))
    column_id = models.CharField(max_length=100, verbose_name=_("ID колонки"))
    color = models.CharField(
        max_length=20,
        verbose_name=_("Цвет"),
        null=True,
        blank=True,  # null=True/blank=True означает отсутствие цвета (очистка)
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Выделение ячейки таблицы")
        verbose_name_plural = _("Выделения ячеек таблиц")
        unique_together = (("user", "table_name", "row_id", "column_id"),)
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.user.email} - {self.table_name}[{self.row_id}][{self.column_id}] = {self.color}"


class SiteRequest(models.Model):
    name = models.CharField(max_length=255, verbose_name="Имя")
    phone = models.CharField(max_length=20, verbose_name="Телефон")
    email = models.EmailField(verbose_name="Email")
    message = models.TextField(verbose_name="Сообщение")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    status = models.CharField(
        max_length=20,
        choices=[("new", "Новый"), ("in_progress", "В обработке"), ("completed", "Завершен"), ("rejected", "Отклонен")],
        default="new",
        verbose_name="Статус",
    )

    class Meta:
        verbose_name = "Заявка с сайта"
        verbose_name_plural = "Заявки с сайта"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Заявка от {self.name} ({self.created_at.strftime('%d.%m.%Y')})"
