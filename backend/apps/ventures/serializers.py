"""
Serializers for ventures app.
"""
from rest_framework import serializers
from django.core.validators import URLValidator, EmailValidator
from django.core.exceptions import ValidationError
from .models import (
    VentureProduct, VentureProfile, Founder, TeamMember, VentureNeed, VentureDocument,
    PitchDeckAccess, PitchDeckAccessEvent, PitchDeckRequest, PitchDeckShare
)
from apps.accounts.models import User


class FounderSerializer(serializers.ModelSerializer):
    """Serializer for Founder model."""
    
    class Meta:
        model = Founder
        fields = ('id', 'full_name', 'linkedin_url', 'email', 'phone', 'role_title')
        read_only_fields = ('id',)
    
    def validate_full_name(self, value):
        """Security: Validate and sanitize full name."""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Full name is required.")
        if len(value) > 255:
            raise serializers.ValidationError("Full name must be 255 characters or less.")
        return value.strip()
    
    def validate_linkedin_url(self, value):
        """Security: Validate URL format."""
        if not value:
            raise serializers.ValidationError("LinkedIn URL is required.")
        if len(value) > 2048:
            raise serializers.ValidationError("URL must be 2048 characters or less.")
        validator = URLValidator()
        try:
            validator(value)
        except ValidationError:
            raise serializers.ValidationError("Please enter a valid LinkedIn URL.")
        return value.strip()
    
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
            cleaned = ''.join(c for c in value if c.isdigit() or c in '+()- ')
            if len(cleaned) > 20:
                raise serializers.ValidationError("Phone number must be 20 characters or less.")
            if not any(c.isdigit() for c in cleaned):
                raise serializers.ValidationError("Phone number must contain digits.")
        return value.strip() if value else value
    
    def validate_role_title(self, value):
        """Security: Validate role title length."""
        if value and len(value) > 100:
            raise serializers.ValidationError("Role title must be 100 characters or less.")
        return value.strip() if value else value


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
    
    def validate_problem_statement(self, value):
        """Security: Validate problem statement length."""
        if value and len(value) > 10000:
            raise serializers.ValidationError("Problem statement must be 10,000 characters or less.")
        return value.strip() if value else value
    
    def validate_solution_description(self, value):
        """Security: Validate solution description length."""
        if value and len(value) > 10000:
            raise serializers.ValidationError("Solution description must be 10,000 characters or less.")
        return value.strip() if value else value
    
    def validate_target_market(self, value):
        """Security: Validate target market length."""
        if value and len(value) > 10000:
            raise serializers.ValidationError("Target market must be 10,000 characters or less.")
        return value.strip() if value else value
    
    def validate_traction_metrics(self, value):
        """Security: Validate traction_metrics is valid JSON and reasonable size."""
        if value is not None:
            if isinstance(value, dict):
                # Limit number of keys to prevent DoS
                if len(value) > 50:
                    raise serializers.ValidationError("Traction metrics cannot have more than 50 fields.")
                # Validate each value is a string or number
                for key, val in value.items():
                    if not isinstance(key, str):
                        raise serializers.ValidationError("All traction metric keys must be strings.")
                    if len(str(key)) > 100:
                        raise serializers.ValidationError("Traction metric keys must be 100 characters or less.")
                    if not isinstance(val, (str, int, float, bool, type(None))):
                        raise serializers.ValidationError("Traction metric values must be strings, numbers, booleans, or null.")
                    if isinstance(val, str) and len(val) > 1000:
                        raise serializers.ValidationError("Traction metric string values must be 1,000 characters or less.")
            elif isinstance(value, list):
                if len(value) > 100:
                    raise serializers.ValidationError("Traction metrics list cannot have more than 100 items.")
            else:
                raise serializers.ValidationError("Traction metrics must be a dictionary or list.")
        return value
    
    def validate_funding_amount(self, value):
        """Security: Validate funding amount length."""
        if value and len(value) > 50:
            raise serializers.ValidationError("Funding amount must be 50 characters or less.")
        return value.strip() if value else value
    
    def validate_funding_stage(self, value):
        """Security: Validate funding stage is from allowed choices."""
        if value:
            allowed_stages = ['PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'GROWTH']
            if value not in allowed_stages:
                raise serializers.ValidationError(f"Funding stage must be one of: {', '.join(allowed_stages)}.")
        return value
    
    def validate_use_of_funds(self, value):
        """Security: Validate use of funds length."""
        if value and len(value) > 10000:
            raise serializers.ValidationError("Use of funds must be 10,000 characters or less.")
        return value.strip() if value else value


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
            'id', 'name', 'industry_sector', 'website', 'linkedin_url', 'address',
            'year_founded', 'employees_count', 'short_description',
            'status', 'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'status', 'is_active', 'created_at', 'updated_at')
    
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
        """
        Create product and return it with full details including ID.
        """
        # User is automatically set by the view
        product = VentureProduct.objects.create(**validated_data)
        return product
    
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
    
    def validate_name(self, value):
        """Security: Validate and sanitize product name."""
        if value:
            if len(value.strip()) == 0:
                raise serializers.ValidationError("Product name cannot be empty.")
            if len(value) > 255:
                raise serializers.ValidationError("Product name must be 255 characters or less.")
            return value.strip()
        return value
    
    def validate_industry_sector(self, value):
        """Security: Validate industry sector."""
        if value:
            if len(value.strip()) == 0:
                raise serializers.ValidationError("Industry sector cannot be empty.")
            if len(value) > 100:
                raise serializers.ValidationError("Industry sector must be 100 characters or less.")
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
    
    def validate_address(self, value):
        """Security: Validate address length."""
        if value and len(value) > 500:
            raise serializers.ValidationError("Address must be 500 characters or less.")
        return value.strip() if value else value
    
    def validate_year_founded(self, value):
        """Security: Validate year founded is reasonable."""
        if value is not None:
            if value < 1800:
                raise serializers.ValidationError("Year founded cannot be before 1800.")
            if value > 2100:
                raise serializers.ValidationError("Year founded cannot be after 2100.")
        return value
    
    def validate_employees_count(self, value):
        """Security: Validate employees count is reasonable."""
        if value is not None:
            if value < 0:
                raise serializers.ValidationError("Employees count cannot be negative.")
            if value > 1000000:
                raise serializers.ValidationError("Employees count must be 1,000,000 or less.")
        return value
    
    def validate_short_description(self, value):
        """Security: Validate short description length."""
        if value:
            if len(value.strip()) == 0:
                raise serializers.ValidationError("Short description cannot be empty.")
            if len(value) > 10000:
                raise serializers.ValidationError("Short description must be 10,000 characters or less.")
            return value.strip()
        return value
    
    def validate(self, attrs):
        """Security: Validate that product can be updated."""
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


class PitchDeckAccessSerializer(serializers.ModelSerializer):
    """Serializer for PitchDeckAccess model."""
    investor_email = serializers.EmailField(source='investor.email', read_only=True)
    investor_name = serializers.CharField(source='investor.full_name', read_only=True)
    granted_by_email = serializers.EmailField(source='granted_by.email', read_only=True)
    document_name = serializers.CharField(source='document.product.name', read_only=True)
    
    class Meta:
        model = PitchDeckAccess
        fields = (
            'id', 'document', 'investor', 'investor_email', 'investor_name',
            'granted_by', 'granted_by_email', 'granted_at', 'revoked_at',
            'is_active', 'document_name'
        )
        read_only_fields = ('id', 'granted_at', 'granted_by')


class PitchDeckAccessEventSerializer(serializers.ModelSerializer):
    """Serializer for PitchDeckAccessEvent model."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    document_name = serializers.CharField(source='document.product.name', read_only=True)
    
    class Meta:
        model = PitchDeckAccessEvent
        fields = (
            'id', 'document', 'document_name', 'user', 'user_email', 'user_name',
            'event_type', 'accessed_at', 'ip_address', 'user_agent'
        )
        read_only_fields = ('id', 'accessed_at')


class PitchDeckRequestSerializer(serializers.ModelSerializer):
    """Serializer for PitchDeckRequest model."""
    investor_email = serializers.EmailField(source='investor.email', read_only=True)
    investor_name = serializers.CharField(source='investor.full_name', read_only=True)
    document_name = serializers.CharField(source='document.product.name', read_only=True)
    responded_by_email = serializers.EmailField(source='responded_by.email', read_only=True)
    
    class Meta:
        model = PitchDeckRequest
        fields = (
            'id', 'document', 'document_name', 'investor', 'investor_email', 'investor_name',
            'status', 'message', 'requested_at', 'responded_at', 'responded_by',
            'responded_by_email', 'response_message'
        )
        read_only_fields = ('id', 'requested_at', 'responded_at', 'responded_by')


class PitchDeckRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a pitch deck request."""
    
    class Meta:
        model = PitchDeckRequest
        fields = ('document', 'message')
    
    def validate_message(self, value):
        """Security: Validate message length."""
        if value and len(value) > 2000:
            raise serializers.ValidationError("Message must be 2,000 characters or less.")
        return value.strip() if value else value


class PitchDeckShareSerializer(serializers.ModelSerializer):
    """Serializer for PitchDeckShare model."""
    investor_email = serializers.EmailField(source='investor.email', read_only=True)
    investor_name = serializers.CharField(source='investor.full_name', read_only=True)
    shared_by_email = serializers.EmailField(source='shared_by.email', read_only=True)
    shared_by_name = serializers.CharField(source='shared_by.full_name', read_only=True)
    document_name = serializers.CharField(source='document.product.name', read_only=True)
    
    class Meta:
        model = PitchDeckShare
        fields = (
            'id', 'document', 'document_name', 'investor', 'investor_email', 'investor_name',
            'shared_by', 'shared_by_email', 'shared_by_name', 'message', 'shared_at', 'viewed_at'
        )
        read_only_fields = ('id', 'shared_at', 'viewed_at', 'shared_by')


class PitchDeckShareCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a pitch deck share."""
    
    class Meta:
        model = PitchDeckShare
        fields = ('document', 'investor', 'message')
    
    def validate_message(self, value):
        """Security: Validate message length."""
        if value and len(value) > 2000:
            raise serializers.ValidationError("Message must be 2,000 characters or less.")
        return value.strip() if value else value
    
    def validate_investor(self, value):
        """Security: Validate investor is actually an investor."""
        if value.role != 'INVESTOR':
            raise serializers.ValidationError("Can only share pitch decks with investors.")
        return value


class VentureProfileSerializer(serializers.ModelSerializer):
    """Serializer for VentureProfile model (read operations)."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    logo_url_display = serializers.SerializerMethodField()
    
    class Meta:
        model = VentureProfile
        fields = (
            'id', 'user', 'user_email', 'user_name',
            'company_name', 'sector', 'short_description',
            'website', 'linkedin_url', 'address',
            'year_founded', 'employees_count',
            'founder_name', 'founder_linkedin', 'founder_role',
            'customers', 'key_metrics', 'needs',
            'phone', 'logo', 'logo_url', 'logo_url_display',
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'user', 'created_at', 'updated_at'
        )
    
    def get_logo_url_display(self, obj):
        """Return logo URL (from ImageField or logo_url field)."""
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return obj.logo_url


class VentureProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a venture profile."""
    
    class Meta:
        model = VentureProfile
        fields = (
            'company_name', 'sector', 'short_description',
            'website', 'linkedin_url', 'address',
            'year_founded', 'employees_count',
            'founder_name', 'founder_linkedin', 'founder_role',
            'customers', 'key_metrics', 'needs',
            'phone', 'logo', 'logo_url'
        )
    
    def validate_company_name(self, value):
        """Security: Validate and sanitize company name."""
        if value:
            if len(value.strip()) == 0:
                raise serializers.ValidationError("Company name cannot be empty.")
            if len(value) > 255:
                raise serializers.ValidationError("Company name must be 255 characters or less.")
            return value.strip()
        return value
    
    def validate_sector(self, value):
        """Security: Validate sector."""
        if value:
            if len(value.strip()) == 0:
                raise serializers.ValidationError("Sector cannot be empty.")
            if len(value) > 100:
                raise serializers.ValidationError("Sector must be 100 characters or less.")
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
    
    def validate_founder_linkedin(self, value):
        """Security: Validate founder LinkedIn URL format."""
        if value:
            if len(value) > 2048:
                raise serializers.ValidationError("Founder LinkedIn URL must be 2048 characters or less.")
            validator = URLValidator()
            try:
                validator(value)
            except ValidationError:
                raise serializers.ValidationError("Please enter a valid LinkedIn URL.")
            return value.strip()
        return value
    
    def validate_phone(self, value):
        """Security: Validate phone number format."""
        if value:
            cleaned = ''.join(c for c in value if c.isdigit() or c in '+()- ')
            if len(cleaned) > 20:
                raise serializers.ValidationError("Phone number must be 20 characters or less.")
            if not any(c.isdigit() for c in cleaned):
                raise serializers.ValidationError("Phone number must contain digits.")
        return value.strip() if value else value
    
    def validate_year_founded(self, value):
        """Security: Validate year founded is reasonable."""
        if value is not None:
            if value < 1800:
                raise serializers.ValidationError("Year founded cannot be before 1800.")
            if value > 2100:
                raise serializers.ValidationError("Year founded cannot be after 2100.")
        return value
    
    def validate_employees_count(self, value):
        """Security: Validate employees count is reasonable."""
        if value is not None:
            if value < 0:
                raise serializers.ValidationError("Employees count cannot be negative.")
            if value > 1000000:
                raise serializers.ValidationError("Employees count must be 1,000,000 or less.")
        return value
    
    def validate_short_description(self, value):
        """Security: Validate short description length."""
        if value:
            if len(value.strip()) == 0:
                raise serializers.ValidationError("Short description cannot be empty.")
            if len(value) > 10000:
                raise serializers.ValidationError("Short description must be 10,000 characters or less.")
            return value.strip()
        return value
    
    def validate_customers(self, value):
        """Security: Validate customers field length."""
        if value:
            if len(value) > 5000:
                raise serializers.ValidationError("Customers field must be 5,000 characters or less.")
            return value.strip()
        return value
    
    def validate_key_metrics(self, value):
        """Security: Validate key metrics field length."""
        if value:
            if len(value) > 5000:
                raise serializers.ValidationError("Key metrics field must be 5,000 characters or less.")
            return value.strip()
        return value
    
    def validate_needs(self, value):
        """Security: Validate needs JSON structure."""
        if value is not None:
            if isinstance(value, list):
                if len(value) > 50:
                    raise serializers.ValidationError("Needs list cannot have more than 50 items.")
                for item in value:
                    if not isinstance(item, str):
                        raise serializers.ValidationError("All needs items must be strings.")
                    if len(item) > 100:
                        raise serializers.ValidationError("Each need item must be 100 characters or less.")
            elif isinstance(value, dict):
                if len(value) > 50:
                    raise serializers.ValidationError("Needs dictionary cannot have more than 50 keys.")
            else:
                raise serializers.ValidationError("Needs must be a list or dictionary.")
        return value
    
    def create(self, validated_data):
        """Create profile and associate with user."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class VentureProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a venture profile."""
    
    class Meta:
        model = VentureProfile
        fields = (
            'company_name', 'sector', 'short_description',
            'website', 'linkedin_url', 'address',
            'year_founded', 'employees_count',
            'founder_name', 'founder_linkedin', 'founder_role',
            'customers', 'key_metrics', 'needs',
            'phone', 'logo', 'logo_url'
        )
    
    def validate_company_name(self, value):
        """Security: Validate and sanitize company name."""
        if value:
            if len(value.strip()) == 0:
                raise serializers.ValidationError("Company name cannot be empty.")
            if len(value) > 255:
                raise serializers.ValidationError("Company name must be 255 characters or less.")
            return value.strip()
        return value
    
    def validate_sector(self, value):
        """Security: Validate sector."""
        if value:
            if len(value.strip()) == 0:
                raise serializers.ValidationError("Sector cannot be empty.")
            if len(value) > 100:
                raise serializers.ValidationError("Sector must be 100 characters or less.")
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
    
    def validate_founder_linkedin(self, value):
        """Security: Validate founder LinkedIn URL format."""
        if value:
            if len(value) > 2048:
                raise serializers.ValidationError("Founder LinkedIn URL must be 2048 characters or less.")
            validator = URLValidator()
            try:
                validator(value)
            except ValidationError:
                raise serializers.ValidationError("Please enter a valid LinkedIn URL.")
            return value.strip()
        return value
    
    def validate_phone(self, value):
        """Security: Validate phone number format."""
        if value:
            cleaned = ''.join(c for c in value if c.isdigit() or c in '+()- ')
            if len(cleaned) > 20:
                raise serializers.ValidationError("Phone number must be 20 characters or less.")
            if not any(c.isdigit() for c in cleaned):
                raise serializers.ValidationError("Phone number must contain digits.")
        return value.strip() if value else value
    
    def validate_year_founded(self, value):
        """Security: Validate year founded is reasonable."""
        if value is not None:
            if value < 1800:
                raise serializers.ValidationError("Year founded cannot be before 1800.")
            if value > 2100:
                raise serializers.ValidationError("Year founded cannot be after 2100.")
        return value
    
    def validate_employees_count(self, value):
        """Security: Validate employees count is reasonable."""
        if value is not None:
            if value < 0:
                raise serializers.ValidationError("Employees count cannot be negative.")
            if value > 1000000:
                raise serializers.ValidationError("Employees count must be 1,000,000 or less.")
        return value
    
    def validate_short_description(self, value):
        """Security: Validate short description length."""
        if value:
            if len(value.strip()) == 0:
                raise serializers.ValidationError("Short description cannot be empty.")
            if len(value) > 10000:
                raise serializers.ValidationError("Short description must be 10,000 characters or less.")
            return value.strip()
        return value
    
    def validate_customers(self, value):
        """Security: Validate customers field length."""
        if value:
            if len(value) > 5000:
                raise serializers.ValidationError("Customers field must be 5,000 characters or less.")
            return value.strip()
        return value
    
    def validate_key_metrics(self, value):
        """Security: Validate key metrics field length."""
        if value:
            if len(value) > 5000:
                raise serializers.ValidationError("Key metrics field must be 5,000 characters or less.")
            return value.strip()
        return value
    
    def validate_needs(self, value):
        """Security: Validate needs JSON structure."""
        if value is not None:
            if isinstance(value, list):
                if len(value) > 50:
                    raise serializers.ValidationError("Needs list cannot have more than 50 items.")
                for item in value:
                    if not isinstance(item, str):
                        raise serializers.ValidationError("All needs items must be strings.")
                    if len(item) > 100:
                        raise serializers.ValidationError("Each need item must be 100 characters or less.")
            elif isinstance(value, dict):
                if len(value) > 50:
                    raise serializers.ValidationError("Needs dictionary cannot have more than 50 keys.")
            else:
                raise serializers.ValidationError("Needs must be a list or dictionary.")
        return value
