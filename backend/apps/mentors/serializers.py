"""
Serializers for mentors app.
"""
from rest_framework import serializers
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
