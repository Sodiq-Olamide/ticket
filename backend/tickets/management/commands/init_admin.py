from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

class Command(BaseCommand):
    help = 'Create initial SuperAdmin user'

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.environ.get('ADMIN_USERNAME', 'admin')
        email = os.environ.get('ADMIN_EMAIL', 'admin@fmcabuja.gov.ng')
        password = os.environ.get('ADMIN_PASSWORD', 'admin')

        if not User.objects.filter(username=username).exists():
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            # Explicitly set the custom role
            user.role = 'SUPERADMIN'
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Successfully created SuperAdmin: {username}'))
        else:
            self.stdout.write(self.style.WARNING(f'SuperAdmin {username} already exists'))
