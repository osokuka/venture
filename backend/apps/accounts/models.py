"""
User and authentication models.
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from shared.utils import generate_verification_token, get_token_expiry


class UserManager(BaseUserManager):
    """Custom user manager."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser."""
        extra_fields.setdefault('role', 'ADMIN')
        extra_fields.setdefault('is_email_verified', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model with role-based access.
    """
    ROLE_CHOICES = [
        ('VENTURE', 'Venture'),
        ('INVESTOR', 'Investor'),
        ('MENTOR', 'Mentor'),
        ('ADMIN', 'Admin'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_email_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name', 'role']
    
    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.email} ({self.role})"


class EmailVerificationToken(models.Model):
    """
    Model for email verification tokens.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_tokens')
    token = models.CharField(max_length=255, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'email_verification_tokens'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Verification token for {self.user.email}"
    
    def is_valid(self):
        """Check if token is valid and not expired."""
        return (
            self.used_at is None and
            timezone.now() < self.expires_at
        )
    
    @classmethod
    def create_for_user(cls, user):
        """Create a new verification token for a user."""
        # Invalidate any existing unused tokens
        cls.objects.filter(user=user, used_at__isnull=True).update(used_at=timezone.now())
        
        token = generate_verification_token()
        expires_at = get_token_expiry(hours=24)
        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
