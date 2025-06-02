from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Highlight
from .serializers import HighlightSerializer
from django.db import transaction

# ... (возможно, другие импорты и view) ...

class HighlightListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        table_name = request.query_params.get('table', None)
        if not table_name:
            return Response({'error': 'Query parameter "table" is required'}, status=status.HTTP_400_BAD_REQUEST)

        highlights = Highlight.objects.filter(user=request.user, table_name=table_name)
        serializer = HighlightSerializer(highlights, many=True) 
        return Response(serializer.data)

class HighlightSaveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        if not isinstance(data, list):
            return Response({'error': 'Expected a list of highlight objects'}, status=status.HTTP_400_BAD_REQUEST)

        results = {'created': 0, 'updated': 0, 'deleted': 0, 'errors': 0}
        
        try:
            with transaction.atomic():
                for item in data:
                    table_name = item.get('table_name')
                    row_id = item.get('row_id')
                    column_id = item.get('column_id')
                    color = item.get('color')

                    if not all([table_name, row_id is not None, column_id]):
                         results['errors'] += 1
                         continue

                    defaults = {'color': color}
                    
                    if color:
                         obj, created = Highlight.objects.update_or_create(
                            user=request.user,
                            table_name=table_name,
                            row_id=row_id,
                            column_id=column_id,
                            defaults=defaults
                         )
                         if created:
                             results['created'] += 1
                         else:
                             results['updated'] += 1
                    else:
                        deleted_count, _ = Highlight.objects.filter(
                            user=request.user,
                            table_name=table_name,
                            row_id=row_id,
                            column_id=column_id
                        ).delete()
                        if deleted_count > 0:
                            results['deleted'] += deleted_count
                            
        except Exception as e:
            print(f"Error saving highlights: {e}")
            return Response({'error': 'An internal error occurred during saving highlights.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if results['errors'] > 0:
             return Response({
                 'message': f'Processed with {results["errors"]} errors.', 
                 'details': results
             }, status=status.HTTP_400_BAD_REQUEST)
        else:
             return Response({
                 'message': 'Highlights saved successfully.', 
                 'details': results
             }, status=status.HTTP_200_OK)

# ... (возможно, другие view) ... 