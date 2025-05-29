from rest_framework import serializers
from .models import CustomUser, Order, Client, Cargo, Vehicle, Task, Document, Payment, Invoice, Notification, ClientContact, Carrier, CarrierContact, UserSettings, CalendarTask, UserProfile, TableHighlight
import logging
from django.utils import timezone
from .encryption_utils import encrypt_data # Импортируем функцию шифрования
import re
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import authenticate

logger = logging.getLogger(__name__)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
        allow_blank=False,
        allow_null=False
    )
    password = serializers.CharField(
        style={'input_type': 'password'},
        trim_whitespace=False,
        required=True,
        allow_blank=False
    )
    remember_me = serializers.BooleanField(required=False, default=False)

    def validate(self, data):
        logger.info(f"Incoming login data: {data}")
        logger.info(f"Request data: {self.context.get('request').data}")
        
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            # Проверяем существование пользователя
            from .models import CustomUser
            try:
                user = CustomUser.objects.get(email=email)
                logger.info(f"User found: {user.email}")
            except CustomUser.DoesNotExist:
                logger.warning(f"No user found with email: {email}")
                raise serializers.ValidationError('Пользователь не найден')
            
            # Проверяем пароль
            if not user.check_password(password):
                logger.warning(f"Invalid password for user: {email}")
                raise serializers.ValidationError('Неверный email или пароль')
            
            if not user.is_active:
                logger.warning(f"Inactive user: {email}")
                raise serializers.ValidationError('Аккаунт заблокирован')
            
            data['user'] = user
        else:
            logger.warning("Email and password are required")
            raise serializers.ValidationError('Email и пароль обязательны')
        
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'role', 'username', 'first_name', 'last_name', 'password')
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'email': {'required': True},
            'role': {'required': True}
        }

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required")
        if CustomUser.objects.filter(email=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("User with this email already exists")
        return value

    def validate_role(self, value):
        valid_roles = ['admin', 'manager', 'client']
        if value not in valid_roles:
            raise serializers.ValidationError(f"Invalid role. Must be one of: {', '.join(valid_roles)}")
        return value

    def create(self, validated_data):
        try:
            password = validated_data.pop('password', None)
            if not password:
                raise serializers.ValidationError("Password is required for new users")
            user = super().create(validated_data)
            user.set_password(password)
            user.save()
            return user
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise serializers.ValidationError(f"Error creating user: {str(e)}")

    def update(self, instance, validated_data):
        try:
            password = validated_data.pop('password', None)
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            if password:
                instance.set_password(password)
            instance.save()
            return instance
        except Exception as e:
            logger.error(f"Error updating user: {str(e)}")
            raise serializers.ValidationError(f"Error updating user: {str(e)}")

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = None  # Будет установлено в дочерних классах
        fields = ['id', 'contact_type', 'name', 'phone', 'email', 'skype', 'telegram']

class ClientContactSerializer(ContactSerializer):
    class Meta(ContactSerializer.Meta):
        model = ClientContact

class CarrierContactSerializer(ContactSerializer):
    class Meta(ContactSerializer.Meta):
        model = CarrierContact

class ClientSerializer(serializers.ModelSerializer):
    contacts = ClientContactSerializer(many=True, required=False)
    has_active_order = serializers.BooleanField(read_only=True)

    class Meta:
        model = Client
        fields = [
            'id', 'company_name', 'has_active_order', 'business_scope', 'address', 'bank_details',
            'unp', 'unn', 'okpo', 'comments', 'contacts', 'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')

    def create(self, validated_data):
        contacts_data = validated_data.pop('contacts', [])
        client = Client.objects.create(**validated_data)
        
        for contact_data in contacts_data:
            ClientContact.objects.create(client=client, **contact_data)
        
        return client

    def update(self, instance, validated_data):
        contacts_data = validated_data.pop('contacts', [])
        
        # Обновляем основные поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Обновляем контакты
        if contacts_data:
            # Удаляем старые контакты
            instance.contacts.all().delete()
            
            # Создаем новые контакты
            for contact_data in contacts_data:
                ClientContact.objects.create(client=instance, **contact_data)
        
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Группируем контакты по типу
        contacts = representation.pop('contacts', [])
        representation['contacts'] = {
            'manager': [c for c in contacts if c['contact_type'] == 'manager'],
            'director': [c for c in contacts if c['contact_type'] == 'director']
        }
        return representation

class ClientListSerializer(serializers.ModelSerializer):
    has_active_order = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Client
        fields = ['id', 'company_name', 'has_active_order', 'comments']

class OrderSerializer(serializers.ModelSerializer):
    client = serializers.SerializerMethodField()
    client_id = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        source='client',
        write_only=True,
        required=False,
        allow_null=True
    )
    carrier = serializers.SerializerMethodField()
    carrier_id = serializers.PrimaryKeyRelatedField(
        queryset=Carrier.objects.all(),
        source='carrier',
        write_only=True,
        required=False,
        allow_null=True
    )
    carrier_details = serializers.SerializerMethodField()
    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'client', 'client_id', 'carrier', 'carrier_id',
            'carrier_details', 'status', 'loading_date', 'loading_address', 
            'unloading_address', 'transport_type', 'contract_number', 
            'total_price', 'created_at', 'shipper', 'destination', 
            'payment_status', 'updated_at', 'created_by', 'updated_by',
            'status_display', 'payment_status_display'
        ]
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')

    def get_client(self, obj):
        if obj.client:
            return {
                'id': obj.client.id,
                'company_name': obj.client.company_name
            }
        return None

    def get_carrier(self, obj):
        if obj.carrier:
            return {
                'id': obj.carrier.id,
                'company_name': obj.carrier.company_name
            }
        return None

    def get_carrier_details(self, obj):
        if obj.carrier:
            return {
                'id': obj.carrier.id,
                'company_name': obj.carrier.company_name,
                'working_directions': obj.carrier.working_directions,
                'location': obj.carrier.location,
                'fleet': obj.carrier.fleet,
                'vehicle_number': obj.carrier.vehicle_number,
                'contacts': [
                    {
                        'name': contact.name,
                        'phone': contact.phone,
                        'email': contact.email,
                        'contact_type': contact.contact_type
                    }
                    for contact in obj.carrier.contacts.all()
                ]
            }
        return None

    def validate(self, data):
        if data.get('loading_date') and data.get('delivery_deadline'):
            if data['loading_date'] > data['delivery_deadline']:
                raise serializers.ValidationError(
                    "Дата погрузки не может быть позже срока доставки"
                )

        if not data.get('loading_address') and data.get('client'):
            client = data['client']
            if hasattr(client, 'address') and client.address:
                data['loading_address'] = client.address

        return data

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Добавляем информацию о клиенте
        if instance.client:
            representation['client'] = {
                'id': instance.client.id,
                'company_name': instance.client.company_name
            }
        
        # Добавляем информацию о перевозчике
        if instance.carrier:
            representation['carrier'] = {
                'id': instance.carrier.id,
                'company_name': instance.carrier.company_name
            }
        
        return representation

class CargoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cargo
        fields = '__all__'

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'
        
# serializers.py
class TaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        source='assignee',
        write_only=True
    )
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'start', 'end', 'assignee', 'assignee_id', 'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        if data.get('start') and data.get('end') and data['start'] > data['end']:
            raise serializers.ValidationError("Дата окончания не может быть раньше начала")
        return data

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'name', 'document_type', 'file', 'created_at', 'order']
        # Удаляем валидацию is_signed
        
# serializers.py
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'order', 'amount', 'method', 'payment_date']
        read_only_fields = ('payment_date',)


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['id', 'client', 'order', 'total', 'issued_date', 'due_date', 'is_paid']
        read_only_fields = ('issued_date',)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'notification_type', 'sent_at', 'is_read', 'related_order']

class CarrierSerializer(serializers.ModelSerializer):
    contacts = CarrierContactSerializer(many=True, required=False)

    class Meta:
        model = Carrier
        fields = [
            'id', 'company_name', 'working_directions', 'location', 'fleet',
            'contacts', 'comments', 'known_rates', 'vehicle_number',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')

    def create(self, validated_data):
        contacts_data = validated_data.pop('contacts', [])
        carrier = Carrier.objects.create(**validated_data)
        
        for contact_data in contacts_data:
            CarrierContact.objects.create(carrier=carrier, **contact_data)
        
        return carrier

    def update(self, instance, validated_data):
        contacts_data = validated_data.pop('contacts', [])
        
        # Обновляем основные поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Обновляем контакты
        if contacts_data:
            # Удаляем старые контакты
            instance.contacts.all().delete()
            
            # Создаем новые контакты
            for contact_data in contacts_data:
                CarrierContact.objects.create(carrier=instance, **contact_data)
        
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Получаем контакты из базы данных
        contacts = instance.contacts.all()
        
        # Создаем структуру для контактов
        representation['contacts'] = {
            'manager': [],
            'director': []
        }
        
        # Заполняем контакты по типам
        for contact in contacts:
            contact_data = {
                'id': contact.id,
                'name': contact.name,
                'phone': contact.phone,
                'email': contact.email,
                'skype': contact.skype,
                'telegram': contact.telegram
            }
            
            if contact.contact_type == 'manager':
                representation['contacts']['manager'].append(contact_data)
            elif contact.contact_type == 'director':
                representation['contacts']['director'].append(contact_data)
        
        return representation

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'role')
        read_only_fields = ('email', 'role')
        extra_kwargs = {
            'username': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False}
        }

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required")
        if CustomUser.objects.filter(email=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("User with this email already exists")
        return value

class CalendarTaskSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        source='assignee',
        write_only=True,
        required=False
    )
    order = OrderSerializer(read_only=True)
    
    class Meta:
        model = CalendarTask
        fields = [
            'id', 'title', 'description', 'deadline', 'priority', 
            'type', 'order', 'created_by', 'assignee', 'assignee_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def validate(self, data):
        if data.get('deadline') and data['deadline'] < timezone.now():
            raise serializers.ValidationError("Срок выполнения не может быть в прошлом")
        return data

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ('id', 'user', 'theme_settings', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

class UserProfileEmailSettingsSerializer(serializers.ModelSerializer):
    # Добавляем поля для приема паролей в открытом виде от фронтенда.
    # Они будут использоваться только для записи (write_only=True)
    # и не будут включены в ответ.
    imap_password = serializers.CharField(write_only=True, required=False, allow_blank=True, style={'input_type': 'password'})
    smtp_password = serializers.CharField(write_only=True, required=False, allow_blank=True, style={'input_type': 'password'})

    class Meta:
        model = UserProfile
        # Указываем поля модели, которые будут сериализоваться.
        # НЕ включаем сюда *_password_encrypted для чтения!
        fields = [
            'email_integration_enabled',
            'imap_host', 'imap_port', 'imap_user',
            'smtp_host', 'smtp_port', 'smtp_user',
            # Поля только для записи:
            'imap_password', 'smtp_password'
        ]
        # Мы не хотим отправлять зашифрованные пароли обратно на фронтенд
        read_only_fields = []
        # Поля для паролей не должны требоваться при чтении или частичном обновлении
        extra_kwargs = {
            'imap_host': {'required': False, 'allow_blank': True, 'allow_null': True},
            'imap_port': {'required': False, 'allow_null': True},
            'imap_user': {'required': False, 'allow_blank': True, 'allow_null': True},
            'smtp_host': {'required': False, 'allow_blank': True, 'allow_null': True},
            'smtp_port': {'required': False, 'allow_null': True},
            'smtp_user': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def update(self, instance, validated_data):
        # Перехватываем пароли из validated_data, если они были переданы
        imap_plain_password = validated_data.pop('imap_password', None)
        smtp_plain_password = validated_data.pop('smtp_password', None)

        # Шифруем и сохраняем пароли, если они были предоставлены
        if imap_plain_password is not None:
            if imap_plain_password: # Шифруем, только если пароль не пустой
                encrypted = encrypt_data(imap_plain_password)
                if encrypted:
                    instance.imap_password_encrypted = encrypted
                else:
                    # Обработка ошибки шифрования (можно выбросить исключение)
                    raise serializers.ValidationError("Ошибка шифрования IMAP пароля.")
            else: # Если передан пустой пароль, очищаем сохраненный
                 instance.imap_password_encrypted = None

        if smtp_plain_password is not None:
            if smtp_plain_password:
                encrypted = encrypt_data(smtp_plain_password)
                if encrypted:
                    instance.smtp_password_encrypted = encrypted
                else:
                     raise serializers.ValidationError("Ошибка шифрования SMTP пароля.")
            else:
                 instance.smtp_password_encrypted = None

        # Обновляем остальные поля стандартным образом
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        """ Переопределяем, чтобы точно не вернуть пароли """
        ret = super().to_representation(instance)
        # Удаляем поля паролей из представления для безопасности
        ret.pop('imap_password', None)
        ret.pop('smtp_password', None)
        return ret

class TableHighlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableHighlight
        fields = ('id', 'user', 'table_name', 'row_id', 'column_id', 'color', 'updated_at')
        read_only_fields = ('id', 'user', 'updated_at') # Пользователь будет устанавливаться автоматически

    def validate(self, data):
        # Убедимся, что color либо null, либо корректный hex-like цвет
        color = data.get('color')
        if color is not None and not re.match(r'^#[0-9a-fA-F]{6}$', color):
             if color != '' : # Допускаем пустую строку как null
                 raise serializers.ValidationError({"color": _("Неверный формат цвета. Используйте #RRGGBB или оставьте пустым.")})
        return data

    # Добавляем validate_row_id и validate_column_id при необходимости