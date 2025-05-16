from django.http import HttpResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django_ratelimit.decorators import ratelimit
from django.db.models import Sum
from datetime import datetime
from django.core.files import File
import csv
import os
import logging
import pandas as pd
from io import BytesIO
from django.apps import apps
from rest_framework import generics
from .models import UserProfile, TableHighlight
from .serializers import UserProfileEmailSettingsSerializer, TableHighlightSerializer
from typing import Optional, Tuple
from .email_service import (
    fetch_emails, send_email, set_email_flags, delete_email,
    ERR_TYPE_CONNECTION, ERR_TYPE_AUTHENTICATION, ERR_TYPE_MAILBOX, 
    ERR_TYPE_OPERATION, ERR_TYPE_CONFIG, ERR_TYPE_UNKNOWN, # Импортируем типы ошибок
    list_mailboxes
)

logger = logging.getLogger(__name__)

from .serializers import (
    LoginSerializer,
    UserSerializer,
    ProfileSerializer,
    OrderSerializer,
    ClientSerializer,
    CargoSerializer,
    VehicleSerializer,
    TaskSerializer,
    DocumentSerializer,
    PaymentSerializer,
    InvoiceSerializer,
    NotificationSerializer,
    ClientListSerializer,
    CarrierSerializer,
    CalendarTaskSerializer,
    UserSettingsSerializer
)
from .models import (
    Order,
    Client,
    Cargo,
    Vehicle,
    Task,
    Document,
    Payment,
    Invoice,
    CustomUser,
    Notification,
    Carrier,
    CalendarTask,
    UserSettings,
    ClientContact,
    CarrierContact,
    TableHighlight
)
from .permissions import IsAdmin, IsManager, IsAdminOrManager
from .services.document_generator import generate_document
from rest_framework.pagination import PageNumberPagination
from django.db import models
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone


@require_GET
@ensure_csrf_cookie
def get_csrf_token(request):
    response = HttpResponse(status=200)
    response['X-CSRFToken'] = request.META.get('CSRF_TOKEN')
    return response

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('client')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'transport_type', 'client__id', 'loading_date']
    search_fields = ['contract_number', 'loading_address', 'unloading_address']

    def create(self, request):
        try:
            # Проверяем номер договора только если он предоставлен
            contract_number = request.data.get('contract_number')
            if contract_number and Order.objects.filter(contract_number=contract_number).exists():
                return Response(
                    {'error': 'Договор с таким номером уже существует'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Создаем заказ
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Ошибка при создании заказа: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def export_orders_csv(self, request):
        orders = Order.objects.all()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="orders.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Contract Number', 'Status', 'Client Email', 'Total Price'])
        for order in orders:
            writer.writerow([
                order.contract_number,
                order.status,
                order.client.user.email,
                order.total_price
            ])
        return response

    @action(detail=True, methods=['post'])
    def generate_document(self, request, pk=None):
        order = self.get_object()
        document_type = request.data.get('document_type')
        if not document_type:
            return Response(
                {'error': 'Тип документа не указан'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            file_path = generate_document(order, document_type)
            
            # Создаем запись документа в базе данных
            with open(file_path, 'rb') as f:
                document = Document.objects.create(
                    name=f"{document_type.capitalize()} для заказа #{order.id}",
                    document_type=document_type,
                    file=File(f, name=os.path.basename(file_path)),
                    order=order
                )
            
            # Преобразуем абсолютный путь в URL для скачивания
            media_url = settings.MEDIA_URL
            relative_path = file_path.replace(settings.MEDIA_ROOT, '')
            file_url = f"{media_url}{relative_path.lstrip('/')}"
            
            return Response({
                'file_path': file_url,
                'document_id': document.id,
                'message': 'Документ успешно сгенерирован'
            })
        except Exception as e:
            logger.error(f"Ошибка при генерации документа: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.role == 'manager':
            return Client.objects.all()
        return Client.objects.filter(contacts__email=user.email).distinct()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.has_active_order:
            return Response(
                {"detail": "Невозможно удалить клиента с активными заказами"},
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def contacts(self, request, pk=None):
        client = self.get_object()
        contacts = client.contacts.all()
        serializer = self.get_serializer(contacts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        try:
            clients = self.get_queryset()
            data = []
            for client in clients:
                data.append({
                    'ID': client.id,
                    'Наименование компании': client.company_name,
                    'Сфера деятельности': client.business_scope,
                    'Адрес': client.address,
                    'Банковские реквизиты': client.bank_details,
                    'УНП': client.unp,
                    'УНН': client.unn,
                    'ОКПО': client.okpo,
                    'Комментарии': client.comments,
                    'Дата создания': client.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'Дата обновления': client.updated_at.strftime('%Y-%m-%d %H:%M:%S')
                })

            df = pd.DataFrame(data)
            output = BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Клиенты')
            
            output.seek(0)
            response = HttpResponse(
                output.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename=clients.xlsx'
            return response
        except Exception as e:
            logger.error(f"Ошибка при экспорте клиентов в Excel: {str(e)}")
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def import_excel(self, request):
        try:
            file = request.FILES['file']
            df = pd.read_excel(file)
            
            # Расширенный словарь соответствия названий столбцов полям модели
            column_mapping = {
                'id': 'id',
                'наименование компании': 'company_name',
                'наименование': 'company_name',
                'статус': 'status',
                'направления': 'business_scope',
                'направление': 'business_scope',
                'сфера деятельности': 'business_scope',
                'деятельность': 'business_scope',
                'наименование товара': 'product_name',
                'контакты': 'contacts',
                'адрес': 'address',
                'юридический адрес': 'address',
                'реквизиты': 'bank_details',
                'банковские реквизиты': 'bank_details',
                'унп': 'unp',
                'учетный номер плательщика': 'unp',
                'унн': 'unn',
                'учетный номер налогоплательщика': 'unn',
                'окпо': 'okpo',
                'окпо код': 'okpo',
                'комментарии': 'comments',
                'примечания': 'comments',
            }
            
            def find_similar_column(column_name, mapping):
                column_name = str(column_name).strip().lower()
                if column_name in mapping:
                    return mapping[column_name]
                for key in mapping:
                    if key in column_name or column_name in key:
                        return mapping[key]
                return None
            
            df.columns = [str(col).strip() for col in df.columns]
            processed_count = 0
            error_count = 0
            errors = []
            
            # Получаем список реальных полей модели Client
            ClientModel = apps.get_model('api', 'Client')
            client_fields = [f.name for f in ClientModel._meta.get_fields() if not f.is_relation or f.one_to_one or (f.many_to_one and f.related_model)]
            
            for idx, row in df.iterrows():
                try:
                    update_data = {}
                    contacts_value = None
                    for col in df.columns:
                        field_name = find_similar_column(col, column_mapping)
                        if field_name:
                            if field_name == 'contacts':
                                contacts_value = row[col]
                            elif field_name in client_fields and pd.notna(row[col]):
                                update_data[field_name] = row[col]
                    if update_data:
                        if 'id' in update_data and update_data['id']:
                            client, created = Client.objects.update_or_create(
                                id=update_data['id'],
                                defaults=update_data
                            )
                        else:
                            client = Client.objects.create(**update_data)
                        # обработка контактов (если нужно)
                        # if contacts_value:
                        #     # здесь добавить логику разбора и добавления контактов
                        processed_count += 1
                except Exception as e:
                    error_count += 1
                    errors.append(f"Ошибка в строке {idx + 2}: {str(e)}")
            return Response({
                'message': f'Импорт завершен. Обработано записей: {processed_count}',
                'errors': errors if errors else None,
                'error_count': error_count
            })
        except Exception as e:
            logger.error(f"Ошибка при импорте клиентов из Excel: {str(e)}")
            return Response({
                'error': str(e),
                'details': 'Проверьте формат файла и названия столбцов'
            }, status=500)

class PaymentPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsManager]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['order', 'method']
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
            if request.user.role != 'admin':
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

    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        if request.method == 'GET':
            serializer = ProfileSerializer(request.user)
            return Response(serializer.data)
        
        if request.method in ['PUT', 'PATCH']:
            serializer = ProfileSerializer(request.user, data=request.data, partial=request.method == 'PATCH')
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

@api_view(['GET', 'POST'])
@permission_classes([IsAdmin])
def system_config(request):
    if request.method == 'GET':
        # Логика получения конфигурации
        return Response({'order_limit': 100})
    elif request.method == 'POST':
        # Логика сохранения конфигурации
        return Response({'status': 'Настройки сохранены'})

@api_view(['POST'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(
        request,
        email=serializer.validated_data['email'],
        password=serializer.validated_data['password']
    )

    if not user:
        return Response({"error": "Неверные учетные данные"}, status=status.HTTP_401_UNAUTHORIZED)
    
    if not user.is_active:
        return Response({"error": "Учетная запись неактивна"}, status=status.HTTP_403_FORBIDDEN)

    # Удаляем старый токен, если он существует
    Token.objects.filter(user=user).delete()
    
    # Создаем новый токен
    token = Token.objects.create(user=user)
    
    # Сериализуем данные пользователя с помощью ProfileSerializer
    user_serializer = ProfileSerializer(user)
    
    response = Response({
        "token": token.key,
        "user": user_serializer.data
    }, status=status.HTTP_200_OK)
    
    return response

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
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date and end_date:
            queryset = queryset.filter(
                start__date__gte=start_date,
                start__date__lte=end_date
            )
        
        # Фильтрация по исполнителю
        assignee = self.request.query_params.get('assignee', None)
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
        if request.query_params.get('download'):
            try:
                file_path = instance.file.path
                if not os.path.exists(file_path):
                    logger.error(f'Файл не найден: {file_path}')
                    return Response({'error': 'Файл не найден'}, status=status.HTTP_404_NOT_FOUND)
                with open(file_path, 'rb') as f:
                    content_type = 'application/octet-stream'
                    ext = os.path.splitext(instance.file.name)[1].lower()
                    if ext == '.pdf':
                        content_type = 'application/pdf'
                    elif ext == '.docx':
                        content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    elif ext == '.xlsx':
                        content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    response = HttpResponse(f.read(), content_type=content_type)
                    from urllib.parse import quote
                    filename = f'{instance.name}{ext}'
                    response['Content-Disposition'] = f"attachment; filename*=UTF-8''{quote(filename)}"
                    return response
            except Exception as e:
                logger.error(f'Ошибка при скачивании файла: {str(e)}')
                return Response(
                    {'error': f'Ошибка при скачивании файла: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def generate_contract(self, request, pk=None):
        order = self.get_object()
        file_path = generate_document(order, 'contract')
        
        with open(file_path, 'rb') as f:
            document = Document.objects.create(
                name=f"Договор №{order.contract_number}",
                document_type='contract',
                file=File(f, name=os.path.basename(file_path)),
                order=order
            )
        return Response({'status': 'Договор создан', 'document_id': document.id})

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, IsManager]

    def create(self, request):
        order_id = request.data.get('order')
        order = Order.objects.get(id=order_id)
        invoice = Invoice.objects.create(
            client=order.client,
            order=order,
            total=order.total_price,
            due_date=order.delivery_deadline
        )
        return Response(InvoiceSerializer(invoice).data, status=201)

class FinancialReportView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')

        total_income = Order.objects.filter(
            created_at__range=(start, end)
        ).aggregate(total=Sum('total_price'))['total'] or 0

        total_expenses = Payment.objects.filter(
            payment_date__range=(start, end)
        ).aggregate(total=Sum('amount'))['total'] or 0

        return Response({
            'period': f'{start_date} - {end_date}',
            'total_income': total_income,
            'total_expenses': total_expenses,
            'net_profit': total_income - total_expenses
        })

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'Уведомление прочитано'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def validate_token(request):
    try:
        user = request.user
        return Response({
            'valid': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role.lower(),
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        })
    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        return Response({'valid': False}, status=status.HTTP_401_UNAUTHORIZED)

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
    search_fields = ['company_name', 'working_directions', 'location', 'manager_name', 'director_name']
    ordering_fields = ['company_name', 'created_at']

    def create(self, request, *args, **kwargs):
        logger.info(f"Создание нового перевозчика. Данные: {request.data}")
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            logger.info(f"Перевозчик успешно создан: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Ошибка при создании перевозчика: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def get_queryset(self):
        logger.info(f"Запрос от пользователя с ролью: {self.request.user.role}")
        queryset = Carrier.objects.all()
        if self.request.user.role == 'admin':
            logger.info("Возвращаем все записи для администратора")
            return queryset
        elif self.request.user.role == 'manager':
            logger.info("Возвращаем все записи для менеджера")
            return queryset
        logger.info("Возвращаем пустой queryset")
        return Carrier.objects.none()

    def list(self, request, *args, **kwargs):
        logger.info("Вызов метода list")
        queryset = self.get_queryset()
        logger.info(f"Количество записей в queryset: {queryset.count()}")
        serializer = self.get_serializer(queryset, many=True)
        logger.info(f"Данные для отправки: {serializer.data}")
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        try:
            carriers = self.get_queryset()
            data = []
            for carrier in carriers:
                data.append({
                    'ID': carrier.id,
                    'Наименование компании': carrier.company_name,
                    'Направления работы': carrier.working_directions,
                    'Местоположение': carrier.location,
                    'Парк': carrier.fleet,
                    'Комментарии': carrier.comments,
                    'Известные тарифы': carrier.known_rates,
                    'Количество ТС': carrier.vehicle_number,
                    'Дата создания': carrier.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'Дата обновления': carrier.updated_at.strftime('%Y-%m-%d %H:%M:%S')
                })

            df = pd.DataFrame(data)
            output = BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Перевозчики')
            
            output.seek(0)
            response = HttpResponse(
                output.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename=carriers.xlsx'
            return response
        except Exception as e:
            logger.error(f"Ошибка при экспорте перевозчиков в Excel: {str(e)}")
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def import_excel(self, request):
        try:
            file = request.FILES['file']
            df = pd.read_excel(file)
            
            # Расширенный словарь соответствия названий столбцов полям модели
            column_mapping = {
                'id': 'id',
                'наименование компании': 'company_name',
                'наименование': 'company_name',
                'направления работы': 'working_directions',
                'направление': 'working_directions',
                'регион/расположение': 'location',
                'местоположение': 'location',
                'автопарк': 'fleet',
                'комментарии': 'comments',
                'примечания': 'comments',
                'известные тарифы': 'known_rates',
                'тарифы': 'known_rates',
                'количество тс': 'vehicle_number',
                'количество автомобилей': 'vehicle_number',
                'транспортные средства': 'vehicle_number',
                'автомобили': 'vehicle_number',
            }
            
            def find_similar_column(column_name, mapping):
                column_name = str(column_name).strip().lower()
                if column_name in mapping:
                    return mapping[column_name]
                for key in mapping:
                    if key in column_name or column_name in key:
                        return mapping[key]
                return None
            
            df.columns = [str(col).strip() for col in df.columns]
            processed_count = 0
            error_count = 0
            errors = []
            
            for idx, row in df.iterrows():
                try:
                    update_data = {}
                    for col in df.columns:
                        field_name = find_similar_column(col, column_mapping)
                        if field_name and pd.notna(row[col]):
                            update_data[field_name] = row[col]
                    if update_data:
                        if 'id' in update_data and update_data['id']:
                            carrier, created = Carrier.objects.update_or_create(
                                id=update_data['id'],
                                defaults=update_data
                            )
                        else:
                            carrier = Carrier.objects.create(**update_data)
                        processed_count += 1
                except Exception as e:
                    error_count += 1
                    errors.append(f"Ошибка в строке {idx + 2}: {str(e)}")
            return Response({
                'message': f'Импорт завершен. Обработано записей: {processed_count}',
                'errors': errors if errors else None,
                'error_count': error_count
            })
        except Exception as e:
            logger.error(f"Ошибка при импорте перевозчиков из Excel: {str(e)}")
            return Response({
                'error': str(e),
                'details': 'Проверьте формат файла и названия столбцов'
            }, status=500)

class UserSettingsViewSet(viewsets.ModelViewSet):
    queryset = UserSettings.objects.all()
    serializer_class = UserSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def get_object(self):
        settings, created = UserSettings.objects.get_or_create(user=self.request.user)
        return settings

    @action(detail=False, methods=['get'])
    def get_settings(self, request):
        settings, created = UserSettings.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(settings)
        return Response(serializer.data)

    @action(detail=False, methods=['put'])
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
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.role == 'manager':
            return CalendarTask.objects.all()
        return CalendarTask.objects.filter(order__client__contacts__email=user.email).distinct()

    def perform_create(self, serializer):
        serializer.save()

class UserProfileEmailSettingsView(generics.RetrieveUpdateAPIView):
    """
    Представление для получения и обновления настроек почты текущего пользователя.
    Использует PUT для полного обновления или PATCH для частичного.
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileEmailSettingsSerializer
    permission_classes = [permissions.IsAuthenticated] # Только для аутентифицированных пользователей

    def get_object(self):
        """ Возвращает профиль текущего пользователя, создавая его при необходимости."""
        # Сигналы должны были создать профиль, но get_or_create надежнее.
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

def _get_error_response(error_info: Optional[Tuple[str, str]]) -> Response:
    """Формирует Response с нужным статусом на основе типа ошибки."""
    if not error_info:
        # На всякий случай, если ошибка не передана
        return Response({"error": "Произошла неизвестная ошибка."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    error_type, error_message = error_info
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR # По умолчанию 500

    if error_type == ERR_TYPE_CONFIG:
        status_code = status.HTTP_400_BAD_REQUEST # Ошибка конфигурации пользователя
    elif error_type == ERR_TYPE_AUTHENTICATION:
        status_code = status.HTTP_401_UNAUTHORIZED # Ошибка входа
    elif error_type == ERR_TYPE_CONNECTION:
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE # Ошибка подключения к серверу
    elif error_type == ERR_TYPE_MAILBOX:
        status_code = status.HTTP_404_NOT_FOUND # Ящик не найден
    elif error_type == ERR_TYPE_OPERATION:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR # Ошибка выполнения команды
    # ERR_TYPE_UNKNOWN остается 500

    return Response({"error": error_message, "error_type": error_type}, status=status_code)

class EmailMessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mailbox = request.query_params.get('mailbox', 'INBOX')
        logger.debug(f"API GET /email/messages/ вызван для {request.user.email}, mailbox: {mailbox}")
        
        # Получаем limit и offset с дефолтами и валидацией
        try:
            limit = int(request.query_params.get('limit', 20))
            if limit <= 0:
                limit = 20 # Если отрицательный или 0, ставим дефолт
        except (ValueError, TypeError):
            limit = 20
        try:
            offset = int(request.query_params.get('offset', 0))
            if offset < 0:
                offset = 0 # Если отрицательный, ставим 0
        except (ValueError, TypeError):
            offset = 0

        # Вызываем обновленную fetch_emails
        emails, error, total_count = fetch_emails(request.user, mailbox=mailbox, limit=limit, offset=offset)

        if error:
            error_type, error_message = error
            status_code = 500 
            if error_type == ERR_TYPE_CONFIG: status_code = 400
            elif error_type == ERR_TYPE_AUTHENTICATION: status_code = 401
            elif error_type == ERR_TYPE_MAILBOX: status_code = 404
            elif error_type == ERR_TYPE_CONNECTION: status_code = 503 # Service Unavailable
            logger.warning(f"Ошибка при получении писем для {request.user.email} (mailbox: {mailbox}): {error_type} - {error_message}")
            return Response({'error': error_message, 'error_type': error_type}, status=status_code)

        logger.info(f"Успешно получено {len(emails)} писем (total: {total_count}) для {request.user.email}, mailbox: {mailbox}")
        # Возвращаем данные в нужном формате для пагинации
        return Response({
            'emails': emails,
            'total_count': total_count
        })

class EmailMessageSendView(APIView):
    """Представление для отправки письма от имени текущего пользователя."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        to_email = request.data.get('to')
        subject = request.data.get('subject')
        content = request.data.get('content')
        documents = request.data.getlist('documents[]')  # Получаем список ID документов

        if not all([to_email, subject, content]):
            return Response({"error": "Поля 'to', 'subject', 'content' обязательны."}, status=status.HTTP_400_BAD_REQUEST)

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
        action = request.data.get('action')
        email_ids = request.data.get('email_ids')
        mailbox = request.data.get('mailbox', 'INBOX')

        if not action or not email_ids or not isinstance(email_ids, list):
            return Response({"error": "Параметры 'action' и 'email_ids' (список) обязательны."}, status=status.HTTP_400_BAD_REQUEST)

        # Возвращаем переменные для результата
        success = False
        error_info = None

        if action == 'mark_read':
            logger.info(f"Попытка пометить {email_ids} как прочитанные для {user.email}")
            # Возвращаем прямой вызов
            success, error_info = set_email_flags(user, email_ids=email_ids, flags=['\\Seen'], mailbox=mailbox, add=True)
        elif action == 'mark_unread':
            logger.info(f"Попытка пометить {email_ids} как непрочитанные для {user.email}")
             # Возвращаем прямой вызов
            success, error_info = set_email_flags(user, email_ids=email_ids, flags=['\\Seen'], mailbox=mailbox, add=False)
        elif action == 'delete':
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
        table_name = self.request.query_params.get('table', None)
        if table_name:
            return TableHighlight.objects.filter(user=user, table_name=table_name)
        return TableHighlight.objects.filter(user=user)

    @action(detail=False, methods=['post'], url_path='save')
    def save_highlights(self, request, *args, **kwargs):
        """Массовое сохранение/удаление выделений."""
        user = request.user
        data = request.data
        results = {'created': 0, 'updated': 0, 'deleted': 0, 'errors': []}

        if not isinstance(data, list):
            return Response({'detail': 'Ожидался список объектов.'}, status=status.HTTP_400_BAD_REQUEST)

        for item in data:
            table_name = item.get('table_name')
            row_id = item.get('row_id')
            column_id = item.get('column_id')
            color = item.get('color') # color может быть null или '' для удаления

            if not all([table_name, row_id is not None, column_id]):
                results['errors'].append({'item': item, 'error': 'Отсутствуют обязательные поля (table_name, row_id, column_id).'})
                continue

            try:
                # Пытаемся найти существующий объект
                highlight, created = TableHighlight.objects.update_or_create(
                    user=user,
                    table_name=table_name,
                    row_id=row_id,
                    column_id=column_id,
                    defaults={'color': color if color else None} # Сохраняем null если color пустой
                )
                
                # Если цвет null или пустой и объект не был только что создан - удаляем его
                if not color and not created:
                    highlight.delete()
                    results['deleted'] += 1
                elif created:
                    results['created'] += 1
                else:
                    results['updated'] += 1

            except Exception as e:
                results['errors'].append({'item': item, 'error': str(e)})

        if results['errors']:
             return Response(results, status=status.HTTP_400_BAD_REQUEST)
        return Response(results, status=status.HTTP_200_OK)

    # Переопределяем create/update/destroy, чтобы они не использовались напрямую
    # или добавляем логику для установки user=request.user
    def perform_create(self, serializer):
         serializer.save(user=self.request.user)

    # Методы list, retrieve, update, partial_update, destroy будут работать
    # но get_queryset уже отфильтровал по пользователю.