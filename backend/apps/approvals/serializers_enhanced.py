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
