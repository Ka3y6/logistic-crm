from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from .models import Request
from .serializers import RequestSerializer, RequestCreateSerializer
from users.permissions import IsAdminUser
from django.views.decorators.csrf import csrf_exempt
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def submit_feedback(request):
    """
    API endpoint для приема заявок с формы обратной связи
    """
    try:
        # Получаем домен источника из заголовка
        source_domain = request.META.get('HTTP_ORIGIN', 'unknown')
        
        # Создаем заявку
        serializer = RequestCreateSerializer(data={
            'name': request.data.get('name'),
            'phone': request.data.get('phone'),
            'email': request.data.get('email'),
            'comment': request.data.get('comment'),
            'source_domain': source_domain
        })
        
        if serializer.is_valid():
            serializer.save()
            logger.info(f"New feedback request created from {source_domain}")
            return Response({
                'status': 'success',
                'message': 'Заявка успешно отправлена'
            }, status=status.HTTP_201_CREATED)
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

class RequestViewSet(viewsets.ModelViewSet):
    queryset = Request.objects.all()
    serializer_class = RequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    def get_serializer_class(self):
        if self.action == 'create':
            return RequestCreateSerializer
        return RequestSerializer

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        request_obj = self.get_object()
        request_obj.status = 'in_progress'
        request_obj.processed_by = request.user
        request_obj.save()
        return Response({'status': 'request processed'})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        request_obj = self.get_object()
        request_obj.status = 'completed'
        request_obj.save()
        return Response({'status': 'request completed'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        request_obj = self.get_object()
        request_obj.status = 'rejected'
        request_obj.save()
        return Response({'status': 'request rejected'}) 