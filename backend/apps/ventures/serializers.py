"""
Serializers for ventures app.
"""
from rest_framework import serializers
from .models import VentureProduct, Founder, TeamMember, VentureNeed, VentureDocument
from apps.accounts.models import User


class FounderSerializer(serializers.ModelSerializer):
    """Serializer for Founder model."""
    
    class Meta:
        model = Founder
        fields = ('id', 'full_name', 'linkedin_url', 'email', 'phone', 'role_title')
        read_only_fields = ('id',)


class TeamMemberSerializer(serializers.ModelSerializer):
    """Serializer for TeamMember model."""
    
    class Meta:
        model = TeamMember
        fields = ('id', 'name', 'role_title', 'description', 'linkedin_url')
        read_only_fields = ('id',)


class VentureNeedSerializer(serializers.ModelSerializer):
    """Serializer for VentureNeed model."""
    
    class Meta:
        model = VentureNeed
        fields = (
            'id', 'need_type', 'finance_size_range', 'finance_objectives',
            'target_markets', 'expertise_field', 'duration', 'other_notes'
        )
        read_only_fields = ('id',)


class VentureDocumentSerializer(serializers.ModelSerializer):
    """Serializer for VentureDocument model."""
    
    class Meta:
        model = VentureDocument
        fields = (
            'id', 'document_type', 'file', 'file_size', 'mime_type', 'uploaded_at',
            'problem_statement', 'solution_description', 'target_market', 'traction_metrics',
            'funding_amount', 'funding_stage', 'use_of_funds', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'file_size', 'mime_type', 'uploaded_at', 'created_at', 'updated_at')


class VentureDocumentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating a pitch deck with metadata."""
    
    class Meta:
        model = VentureDocument
        fields = (
            'file', 'problem_statement', 'solution_description', 'target_market',
            'traction_metrics', 'funding_amount', 'funding_stage', 'use_of_funds'
        )
        read_only_fields = ('file_size', 'mime_type')


class VentureProductSerializer(serializers.ModelSerializer):
    """
    Serializer for VentureProduct model.
    Used for listing and detail views.
    """
    founders = FounderSerializer(many=True, read_only=True)
    team_members = TeamMemberSerializer(many=True, read_only=True)
    needs = VentureNeedSerializer(many=True, read_only=True)
    documents = VentureDocumentSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = VentureProduct
        fields = (
            'id', 'user', 'user_email', 'user_name', 'name', 'industry_sector',
            'website', 'linkedin_url', 'address', 'year_founded', 'employees_count',
            'short_description', 'status', 'is_active',
            'submitted_at', 'approved_at', 'created_at', 'updated_at',
            'founders', 'team_members', 'needs', 'documents'
        )
        read_only_fields = (
            'id', 'user', 'submitted_at', 'approved_at', 'created_at', 'updated_at'
        )


class VentureProductCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new product.
    Validates 3-product limit.
    
    Note: problem_statement, solution_description, target_market, traction_metrics,
    funding_amount, funding_stage, and use_of_funds are now associated with
    each pitch deck document, not the product itself.
    """
    
    class Meta:
        model = VentureProduct
        fields = (
            'name', 'industry_sector', 'website', 'linkedin_url', 'address',
            'year_founded', 'employees_count', 'short_description'
        )
    
    def validate(self, attrs):
        """Validate that user hasn't reached product limit."""
        user = self.context['request'].user
        
        # Check product count
        product_count = VentureProduct.objects.filter(user=user).count()
        if product_count >= 3:
            raise serializers.ValidationError(
                "You have reached the maximum limit of 3 products. "
                "Please delete an existing product or contact support."
            )
        
        return attrs
    
    def create(self, validated_data):
        """Create product and associate with user."""
        validated_data['user'] = self.context['request'].user
        validated_data['status'] = 'DRAFT'
        validated_data['is_active'] = True
        return super().create(validated_data)


class VentureProductUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating a product.
    Only allows updates if product is in DRAFT or REJECTED status.
    
    Note: problem_statement, solution_description, target_market, traction_metrics,
    funding_amount, funding_stage, and use_of_funds are now associated with
    each pitch deck document, not the product itself.
    """
    
    class Meta:
        model = VentureProduct
        fields = (
            'name', 'industry_sector', 'website', 'linkedin_url', 'address',
            'year_founded', 'employees_count', 'short_description'
        )
    
    def validate(self, attrs):
        """Validate that product can be updated."""
        instance = self.instance
        
        if instance.status not in ['DRAFT', 'REJECTED']:
            raise serializers.ValidationError(
                f"Cannot update product with status '{instance.status}'. "
                "Only DRAFT or REJECTED products can be updated."
            )
        
        return attrs


class VentureProductActivateSerializer(serializers.ModelSerializer):
    """
    Serializer for activating/deactivating a product.
    Users can toggle is_active field.
    """
    
    class Meta:
        model = VentureProduct
        fields = ('is_active',)
    
    def validate_is_active(self, value):
        """Validate activation based on product status."""
        instance = self.instance
        
        # Only allow activation if product is approved
        if value and instance.status != 'APPROVED':
            raise serializers.ValidationError(
                "Only approved products can be activated. "
                f"Current status: {instance.status}"
            )
        
        return value
