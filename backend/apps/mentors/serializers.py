"""
Serializers for mentors app.
"""
from rest_framework import serializers
from django.core.validators import URLValidator, EmailValidator
from django.core.exceptions import ValidationError
from decimal import Decimal, InvalidOperation
from .models import MentorProfile


class MentorProfileSerializer(serializers.ModelSerializer):
    """Serializer for MentorProfile (public view)."""
    user = serializers.UUIDField(source='user.id', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = MentorProfile
        fields = (
            'id', 'user', 'user_email', 'user_name', 'full_name', 'job_title', 'company',
            'linkedin_or_website', 'contact_email', 'phone', 'expertise_fields',
            'experience_overview', 'industries_of_interest', 'engagement_type',
            'paid_rate_type', 'paid_rate_amount', 'availability_types',
            'preferred_engagement', 'visible_to_ventures', 'status',
            'submitted_at', 'approved_at', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'user', 'user_email', 'user_name', 'submitted_at', 'approved_at',
            'created_at', 'updated_at'
        )


class MentorProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a mentor profile."""
    
    class Meta:
        model = MentorProfile
        fields = (
            'full_name', 'job_title', 'company', 'linkedin_or_website', 'contact_email',
            'phone', 'expertise_fields', 'experience_overview', 'industries_of_interest',
            'engagement_type', 'paid_rate_type', 'paid_rate_amount', 'availability_types',
            'preferred_engagement', 'visible_to_ventures'
        )
    
    def validate_full_name(self, value):
        """Security: Validate and sanitize full name."""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Full name is required.")
        if len(value) > 255:
            raise serializers.ValidationError("Full name must be 255 characters or less.")
        return value.strip()
    
    def validate_job_title(self, value):
        """Security: Validate job title."""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Job title is required.")
        if len(value) > 255:
            raise serializers.ValidationError("Job title must be 255 characters or less.")
        return value.strip()
    
    def validate_company(self, value):
        """Security: Validate company name."""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Company is required.")
        if len(value) > 255:
            raise serializers.ValidationError("Company must be 255 characters or less.")
        return value.strip()
    
    def validate_linkedin_or_website(self, value):
        """Security: Validate URL format."""
        if not value:
            raise serializers.ValidationError("LinkedIn or website URL is required.")
        if len(value) > 2048:
            raise serializers.ValidationError("URL must be 2048 characters or less.")
        validator = URLValidator()
        try:
            validator(value)
        except ValidationError:
            raise serializers.ValidationError("Please enter a valid URL.")
        return value.strip()
    
    def validate_contact_email(self, value):
        """Security: Validate email format."""
        if not value:
            raise serializers.ValidationError("Contact email is required.")
        if len(value) > 254:
            raise serializers.ValidationError("Email must be 254 characters or less.")
        validator = EmailValidator()
        try:
            validator(value)
        except ValidationError:
            raise serializers.ValidationError("Please enter a valid email address.")
        return value.strip().lower()
    
    def validate_phone(self, value):
        """Security: Validate phone number format."""
        if value:
            # Remove common phone number characters for validation
            cleaned = ''.join(c for c in value if c.isdigit() or c in '+()- ')
            if len(cleaned) > 20:
                raise serializers.ValidationError("Phone number must be 20 characters or less.")
            # Basic validation: should contain digits
            if not any(c.isdigit() for c in cleaned):
                raise serializers.ValidationError("Phone number must contain digits.")
        return value.strip() if value else value
    
    def validate_experience_overview(self, value):
        """Security: Validate experience overview length."""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Experience overview is required.")
        if len(value) > 10000:
            raise serializers.ValidationError("Experience overview must be 10,000 characters or less.")
        return value.strip()
    
    def validate_paid_rate_amount(self, value):
        """Security: Validate rate amount if provided."""
        if value is not None:
            try:
                rate = Decimal(str(value))
                if rate < 0:
                    raise serializers.ValidationError("Rate amount cannot be negative.")
                if rate > 1000000:
                    raise serializers.ValidationError("Rate amount must be $1,000,000 or less.")
            except (InvalidOperation, ValueError):
                raise serializers.ValidationError("Rate amount must be a valid number.")
        return value
    
    def validate_expertise_fields(self, value):
        """Security: Validate expertise_fields is a list with reasonable size."""
        if not isinstance(value, list):
            raise serializers.ValidationError("expertise_fields must be a list.")
        if len(value) > 50:
            raise serializers.ValidationError("Cannot select more than 50 expertise fields.")
        # Validate each item is a string
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError("All expertise fields must be strings.")
            if len(item) > 100:
                raise serializers.ValidationError("Expertise field items must be 100 characters or less.")
        return value
    
    def validate_industries_of_interest(self, value):
        """Security: Validate industries_of_interest is a list with reasonable size."""
        if not isinstance(value, list):
            raise serializers.ValidationError("industries_of_interest must be a list.")
        if len(value) > 50:
            raise serializers.ValidationError("Cannot select more than 50 industries.")
        # Validate each item is a string
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError("All industries must be strings.")
            if len(item) > 100:
                raise serializers.ValidationError("Industry items must be 100 characters or less.")
        return value
    
    def validate_availability_types(self, value):
        """Security: Validate availability_types is a list with reasonable size."""
        if not isinstance(value, list):
            raise serializers.ValidationError("availability_types must be a list.")
        if len(value) > 20:
            raise serializers.ValidationError("Cannot select more than 20 availability types.")
        # Validate each item is a string
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError("All availability types must be strings.")
            if len(item) > 100:
                raise serializers.ValidationError("Availability type items must be 100 characters or less.")
        return value
    
    def create(self, validated_data):
        """Create mentor profile and associate with user."""
        validated_data['user'] = self.context['request'].user
        validated_data['status'] = 'DRAFT'
        return super().create(validated_data)


class MentorProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a mentor profile."""
    
    class Meta:
        model = MentorProfile
        fields = (
            'full_name', 'job_title', 'company', 'linkedin_or_website', 'contact_email',
            'phone', 'expertise_fields', 'experience_overview', 'industries_of_interest',
            'engagement_type', 'paid_rate_type', 'paid_rate_amount', 'availability_types',
            'preferred_engagement', 'visible_to_ventures'
        )
    
    def validate(self, attrs):
        """Validate that profile can be updated."""
        instance = self.instance
        
        # Allow updates if profile is in DRAFT, REJECTED, or SUBMITTED status
        # SUBMITTED is allowed so users can fix issues before admin approval
        # APPROVED profiles cannot be updated (must be rejected first)
        if instance.status not in ['DRAFT', 'REJECTED', 'SUBMITTED']:
            raise serializers.ValidationError(
                f"Cannot update profile with status '{instance.status}'. "
                "Only DRAFT, REJECTED, or SUBMITTED profiles can be updated."
            )
        
        return attrs
    
    def validate_expertise_fields(self, value):
        """Validate expertise_fields is a list."""
        if not isinstance(value, list):
            raise serializers.ValidationError("expertise_fields must be a list.")
        return value
    
    def validate_industries_of_interest(self, value):
        """Validate industries_of_interest is a list."""
        if not isinstance(value, list):
            raise serializers.ValidationError("industries_of_interest must be a list.")
        return value
    
    def validate_availability_types(self, value):
        """Validate availability_types is a list."""
        if not isinstance(value, list):
            raise serializers.ValidationError("availability_types must be a list.")
        return value
