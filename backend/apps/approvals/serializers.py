"""
Enhanced serializers for approvals app with pitch deck information.
"""

from rest_framework import serializers
from apps.approvals.models import ReviewRequest


class ApprovalItemSerializer(serializers.ModelSerializer):
    """
    Enhanced serializer for ReviewRequest with pitch deck/product information.
    
    Shows pitch deck name prominently with venture user underneath.
    Includes all pitch deck details for admin review.
    """

    # User fields
    user_id = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    submitted_at = serializers.SerializerMethodField()
    
    # Product/pitch deck fields
    product_id = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    product_industry = serializers.SerializerMethodField()
    product_website = serializers.SerializerMethodField()
    product_short_description = serializers.SerializerMethodField()
    product_created_at = serializers.SerializerMethodField()
    
    # Pitch deck document fields
    pitch_deck_file_url = serializers.SerializerMethodField()
    pitch_deck_file_name = serializers.SerializerMethodField()
    pitch_deck_problem_statement = serializers.SerializerMethodField()
    pitch_deck_solution_description = serializers.SerializerMethodField()
    pitch_deck_target_market = serializers.SerializerMethodField()
    pitch_deck_funding_amount = serializers.SerializerMethodField()
    pitch_deck_funding_stage = serializers.SerializerMethodField()
    pitch_deck_traction_metrics = serializers.SerializerMethodField()
    pitch_deck_use_of_funds = serializers.SerializerMethodField()
    
    # Investor/Mentor profile fields (only populated for profile review requests)
    profile_id = serializers.SerializerMethodField()
    profile_type = serializers.SerializerMethodField()  # INVESTOR | MENTOR | null
    
    # Common
    profile_full_name = serializers.SerializerMethodField()
    profile_linkedin_or_website = serializers.SerializerMethodField()
    profile_phone = serializers.SerializerMethodField()
    profile_visible_to_ventures = serializers.SerializerMethodField()
    profile_status = serializers.SerializerMethodField()
    profile_submitted_at = serializers.SerializerMethodField()
    profile_approved_at = serializers.SerializerMethodField()
    
    # Investor-specific
    investor_organization_name = serializers.SerializerMethodField()
    investor_email = serializers.SerializerMethodField()
    investor_investment_experience_years = serializers.SerializerMethodField()
    investor_deals_count = serializers.SerializerMethodField()
    investor_stage_preferences = serializers.SerializerMethodField()
    investor_industry_preferences = serializers.SerializerMethodField()
    investor_average_ticket_size = serializers.SerializerMethodField()
    
    # Mentor-specific
    mentor_job_title = serializers.SerializerMethodField()
    mentor_company = serializers.SerializerMethodField()
    mentor_contact_email = serializers.SerializerMethodField()
    mentor_expertise_fields = serializers.SerializerMethodField()
    mentor_experience_overview = serializers.SerializerMethodField()
    mentor_industries_of_interest = serializers.SerializerMethodField()
    mentor_engagement_type = serializers.SerializerMethodField()
    mentor_paid_rate_type = serializers.SerializerMethodField()
    mentor_paid_rate_amount = serializers.SerializerMethodField()
    mentor_availability_types = serializers.SerializerMethodField()
    mentor_preferred_engagement = serializers.SerializerMethodField()

    class Meta:
        model = ReviewRequest
        fields = (
            # User fields
            'id',
            'user_id',
            'user_email',
            'user_name',
            'role',
            'status',
            'submitted_at',
            'reviewed_at',
            'rejection_reason',
            # Product fields
            'product_id',
            'product_name',
            'product_industry',
            'product_website',
            'product_short_description',
            'product_created_at',
            # Pitch deck fields
            'pitch_deck_file_url',
            'pitch_deck_file_name',
            'pitch_deck_problem_statement',
            'pitch_deck_solution_description',
            'pitch_deck_target_market',
            'pitch_deck_funding_amount',
            'pitch_deck_funding_stage',
            'pitch_deck_traction_metrics',
            'pitch_deck_use_of_funds',
            # Profile fields
            'profile_id',
            'profile_type',
            'profile_full_name',
            'profile_linkedin_or_website',
            'profile_phone',
            'profile_visible_to_ventures',
            'profile_status',
            'profile_submitted_at',
            'profile_approved_at',
            # Investor fields
            'investor_organization_name',
            'investor_email',
            'investor_investment_experience_years',
            'investor_deals_count',
            'investor_stage_preferences',
            'investor_industry_preferences',
            'investor_average_ticket_size',
            # Mentor fields
            'mentor_job_title',
            'mentor_company',
            'mentor_contact_email',
            'mentor_expertise_fields',
            'mentor_experience_overview',
            'mentor_industries_of_interest',
            'mentor_engagement_type',
            'mentor_paid_rate_type',
            'mentor_paid_rate_amount',
            'mentor_availability_types',
            'mentor_preferred_engagement',
        )

    # User methods
    def get_user_id(self, obj: ReviewRequest) -> str:
        return str(obj.submitted_by_id)

    def get_user_email(self, obj: ReviewRequest) -> str:
        return obj.submitted_by.email

    def get_user_name(self, obj: ReviewRequest) -> str:
        return obj.submitted_by.full_name

    def get_role(self, obj: ReviewRequest) -> str:
        return obj.submitted_by.role

    def get_status(self, obj: ReviewRequest) -> str:
        if obj.status == 'SUBMITTED':
            return 'PENDING'
        return obj.status

    def get_submitted_at(self, obj: ReviewRequest) -> str:
        return obj.created_at.isoformat()
    
    # Helper methods
    def _get_product(self, obj: ReviewRequest):
        """Get VentureProduct if this is a product review."""
        from apps.ventures.models import VentureProduct
        from django.contrib.contenttypes.models import ContentType
        
        try:
            product_ct = ContentType.objects.get_for_model(VentureProduct)
            if obj.content_type == product_ct:
                return VentureProduct.objects.prefetch_related('documents').get(id=obj.object_id)
        except:
            pass
        return None
    
    def _get_pitch_deck(self, product):
        """Get pitch deck document from product."""
        if not product:
            return None
        try:
            from apps.ventures.models import VentureDocument
            return product.documents.filter(document_type='PITCH_DECK').first()
        except:
            return None
    
    # Product methods
    def get_product_id(self, obj: ReviewRequest):
        product = self._get_product(obj)
        return str(product.id) if product else None
    
    def get_product_name(self, obj: ReviewRequest):
        product = self._get_product(obj)
        return product.name if product else None
    
    def get_product_industry(self, obj: ReviewRequest):
        product = self._get_product(obj)
        return product.industry_sector if product else None
    
    def get_product_website(self, obj: ReviewRequest):
        product = self._get_product(obj)
        return product.website if product else None
    
    def get_product_short_description(self, obj: ReviewRequest):
        product = self._get_product(obj)
        return product.short_description if product else None
    
    def get_product_created_at(self, obj: ReviewRequest):
        product = self._get_product(obj)
        return product.created_at.isoformat() if product and product.created_at else None
    
    # Pitch deck methods
    def get_pitch_deck_file_url(self, obj: ReviewRequest):
        product = self._get_product(obj)
        pitch_deck = self._get_pitch_deck(product)
        if pitch_deck and pitch_deck.file:
            return pitch_deck.file.url
        return None

    # Profile helpers
    def _get_profile(self, obj: ReviewRequest):
        """
        Return (profile_type, profile_obj) for InvestorProfile/MentorProfile review requests.
        For VentureProduct reviews, returns (None, None).
        """
        content_obj = getattr(obj, 'content_object', None)
        if not content_obj:
            return (None, None)
        
        try:
            from apps.investors.models import InvestorProfile
            if isinstance(content_obj, InvestorProfile):
                return ('INVESTOR', content_obj)
        except Exception:
            pass
        
        try:
            from apps.mentors.models import MentorProfile
            if isinstance(content_obj, MentorProfile):
                return ('MENTOR', content_obj)
        except Exception:
            pass
        
        return (None, None)

    # Profile methods (common)
    def get_profile_type(self, obj: ReviewRequest):
        profile_type, _profile = self._get_profile(obj)
        return profile_type

    def get_profile_id(self, obj: ReviewRequest):
        _profile_type, profile = self._get_profile(obj)
        return str(profile.id) if profile else None

    def get_profile_full_name(self, obj: ReviewRequest):
        _profile_type, profile = self._get_profile(obj)
        return getattr(profile, 'full_name', None) if profile else None

    def get_profile_linkedin_or_website(self, obj: ReviewRequest):
        _profile_type, profile = self._get_profile(obj)
        return getattr(profile, 'linkedin_or_website', None) if profile else None

    def get_profile_phone(self, obj: ReviewRequest):
        _profile_type, profile = self._get_profile(obj)
        return getattr(profile, 'phone', None) if profile else None

    def get_profile_visible_to_ventures(self, obj: ReviewRequest):
        _profile_type, profile = self._get_profile(obj)
        return getattr(profile, 'visible_to_ventures', None) if profile else None

    def get_profile_status(self, obj: ReviewRequest):
        _profile_type, profile = self._get_profile(obj)
        return getattr(profile, 'status', None) if profile else None

    def get_profile_submitted_at(self, obj: ReviewRequest):
        _profile_type, profile = self._get_profile(obj)
        dt = getattr(profile, 'submitted_at', None) if profile else None
        return dt.isoformat() if dt else None

    def get_profile_approved_at(self, obj: ReviewRequest):
        _profile_type, profile = self._get_profile(obj)
        dt = getattr(profile, 'approved_at', None) if profile else None
        return dt.isoformat() if dt else None

    # Investor methods
    def get_investor_organization_name(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.organization_name if profile_type == 'INVESTOR' else None

    def get_investor_email(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.email if profile_type == 'INVESTOR' else None

    def get_investor_investment_experience_years(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.investment_experience_years if profile_type == 'INVESTOR' else None

    def get_investor_deals_count(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.deals_count if profile_type == 'INVESTOR' else None

    def get_investor_stage_preferences(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.stage_preferences if profile_type == 'INVESTOR' else None

    def get_investor_industry_preferences(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.industry_preferences if profile_type == 'INVESTOR' else None

    def get_investor_average_ticket_size(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.average_ticket_size if profile_type == 'INVESTOR' else None

    # Mentor methods
    def get_mentor_job_title(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.job_title if profile_type == 'MENTOR' else None

    def get_mentor_company(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.company if profile_type == 'MENTOR' else None

    def get_mentor_contact_email(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.contact_email if profile_type == 'MENTOR' else None

    def get_mentor_expertise_fields(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.expertise_fields if profile_type == 'MENTOR' else None

    def get_mentor_experience_overview(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.experience_overview if profile_type == 'MENTOR' else None

    def get_mentor_industries_of_interest(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.industries_of_interest if profile_type == 'MENTOR' else None

    def get_mentor_engagement_type(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.engagement_type if profile_type == 'MENTOR' else None

    def get_mentor_paid_rate_type(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.paid_rate_type if profile_type == 'MENTOR' else None

    def get_mentor_paid_rate_amount(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        if profile_type != 'MENTOR':
            return None
        return str(profile.paid_rate_amount) if profile.paid_rate_amount is not None else None

    def get_mentor_availability_types(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.availability_types if profile_type == 'MENTOR' else None

    def get_mentor_preferred_engagement(self, obj: ReviewRequest):
        profile_type, profile = self._get_profile(obj)
        return profile.preferred_engagement if profile_type == 'MENTOR' else None
    
    def get_pitch_deck_file_name(self, obj: ReviewRequest):
        product = self._get_product(obj)
        pitch_deck = self._get_pitch_deck(product)
        if pitch_deck and pitch_deck.file:
            import os
            return os.path.basename(pitch_deck.file.name)
        return None
    
    def get_pitch_deck_problem_statement(self, obj: ReviewRequest):
        product = self._get_product(obj)
        pitch_deck = self._get_pitch_deck(product)
        return pitch_deck.problem_statement if pitch_deck else None
    
    def get_pitch_deck_solution_description(self, obj: ReviewRequest):
        product = self._get_product(obj)
        pitch_deck = self._get_pitch_deck(product)
        return pitch_deck.solution_description if pitch_deck else None
    
    def get_pitch_deck_target_market(self, obj: ReviewRequest):
        product = self._get_product(obj)
        pitch_deck = self._get_pitch_deck(product)
        return pitch_deck.target_market if pitch_deck else None
    
    def get_pitch_deck_funding_amount(self, obj: ReviewRequest):
        product = self._get_product(obj)
        pitch_deck = self._get_pitch_deck(product)
        return pitch_deck.funding_amount if pitch_deck else None
    
    def get_pitch_deck_funding_stage(self, obj: ReviewRequest):
        product = self._get_product(obj)
        pitch_deck = self._get_pitch_deck(product)
        return pitch_deck.funding_stage if pitch_deck else None
    
    def get_pitch_deck_traction_metrics(self, obj: ReviewRequest):
        product = self._get_product(obj)
        pitch_deck = self._get_pitch_deck(product)
        return pitch_deck.traction_metrics if pitch_deck else None
    
    def get_pitch_deck_use_of_funds(self, obj: ReviewRequest):
        product = self._get_product(obj)
        pitch_deck = self._get_pitch_deck(product)
        return pitch_deck.use_of_funds if pitch_deck else None


class ApprovalRejectSerializer(serializers.Serializer):
    """Payload for rejecting an approval with detailed reason."""
    reason = serializers.CharField(required=True, allow_blank=False, max_length=5000)
