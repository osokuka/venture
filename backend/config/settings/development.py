"""
Development settings for VentureLink project.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Add development-specific apps
INSTALLED_APPS += [
    'django_extensions',  # Useful for development
]

# Development-specific settings
CORS_ALLOW_ALL_ORIGINS = True  # Only for development

# Email backend for development (console)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Disable security features for development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
