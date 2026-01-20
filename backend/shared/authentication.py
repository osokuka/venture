"""
Custom authentication classes for Django REST Framework.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.utils.translation import gettext_lazy as _


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads tokens from httpOnly cookies.
    Falls back to Authorization header for backward compatibility.
    
    Security: httpOnly cookies prevent XSS attacks from stealing tokens.
    
    Important: Returns None (not raises exception) when no token is found.
    This allows AllowAny permission classes to work correctly.
    """
    
    def authenticate(self, request):
        """
        Authenticate user by reading JWT token from cookie or Authorization header.
        
        Priority:
        1. Cookie (httpOnly, more secure)
        2. Authorization header (backward compatibility)
        
        Returns None if no valid token is found (allows AllowAny to work).
        """
        # Try to get token from cookie first (more secure)
        raw_token = request.COOKIES.get('access_token')
        if raw_token:
            try:
                # Validate token from cookie
                validated_token = self.get_validated_token(raw_token)
                return self.get_user(validated_token), validated_token
            except (InvalidToken, TokenError):
                # Cookie token invalid, fall through to header check
                pass
        
        # Fall back to Authorization header (backward compatibility)
        # Important: Catch exceptions and return None to allow AllowAny to work
        try:
            return super().authenticate(request)
        except (InvalidToken, TokenError):
            # No valid token found - return None to allow AllowAny permission
            return None
