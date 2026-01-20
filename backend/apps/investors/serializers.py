"""
Serializers for investors app.
"""
from rest_framework import serializers
from django.core.validators import URLValidator, EmailValidator
from django.core.exceptions import ValidationError
from .models import InvestorProfile
from apps.accounts.models import User


class InvestorProfileSerializer(serializers.ModelSerializer):
    """Serializer for InvestorProfile model (read operations)."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = InvestorProfile
        fields = (
            'id', 'user', 'user_email', 'user_name', 'full_name', 'organization_name',
            'linkedin_or_website', 'website', 'linkedin_url', 'email', 'phone',
            'investor_type', 'bio', 'investment_experience', 'investment_philosophy',
            'notable_investments', 'address', 'investment_experience_years', 'deals_count',
            'stage_preferences', 'industry_preferences', 'geographic_focus',
            'average_ticket_size', 'min_investment', 'max_investment',
            'visible_to_ventures', 'allow_direct_contact', 'status',
            'submitted_at', 'approved_at', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'user', 'submitted_at', 'approved_at', 'created_at', 'updated_at'
        )


class InvestorProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating an investor profile."""
    
    class Meta:
        model = InvestorProfile
        fields = (
            'full_name', 'organization_name', 'linkedin_or_website', 'website', 'linkedin_url',
            'email', 'phone', 'investor_type', 'bio', 'investment_experience',
            'investment_philosophy', 'notable_investments', 'address',
            'investment_experience_years', 'deals_count', 'stage_preferences',
            'industry_preferences', 'geographic_focus', 'average_ticket_size',
            'min_investment', 'max_investment', 'visible_to_ventures', 'allow_direct_contact'
        )
    
    def validate_full_name(self, value):
        """Security: Validate and sanitize full name."""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Full name is required.")
        if len(value) > 255:
            raise serializers.ValidationError("Full name must be 255 characters or less.")
        return value.strip()
    
    def validate_organization_name(self, value):
        """Security: Validate organization name."""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Organization name is required.")
        if len(value) > 255:
            raise serializers.ValidationError("Organization name must be 255 characters or less.")
        return value.strip()
    
    def validate_linkedin_or_website(self, value):
        """Security: Validate URL format (legacy field, optional if website/linkedin_url provided)."""
        if value:
            if len(value) > 2048:
                raise serializers.ValidationError("URL must be 2048 characters or less.")
            validator = URLValidator()
            try:
                validator(value)
            except ValidationError:
                raise serializers.ValidationError("Please enter a valid URL.")
            return value.strip()
        return value
    
    def validate_website(self, value):
        """Security: Validate website URL format."""
        if value:
            if len(value) > 2048:
                raise serializers.ValidationError("Website URL must be 2048 characters or less.")
            validator = URLValidator()
            try:
                validator(value)
            except ValidationError:
                raise serializers.ValidationError("Please enter a valid website URL.")
            return value.strip()
        return value
    
    def validate_linkedin_url(self, value):
        """Security: Validate LinkedIn URL format."""
        if value:
            if len(value) > 2048:
                raise serializers.ValidationError("LinkedIn URL must be 2048 characters or less.")
            validator = URLValidator()
            try:
                validator(value)
            except ValidationError:
                raise serializers.ValidationError("Please enter a valid LinkedIn URL.")
            return value.strip()
        return value
    
    def validate_investor_type(self, value):
        """Security: Validate investor type."""
        if value:
            valid_types = ['INDIVIDUAL', 'FIRM', 'CORPORATE', 'FAMILY_OFFICE']
            if value not in valid_types:
                raise serializers.ValidationError(f"Investor type must be one of: {', '.join(valid_types)}")
        return value
    
    def validate_geographic_focus(self, value):
        """Security: Validate geographic focus is a list with reasonable size."""
        if value:
            if not isinstance(value, list):
                raise serializers.ValidationError("geographic_focus must be a list.")
            if len(value) > 20:
                raise serializers.ValidationError("Cannot select more than 20 geographic regions.")
            # Validate each item is a string
            for item in value:
                if not isinstance(item, str):
                    raise serializers.ValidationError("All geographic focus items must be strings.")
                if len(item) > 100:
                    raise serializers.ValidationError("Geographic focus items must be 100 characters or less.")
        return value
    
    def validate_investment_philosophy(self, value):
        """Security: Validate investment philosophy length."""
        if value:
            if len(value) > 5000:
                raise serializers.ValidationError("Investment philosophy must be 5,000 characters or less.")
        return value.strip() if value else value
    
    def validate_notable_investments(self, value):
        """Security: Validate notable investments length."""
        if value:
            if len(value) > 5000:
                raise serializers.ValidationError("Notable investments must be 5,000 characters or less.")
        return value.strip() if value else value
    
    def validate_min_investment(self, value):
        """Security: Validate min investment format."""
        if value:
            if len(value) > 50:
                raise serializers.ValidationError("Minimum investment must be 50 characters or less.")
        return value.strip() if value else value
    
    def validate_max_investment(self, value):
        """Security: Validate max investment format."""
        if value:
            if len(value) > 50:
                raise serializers.ValidationError("Maximum investment must be 50 characters or less.")
        return value.strip() if value else value
    
    def validate(self, attrs):
        """Ensure at least one URL field is provided (website, linkedin_url, or linkedin_or_website)."""
        website = attrs.get('website')
        linkedin_url = attrs.get('linkedin_url')
        linkedin_or_website = attrs.get('linkedin_or_website')
        
        # If this is an update, check instance values
        if self.instance:
            website = website if 'website' in attrs else self.instance.website
            linkedin_url = linkedin_url if 'linkedin_url' in attrs else self.instance.linkedin_url
            linkedin_or_website = linkedin_or_website if 'linkedin_or_website' in attrs else self.instance.linkedin_or_website
        
        # At least one URL must be provided
        if not website and not linkedin_url and not linkedin_or_website:
            raise serializers.ValidationError(
                "At least one URL is required: website, linkedin_url, or linkedin_or_website."
            )
        
        return attrs
    
    def validate_email(self, value):
        """Security: Validate email format."""
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
    
    def validate_investment_experience_years(self, value):
        """Security: Validate experience years."""
        if value < 0:
            raise serializers.ValidationError("Experience years cannot be negative.")
        if value > 100:
            raise serializers.ValidationError("Experience years must be 100 or less.")
        return value
    
    def validate_deals_count(self, value):
        """Security: Validate deals count."""
        if value is not None:
            if value < 0:
                raise serializers.ValidationError("Deals count cannot be negative.")
            if value > 10000:
                raise serializers.ValidationError("Deals count must be 10,000 or less.")
        return value
    
    def validate_stage_preferences(self, value):
        """Security: Validate stage preferences is a list with reasonable size."""
        if not isinstance(value, list):
            raise serializers.ValidationError("stage_preferences must be a list.")
        if len(value) > 50:
            raise serializers.ValidationError("Cannot select more than 50 stage preferences.")
        # Validate each item is a string
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError("All stage preferences must be strings.")
            if len(item) > 100:
                raise serializers.ValidationError("Stage preference items must be 100 characters or less.")
        return value
    
    def validate_industry_preferences(self, value):
        """Security: Validate industry preferences is a list with reasonable size."""
        if not isinstance(value, list):
            raise serializers.ValidationError("industry_preferences must be a list.")
        if len(value) > 50:
            raise serializers.ValidationError("Cannot select more than 50 industry preferences.")
        # Validate each item is a string
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError("All industry preferences must be strings.")
            if len(item) > 100:
                raise serializers.ValidationError("Industry preference items must be 100 characters or less.")
        return value
    
    def validate_bio(self, value):
        """Security: Validate bio length."""
        if value:
            if len(value) > 5000:
                raise serializers.ValidationError("Bio must be 5,000 characters or less.")
        return value.strip() if value else value
    
    def validate_investment_experience(self, value):
        """Security: Validate investment experience length."""
        if value:
            if len(value) > 5000:
                raise serializers.ValidationError("Investment experience must be 5,000 characters or less.")
        return value.strip() if value else value
    
    def validate_address(self, value):
        """Security: Validate address length."""
        if value:
            if len(value) > 255:
                raise serializers.ValidationError("Address must be 255 characters or less.")
        return value.strip() if value else value
    
    def validate_average_ticket_size(self, value):
        """Security: Validate ticket size."""
        if not value:
            raise serializers.ValidationError("Average ticket size is required.")
        if len(value) > 50:
            raise serializers.ValidationError("Average ticket size must be 50 characters or less.")
        return value.strip()
    
    def create(self, validated_data):
        """Create investor profile and associate with user."""
        validated_data['user'] = self.context['request'].user
        validated_data['status'] = 'DRAFT'
        return super().create(validated_data)


class InvestorProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating an investor profile."""
    
    class Meta:
        model = InvestorProfile
        fields = (
            'full_name', 'organization_name', 'linkedin_or_website', 'website', 'linkedin_url',
            'email', 'phone', 'investor_type', 'bio', 'investment_experience',
            'investment_philosophy', 'notable_investments', 'address',
            'investment_experience_years', 'deals_count', 'stage_preferences',
            'industry_preferences', 'geographic_focus', 'average_ticket_size',
            'min_investment', 'max_investment', 'visible_to_ventures', 'allow_direct_contact'
        )
    
    def validate(self, attrs):
        """Validate that profile can be updated and ensure at least one URL field."""
        instance = self.instance
        
        # Allow updates if profile is in DRAFT, REJECTED, or SUBMITTED status
        # SUBMITTED is allowed so users can fix issues before admin approval
        # APPROVED profiles cannot be updated (must be rejected first)
        if instance.status not in ['DRAFT', 'REJECTED', 'SUBMITTED']:
            raise serializers.ValidationError(
                f"Cannot update profile with status '{instance.status}'. "
                "Only DRAFT, REJECTED, or SUBMITTED profiles can be updated."
            )
        
        # Ensure at least one URL field is provided
        website = attrs.get('website')
        linkedin_url = attrs.get('linkedin_url')
        linkedin_or_website = attrs.get('linkedin_or_website')
        
        # Check instance values for fields not being updated
        if instance:
            website = website if 'website' in attrs else (instance.website if hasattr(instance, 'website') else None)
            linkedin_url = linkedin_url if 'linkedin_url' in attrs else (instance.linkedin_url if hasattr(instance, 'linkedin_url') else None)
            linkedin_or_website = linkedin_or_website if 'linkedin_or_website' in attrs else (instance.linkedin_or_website if hasattr(instance, 'linkedin_or_website') else None)
        
        # At least one URL must be provided
        if not website and not linkedin_url and not linkedin_or_website:
            raise serializers.ValidationError(
                "At least one URL is required: website, linkedin_url, or linkedin_or_website."
            )
        
        return attrs
    
    def validate_stage_preferences(self, value):
        """Validate stage preferences is a list."""
        if not isinstance(value, list):
            raise serializers.ValidationError("stage_preferences must be a list.")
        return value
    
    def validate_industry_preferences(self, value):
        """Validate industry preferences is a list."""
        if not isinstance(value, list):
            raise serializers.ValidationError("industry_preferences must be a list.")
        return value
