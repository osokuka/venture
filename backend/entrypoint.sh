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

# Copy and resize logo file for email templates (if not already present or if too large)
echo "Checking for logo file..."
LOGO_SIZE=$(stat -f%z "/app/static/logos/ventureuplink.png" 2>/dev/null || stat -c%s "/app/static/logos/ventureuplink.png" 2>/dev/null || echo "0")
MAX_LOGO_SIZE=500000  # 500KB - if larger, re-process to resize

if [ ! -f "/app/static/logos/ventureuplink.png" ] || [ "$LOGO_SIZE" -gt "$MAX_LOGO_SIZE" ]; then
    if [ "$LOGO_SIZE" -gt "$MAX_LOGO_SIZE" ]; then
        echo "Logo file is too large (${LOGO_SIZE} bytes), re-processing to resize..."
    else
        echo "Logo not found, attempting to copy/download and resize..."
    fi
    python manage.py copy_logo || echo "Warning: Could not copy logo, emails will use URL fallback"
else
    echo "Logo file already exists and is optimized (${LOGO_SIZE} bytes)."
fi

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

echo "Starting server..."
exec "$@"
