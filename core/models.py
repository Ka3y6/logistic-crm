from django.db import models
from django.conf import settings

# ... (возможно, другие модели) ...

class Highlight(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='highlights')
    table_name = models.CharField(max_length=50, db_index=True) # e.g., 'orders', 'clients'
    row_id = models.PositiveIntegerField(db_index=True) # Assuming integer IDs for rows
    column_id = models.CharField(max_length=100, db_index=True) # e.g., 'status', 'clientName'
    color = models.CharField(max_length=20, null=True, blank=True) # e.g., '#FFFF00', null to clear

    class Meta:
        # Ensure only one highlight per user/table/cell combination
        unique_together = ('user', 'table_name', 'row_id', 'column_id')
        indexes = [
            models.Index(fields=['user', 'table_name']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.table_name}[{self.row_id}, {self.column_id}] = {self.color}"

# ... (возможно, другие модели) ... 