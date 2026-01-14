"""
Serializers for accounts app.
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, EmailVerificationToken


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('email', 'password', 'password_confirm', 'full_name', 'role')
        extra_kwargs = {
            'email': {'required': True},
            'full_name': {'required': True},
            'role': {'required': True},
        }
    
    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password': 'Passwords do not match.'
            })
        return attrs
    
    def validate_role(self, value):
        """Validate role is not ADMIN."""
        if value == 'ADMIN':
            raise serializers.ValidationError('Cannot register as admin.')
        return value
    
    def create(self, validated_data):
        """Create user and verification token."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        
        # Create verification token
        EmailVerificationToken.create_for_user(user)
        
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details."""
    
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'role', 'is_email_verified', 'is_active', 'date_joined')
        read_only_fields = ('id', 'email', 'role', 'is_email_verified', 'date_joined')


class AdminUserUpsertSerializer(serializers.ModelSerializer):
    """
    Serializer for admin CRUD on users.

    Notes:
    - `password` is optional; if provided we set it using `set_password`.
    - We intentionally do NOT allow setting `is_staff` / `is_superuser` via API.
    """
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=False,
        validators=[validate_password],
    )

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'password',
            'full_name',
            'role',
            'is_email_verified',
            'is_active',
            'date_joined',
        )
        read_only_fields = ('id', 'date_joined')

    def validate_role(self, value):
        """
        Allow admins to create/update any role, but keep it explicit.
        """
        if value not in {'VENTURE', 'INVESTOR', 'MENTOR', 'ADMIN'}:
            raise serializers.ValidationError('Invalid role.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create_user(password=password or None, **validated_data)
        # If no password was provided, create_user(None) leaves unusable password;
        # that's acceptable for admin-created accounts if you want to force reset later.
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification."""
    token = serializers.CharField(required=True)
    
    def validate_token(self, value):
        """Validate token exists and is valid."""
        try:
            token_obj = EmailVerificationToken.objects.get(token=value)
            if not token_obj.is_valid():
                raise serializers.ValidationError('Token is invalid or expired.')
            return value
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError('Invalid verification token.')
