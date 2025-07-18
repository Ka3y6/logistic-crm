import csv
import logging
import os
from datetime import datetime, timedelta
from io import BytesIO
from typing import Optional, Tuple

import pandas as pd

# noqa comments for late imports (E402)
from django.conf import settings  # noqa: E402
from django.contrib.auth import get_user_model  # noqa: E402
from django.core.files import File
from django.db.models import Count, DecimalField, ExpressionWrapper, F, Q, Sum, Value
from django.db.models.functions import Coalesce, TruncDate
from django.http import HttpResponse
from django.middleware.csrf import get_token
from django.utils.deprecation import MiddlewareMixin
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status, viewsets
from rest_framework.authentication import SessionAuthentication  # noqa: E402
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, authentication_classes, permission_classes
from rest_framework.filters import SearchFilter

# from docxtpl import DocxTemplate
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import CustomTokenAuthentication
from .email_service import (  # noqa: F401
    ERR_TYPE_AUTHENTICATION,  # Импортируем типы ошибок
    ERR_TYPE_CONFIG,
    ERR_TYPE_CONNECTION,
    ERR_TYPE_MAILBOX,
    ERR_TYPE_OPERATION,
    ERR_TYPE_UNKNOWN,
    delete_email,
    fetch_emails,
    list_mailboxes,
    send_email,
    set_email_flags,
)
from .models import (
    CalendarTask,
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
    TableHighlight,
    Task,
    UserProfile,
    UserSettings,
    Vehicle,
)
from .permissions import IsAdmin, IsAdminOrManager, IsManager
from .serializers import (
    CalendarTaskSerializer,
    CargoSerializer,
    CarrierSerializer,
    ClientSerializer,
    DocumentSerializer,
    InvoiceSerializer,
    LoginSerializer,
    NotificationSerializer,
    OrderSerializer,
    PaymentSerializer,
    ProfileSerializer,
    TableHighlightSerializer,
    TaskSerializer,
    UserProfileEmailSettingsSerializer,
    UserSerializer,
    UserSettingsSerializer,
    VehicleSerializer,
)
from .services.document_generator import generate_document
from .utils import extract_contact_info

User = get_user_model()
logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(MiddlewareMixin):
    def process_request(self, request):
        logger.info(f"Request path: {request.path}")
        logger.info(f"Request method: {request.method}")
        logger.info(f"Request headers: {dict(request.headers)}")
        logger.info(f"Request user: {request.user}")
        if hasattr(request, "auth"):
            logger.info(f"Request auth: {request.auth}")
        else:
            logger.info("Request auth: Not available")

    def process_response(self, request, response):
        logger.info(f"Response status: {response.status_code}")
        logger.info(f"Response headers: {dict(response.headers)}")
        return response


@require_GET
@ensure_csrf_cookie
def get_csrf_token(request):
    response = HttpResponse(status=200)
    response["X-CSRFToken"] = request.META.get("CSRF_TOKEN")
    return response


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def csrf_token(request):
    token = get_token(request)
    return Response({"csrfToken": token})


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related("client")
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["status", "transport_type", "client__id", "loading_date", "created_by"]
    search_fields = ["contract_number", "loading_address", "unloading_address"]

    def get_queryset(self):
        queryset = Order.objects.all()
        user = self.request.user

        # Если передан параметр created_by, фильтруем по нему
        created_by = self.request.query_params.get("created_by")
        if created_by:
            return queryset.filter(created_by=created_by)

        # Иначе возвращаем заказы текущего пользователя
        return queryset.filter(created_by=user)

    def create(self, request):
        try:
            contract_number = request.data.get("contract_number")
            if contract_number and Order.objects.filter(contract_number=contract_number).exists():
                return Response({"error": "Договор с таким номером уже существует"}, status=status.HTTP_400_BAD_REQUEST)

            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(created_by=request.user)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Ошибка при создании заказа: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"])
    def export_orders_csv(self, request):
        orders = Order.objects.all()
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="orders.csv"'

        writer = csv.writer(response)
        writer.writerow(["Contract Number", "Status", "Client Email", "Total Price"])
        for order in orders:
            writer.writerow([order.contract_number, order.status, order.client.user.email, order.total_price])
        return response

    @action(detail=True, methods=["post"])
    def generate_document(self, request, pk=None):
        order = self.get_object()
        document_type = request.data.get("document_type")
        if not document_type:
            return Response({"error": "Тип документа не указан"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            file_path = generate_document(order, document_type)

            # Создаем запись документа в базе данных
            with open(file_path, "rb") as f:
                document = Document.objects.create(
                    name=f"{document_type.capitalize()} для заказа #{order.id}",
                    document_type=document_type,
                    file=File(f, name=os.path.basename(file_path)),
                    order=order,
                )

            # Преобразуем абсолютный путь в URL для скачивания
            media_url = settings.MEDIA_URL
            relative_path = file_path.replace(settings.MEDIA_ROOT, "")
            file_url = f"{media_url}{relative_path.lstrip('/')}"

            return Response(
                {"file_path": file_url, "document_id": document.id, "message": "Документ успешно сгенерирован"}
            )
        except Exception as e:
            logger.error(f"Ошибка при генерации документа: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminOrManager()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return Client.objects.all()
        return Client.objects.filter(created_by=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.has_active_order:
            return Response(
                {"detail": "Невозможно удалить клиента с активными заказами"}, status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"])
    def contacts(self, request, pk=None):
        client = self.get_object()
        contacts = client.contacts.all()
        serializer = self.get_serializer(contacts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def export_excel(self, request):
        try:
            clients = self.get_queryset()
            data = []
            for client in clients:
                data.append(
                    {
                        "ID": client.id,
                        "Наименование компании": client.company_name,
                        "Сфера деятельности": client.business_scope,
                        "Адрес": client.address,
                        "Банковские реквизиты": client.bank_details,
                        "УНП": client.unp,
                        "УНН": client.unn,
                        "ОКПО": client.okpo,
                        "Комментарии": client.comments,
                        "Дата создания": client.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                        "Дата обновления": client.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
                    }
                )

            df = pd.DataFrame(data)
            output = BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, sheet_name="Клиенты")

            output.seek(0)
            response = HttpResponse(
                output.getvalue(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            response["Content-Disposition"] = "attachment; filename=clients.xlsx"
            return response
        except Exception as e:
            logger.error(f"Ошибка при экспорте клиентов в Excel: {str(e)}")
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=["post"])
    def import_excel(self, request):
        if "file" not in request.FILES:
            return Response({"error": "Файл не найден"}, status=400)

        file = request.FILES["file"]
        if not file.name.endswith(".xlsx"):
            return Response({"error": "Поддерживаются только файлы .xlsx"}, status=400)

        try:
            df = pd.read_excel(file)

            # Логируем содержимое файла
            logger.info(f"Содержимое файла {file.name}:")
            logger.info(f"Колонки: {df.columns.tolist()}")
            logger.info(f"Первые 5 строк:\n{df.head().to_string()}")

            # Маппинг колонок Excel в поля модели
            column_mapping = {
                "Наименование компании": "company_name",
                "Сфера деятельности": "business_scope",
                "Контакты": "contact_info",
                "Менеджер": "manager_name",
                "Комментарии": "comments",
            }

            # Логируем маппинг
            logger.info(f"Маппинг колонок: {column_mapping}")

            # Переименовываем колонки
            df = df.rename(columns=column_mapping)

            # Логируем переименованные колонки
            logger.info(f"Переименованные колонки: {df.columns.tolist()}")

            # Обрабатываем каждую строку
            for idx, row in df.iterrows():
                # Логируем данные строки
                logger.info(f"Обработка строки {idx + 2}:")
                logger.info(f"Данные: {row.to_dict()}")

                # Создаем или обновляем клиента
                client_data = {
                    "company_name": row.get("company_name", ""),
                    "business_scope": row.get("business_scope", ""),
                    "comments": row.get("comments", ""),
                }

                # Очищаем данные от NaN
                client_data = {k: v if pd.notna(v) else "" for k, v in client_data.items()}

                # Логируем данные для создания клиента
                logger.info(f"Данные для создания клиента: {client_data}")

                # Создаем клиента
                client = Client.objects.create(**client_data)

                # Обрабатываем контактную информацию
                contact_info = row.get("contact_info", "")
                manager_name = row.get("manager_name", "")

                if pd.notna(contact_info):
                    # Парсим контактную информацию
                    name, phone, email = extract_contact_info(contact_info)

                    # Если есть имя менеджера, используем его
                    if pd.notna(manager_name):
                        name = manager_name

                    if name or phone or email:
                        ClientContact.objects.create(
                            client=client, name=name or "", phone=phone or "", email=email or "", contact_type="manager"
                        )

            return Response({"message": "Импорт успешно завершен"})

        except Exception as e:
            logger.error(f"Ошибка при импорте: {str(e)}")
            return Response({"error": str(e)}, status=400)


class PaymentPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsManager]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["order", "method"]
    pagination_class = PaymentPagination


class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def list(self, request, *args, **kwargs):
        try:
            logger.info(f"User {request.user.email} requesting users list. User role: {request.user.role}")
            if not request.user.is_authenticated:
                logger.error("Unauthenticated user tried to access users list")
                return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            if request.user.role != "admin":
                logger.error(f"User {request.user.email} with role {request.user.role} tried to access users list")
                return Response({"detail": "Admin privileges required"}, status=status.HTTP_403_FORBIDDEN)
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in UserViewSet.list: {str(e)}")
            return Response({"detail": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"User {request.user.email} creating new user")
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error in UserViewSet.create: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            logger.info(f"User {request.user.email} updating user {kwargs.get('pk')}")
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=False)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in UserViewSet.update: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        try:
            logger.info(f"User {request.user.email} partially updating user {kwargs.get('pk')}")
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in UserViewSet.partial_update: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get", "put", "patch"], permission_classes=[IsAuthenticated])
    def me(self, request):
        if request.method == "GET":
            serializer = ProfileSerializer(request.user)
            return Response(serializer.data)

        if request.method in ["PUT", "PATCH"]:
            serializer = ProfileSerializer(request.user, data=request.data, partial=request.method == "PATCH")
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)


@api_view(["GET", "POST"])
@permission_classes([IsAdmin])
def system_config(request):
    if request.method == "GET":
        # Логика получения конфигурации
        return Response({"order_limit": 100})
    elif request.method == "POST":
        # Логика сохранения конфигурации
        return Response({"status": "Настройки сохранены"})


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    try:
        logger.info(f"Login request data: {request.data}")
        serializer = LoginSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            token, _ = Token.objects.get_or_create(user=user)
            return Response({"token": token.key, "user": UserSerializer(user).data})
        logger.warning(f"Login validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response({"error": "Ошибка при входе в систему"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Остальные существующие ViewSets и классы
class CargoViewSet(viewsets.ModelViewSet):
    queryset = Cargo.objects.all()
    serializer_class = CargoSerializer
    permission_classes = [IsAuthenticated]


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.all()

        # Фильтрация по дате
        start_date = self.request.query_params.get("start_date", None)
        end_date = self.request.query_params.get("end_date", None)

        if start_date and end_date:
            queryset = queryset.filter(start__date__gte=start_date, start__date__lte=end_date)

        # Фильтрация по исполнителю
        assignee = self.request.query_params.get("assignee", None)
        if assignee:
            queryset = queryset.filter(assignee=assignee)

        return queryset

    def perform_create(self, serializer):
        serializer.save(assignee=self.request.user)


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    pagination_class = None  # Отключаем пагинацию для этого ViewSet

    def list(self, request, *args, **kwargs):
        logger.info(f"Запрос списка документов от пользователя {request.user.email}")
        documents = self.get_queryset()
        logger.info(f"Найдено {documents.count()} документов")
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.query_params.get("download"):
            try:
                file_path = instance.file.path
                if not os.path.exists(file_path):
                    logger.error(f"Файл не найден: {file_path}")
                    return Response({"error": "Файл не найден"}, status=status.HTTP_404_NOT_FOUND)
                with open(file_path, "rb") as f:
                    content_type = "application/octet-stream"
                    ext = os.path.splitext(instance.file.name)[1].lower()
                    if ext == ".pdf":
                        content_type = "application/pdf"
                    elif ext == ".docx":
                        content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    elif ext == ".xlsx":
                        content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    response = HttpResponse(f.read(), content_type=content_type)
                    from urllib.parse import quote

                    filename = f"{instance.name}{ext}"
                    response["Content-Disposition"] = f"attachment; filename*=UTF-8''{quote(filename)}"
                    return response
            except Exception as e:
                logger.error(f"Ошибка при скачивании файла: {str(e)}")
                return Response(
                    {"error": f"Ошибка при скачивании файла: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def generate_contract(self, request, pk=None):
        order = self.get_object()
        file_path = generate_document(order, "contract")

        with open(file_path, "rb") as f:
            document = Document.objects.create(
                name=f"Договор №{order.contract_number}",
                document_type="contract",
                file=File(f, name=os.path.basename(file_path)),
                order=order,
            )
        return Response({"status": "Договор создан", "document_id": document.id})


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, IsManager]

    def create(self, request):
        order_id = request.data.get("order")
        order = Order.objects.get(id=order_id)
        invoice = Invoice.objects.create(
            client=order.client, order=order, total=order.total_price, due_date=order.delivery_deadline
        )
        return Response(InvoiceSerializer(invoice).data, status=201)


class FinanceReportView(APIView):
    """Возвращает расширенный финансовый отчёт за произвольный период.

    Формат ответа соответствует ожиданиям фронтенда:
    {
        "total_revenue": 100000,
        "revenue_trend": 12.5,
        "total_orders": 45,
        "orders_trend": -3.8,
        "average_order_value": 2222,
        "average_order_trend": 5.1,
        "profit": 15000,
        "profit_trend": 9.4,
        "daily_stats": [ { … }, … ]
    }
    """

    permission_classes = [IsAuthenticated, IsAdminOrManager]
    authentication_classes = [CustomTokenAuthentication, SessionAuthentication]

    def _percent_change(self, current, previous):
        if previous in (None, 0):
            return 0
        return round(((current - previous) / previous) * 100, 2)

    def get(self, request):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if not start_date or not end_date:
            return Response({"error": "start_date and end_date are required"}, status=400)

        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)

        # Текущий период
        orders = Order.objects.filter(created_at__date__range=(start, end))

        zero_decimal = Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
        revenue_agg = orders.aggregate(
            total_revenue=Coalesce(
                Sum("total_price"), zero_decimal, output_field=DecimalField(max_digits=12, decimal_places=2)
            )
        )
        total_revenue = revenue_agg["total_revenue"]

        total_orders = orders.count()

        profit_agg = orders.aggregate(
            total_profit=Coalesce(
                Sum(
                    ExpressionWrapper(
                        Coalesce(F("client_rate"), F("total_price"), zero_decimal)
                        - Coalesce(F("carrier_rate"), zero_decimal),
                        output_field=DecimalField(max_digits=12, decimal_places=2),
                    )
                ),
                zero_decimal,
            )
        )
        profit = profit_agg["total_profit"] or 0

        average_order_value = round(total_revenue / total_orders, 2) if total_orders else 0

        # Предыдущий период такой же длительности
        period_delta = end - start
        prev_start = start - period_delta - timedelta(days=1)
        prev_end = start - timedelta(days=1)

        prev_orders = Order.objects.filter(created_at__date__range=(prev_start, prev_end))
        prev_revenue = prev_orders.aggregate(
            total=Coalesce(Sum("total_price"), zero_decimal, output_field=DecimalField(max_digits=12, decimal_places=2))
        )["total"]
        prev_total_orders = prev_orders.count()
        prev_average_order = round(prev_revenue / prev_total_orders, 2) if prev_total_orders else 0
        prev_profit = (
            prev_orders.aggregate(
                total_profit=Coalesce(
                    Sum(
                        ExpressionWrapper(
                            Coalesce(F("client_rate"), F("total_price"), zero_decimal)
                            - Coalesce(F("carrier_rate"), zero_decimal),
                            output_field=DecimalField(max_digits=12, decimal_places=2),
                        )
                    ),
                    zero_decimal,
                )
            )["total_profit"]
            or 0
        )

        # Ежедневная статистика
        daily_qs = (
            orders.annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(
                revenue=Coalesce(
                    Sum("total_price"), zero_decimal, output_field=DecimalField(max_digits=12, decimal_places=2)
                ),
                orders=Count("id"),
                profit=Coalesce(
                    Sum(
                        ExpressionWrapper(
                            Coalesce(F("client_rate"), F("total_price"), zero_decimal)
                            - Coalesce(F("carrier_rate"), zero_decimal),
                            output_field=DecimalField(max_digits=12, decimal_places=2),
                        )
                    ),
                    zero_decimal,
                ),
            )
            .order_by("date")
        )

        daily_stats = []
        for row in daily_qs:
            avg_val = round(row["revenue"] / row["orders"], 2) if row["orders"] else 0
            daily_stats.append(
                {
                    "date": row["date"].isoformat(),
                    "revenue": float(row["revenue"]),
                    "orders": row["orders"],
                    "average_order_value": avg_val,
                    "profit": float(row["profit"]),
                }
            )

        response = {
            "total_revenue": float(total_revenue),
            "revenue_trend": self._percent_change(total_revenue, prev_revenue),
            "total_orders": total_orders,
            "orders_trend": self._percent_change(total_orders, prev_total_orders),
            "average_order_value": average_order_value,
            "average_order_trend": self._percent_change(average_order_value, prev_average_order),
            "profit": float(profit),
            "profit_trend": self._percent_change(profit, prev_profit),
            "daily_stats": daily_stats,
        }

        return Response(response)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"status": "Уведомление прочитано"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def validate_token(request):
    """Проверка валидности токена"""
    try:
        logger.info(f"Validating token for user: {request.user.email}")

        # Проверяем заголовок авторизации
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        logger.info(f"Auth header: {auth_header}")
        logger.info(f"All headers: {request.META}")

        if not auth_header.startswith("Token "):
            logger.warning(f"Invalid token format: {auth_header}")
            return Response({"error": "Invalid token format"}, status=status.HTTP_401_UNAUTHORIZED)

        # Проверяем, что пользователь аутентифицирован
        if not request.user.is_authenticated:
            logger.warning(f"User not authenticated: {request.user}")
            return Response({"error": "User not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

        # Проверяем токен в базе данных
        token_key = auth_header.split(" ")[1]
        try:
            token = Token.objects.get(key=token_key)
            if token.user != request.user:
                logger.warning(
                    f"Token user mismatch: token user {token.user.email} != request user {request.user.email}"
                )
                return Response({"error": "Token user mismatch"}, status=status.HTTP_401_UNAUTHORIZED)
        except Token.DoesNotExist:
            logger.warning(f"Token not found: {token_key}")
            return Response({"error": "Token not found"}, status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"User is authenticated: {request.user.is_authenticated}")
        logger.info(f"User auth: {request.auth}")

        # Возвращаем информацию о пользователе
        return Response(
            {
                "valid": True,
                "user": {
                    "id": request.user.id,
                    "email": request.user.email,
                    "role": request.user.role,
                    "username": request.user.username,
                    "first_name": request.user.first_name,
                    "last_name": request.user.last_name,
                },
            }
        )
    except Exception as e:
        logger.error(f"Error validating token: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class CarrierViewSet(viewsets.ModelViewSet):
    queryset = Carrier.objects.all()
    serializer_class = CarrierSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ["company_name", "working_directions", "location", "manager_name", "director_name"]
    ordering_fields = ["company_name", "created_at"]

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return Carrier.objects.all()
        return Carrier.objects.filter(created_by=user)

    def create(self, request, *args, **kwargs):
        logger.info(f"Создание нового перевозчика. Данные: {request.data}")
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(created_by=request.user)
            headers = self.get_success_headers(serializer.data)
            logger.info(f"Перевозчик успешно создан: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Ошибка при создании перевозчика: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        logger.info("Вызов метода list")
        queryset = self.get_queryset()
        logger.info(f"Количество записей в queryset: {queryset.count()}")
        serializer = self.get_serializer(queryset, many=True)
        logger.info(f"Данные для отправки: {serializer.data}")
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def export_excel(self, request):
        try:
            carriers = self.get_queryset()
            data = []
            for carrier in carriers:
                data.append(
                    {
                        "ID": carrier.id,
                        "Наименование компании": carrier.company_name,
                        "Направления работы": carrier.working_directions,
                        "Местоположение": carrier.location,
                        "Парк": carrier.fleet,
                        "Комментарии": carrier.comments,
                        "Известные тарифы": carrier.known_rates,
                        "Количество ТС": carrier.vehicle_number,
                        "Дата создания": carrier.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                        "Дата обновления": carrier.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
                    }
                )

            df = pd.DataFrame(data)
            output = BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, sheet_name="Перевозчики")

            output.seek(0)
            response = HttpResponse(
                output.getvalue(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            response["Content-Disposition"] = "attachment; filename=carriers.xlsx"
            return response
        except Exception as e:
            logger.error(f"Ошибка при экспорте перевозчиков в Excel: {str(e)}")
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=["post"])
    def import_excel(self, request):
        if "file" not in request.FILES:
            return Response({"error": "Файл не найден"}, status=400)

        file = request.FILES["file"]
        if not file.name.endswith(".xlsx"):
            return Response({"error": "Поддерживаются только файлы .xlsx"}, status=400)

        try:
            df = pd.read_excel(file)

            # Логируем содержимое файла
            logger.info(f"Содержимое файла {file.name}:")
            logger.info(f"Колонки: {df.columns.tolist()}")
            logger.info(f"Первые 5 строк:\n{df.head().to_string()}")

            # Маппинг колонок Excel в поля модели
            column_mapping = {
                "Наименование ": "company_name",
                "Направления": "working_directions",
                "Расположение/Местоположение": "location",
                "Парк": "fleet",
                "Контактная информация": "contact_info",
                "Менеджер": "manager_name",
                "comments": "comments",
                "Известные тарифы": "known_rates",
            }

            # Логируем маппинг
            logger.info(f"Маппинг колонок: {column_mapping}")

            # Переименовываем колонки
            df = df.rename(columns=column_mapping)

            # Логируем переименованные колонки
            logger.info(f"Переименованные колонки: {df.columns.tolist()}")

            # Обрабатываем каждую строку
            for idx, row in df.iterrows():
                # Логируем данные строки
                logger.info(f"Обработка строки {idx + 2}:")
                logger.info(f"Данные: {row.to_dict()}")

                # Создаем или обновляем перевозчика
                carrier_data = {
                    "company_name": row.get("company_name", ""),
                    "working_directions": row.get("working_directions", ""),
                    "location": row.get("location", ""),
                    "fleet": row.get("fleet", ""),
                    "comments": row.get("comments", ""),
                    "known_rates": row.get("known_rates", ""),
                }

                # Очищаем данные от NaN
                carrier_data = {k: v if pd.notna(v) else "" for k, v in carrier_data.items()}

                # Логируем данные для создания перевозчика
                logger.info(f"Данные для создания перевозчика: {carrier_data}")

                # Создаем перевозчика и привязываем к текущему пользователю, чтобы он был виден в его списке
                carrier = Carrier.objects.create(**carrier_data, created_by=request.user)

                # Обрабатываем контактную информацию
                contact_info = row.get("contact_info", "")
                manager_name = row.get("manager_name", "")

                if pd.notna(contact_info):
                    # Парсим контактную информацию
                    name, phone, email = extract_contact_info(contact_info)

                    # Если есть имя менеджера, используем его
                    if pd.notna(manager_name):
                        name = manager_name

                    if name or phone or email:
                        CarrierContact.objects.create(
                            carrier=carrier,
                            name=name or "",
                            phone=phone or "",
                            email=email or "",
                            contact_type="manager",
                        )

            return Response({"message": "Импорт успешно завершен"})

        except Exception as e:
            logger.error(f"Ошибка при импорте: {str(e)}")
            return Response({"error": str(e)}, status=400)


class UserSettingsViewSet(viewsets.ModelViewSet):
    queryset = UserSettings.objects.all()
    serializer_class = UserSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def get_object(self):
        settings, created = UserSettings.objects.get_or_create(user=self.request.user)
        return settings

    @action(detail=False, methods=["get"])
    def get_settings(self, request):
        settings, created = UserSettings.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(settings)
        return Response(serializer.data)

    @action(detail=False, methods=["put"])
    def update_settings(self, request):
        settings, created = UserSettings.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CalendarTaskViewSet(viewsets.ModelViewSet):
    queryset = CalendarTask.objects.all()
    serializer_class = CalendarTaskSerializer
    authentication_classes = [CustomTokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = CalendarTask.objects.all()
        user_id = self.request.query_params.get("user")
        date = self.request.query_params.get("date")

        if user_id:
            queryset = queryset.filter(assignee_id=user_id)
        elif self.request.user.is_authenticated:
            queryset = queryset.filter(assignee=self.request.user)

        if date:
            try:
                date = datetime.strptime(date, "%Y-%m-%d").date()
                queryset = queryset.filter(Q(deadline__date=date) | Q(created_at__date=date))
            except ValueError:
                pass

        return queryset.order_by("deadline")

    def perform_create(self, serializer):
        """Создание задачи календаря.

        • Если автор запроса ‑ администратор и в данных передан исполнитель, используем его.
        • Для всех остальных случаев (или если исполнитель не указан) назначаем задачу
          на самого создателя.
        """

        user = self.request.user

        if not user.is_authenticated:
            raise permissions.PermissionDenied("Authentication required")

        # Попытка взять переданного assignee (serializer.validated_data уже содержит объект)
        assignee = serializer.validated_data.get("assignee")

        if assignee is None or (assignee != user and user.role != CustomUser.RoleChoices.ADMIN):
            # либо не передан, либо пользователь не админ, либо пытается назначить не себя
            assignee = user

        serializer.save(created_by=user, assignee=assignee)


class UserProfileEmailSettingsView(generics.RetrieveUpdateAPIView):
    """
    Представление для получения и обновления настроек почты текущего пользователя.
    Использует PUT для полного обновления или PATCH для частичного.
    """

    queryset = UserProfile.objects.all()
    serializer_class = UserProfileEmailSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]  # Только для аутентифицированных пользователей

    def get_object(self):
        """Возвращает профиль текущего пользователя, создавая его при необходимости."""
        # Сигналы должны были создать профиль, но get_or_create надежнее.
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


def _get_error_response(error_info: Optional[Tuple[str, str]]) -> Response:
    """Формирует Response с нужным статусом на основе типа ошибки."""
    if not error_info:
        # На всякий случай, если ошибка не передана
        return Response({"error": "Произошла неизвестная ошибка."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    error_type, error_message = error_info
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR  # По умолчанию 500

    if error_type == ERR_TYPE_CONFIG:
        status_code = status.HTTP_400_BAD_REQUEST  # Ошибка конфигурации пользователя
    elif error_type == ERR_TYPE_AUTHENTICATION:
        status_code = status.HTTP_401_UNAUTHORIZED  # Ошибка входа
    elif error_type == ERR_TYPE_CONNECTION:
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE  # Ошибка подключения к серверу
    elif error_type == ERR_TYPE_MAILBOX:
        status_code = status.HTTP_404_NOT_FOUND  # Ящик не найден
    elif error_type == ERR_TYPE_OPERATION:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR  # Ошибка выполнения команды
    # ERR_TYPE_UNKNOWN остается 500

    return Response({"error": error_message, "error_type": error_type}, status=status_code)


class EmailMessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Получаем параметры запроса
            mailbox = request.GET.get("mailbox", "INBOX")
            limit = int(request.GET.get("limit", 25))
            offset = int(request.GET.get("offset", 0))

            # Получаем email пользователя
            user_email = request.user.email
            logger.info(f"API GET /email/messages/ вызван для {user_email}, mailbox: {mailbox}")
            logger.debug(f"Полные параметры запроса: {request.GET}")
            logger.debug(f"Параметры пагинации: limit={limit}, offset={offset}")

            # Вызываем функцию получения писем
            logger.info(
                f"Вызов fetch_emails для {user_email} с параметрами: mailbox={mailbox}, limit={limit}, offset={offset}"
            )
            result = fetch_emails(user_email, mailbox, limit, offset)

            # Если результат содержит ошибку
            if isinstance(result, tuple) and len(result) == 2:
                error_type, error_message = result
                logger.warning(
                    f"Ошибка при получении писем для {user_email} (mailbox: {mailbox}): {error_type} - {error_message}"
                )
                return Response({"error": error_message}, status=503 if error_type == ERR_TYPE_CONNECTION else 400)

            # Логируем содержимое первого письма для отладки
            if result.get("emails") and len(result["emails"]) > 0:
                first_email = result["emails"][0]
                logger.debug("Пример содержимого письма:")
                logger.debug(f"- ID: {first_email.get('id')}")
                logger.debug(f"- Subject: {first_email.get('subject')}")
                logger.debug(f"- From: {first_email.get('from')}")
                logger.debug(f"- Date: {first_email.get('date')}")
                logger.debug(f"- Body length: {len(first_email.get('body', ''))}")
                logger.debug(f"- Is HTML: {first_email.get('is_html')}")
                logger.debug(f"- Mailbox: {first_email.get('mailbox')}")

            # Если результат успешный
            return Response(result)

        except Exception as e:
            logger.error(f"Неожиданная ошибка при получении писем: {str(e)}", exc_info=True)
            return Response({"error": "Внутренняя ошибка сервера"}, status=500)


class EmailMessageSendView(APIView):
    """Представление для отправки письма от имени текущего пользователя."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        to_email = request.data.get("to")
        subject = request.data.get("subject")
        content = request.data.get("content")
        documents = request.data.getlist("documents[]")  # Получаем список ID документов

        if not all([to_email, subject, content]):
            return Response(
                {"error": "Поля 'to', 'subject', 'content' обязательны."}, status=status.HTTP_400_BAD_REQUEST
            )

        logger.info(f"Попытка отправки письма от {user.email} к {to_email} с {len(documents)} документами")

        # Возвращаем прямой синхронный вызов
        success, error_info = send_email(user, to=to_email, subject=subject, body=content, documents=documents)

        # Возвращаем старую логику ответа
        if success:
            return Response({"message": "Письмо успешно отправлено."}, status=status.HTTP_200_OK)
        else:
            return _get_error_response(error_info)


class EmailActionView(APIView):
    """Представление для выполнения действий над письмами (пометка, удаление)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        action = request.data.get("action")
        email_ids = request.data.get("email_ids")
        mailbox = request.data.get("mailbox", "INBOX")

        if not action or not email_ids or not isinstance(email_ids, list):
            return Response(
                {"error": "Параметры 'action' и 'email_ids' (список) обязательны."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Возвращаем переменные для результата
        success = False
        error_info = None

        if action == "mark_read":
            logger.info(f"Попытка пометить {email_ids} как прочитанные для {user.email}")
            # Возвращаем прямой вызов
            success, error_info = set_email_flags(
                user, email_ids=email_ids, flags=["\\Seen"], mailbox=mailbox, add=True
            )
        elif action == "mark_unread":
            logger.info(f"Попытка пометить {email_ids} как непрочитанные для {user.email}")
            # Возвращаем прямой вызов
            success, error_info = set_email_flags(
                user, email_ids=email_ids, flags=["\\Seen"], mailbox=mailbox, add=False
            )
        elif action == "delete":
            logger.info(f"Попытка удалить {email_ids} для {user.email}")
            # Возвращаем прямой вызов
            success, error_info = delete_email(user, email_ids=email_ids, mailbox=mailbox)
        else:
            return Response({"error": f"Неизвестное действие: {action}"}, status=status.HTTP_400_BAD_REQUEST)

        # Возвращаем старую логику ответа
        if success:
            return Response({"message": f"Действие '{action}' успешно выполнено."}, status=status.HTTP_200_OK)
        else:
            return _get_error_response(error_info)


class TableHighlightViewSet(viewsets.ModelViewSet):
    serializer_class = TableHighlightSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Возвращает выделения только для текущего пользователя."""
        user = self.request.user
        # Фильтруем по таблице, если параметр table_name передан в GET запросе
        table_name = self.request.query_params.get("table", None)
        if table_name:
            return TableHighlight.objects.filter(user=user, table_name=table_name)
        return TableHighlight.objects.filter(user=user)

    @action(detail=False, methods=["post"], url_path="save")
    def save_highlights(self, request, *args, **kwargs):
        """Массовое сохранение/удаление выделений."""
        user = request.user
        data = request.data
        results = {"created": 0, "updated": 0, "deleted": 0, "errors": []}

        if not isinstance(data, list):
            return Response({"detail": "Ожидался список объектов."}, status=status.HTTP_400_BAD_REQUEST)

        for item in data:
            table_name = item.get("table_name")
            row_id = item.get("row_id")
            column_id = item.get("column_id")
            color = item.get("color")  # color может быть null или '' для удаления

            if not all([table_name, row_id is not None, column_id]):
                results["errors"].append(
                    {"item": item, "error": "Отсутствуют обязательные поля (table_name, row_id, column_id)."}
                )
                continue

            try:
                # Пытаемся найти существующий объект
                highlight, created = TableHighlight.objects.update_or_create(
                    user=user,
                    table_name=table_name,
                    row_id=row_id,
                    column_id=column_id,
                    defaults={"color": color if color else None},  # Сохраняем null если color пустой
                )

                # Если цвет null или пустой и объект не был только что создан - удаляем его
                if not color and not created:
                    highlight.delete()
                    results["deleted"] += 1
                elif created:
                    results["created"] += 1
                else:
                    results["updated"] += 1

            except Exception as e:
                results["errors"].append({"item": item, "error": str(e)})

        if results["errors"]:
            return Response(results, status=status.HTTP_400_BAD_REQUEST)
        return Response(results, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # Методы list, retrieve, update, partial_update, destroy будут работать
    # но get_queryset уже отфильтровал по пользователю.
