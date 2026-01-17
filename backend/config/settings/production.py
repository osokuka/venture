"""
Production settings for VentureLink project.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',')

# Security settings for production - TLS 1.3+ enforced
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Enhanced Session Security for Production
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'  # Stricter in production
SESSION_COOKIE_AGE = 3600  # 1 hour in production
SESSION_SAVE_EVERY_REQUEST = True  # Refresh session on each request
SESSION_EXPIRE_AT_BROWSER_CLOSE = True  # Expire on browser close

# CSRF Security
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'
CSRF_USE_SESSIONS = False

# CSRF Trusted Origins - Allow requests from these origins
# Can be set via environment variable CSRF_TRUSTED_ORIGINS (comma-separated)
CSRF_TRUSTED_ORIGINS = os.environ.get(
    'CSRF_TRUSTED_ORIGINS',
    'https://ventureuplink.com,https://www.ventureuplink.com,https://backend.ventureuplink.com'
).split(',')

# TLS 1.3+ Security Headers
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')  # For external nginx proxy

# Additional Security Headers
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin'

# CORS settings for production
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')

# Static files
STATIC_ROOT = os.environ.get('STATIC_ROOT', BASE_DIR / 'staticfiles')
MEDIA_ROOT = os.environ.get('MEDIA_ROOT', BASE_DIR / 'media')

# Database connection pooling
DATABASES['default']['CONN_MAX_AGE'] = 600

# Logging for production
LOGGING['handlers']['file'] = {
    'class': 'logging.handlers.RotatingFileHandler',
    'filename': os.environ.get('LOG_FILE', BASE_DIR / 'logs' / 'django.log'),
    'maxBytes': 1024 * 1024 * 10,  # 10MB
    'backupCount': 5,
    'formatter': 'verbose',
}

LOGGING['root']['handlers'] = ['console', 'file']
