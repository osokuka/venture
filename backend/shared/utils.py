"""
Shared utility functions.
"""
import uuid
import secrets
from django.utils import timezone
from datetime import timedelta


def generate_verification_token():
    """
    Generate a secure random token for email verification.
    """
    return secrets.token_urlsafe(32)


def generate_uuid():
    """
    Generate a UUID4 string.
    """
    return str(uuid.uuid4())


def get_token_expiry(hours=24):
    """
    Get expiry datetime for tokens (default 24 hours).
    """
    return timezone.now() + timedelta(hours=hours)


def validate_file_type(file, allowed_types=None):
    """
    Validate file MIME type.
    
    Args:
        file: Uploaded file object
        allowed_types: List of allowed MIME types (e.g., ['application/pdf'])
    
    Returns:
        bool: True if file type is allowed
    """
    if allowed_types is None:
        allowed_types = ['application/pdf']
    
    return file.content_type in allowed_types


def validate_file_size(file, max_size_mb=10):
    """
    Validate file size.
    
    Args:
        file: Uploaded file object
        max_size_mb: Maximum file size in MB
    
    Returns:
        bool: True if file size is within limit
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    return file.size <= max_size_bytes
