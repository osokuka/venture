"""
Serializers for investors app.
"""
from rest_framework import serializers
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
            'linkedin_or_website', 'email', 'phone', 'investment_experience_years',
            'deals_count', 'stage_preferences', 'industry_preferences', 'average_ticket_size',
            'visible_to_ventures', 'status', 'submitted_at', 'approved_at',
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'user', 'submitted_at', 'approved_at', 'created_at', 'updated_at'
        )


class InvestorProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating an investor profile."""
    
    class Meta:
        model = InvestorProfile
        fields = (
            'full_name', 'organization_name', 'linkedin_or_website', 'email', 'phone',
            'investment_experience_years', 'deals_count', 'stage_preferences',
            'industry_preferences', 'average_ticket_size', 'visible_to_ventures'
        )
    
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
            'full_name', 'organization_name', 'linkedin_or_website', 'email', 'phone',
            'investment_experience_years', 'deals_count', 'stage_preferences',
            'industry_preferences', 'average_ticket_size', 'visible_to_ventures'
        )
    
    def validate(self, attrs):
        """Validate that profile can be updated."""
        instance = self.instance
        
        # Only allow updates if profile is in DRAFT or REJECTED status
        if instance.status not in ['DRAFT', 'REJECTED']:
            raise serializers.ValidationError(
                f"Cannot update profile with status '{instance.status}'. "
                "Only DRAFT or REJECTED profiles can be updated."
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
