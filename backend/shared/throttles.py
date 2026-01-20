"""
Custom throttle classes for rate limiting.
"""
import json
from rest_framework.throttling import SimpleRateThrottle
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta


class PasswordResetRateThrottle(SimpleRateThrottle):
    """
    Custom throttle to limit password reset requests to 1 per hour per email address.
    This prevents abuse while allowing legitimate users to request resets.
    """
    scope = 'password_reset'
    
    def get_cache_key(self, request, view):
        """
        Generate cache key based on email address from request data.
        This ensures rate limiting is per-email, not per-IP.
        
        Security: Parses request body to get email, falls back to IP if unavailable.
        """
        email = None
        
        # Try to get email from parsed request data (if available)
        if hasattr(request, 'data') and request.data:
            email = request.data.get('email', '').strip().lower()
        
        # If not available, try parsing request body directly
        if not email and hasattr(request, 'body') and request.body:
            try:
                body_data = json.loads(request.body.decode('utf-8'))
                email = body_data.get('email', '').strip().lower()
            except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
                pass
        
        # If still no email, fall back to IP-based throttling
        if not email:
            ident = self.get_ident(request)
            return f'throttle_password_reset_{ident}'
        
        # Use email as identifier for rate limiting (normalized to lowercase)
        return f'throttle_password_reset_email_{email}'
    
    def get_rate(self):
        """
        Return the rate limit: 1 request per hour.
        """
        return '1/hour'


class EmailBasedRateThrottle(SimpleRateThrottle):
    """
    Generic throttle that limits by email address from request data.
    Useful for email-related endpoints.
    """
    scope = 'email_based'
    
    def get_cache_key(self, request, view):
        """
        Generate cache key based on email address from request data.
        """
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            ident = self.get_ident(request)
            return f'throttle_email_{ident}'
        
        return f'throttle_email_{email}'
    
    def get_rate(self):
        """
        Override in subclasses or set via scope.
        """
        return self.rate


class CurrentUserRateThrottle(SimpleRateThrottle):
    """
    Custom throttle for /api/auth/me endpoint.
    Allows more requests since this is a lightweight read-only endpoint
    that's frequently called to check authentication status.
    
    Rate: 1000 requests/hour for authenticated users (vs default 5000/hour, but this endpoint is called very frequently)
    This prevents legitimate users from hitting rate limits during normal usage.
    """
    scope = 'current_user'
    
    def get_cache_key(self, request, view):
        """
        Generate cache key based on authenticated user ID.
        """
        if request.user and request.user.is_authenticated:
            return f'throttle_current_user_{request.user.id}'
        # Fall back to IP for unauthenticated requests (shouldn't happen for /auth/me)
        ident = self.get_ident(request)
        return f'throttle_current_user_{ident}'
    
    def get_rate(self):
        """
        Return the rate limit: 1000 requests per hour for authenticated users.
        """
        return '1000/hour'
