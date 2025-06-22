from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from .models import Request
from .serializers import RequestSerializer, RequestCreateSerializer
from rest_framework.permissions import IsAdminUser, AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import logging
from .permissions import IsAdminOrReadOnly

logger = logging.getLogger(__name__)

# Дополнительное разрешение: допускает пользователей с role == 'admin'
class IsAdminOrRoleAdmin(IsAdminUser):
    """Разрешает доступ стaff-пользователям ИЛИ тем, у кого role == 'admin'."""

    def has_permission(self, request, view):
        is_staff = super().has_permission(request, view)
        is_role_admin = bool(request.user and getattr(request.user, 'role', None) == 'admin')
        return is_staff or is_role_admin

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def submit_feedback(request):
    """
    API endpoint для приема заявок с формы обратной связи
    """
    try:
        # Создаем заявку
        serializer = RequestCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            logger.info(f"New feedback request created from {request.data.get('source_domain', 'unknown')}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"Invalid feedback data: {serializer.errors}")
            return Response({
                'status': 'error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error processing feedback: {str(e)}")
        return Response({
            'status': 'error',
            'message': 'Внутренняя ошибка сервера'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class RequestViewSet(viewsets.ModelViewSet):
    queryset = Request.objects.all().order_by('-created_at')
    serializer_class = RequestSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrReadOnly()]
        return [IsAdminOrRoleAdmin()]

    def get_serializer_class(self):
        if self.action == 'create':
            return RequestCreateSerializer
        return RequestSerializer

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def process(self, request, pk=None):
        request_obj = self.get_object()
        request_obj.status = 'in_progress'
        request_obj.processed_by = request.user
        request_obj.save()
        return Response({'status': 'request processed'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def complete(self, request, pk=None):
        request_obj = self.get_object()
        request_obj.status = 'completed'
        request_obj.save()
        return Response({'status': 'request completed'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        request_obj = self.get_object()
        request_obj.status = 'rejected'
        request_obj.save()
        return Response({'status': 'request rejected'}) 