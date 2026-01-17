"""
Development settings for VentureLink project.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'ventureuplink.com', 'backend.ventureuplink.com']

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

# CSRF Trusted Origins - Allow requests from these origins
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://ventureuplink.com',
    'https://ventureuplink.com',
    'http://www.ventureuplink.com',
    'https://www.ventureuplink.com',
    'http://backend.ventureuplink.com',
    'https://backend.ventureuplink.com',
]
