"""
Management command to create demo accounts for testing.
"""
from django.core.management.base import BaseCommand
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Create demo accounts for testing'

    def add_arguments(self, parser):
        # Accept `--noinput` because `entrypoint.sh` calls it; we intentionally ignore it.
        parser.add_argument(
            '--noinput',
            action='store_true',
            help='Ignored (kept for compatibility with Docker entrypoint).',
        )

    def handle(self, *args, **options):
        demo_accounts = [
            # Ventures
            {
                'email': 'sarah@techflow.ai',
                'password': 'demo123',
                'full_name': 'Sarah Chen',
                'role': 'VENTURE',
            },
            {
                'email': 'marcus@greenspace.co',
                'password': 'demo123',
                'full_name': 'Marcus Rodriguez',
                'role': 'VENTURE',
            },
            {
                'email': 'lisa@healthbridge.com',
                'password': 'demo123',
                'full_name': 'Dr. Lisa Park',
                'role': 'VENTURE',
            },
            {
                'email': 'david@fintech-solutions.io',
                'password': 'demo123',
                'full_name': 'David Kim',
                'role': 'VENTURE',
            },
            # Investors
            {
                'email': 'sarah.chen@techventures.com',
                'password': 'demo123',
                'full_name': 'Sarah Chen',
                'role': 'INVESTOR',
            },
            {
                'email': 'marcus@greentech-ventures.com',
                'password': 'demo123',
                'full_name': 'Marcus Rodriguez',
                'role': 'INVESTOR',
            },
            {
                'email': 'lisa@innovation-angels.com',
                'password': 'demo123',
                'full_name': 'Dr. Lisa Park',
                'role': 'INVESTOR',
            },
            # Mentors
            {
                'email': 'james@stripe.com',
                'password': 'demo123',
                'full_name': 'James Wilson',
                'role': 'MENTOR',
            },
            {
                'email': 'sarah@startupmentor.io',
                'password': 'demo123',
                'full_name': 'Sarah Johnson',
                'role': 'MENTOR',
            },
        ]

        created_count = 0
        skipped_count = 0

        for account in demo_accounts:
            email = account['email']
            if User.objects.filter(email=email).exists():
                self.stdout.write(
                    self.style.WARNING(f'Account {email} already exists. Skipping.')
                )
                skipped_count += 1
            else:
                user = User.objects.create_user(
                    email=email,
                    password=account['password'],
                    full_name=account['full_name'],
                    role=account['role'],
                    is_email_verified=True,  # Auto-verify demo accounts
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Created demo account: {email} ({account["role"]})')
                )
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nDemo accounts creation complete!\n'
                f'Created: {created_count}\n'
                f'Skipped: {skipped_count}\n'
                f'Total: {created_count + skipped_count}'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                '\nAll demo accounts use password: demo123'
            )
        )
