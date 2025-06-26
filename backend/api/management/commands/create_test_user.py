from api.models import CustomUser
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Creates a test user"

    def handle(self, *args, **options):
        user = CustomUser.objects.create_user(
            username="test", email="test@test.com", password="testpass123", role="user"
        )
        self.stdout.write(f"User {user.username} created!")
