"""
Management command to create a superuser non-interactively.

Usage:
    python manage.py create_superuser
    python manage.py create_superuser --email admin@example.com --password admin123 --name "Admin User"
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a superuser non-interactively'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default=os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@venturelink.com'),
            help='Email address for the superuser'
        )
        parser.add_argument(
            '--password',
            type=str,
            default=os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123'),
            help='Password for the superuser'
        )
        parser.add_argument(
            '--name',
            type=str,
            default=os.environ.get('DJANGO_SUPERUSER_NAME', 'Admin User'),
            help='Full name for the superuser'
        )

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        name = options['name']

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'User with email {email} already exists.')
            )
            return

        # Create superuser
        try:
            user = User.objects.create_superuser(
                email=email,
                password=password,
                full_name=name,
                role='ADMIN'
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created superuser: {user.email}'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating superuser: {str(e)}')
            )
