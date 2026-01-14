#!/bin/bash
set -e

echo "Waiting for database..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "Database is ready!"

echo "Creating migrations if needed..."
python manage.py makemigrations --noinput || true

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

# Create superuser if it doesn't exist (non-interactive)
echo "Checking for superuser..."
python manage.py shell << EOF
from apps.accounts.models import User
import os

admin_email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@ventureuplink.com')
admin_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')

if not User.objects.filter(email=admin_email).exists():
    print(f"Creating superuser: {admin_email}")
    User.objects.create_superuser(
        email=admin_email,
        password=admin_password,
        full_name='Admin User',
        role='ADMIN'
    )
    print("Superuser created successfully!")
else:
    print(f"Superuser {admin_email} already exists.")
EOF

# Create demo accounts if they don't exist
echo "Creating demo accounts..."
python manage.py create_demo_accounts --noinput || true

echo "Starting server..."
exec "$@"
