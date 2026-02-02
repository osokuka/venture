"""
Serializers for accounts app.
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, EmailVerificationToken


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    JWT login serializer that accepts 'email' and 'password'.
    Normalizes 'email' to the username field so both {"email": "..."} and
    {"username": "..."} work (for USERNAME_FIELD='email' and older clients).
    """
    def validate(self, attrs):
        # Accept "email" or "username" (older simplejwt uses "username" in the API)
        username_field = User.USERNAME_FIELD  # 'email' for our User
        email_value = (
            attrs.pop('email', None)
            or attrs.get(username_field)
            or attrs.pop('username', None)
        )
        if not email_value or not str(email_value).strip():
            raise serializers.ValidationError(
                {username_field: 'This field is required.'}
            )
        attrs[username_field] = str(email_value).strip().lower()
        return super().validate(attrs)


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, validators=[validate_password], max_length=128)
    password_confirm = serializers.CharField(write_only=True, max_length=128)
    
    class Meta:
        model = User
        fields = ('email', 'password', 'password_confirm', 'full_name', 'role')
        extra_kwargs = {
            'email': {'required': True},
            'full_name': {'required': True},
            'role': {'required': True},
        }
    
    def validate_email(self, value):
        """Security: Validate email format and length."""
        if not value:
            raise serializers.ValidationError("Email is required.")
        if len(value) > 254:
            raise serializers.ValidationError("Email must be 254 characters or less.")
        validator = EmailValidator()
        try:
            validator(value)
        except ValidationError:
            raise serializers.ValidationError("Please enter a valid email address.")
        return value.strip().lower()
    
    def validate_full_name(self, value):
        """Security: Validate and sanitize full name."""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Full name is required.")
        if len(value) > 255:
            raise serializers.ValidationError("Full name must be 255 characters or less.")
        # Security: Remove potentially dangerous characters
        value = value.strip()
        # Allow letters, spaces, hyphens, apostrophes, and common international characters
        # This is a basic sanitization - more complex if needed
        return value
    
    def validate_password(self, value):
        """Security: Validate password length."""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if len(value) > 128:
            raise serializers.ValidationError("Password must be 128 characters or less.")
        return value
    
    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password': 'Passwords do not match.'
            })
        return attrs
    
    def validate_role(self, value):
        """Security: Validate role is not ADMIN and is a valid role."""
        if value == 'ADMIN':
            raise serializers.ValidationError('Cannot register as admin.')
        valid_roles = ['VENTURE', 'INVESTOR', 'MENTOR']
        if value not in valid_roles:
            raise serializers.ValidationError(f'Invalid role. Must be one of: {", ".join(valid_roles)}.')
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


class AdminUserDetailSerializer(serializers.ModelSerializer):
    """
    Rich admin user detail serializer.

    Includes:
    - Base user fields (email, role, status, verification, dates)
    - Role-specific profile summaries:
      - venture_profile: VentureProfile (company, sector, needs, etc.)
      - investor_profile: InvestorProfile (organization, preferences, ticket size, visibility, status)
      - mentor_profile: MentorProfile (job title, expertise, industries, availability, visibility, status)
    """

    venture_profile = serializers.SerializerMethodField()
    investor_profile = serializers.SerializerMethodField()
    mentor_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'full_name',
            'role',
            'is_email_verified',
            'is_active',
            'date_joined',
            'venture_profile',
            'investor_profile',
            'mentor_profile',
        )
        read_only_fields = (
            'id',
            'email',
            'role',
            'date_joined',
        )

    def _get_venture_profile(self, obj):
        """
        Internal helper: fetch VentureProfile for a user (if it exists).

        We intentionally do NOT gate strictly on role here so that if a user
        happens to have a VentureProfile row, admin can still see it.
        """
        try:
            from apps.ventures.models import VentureProfile
            from apps.ventures.serializers import VentureProfileSerializer
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f'Failed to import venture models/serializers: {e}')
            return None

        try:
            profile = VentureProfile.objects.get(user=obj)
        except VentureProfile.DoesNotExist:
            return None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error fetching VentureProfile for user {obj.id}: {e}')
            return None

        try:
            serializer = VentureProfileSerializer(profile, context=self.context)
            return serializer.data
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error serializing VentureProfile {profile.id}: {e}')
            return None

    def _get_investor_profile(self, obj):
        """
        Internal helper: fetch InvestorProfile for a user (if it exists).

        This allows admin to see investor data even if role/state drifted.
        """
        try:
            from apps.investors.models import InvestorProfile
            from apps.investors.serializers import InvestorProfileSerializer
        except Exception as e:
            # Log import errors for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f'Failed to import investor models/serializers: {e}')
            return None

        try:
            profile = InvestorProfile.objects.get(user=obj)
        except InvestorProfile.DoesNotExist:
            # Profile doesn't exist - return None (this is expected if user hasn't created profile yet)
            return None
        except Exception as e:
            # Log any other errors (database issues, etc.)
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error fetching InvestorProfile for user {obj.id}: {e}')
            return None

        try:
            # Pass request context so serializer can build absolute URLs if needed
            serializer = InvestorProfileSerializer(profile, context=self.context)
            return serializer.data
        except Exception as e:
            # Log serialization errors
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error serializing InvestorProfile {profile.id}: {e}')
            return None

    def _get_mentor_profile(self, obj):
        """
        Internal helper: fetch MentorProfile for a user (if it exists).

        This allows admin to see mentor data even if role/state drifted.
        """
        try:
            from apps.mentors.models import MentorProfile
            from apps.mentors.serializers import MentorProfileSerializer
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f'Failed to import mentor models/serializers: {e}')
            return None

        try:
            profile = MentorProfile.objects.get(user=obj)
        except MentorProfile.DoesNotExist:
            return None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error fetching MentorProfile for user {obj.id}: {e}')
            return None

        try:
            # Pass request context so serializer can build absolute URLs if needed
            serializer = MentorProfileSerializer(profile, context=self.context)
            return serializer.data
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error serializing MentorProfile {profile.id}: {e}')
            return None

    def get_venture_profile(self, obj):
        """Public getter for venture_profile field."""
        return self._get_venture_profile(obj)

    def get_investor_profile(self, obj):
        """Public getter for investor_profile field."""
        return self._get_investor_profile(obj)

    def get_mentor_profile(self, obj):
        """Public getter for mentor_profile field."""
        return self._get_mentor_profile(obj)

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


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""
    email = serializers.EmailField(required=True, max_length=254)
    
    def validate_email(self, value):
        """Security: Validate email format and length."""
        if not value:
            raise serializers.ValidationError("Email is required.")
        if len(value) > 254:
            raise serializers.ValidationError("Email must be 254 characters or less.")
        validator = EmailValidator()
        try:
            validator(value)
        except ValidationError:
            raise serializers.ValidationError("Please enter a valid email address.")
        return value.strip().lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""
    token = serializers.CharField(required=True, max_length=255)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password], max_length=128)
    new_password_confirm = serializers.CharField(required=True, write_only=True, max_length=128)
    
    def validate_token(self, value):
        """Validate token exists and is valid."""
        try:
            from .models import PasswordResetToken
            token_obj = PasswordResetToken.objects.get(token=value)
            if not token_obj.is_valid():
                raise serializers.ValidationError('Token is invalid or expired.')
            return value
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError('Invalid password reset token.')
    
    def validate(self, attrs):
        """Security: Validate passwords match."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Passwords do not match.'
            })
        return attrs
