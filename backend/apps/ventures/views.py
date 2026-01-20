"""
Views for ventures app.
"""
import os
from django.utils import timezone
from django.db.models import Q
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from shared.permissions import IsApprovedUser, IsAdminOrReviewer, IsApprovedOrSubmittedUser
from apps.ventures.models import (
    VentureProduct, VentureProfile, VentureDocument, TeamMember, Founder,
    PitchDeckAccess, PitchDeckAccessEvent, PitchDeckRequest, PitchDeckShare,
    PitchDeckInterest, InvestmentCommitment
)
from django.conf import settings
from apps.ventures.serializers import (
    VentureProductSerializer,
    VentureProductCreateSerializer,
    VentureProductUpdateSerializer,
    VentureProductActivateSerializer,
    VentureProfileSerializer,
    VentureProfileCreateSerializer,
    VentureProfileUpdateSerializer,
    VentureDocumentSerializer,
    VentureDocumentCreateSerializer,
    TeamMemberSerializer,
    FounderSerializer,
    PitchDeckAccessSerializer,
    PitchDeckAccessEventSerializer,
    PitchDeckRequestSerializer,
    PitchDeckRequestCreateSerializer,
    PitchDeckShareSerializer,
    PitchDeckShareCreateSerializer
)
from apps.approvals.models import ReviewRequest
from apps.accounts.models import User
from django.contrib.contenttypes.models import ContentType
from django.http import FileResponse, Http404
from django.utils.http import http_date
from apps.messaging.models import Conversation, Message
from django.db.models import Count


def get_or_create_commitment_conversation(investor, venture_user):
    """
    Helper function to get or create a conversation between investor and venture user.
    Used for linking investment commitments to chat conversations.
    
    Args:
        investor: User object (investor)
        venture_user: User object (venture owner)
    
    Returns:
        Conversation object
    """
    # Check if conversation already exists between these two users
    existing_conversation = Conversation.objects.filter(
        Q(participants=investor) & Q(participants=venture_user)
    ).annotate(
        participant_count=Count('participants')
    ).filter(
        participant_count=2
    ).distinct().first()
    
    if existing_conversation:
        return existing_conversation
    
    # Create new conversation
    conversation = Conversation.objects.create()
    conversation.participants.add(investor, venture_user)
    return conversation


def create_commitment_system_message(conversation, commitment, message_type, previous_amount=None):
    """
    Helper function to create system messages for commitment events.
    
    Args:
        conversation: Conversation object
        commitment: InvestmentCommitment object
        message_type: str - 'created', 'updated', 'accepted', 'renegotiate'
        previous_amount: Decimal (optional) - previous amount for 'updated' messages
    
    Returns:
        Message object
    """
    from decimal import Decimal
    
    amount_str = f"${commitment.amount:,.0f}" if commitment.amount else "Amount not specified"
    
    if message_type == 'created':
        body = f"💰 Investment commitment created: {amount_str} for {commitment.product.name}"
        if commitment.message:
            body += f"\n\nMessage: {commitment.message}"
    elif message_type == 'updated':
        prev_amount_str = f"${previous_amount:,.0f}" if previous_amount else "Amount not specified"
        body = f"📝 Investment commitment updated: {amount_str} (previously {prev_amount_str}) for {commitment.product.name}"
        if commitment.message:
            body += f"\n\nMessage: {commitment.message}"
    elif message_type == 'accepted':
        body = f"✅ Investment commitment accepted - Deal created! {amount_str} for {commitment.product.name}"
        if commitment.venture_response_message:
            body += f"\n\nMessage: {commitment.venture_response_message}"
    elif message_type == 'renegotiate':
        body = f"🔄 Renegotiation requested for investment commitment: {amount_str} for {commitment.product.name}"
        if commitment.venture_response_message:
            body += f"\n\nRenegotiation message: {commitment.venture_response_message}"
    else:
        body = f"Investment commitment: {amount_str} for {commitment.product.name}"
    
    # Create system message (sender is the system, represented by the venture user for context)
    # Note: System messages are not editable/deletable
    message = Message.objects.create(
        conversation=conversation,
        sender=commitment.product.user,  # Use venture user as sender for system messages
        body=body
    )
    
    # Update conversation's last_message_at
    conversation.last_message_at = timezone.now()
    conversation.save(update_fields=['last_message_at'])
    
    return message


class ProductListCreateView(generics.ListCreateAPIView):
    """
    List user's products or create a new product.
    
    GET /api/ventures/products - List all user's products
    POST /api/ventures/products - Create new product (max 3)
    
    Note: Pagination is disabled for this endpoint since users can only have max 3 products.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination - users can only have max 3 products
    
    def get_queryset(self):
        """Return only products owned by the current user with all related data."""
        return VentureProduct.objects.filter(
            user=self.request.user
        ).prefetch_related(
            'documents',  # Prefetch pitch deck documents
            'founders',   # Prefetch founders
            'team_members',  # Prefetch team members
            'needs'       # Prefetch venture needs
        ).select_related('user').order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return VentureProductCreateSerializer
        return VentureProductSerializer
    
    def perform_create(self, serializer):
        """
        Create product and associate with current user.
        Sets user and initial status to DRAFT.
        """
        serializer.save(user=self.request.user, status='DRAFT', is_active=True)


class ProductDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update a product.
    
    GET /api/ventures/products/{product_id} - Get product details
    PATCH /api/ventures/products/{product_id} - Update product (only if DRAFT/REJECTED)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = VentureProductUpdateSerializer
    lookup_field = 'id'  # Model field name
    lookup_url_kwarg = 'product_id'  # URL parameter name
    
    def get_queryset(self):
        """Return products owned by the current user with all related data."""
        return VentureProduct.objects.filter(
            user=self.request.user
        ).prefetch_related(
            'documents',  # Prefetch pitch deck documents
            'founders',   # Prefetch founders
            'team_members',  # Prefetch team members
            'needs'       # Prefetch venture needs
        ).select_related('user')
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return VentureProductSerializer
        return VentureProductUpdateSerializer


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def activate_product(request, product_id):
    """
    Activate or deactivate a product.
    
    PATCH /api/ventures/products/{id}/activate
    Body: { "is_active": true/false }
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = VentureProductActivateSerializer(
        product,
        data=request.data,
        partial=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    
    return Response(
        {'detail': f'Product {"activated" if product.is_active else "deactivated"} successfully.'},
        status=status.HTTP_200_OK
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_product(request, product_id):
    """
    Delete a product.
    - Regular users: DRAFT or REJECTED status only
    - Admins: Any status (for moderation/cleanup)
    
    DELETE /api/ventures/products/{id}
    
    Regular users can only delete products in DRAFT or REJECTED status.
    Admins can delete any product for moderation purposes.
    """
    # Check if user is admin
    is_admin = request.user.is_staff or request.user.groups.filter(name__in=['Admin', 'Reviewer']).exists()
    
    # Try to get product - admins can access any product, users only their own
    try:
        if is_admin:
            product = VentureProduct.objects.get(id=product_id)
        else:
            product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Security: Regular users can only delete DRAFT or REJECTED
    # Admins can delete any status (for moderation)
    if not is_admin and product.status not in ['DRAFT', 'REJECTED']:
        return Response(
            {
                'detail': f'Cannot delete product with status {product.status}. Only DRAFT or REJECTED products can be deleted. For SUBMITTED or APPROVED products, please request deletion.',
                'status': product.status,
                'action_required': 'request_deletion'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Store product information for email notification (before deletion)
    product_name = product.name
    product_status = product.status
    product_owner_id = product.user.id
    
    # Delete associated files (pitch decks)
    documents = VentureDocument.objects.filter(product=product)
    for doc in documents:
        if doc.file:
            try:
                doc.file.delete(save=False)
            except Exception:
                pass  # Continue deletion even if file doesn't exist
    
    # Delete product (cascades to related models via CASCADE)
    product.delete()
    
    # Send email notification to the product owner (async via Celery)
    try:
        from apps.accounts.tasks import send_deletion_notification
        send_deletion_notification.delay(
            user_id=product_owner_id,
            product_name=product_name,
            product_status=product_status,
            deleted_by_admin=is_admin and request.user.id != product_owner_id
        )
    except Exception as e:
        # Log error but don't fail the deletion if email fails
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send deletion notification email: {str(e)}")
    
    return Response(
        {'detail': f'Product "{product_name}" deleted successfully.'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_product_deletion(request, product_id):
    """
    Request deletion of a SUBMITTED or APPROVED product.
    
    POST /api/ventures/products/{id}/request-deletion
    Body: { "reason": "Optional reason for deletion request" }
    
    Creates a deletion request that requires admin approval.
    Only for products in SUBMITTED or APPROVED status.
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Validation: Only SUBMITTED or APPROVED products require deletion request
    if product.status in ['DRAFT', 'REJECTED']:
        return Response(
            {
                'detail': f'Product with status {product.status} can be deleted directly. Use DELETE /api/ventures/products/{{id}} instead.',
                'status': product.status,
                'action_required': 'direct_delete'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if product.status not in ['SUBMITTED', 'APPROVED']:
        return Response(
            {'detail': f'Cannot request deletion for product with status {product.status}.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if there's already a pending deletion request
    content_type = ContentType.objects.get_for_model(VentureProduct)
    existing_request = ReviewRequest.objects.filter(
        content_type=content_type,
        object_id=product.id,
        status='SUBMITTED',
        # Check if this is a deletion request (we'll add a deletion_request field or use notes)
    ).exists()
    
    if existing_request:
        return Response(
            {'detail': 'A deletion request for this product is already pending review.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get reason from request body
    reason = request.data.get('reason', '').strip()
    if len(reason) > 1000:
        return Response(
            {'detail': 'Reason must be 1000 characters or less.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create deletion request (using ReviewRequest model)
    # Note: We'll add a note or flag to indicate this is a deletion request
    review_request = ReviewRequest.objects.create(
        content_type=content_type,
        object_id=product.id,
        submitted_by=request.user,
        status='SUBMITTED',
        # Store deletion request info in admin_notes or add a new field
    )
    
    # Add reason as a note if provided
    if reason:
        review_request.admin_notes = f"DELETION REQUEST: {reason}"
        review_request.save(update_fields=['admin_notes'])
    
    return Response(
        {
            'detail': f'Deletion request for "{product.name}" submitted successfully. Admin will review your request.',
            'review_id': str(review_request.id),
            'reason': reason or None
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reopen_product(request, product_id):
    """
    Reopen an APPROVED or SUBMITTED product for editing.
    Changes status back to DRAFT so user can make updates and resubmit.
    
    POST /api/ventures/products/{id}/reopen
    
    Requirements:
    - Product must be in APPROVED or SUBMITTED status
    - User must be the product owner
    
    Use case: User wants to update an approved product with new information.
    After reopening, they can edit and resubmit for approval.
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Only APPROVED or SUBMITTED products can be reopened
    if product.status not in ['APPROVED', 'SUBMITTED']:
        return Response(
            {
                'detail': f'Cannot reopen product with status {product.status}. Only APPROVED or SUBMITTED products can be reopened.',
                'current_status': product.status
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Store previous status for response
    previous_status = product.status
    
    # Change status back to DRAFT
    product.status = 'DRAFT'
    product.save(update_fields=['status', 'updated_at'])
    
    return Response(
        {
            'detail': f'Product "{product.name}" reopened for editing. Status changed from {previous_status} to DRAFT.',
            'product_id': str(product.id),
            'previous_status': previous_status,
            'new_status': 'DRAFT'
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_product(request, product_id):
    """
    Submit a complete product package (product + pitch deck) for admin approval.
    
    POST /api/ventures/products/{id}/submit
    
    Requirements:
    - Product must be in DRAFT or REJECTED status
    - Product must have at least ONE pitch deck document uploaded
    - Creates a ReviewRequest for the complete package (product + pitch deck)
    
    Note: This is a SINGLE submission for the complete package.
    Admin reviews everything together in one sitting.
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if product can be submitted
    if product.status not in ['DRAFT', 'REJECTED']:
        return Response(
            {'detail': f'Product with status {product.status} cannot be submitted.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validation: Product must have at least ONE pitch deck document
    has_pitch_deck = VentureDocument.objects.filter(
        product=product,
        document_type='PITCH_DECK'
    ).exists()
    
    if not has_pitch_deck:
        return Response(
            {
                'detail': 'Cannot submit product without a pitch deck. Please upload a pitch deck first.',
                'missing': 'pitch_deck'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if there's already a pending review
    content_type = ContentType.objects.get_for_model(VentureProduct)
    existing_review = ReviewRequest.objects.filter(
        content_type=content_type,
        object_id=product.id,
        status='SUBMITTED'
    ).exists()
    
    if existing_review:
        return Response(
            {'detail': 'This product already has a pending review request.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create review request for the complete package (product + pitch deck)
    review_request = ReviewRequest.objects.create(
        content_type=content_type,
        object_id=product.id,
        submitted_by=request.user,
        status='SUBMITTED'
    )
    
    # Update product status
    product.status = 'SUBMITTED'
    product.submitted_at = timezone.now()
    product.save(update_fields=['status', 'submitted_at'])
    
    return Response(
        {
            'detail': 'Complete package (product + pitch deck) submitted for approval.',
            'review_id': str(review_request.id)
        },
        status=status.HTTP_200_OK
    )


class PublicProductListView(generics.ListAPIView):
    """
    List approved and active products (public view).
    
    GET /api/ventures/public
    Only returns products with status=APPROVED and is_active=True
    Marketplace behavior:
    - Any authenticated investor should be able to browse ALL approved pitch decks/products
    - Access control for downloading/viewing the actual pitch deck file is handled by the
      dedicated download/view endpoints (and PitchDeckAccess logic), not by the list feed.
    """
    # NOTE: Do NOT gate the marketplace feed by profile approval.
    # The queryset already enforces "public" visibility (APPROVED + active).
    permission_classes = [IsAuthenticated]
    serializer_class = VentureProductSerializer
    
    def get_queryset(self):
        """Return only approved and active products."""
        return VentureProduct.objects.filter(
            status='APPROVED',
            is_active=True
        ).select_related('user').order_by('-created_at')


class PublicProductDetailView(generics.RetrieveAPIView):
    """
    Get a single approved product (public view).
    
    GET /api/ventures/{id}
    Only returns products with status=APPROVED and is_active=True
    """
    # Marketplace detail should be viewable to any authenticated investor.
    # File access remains protected by the download/view endpoints.
    permission_classes = [IsAuthenticated]
    serializer_class = VentureProductSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return only approved and active products."""
        return VentureProduct.objects.filter(
            status='APPROVED',
            is_active=True
        ).select_related('user')


class VentureProfileCreateUpdateView(generics.CreateAPIView, generics.RetrieveUpdateAPIView):
    """
    Create or update venture profile.
    
    POST /api/ventures/profile - Create venture profile (draft)
    GET /api/ventures/profile/me - Get own venture profile
    PATCH /api/ventures/profile/me - Update own profile
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]  # Support both JSON and file uploads for logo
    
    def get_object(self):
        """Get venture profile for current user."""
        try:
            return VentureProfile.objects.get(user=self.request.user)
        except VentureProfile.DoesNotExist:
            return None
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return VentureProfileCreateSerializer
        elif self.request.method == 'PATCH':
            return VentureProfileUpdateSerializer
        return VentureProfileSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context for building absolute URLs."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Create venture profile."""
        # Check if profile already exists
        if VentureProfile.objects.filter(user=request.user).exists():
            return Response(
                {'detail': 'Venture profile already exists. Use PATCH to update.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        
        # Return serialized data with logo URL
        response_serializer = VentureProfileSerializer(serializer.instance, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    def get(self, request, *args, **kwargs):
        """Handle GET requests for /profile/me (no pk in URL)."""
        return self.retrieve(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        """Get own venture profile."""
        profile = self.get_object()
        if not profile:
            # Return 200 OK with null instead of 404 for missing profiles
            # This is more user-friendly since profiles are optional and might not exist yet
            # Frontend can check for null/empty response instead of handling 404 errors
            return Response(
                None,
                status=status.HTTP_200_OK
            )
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    def patch(self, request, *args, **kwargs):
        """Handle PATCH requests for /profile/me (no pk in URL)."""
        return self.update(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Update own venture profile."""
        profile = self.get_object()
        if not profile:
            # Auto-create profile if it doesn't exist (for backward compatibility)
            serializer = VentureProfileCreateSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            serializer.save(user=request.user)
            response_serializer = VentureProfileSerializer(serializer.instance, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        serializer = self.get_serializer(profile, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Return serialized data with logo URL
        response_serializer = VentureProfileSerializer(serializer.instance, context={'request': request})
        return Response(response_serializer.data)


# Admin endpoints for product management
class AdminProductListView(generics.ListAPIView):
    """
    Admin endpoint to list all products with filtering.
    
    GET /api/admin/products
    Query params: ?user_id=..., ?status=..., ?is_active=...
    """
    permission_classes = [IsAuthenticated, IsAdminOrReviewer]
    serializer_class = VentureProductSerializer
    
    def get_queryset(self):
        queryset = VentureProduct.objects.select_related('user').all()
        
        # Security: Validate and sanitize query parameters to prevent injection
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            # Validate UUID format to prevent injection
            try:
                import uuid
                uuid.UUID(str(user_id))
                queryset = queryset.filter(user_id=user_id)
            except (ValueError, TypeError):
                # Invalid UUID format, ignore filter
                pass
        
        # Filter by status - whitelist allowed values
        status_filter = self.request.query_params.get('status')
        if status_filter:
            allowed_statuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'SUSPENDED']
            if status_filter.upper() in allowed_statuses:
                queryset = queryset.filter(status=status_filter.upper())
        
        # Filter by is_active - validate boolean
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            is_active_lower = str(is_active).lower()
            if is_active_lower in ('true', '1', 'yes'):
                queryset = queryset.filter(is_active=True)
            elif is_active_lower in ('false', '0', 'no'):
                queryset = queryset.filter(is_active=False)
        
        return queryset.order_by('-created_at')


class AdminProductDetailView(generics.RetrieveDestroyAPIView):
    """
    Admin endpoint to retrieve or delete a product.
    
    GET /api/admin/products/{id} - Get product details
    DELETE /api/admin/products/{id} - Delete product (admin only)
    """
    permission_classes = [IsAuthenticated, IsAdminOrReviewer]
    serializer_class = VentureProductSerializer
    lookup_field = 'id'
    queryset = VentureProduct.objects.select_related('user').all()
    
    def perform_destroy(self, instance):
        """Delete product (cascades to related models)."""
        # Log deletion for audit trail
        product_name = instance.name
        user_email = instance.user.email
        # Product will be deleted via CASCADE
        return super().perform_destroy(instance)


# Document (Pitch Deck) Management Endpoints
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_pitch_deck(request, product_id):
    """
    Upload a pitch deck document for a product with metadata.
    
    POST /api/ventures/products/{id}/documents/pitch-deck
    Body: multipart/form-data with 'file' field and optional metadata fields:
    - problem_statement
    - solution_description
    - target_market
    - traction_metrics (JSON)
    - funding_amount
    - funding_stage
    - use_of_funds
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Security: Only allow updates if product is in DRAFT or REJECTED status
    if product.status not in ['DRAFT', 'REJECTED']:
        return Response(
            {'detail': f'Cannot upload pitch deck for product with status {product.status}. Only DRAFT or REJECTED products can be modified.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if file is provided
    if 'file' not in request.FILES:
        return Response(
            {'detail': 'No file provided.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    
    # Security: Validate file extension first (prevents MIME type spoofing)
    allowed_extensions = ['.pdf']
    file_name = file.name.lower()
    if not any(file_name.endswith(ext) for ext in allowed_extensions):
        return Response(
            {'detail': 'Only PDF files are allowed for pitch decks.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file type (PDF only) - MIME type check
    allowed_types = ['application/pdf']
    if file.content_type not in allowed_types:
        return Response(
            {'detail': 'Only PDF files are allowed for pitch decks.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    if file.size > max_size:
        return Response(
            {'detail': 'File size exceeds 10MB limit.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Security: Additional validation - check file is not empty
    if file.size == 0:
        return Response(
            {'detail': 'File cannot be empty.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Parse and validate traction_metrics if provided
    traction_metrics = None
    if 'traction_metrics' in request.data:
        try:
            import json
            if isinstance(request.data['traction_metrics'], str):
                # Security: Limit JSON string length to prevent DoS
                json_str = request.data['traction_metrics']
                if len(json_str) > 100000:  # 100KB max for JSON string
                    return Response(
                        {'detail': 'Traction metrics JSON string is too large (max 100KB).'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                traction_metrics = json.loads(json_str)
            else:
                traction_metrics = request.data['traction_metrics']
            
            # Security: Validate traction_metrics structure and size
            if isinstance(traction_metrics, dict):
                if len(traction_metrics) > 50:
                    return Response(
                        {'detail': 'Traction metrics cannot have more than 50 fields.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # Validate each key and value
                for key, val in traction_metrics.items():
                    if not isinstance(key, str):
                        return Response(
                            {'detail': 'All traction metric keys must be strings.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    if len(str(key)) > 100:
                        return Response(
                            {'detail': 'Traction metric keys must be 100 characters or less.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    if not isinstance(val, (str, int, float, bool, type(None))):
                        return Response(
                            {'detail': 'Traction metric values must be strings, numbers, booleans, or null.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    if isinstance(val, str) and len(val) > 1000:
                        return Response(
                            {'detail': 'Traction metric string values must be 1,000 characters or less.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            elif isinstance(traction_metrics, list):
                if len(traction_metrics) > 100:
                    return Response(
                        {'detail': 'Traction metrics list cannot have more than 100 items.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(
                    {'detail': 'Traction metrics must be a dictionary or list.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (json.JSONDecodeError, TypeError) as e:
            return Response(
                {'detail': f'Invalid traction_metrics format. Must be valid JSON. Error: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Security: Sanitize and validate metadata fields
    problem_statement = request.data.get('problem_statement', '').strip()[:10000] if request.data.get('problem_statement') else ''
    solution_description = request.data.get('solution_description', '').strip()[:10000] if request.data.get('solution_description') else ''
    target_market = request.data.get('target_market', '').strip()[:10000] if request.data.get('target_market') else ''
    funding_amount = request.data.get('funding_amount', '').strip()[:50] if request.data.get('funding_amount') else ''
    funding_stage = request.data.get('funding_stage', '').strip()[:20] if request.data.get('funding_stage') else ''
    use_of_funds = request.data.get('use_of_funds', '').strip()[:10000] if request.data.get('use_of_funds') else ''
    
    # Validate funding_stage if provided
    if funding_stage:
        allowed_stages = ['PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'GROWTH']
        if funding_stage not in allowed_stages:
            return Response(
                {'detail': f'Invalid funding stage. Must be one of: {", ".join(allowed_stages)}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Create document record with metadata
    document = VentureDocument.objects.create(
        product=product,
        document_type='PITCH_DECK',
        file=file,
        file_size=file.size,
        mime_type=file.content_type,
        problem_statement=problem_statement,
        solution_description=solution_description,
        target_market=target_market,
        traction_metrics=traction_metrics,
        funding_amount=funding_amount,
        funding_stage=funding_stage if funding_stage else None,
        use_of_funds=use_of_funds
    )
    
    serializer = VentureDocumentSerializer(document)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_product_documents(request, product_id):
    """
    List all documents for a product.
    
    GET /api/ventures/products/{id}/documents
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    documents = VentureDocument.objects.filter(product=product).order_by('-uploaded_at')
    serializer = VentureDocumentSerializer(documents, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_product_document(request, product_id, doc_id):
    """
    Delete a document from a product.
    
    DELETE /api/ventures/products/{id}/documents/{doc_id}
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product, document_type='PITCH_DECK')
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Pitch deck document not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Security: Only allow deletion if product is in DRAFT or REJECTED status
    # This ensures consistency with upload and update operations
    if product.status not in ['DRAFT', 'REJECTED']:
        return Response(
            {'detail': f'Cannot delete pitch deck for product with status {product.status}. Only DRAFT or REJECTED products can be modified.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Delete the file from storage
    # Security: Use Django's file storage delete method instead of direct os.remove
    # This prevents path traversal attacks and ensures proper file handling
    if document.file:
        try:
            document.file.delete(save=False)
        except Exception:
            # If file doesn't exist, continue with record deletion
            pass
    
    # Delete the document record
    document.delete()
    
    return Response(
        {'detail': 'Document deleted successfully.'},
        status=status.HTTP_200_OK
    )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_pitch_deck_metadata(request, product_id, doc_id):
    """
    Update pitch deck metadata (without replacing the file).
    
    PATCH /api/ventures/products/{id}/documents/{doc_id}
    Body: JSON with optional metadata fields:
    - problem_statement
    - solution_description
    - target_market
    - traction_metrics (JSON)
    - funding_amount
    - funding_stage
    - use_of_funds
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product, document_type='PITCH_DECK')
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Pitch deck document not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Security: Only allow updates if product is in DRAFT or REJECTED status
    if product.status not in ['DRAFT', 'REJECTED']:
        return Response(
            {'detail': f'Cannot update pitch deck metadata for product with status {product.status}. Only DRAFT or REJECTED products can be modified.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Parse and validate traction_metrics if provided
    if 'traction_metrics' in request.data:
        try:
            import json
            traction_metrics = request.data['traction_metrics']
            if isinstance(traction_metrics, str):
                # Security: Limit JSON string length to prevent DoS
                json_str = traction_metrics
                if len(json_str) > 100000:  # 100KB max for JSON string
                    return Response(
                        {'detail': 'Traction metrics JSON string is too large (max 100KB).'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                traction_metrics = json.loads(json_str)
            
            # Security: Validate traction_metrics structure and size
            if isinstance(traction_metrics, dict):
                if len(traction_metrics) > 50:
                    return Response(
                        {'detail': 'Traction metrics cannot have more than 50 fields.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # Validate each key and value
                for key, val in traction_metrics.items():
                    if not isinstance(key, str):
                        return Response(
                            {'detail': 'All traction metric keys must be strings.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    if len(str(key)) > 100:
                        return Response(
                            {'detail': 'Traction metric keys must be 100 characters or less.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    if not isinstance(val, (str, int, float, bool, type(None))):
                        return Response(
                            {'detail': 'Traction metric values must be strings, numbers, booleans, or null.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    if isinstance(val, str) and len(val) > 1000:
                        return Response(
                            {'detail': 'Traction metric string values must be 1,000 characters or less.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            elif isinstance(traction_metrics, list):
                if len(traction_metrics) > 100:
                    return Response(
                        {'detail': 'Traction metrics list cannot have more than 100 items.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(
                    {'detail': 'Traction metrics must be a dictionary or list.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            document.traction_metrics = traction_metrics
        except (json.JSONDecodeError, TypeError) as e:
            return Response(
                {'detail': f'Invalid traction_metrics format. Must be valid JSON. Error: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Security: Sanitize and validate metadata fields
    if 'problem_statement' in request.data:
        document.problem_statement = request.data.get('problem_statement', '').strip()[:10000] if request.data.get('problem_statement') else None
    
    if 'solution_description' in request.data:
        document.solution_description = request.data.get('solution_description', '').strip()[:10000] if request.data.get('solution_description') else None
    
    if 'target_market' in request.data:
        document.target_market = request.data.get('target_market', '').strip()[:10000] if request.data.get('target_market') else None
    
    if 'funding_amount' in request.data:
        document.funding_amount = request.data.get('funding_amount', '').strip()[:50] if request.data.get('funding_amount') else None
    
    if 'funding_stage' in request.data:
        funding_stage = request.data.get('funding_stage', '').strip()[:20] if request.data.get('funding_stage') else None
        if funding_stage:
            allowed_stages = ['PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'GROWTH']
            if funding_stage not in allowed_stages:
                return Response(
                    {'detail': f'Invalid funding stage. Must be one of: {", ".join(allowed_stages)}.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        document.funding_stage = funding_stage
    
    if 'use_of_funds' in request.data:
        document.use_of_funds = request.data.get('use_of_funds', '').strip()[:10000] if request.data.get('use_of_funds') else None
    
    document.save()
    
    serializer = VentureDocumentSerializer(document)
    return Response(serializer.data, status=status.HTTP_200_OK)


# Pitch Deck Access Control & Download/View Endpoints (VL-823, VL-824)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedUser])
def download_pitch_deck(request, product_id, doc_id):
    """
    Download a pitch deck document.
    
    GET /api/ventures/products/{id}/documents/{doc_id}/download
    Only approved users can download. Access is tracked.
    """
    try:
        # Get the product (must be approved and active)
        product = VentureProduct.objects.get(
            id=product_id,
            status='APPROVED',
            is_active=True
        )
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or not available.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product, document_type='PITCH_DECK')
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Pitch deck not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Security: Check if user has access
    # For now, all approved users can access approved products' pitch decks
    # In the future, this can be restricted via PitchDeckAccess model
    has_access = True
    if request.user.role == 'INVESTOR':
        # Check if there's a specific access record that denies access
        access_record = PitchDeckAccess.objects.filter(
            document=document,
            investor=request.user,
            is_active=False
        ).exists()
        if access_record:
            has_access = False
        else:
            # Check if there's an active access record or if default access is allowed
            # Default: All approved investors can access approved products' pitch decks
            has_access = True
    elif request.user.role == 'VENTURE':
        # Ventures can only access their own pitch decks
        has_access = (product.user == request.user)
    elif request.user.role in ['ADMIN', 'REVIEWER']:
        # Admins and reviewers have access
        has_access = True
    else:
        has_access = False
    
    if not has_access:
        return Response(
            {'detail': 'You do not have permission to access this pitch deck.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Track access event
    PitchDeckAccessEvent.objects.create(
        document=document,
        user=request.user,
        event_type='DOWNLOAD',
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]  # Limit length
    )
    
    # Grant access if not already granted (for investors)
    if request.user.role == 'INVESTOR':
        PitchDeckAccess.objects.get_or_create(
            document=document,
            investor=request.user,
            defaults={'granted_by': product.user, 'is_active': True}
        )
    
    # Serve the file
    if not document.file:
        return Response(
            {'detail': 'File not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        response = FileResponse(
            document.file.open('rb'),
            content_type=document.mime_type,
            as_attachment=True,
            filename=document.file.name.split('/')[-1]
        )
        response['Content-Length'] = document.file_size
        response['Last-Modified'] = http_date(document.uploaded_at.timestamp())
        return response
    except Exception as e:
        return Response(
            {'detail': f'Error serving file: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedUser])
def view_pitch_deck(request, product_id, doc_id):
    """
    View a pitch deck document in browser.
    
    GET /api/ventures/products/{id}/documents/{doc_id}/view
    Only approved users can view. Access is tracked.
    """
    try:
        product = VentureProduct.objects.get(
            id=product_id,
            status='APPROVED',
            is_active=True
        )
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or not available.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product, document_type='PITCH_DECK')
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Pitch deck not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Security: Check if user has access (same logic as download)
    has_access = True
    if request.user.role == 'INVESTOR':
        access_record = PitchDeckAccess.objects.filter(
            document=document,
            investor=request.user,
            is_active=False
        ).exists()
        if access_record:
            has_access = False
        else:
            has_access = True
    elif request.user.role == 'VENTURE':
        has_access = (product.user == request.user)
    elif request.user.role in ['ADMIN', 'REVIEWER']:
        has_access = True
    else:
        has_access = False
    
    if not has_access:
        return Response(
            {'detail': 'You do not have permission to access this pitch deck.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Track access event
    PitchDeckAccessEvent.objects.create(
        document=document,
        user=request.user,
        event_type='VIEW',
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
    )
    
    # Grant access if not already granted (for investors)
    if request.user.role == 'INVESTOR':
        PitchDeckAccess.objects.get_or_create(
            document=document,
            investor=request.user,
            defaults={'granted_by': product.user, 'is_active': True}
        )
    
    # Mark share as viewed if applicable
    if request.user.role == 'INVESTOR':
        PitchDeckShare.objects.filter(
            document=document,
            investor=request.user,
            viewed_at__isnull=True
        ).update(viewed_at=timezone.now())
    
    # Serve the file for browser viewing
    if not document.file:
        return Response(
            {'detail': 'File not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        response = FileResponse(
            document.file.open('rb'),
            content_type=document.mime_type
        )
        response['Content-Length'] = document.file_size
        response['Last-Modified'] = http_date(document.uploaded_at.timestamp())
        response['Content-Disposition'] = f'inline; filename="{document.file.name.split("/")[-1]}"'
        return response
    except Exception as e:
        return Response(
            {'detail': f'Error serving file: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Team Member Management Endpoints
class TeamMemberListCreateView(generics.ListCreateAPIView):
    """
    List or create team members for a product.
    
    GET /api/ventures/products/{product_id}/team-members - List team members
    POST /api/ventures/products/{product_id}/team-members - Create team member
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TeamMemberSerializer
    
    def get_queryset(self):
        """Return team members for the product owned by the current user."""
        product_id = self.kwargs['product_id']
        try:
            product = VentureProduct.objects.get(id=product_id, user=self.request.user)
            return TeamMember.objects.filter(product=product).order_by('created_at')
        except VentureProduct.DoesNotExist:
            return TeamMember.objects.none()
    
    def perform_create(self, serializer):
        """Create team member and associate with product."""
        product_id = self.kwargs['product_id']
        try:
            product = VentureProduct.objects.get(id=product_id, user=self.request.user)
            # Security: Only allow updates if product is in DRAFT or REJECTED status
            if product.status not in ['DRAFT', 'REJECTED']:
                raise PermissionDenied(
                    f"Cannot add team members to product with status '{product.status}'. "
                    "Only DRAFT or REJECTED products can be modified."
                )
            serializer.save(product=product)
        except VentureProduct.DoesNotExist:
            raise PermissionDenied('Product not found or you do not have permission.')


class TeamMemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a team member.
    
    GET /api/ventures/products/{product_id}/team-members/{id} - Get team member
    PATCH /api/ventures/products/{product_id}/team-members/{id} - Update team member
    DELETE /api/ventures/products/{product_id}/team-members/{id} - Delete team member
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TeamMemberSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return team members for products owned by the current user."""
        product_id = self.kwargs['product_id']
        try:
            product = VentureProduct.objects.get(id=product_id, user=self.request.user)
            return TeamMember.objects.filter(product=product)
        except VentureProduct.DoesNotExist:
            return TeamMember.objects.none()
    
    def perform_update(self, serializer):
        """Update team member with permission check."""
        team_member = serializer.instance
        product = team_member.product
        
        # Security: Only allow updates if product is in DRAFT or REJECTED status
        if product.status not in ['DRAFT', 'REJECTED']:
            raise PermissionDenied(
                f"Cannot update team members for product with status '{product.status}'. "
                "Only DRAFT or REJECTED products can be modified."
            )
        
        # Security: Ensure user owns the product
        if product.user != self.request.user:
            raise PermissionDenied('You do not have permission to update this team member.')
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete team member with permission check."""
        product = instance.product
        
        # Security: Only allow deletion if product is in DRAFT or REJECTED status
        if product.status not in ['DRAFT', 'REJECTED']:
            raise PermissionDenied(
                f"Cannot delete team members for product with status '{product.status}'. "
                "Only DRAFT or REJECTED products can be modified."
            )
        
        # Security: Ensure user owns the product
        if product.user != self.request.user:
            raise PermissionDenied('You do not have permission to delete this team member.')
        
        instance.delete()


# Founder Management Endpoints
class FounderListCreateView(generics.ListCreateAPIView):
    """
    List or create founders for a product.
    
    GET /api/ventures/products/{product_id}/founders - List founders
    POST /api/ventures/products/{product_id}/founders - Create founder
    """
    permission_classes = [IsAuthenticated]
    serializer_class = FounderSerializer
    
    def get_queryset(self):
        """Return founders for the product owned by the current user."""
        product_id = self.kwargs['product_id']
        try:
            product = VentureProduct.objects.get(id=product_id, user=self.request.user)
            return Founder.objects.filter(product=product).order_by('created_at')
        except VentureProduct.DoesNotExist:
            return Founder.objects.none()
    
    def perform_create(self, serializer):
        """Create founder and associate with product."""
        product_id = self.kwargs['product_id']
        try:
            product = VentureProduct.objects.get(id=product_id, user=self.request.user)
            # Security: Only allow updates if product is in DRAFT or REJECTED status
            if product.status not in ['DRAFT', 'REJECTED']:
                raise PermissionDenied(
                    f"Cannot add founders to product with status '{product.status}'. "
                    "Only DRAFT or REJECTED products can be modified."
                )
            serializer.save(product=product)
        except VentureProduct.DoesNotExist:
            raise PermissionDenied('Product not found or you do not have permission.')


class FounderDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a founder.
    
    GET /api/ventures/products/{product_id}/founders/{id} - Get founder
    PATCH /api/ventures/products/{product_id}/founders/{id} - Update founder
    DELETE /api/ventures/products/{product_id}/founders/{id} - Delete founder
    """
    permission_classes = [IsAuthenticated]
    serializer_class = FounderSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return founders for products owned by the current user."""
        product_id = self.kwargs['product_id']
        try:
            product = VentureProduct.objects.get(id=product_id, user=self.request.user)
            return Founder.objects.filter(product=product)
        except VentureProduct.DoesNotExist:
            return Founder.objects.none()
    
    def perform_update(self, serializer):
        """Update founder with permission check."""
        founder = serializer.instance
        product = founder.product
        
        # Security: Only allow updates if product is in DRAFT or REJECTED status
        if product.status not in ['DRAFT', 'REJECTED']:
            raise PermissionDenied(
                f"Cannot update founders for product with status '{product.status}'. "
                "Only DRAFT or REJECTED products can be modified."
            )
        
        # Security: Ensure user owns the product
        if product.user != self.request.user:
            raise PermissionDenied('You do not have permission to update this founder.')
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete founder with permission check."""
        product = instance.product
        
        # Security: Only allow deletion if product is in DRAFT or REJECTED status
        if product.status not in ['DRAFT', 'REJECTED']:
            raise PermissionDenied(
                f"Cannot delete founders for product with status '{product.status}'. "
                "Only DRAFT or REJECTED products can be modified."
            )
        
        # Security: Ensure user owns the product
        if product.user != self.request.user:
            raise PermissionDenied('You do not have permission to delete this founder.')
        
        instance.delete()


# Pitch Deck Access Control & Download/View Endpoints (VL-823, VL-824)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedUser])
def download_pitch_deck(request, product_id, doc_id):
    """
    Download a pitch deck document.
    
    GET /api/ventures/products/{id}/documents/{doc_id}/download
    Only approved users can download. Access is tracked.
    """
    try:
        # Get the product (must be approved and active)
        product = VentureProduct.objects.get(
            id=product_id,
            status='APPROVED',
            is_active=True
        )
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or not available.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product, document_type='PITCH_DECK')
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Pitch deck not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Security: Check if user has access
    # For now, all approved users can access approved products' pitch decks
    # In the future, this can be restricted via PitchDeckAccess model
    has_access = True
    if request.user.role == 'INVESTOR':
        # Check if there's a specific access record that denies access
        access_record = PitchDeckAccess.objects.filter(
            document=document,
            investor=request.user,
            is_active=False
        ).exists()
        if access_record:
            has_access = False
        else:
            # Check if there's an active access record or if default access is allowed
            # Default: All approved investors can access approved products' pitch decks
            has_access = True
    elif request.user.role == 'VENTURE':
        # Ventures can only access their own pitch decks
        has_access = (product.user == request.user)
    elif request.user.role in ['ADMIN', 'REVIEWER']:
        # Admins and reviewers have access
        has_access = True
    else:
        has_access = False
    
    if not has_access:
        return Response(
            {'detail': 'You do not have permission to access this pitch deck.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Track access event
    PitchDeckAccessEvent.objects.create(
        document=document,
        user=request.user,
        event_type='DOWNLOAD',
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]  # Limit length
    )
    
    # Grant access if not already granted (for investors)
    if request.user.role == 'INVESTOR':
        PitchDeckAccess.objects.get_or_create(
            document=document,
            investor=request.user,
            defaults={'granted_by': product.user, 'is_active': True}
        )
    
    # Serve the file
    if not document.file:
        return Response(
            {'detail': 'File not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        response = FileResponse(
            document.file.open('rb'),
            content_type=document.mime_type,
            as_attachment=True,
            filename=document.file.name.split('/')[-1]
        )
        response['Content-Length'] = document.file_size
        response['Last-Modified'] = http_date(document.uploaded_at.timestamp())
        return response
    except Exception as e:
        return Response(
            {'detail': f'Error serving file: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedUser])
def view_pitch_deck(request, product_id, doc_id):
    """
    View a pitch deck document in browser.
    
    GET /api/ventures/products/{id}/documents/{doc_id}/view
    Only approved users can view. Access is tracked.
    """
    try:
        product = VentureProduct.objects.get(
            id=product_id,
            status='APPROVED',
            is_active=True
        )
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or not available.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product, document_type='PITCH_DECK')
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Pitch deck not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Security: Check if user has access (same logic as download)
    has_access = True
    if request.user.role == 'INVESTOR':
        access_record = PitchDeckAccess.objects.filter(
            document=document,
            investor=request.user,
            is_active=False
        ).exists()
        if access_record:
            has_access = False
        else:
            has_access = True
    elif request.user.role == 'VENTURE':
        has_access = (product.user == request.user)
    elif request.user.role in ['ADMIN', 'REVIEWER']:
        has_access = True
    else:
        has_access = False
    
    if not has_access:
        return Response(
            {'detail': 'You do not have permission to access this pitch deck.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Track access event
    PitchDeckAccessEvent.objects.create(
        document=document,
        user=request.user,
        event_type='VIEW',
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
    )
    
    # Grant access if not already granted (for investors)
    if request.user.role == 'INVESTOR':
        PitchDeckAccess.objects.get_or_create(
            document=document,
            investor=request.user,
            defaults={'granted_by': product.user, 'is_active': True}
        )
    
    # Mark share as viewed if applicable
    if request.user.role == 'INVESTOR':
        PitchDeckShare.objects.filter(
            document=document,
            investor=request.user,
            viewed_at__isnull=True
        ).update(viewed_at=timezone.now())
    
    # Serve the file for browser viewing
    if not document.file:
        return Response(
            {'detail': 'File not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        response = FileResponse(
            document.file.open('rb'),
            content_type=document.mime_type
        )
        response['Content-Length'] = document.file_size
        response['Last-Modified'] = http_date(document.uploaded_at.timestamp())
        response['Content-Disposition'] = f'inline; filename="{document.file.name.split("/")[-1]}"'
        return response
    except Exception as e:
        return Response(
            {'detail': f'Error serving file: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Pitch Deck Access Control Endpoints (VL-824)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def grant_pitch_deck_access(request, product_id, doc_id):
    """
    Grant pitch deck access to an investor.
    
    POST /api/ventures/products/{id}/documents/{doc_id}/access/grant
    Body: { "investor_id": "uuid" }
    Only product owner can grant access.
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product, document_type='PITCH_DECK')
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Pitch deck not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    investor_id = request.data.get('investor_id')
    if not investor_id:
        return Response(
            {'detail': 'investor_id is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        investor = User.objects.get(id=investor_id, role='INVESTOR')
    except User.DoesNotExist:
        return Response(
            {'detail': 'Investor not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Create or update access record
    access, created = PitchDeckAccess.objects.get_or_create(
        document=document,
        investor=investor,
        defaults={'granted_by': request.user, 'is_active': True}
    )
    
    if not created:
        # Reactivate if previously revoked
        access.is_active = True
        access.revoked_at = None
        access.granted_by = request.user
        access.save()
    
    serializer = PitchDeckAccessSerializer(access)
    return Response(serializer.data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def revoke_pitch_deck_access(request, product_id, doc_id):
    """
    Revoke pitch deck access from an investor.
    
    POST /api/ventures/products/{id}/documents/{doc_id}/access/revoke
    Body: { "investor_id": "uuid" }
    Only product owner can revoke access.
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product, document_type='PITCH_DECK')
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Pitch deck not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    investor_id = request.data.get('investor_id')
    if not investor_id:
        return Response(
            {'detail': 'investor_id is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        access = PitchDeckAccess.objects.get(
            document=document,
            investor_id=investor_id,
            is_active=True
        )
    except PitchDeckAccess.DoesNotExist:
        return Response(
            {'detail': 'Access record not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    access.is_active = False
    access.revoked_at = timezone.now()
    access.save()
    
    return Response(
        {'detail': 'Access revoked successfully.'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_pitch_deck_access(request, product_id, doc_id):
    """
    List who has access to a pitch deck.
    
    GET /api/ventures/products/{id}/documents/{doc_id}/access
    Only product owner can view access list.
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product, document_type='PITCH_DECK')
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Pitch deck not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    accesses = PitchDeckAccess.objects.filter(document=document, is_active=True).order_by('-granted_at')
    serializer = PitchDeckAccessSerializer(accesses, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# Pitch Deck Sharing Endpoints (VL-825)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_pitch_deck(request, product_id, doc_id):
    """
    Share a pitch deck with an investor.
    
    POST /api/ventures/products/{id}/documents/{doc_id}/share
    Body: { "investor_id": "uuid", "message": "optional message" }
    Only product owner can share.
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product, document_type='PITCH_DECK')
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Pitch deck not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = PitchDeckShareCreateSerializer(data={
        'document': str(document.id),
        'investor': request.data.get('investor_id'),
        'message': request.data.get('message', '')
    })
    serializer.is_valid(raise_exception=True)
    
    # Set shared_by to current user
    share = serializer.save(shared_by=request.user)
    
    # Grant access automatically when sharing
    PitchDeckAccess.objects.get_or_create(
        document=document,
        investor=share.investor,
        defaults={'granted_by': request.user, 'is_active': True}
    )
    
    # TODO: Send notification email to investor
    
    response_serializer = PitchDeckShareSerializer(share)
    return Response(response_serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_pitch_deck_shares(request, product_id, doc_id):
    """
    List shares for a pitch deck.
    
    GET /api/ventures/products/{id}/documents/{doc_id}/shares
    Only product owner can view shares.
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product, document_type='PITCH_DECK')
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Pitch deck not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    shares = PitchDeckShare.objects.filter(document=document).order_by('-shared_at')
    serializer = PitchDeckShareSerializer(shares, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# Pitch Deck Request Endpoints (VL-826)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsApprovedUser])
def request_pitch_deck(request, product_id, doc_id):
    """
    Request access to a pitch deck.
    
    POST /api/ventures/products/{id}/documents/{doc_id}/request
    Body: { "message": "optional message" }
    Only approved investors can request.
    """
    if request.user.role != 'INVESTOR':
        return Response(
            {'detail': 'Only investors can request pitch decks.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        product = VentureProduct.objects.get(
            id=product_id,
            status='APPROVED',
            is_active=True
        )
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or not available.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product, document_type='PITCH_DECK')
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Pitch deck not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if request already exists
    existing_request = PitchDeckRequest.objects.filter(
        document=document,
        investor=request.user,
        status='PENDING'
    ).first()
    
    if existing_request:
        return Response(
            {'detail': 'You already have a pending request for this pitch deck.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = PitchDeckRequestCreateSerializer(data={
        'document': str(document.id),
        'message': request.data.get('message', '')
    })
    serializer.is_valid(raise_exception=True)
    
    request_obj = serializer.save(investor=request.user)
    
    # TODO: Send notification email to venture owner
    
    response_serializer = PitchDeckRequestSerializer(request_obj)
    return Response(response_serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_pitch_deck_requests(request, product_id, doc_id):
    """
    List requests for a pitch deck.
    
    GET /api/ventures/products/{id}/documents/{doc_id}/requests
    Only product owner can view requests.
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product, document_type='PITCH_DECK')
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Pitch deck not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    requests = PitchDeckRequest.objects.filter(document=document).order_by('-requested_at')
    serializer = PitchDeckRequestSerializer(requests, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_pitch_deck_request(request, product_id, doc_id, request_id):
    """
    Approve or deny a pitch deck request.
    
    POST /api/ventures/products/{id}/documents/{doc_id}/requests/{request_id}/respond
    Body: { "status": "APPROVED" or "DENIED", "response_message": "optional" }
    Only product owner can respond.
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product, document_type='PITCH_DECK')
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Pitch deck not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        request_obj = PitchDeckRequest.objects.get(id=request_id, document=document, status='PENDING')
    except PitchDeckRequest.DoesNotExist:
        return Response(
            {'detail': 'Request not found or already processed.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    new_status = request.data.get('status')
    if new_status not in ['APPROVED', 'DENIED']:
        return Response(
            {'detail': 'status must be APPROVED or DENIED.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    request_obj.status = new_status
    request_obj.responded_at = timezone.now()
    request_obj.responded_by = request.user
    request_obj.response_message = request.data.get('response_message', '').strip()[:2000] if request.data.get('response_message') else None
    request_obj.save()
    
    # If approved, grant access
    if new_status == 'APPROVED':
        PitchDeckAccess.objects.get_or_create(
            document=document,
            investor=request_obj.investor,
            defaults={'granted_by': request.user, 'is_active': True}
        )
        # TODO: Send notification email to investor
    
    response_serializer = PitchDeckRequestSerializer(request_obj)
    return Response(response_serializer.data, status=status.HTTP_200_OK)


# Pitch Deck Analytics Endpoints (VL-828)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pitch_deck_analytics(request, product_id, doc_id):
    """
    Get analytics for a pitch deck.
    
    GET /api/ventures/products/{id}/documents/{doc_id}/analytics
    Only product owner can view analytics.
    """
    try:
        product = VentureProduct.objects.get(id=product_id, user=request.user)
    except VentureProduct.DoesNotExist:
        return Response(
            {'detail': 'Product not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        document = VentureDocument.objects.get(id=doc_id, product=product, document_type='PITCH_DECK')
    except VentureDocument.DoesNotExist:
        return Response(
            {'detail': 'Pitch deck not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get access events
    events = PitchDeckAccessEvent.objects.filter(document=document)
    
    total_views = events.filter(event_type='VIEW').count()
    total_downloads = events.filter(event_type='DOWNLOAD').count()
    unique_viewers = events.filter(event_type='VIEW').values('user').distinct().count()
    unique_downloaders = events.filter(event_type='DOWNLOAD').values('user').distinct().count()
    
    # Get recent events
    recent_events = events.order_by('-accessed_at')[:20]
    recent_events_serializer = PitchDeckAccessEventSerializer(recent_events, many=True)
    
    # Get access permissions count
    total_access_granted = PitchDeckAccess.objects.filter(document=document, is_active=True).count()
    
    return Response({
        'total_views': total_views,
        'total_downloads': total_downloads,
        'unique_viewers': unique_viewers,
        'unique_downloaders': unique_downloaders,
        'total_access_granted': total_access_granted,
        'recent_events': recent_events_serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_product_commitments(request, product_id):
    """
    List investment commitments for a venture's product.
    
    GET /api/ventures/products/{product_id}/commitments
    Returns all InvestmentCommitment records for the product.
    Only the product owner (venture) can view commitments.
    """
    try:
        # Security: Only product owner can view commitments
        try:
            product = VentureProduct.objects.get(id=product_id)
        except VentureProduct.DoesNotExist:
            return Response(
                {'detail': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check ownership
        if product.user != request.user and request.user.role != 'ADMIN':
            return Response(
                {'detail': 'You do not have permission to view commitments for this product.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all commitments for this product
        commitments = InvestmentCommitment.objects.filter(
            product=product
        ).select_related(
            'investor',
            'investor__investor_profile',
            'document',
            'responded_by'
        ).order_by('-committed_at')
        
        # Serialize commitments
        commitments_data = []
        for commitment in commitments:
            investor_profile = getattr(commitment.investor, 'investor_profile', None)
            commitments_data.append({
                'commitment_id': str(commitment.id),
                'investor_id': str(commitment.investor.id),
                'investor_name': investor_profile.full_name if investor_profile else commitment.investor.full_name or commitment.investor.email,
                'investor_organization': investor_profile.organization_name if investor_profile else None,
                'investor_email': commitment.investor.email,
                'status': commitment.status,
                'amount': str(commitment.amount) if commitment.amount else None,
                'message': commitment.message,
                'committed_at': commitment.committed_at.isoformat() if commitment.committed_at else None,
                'venture_response': commitment.venture_response,
                'venture_response_at': commitment.venture_response_at.isoformat() if commitment.venture_response_at else None,
                'venture_response_message': commitment.venture_response_message,
                'responded_by_name': commitment.responded_by.full_name if commitment.responded_by else None,
                'document_id': str(commitment.document.id) if commitment.document else None,
                'is_deal': commitment.is_deal,
            })
        
        return Response({
            'count': len(commitments_data),
            'results': commitments_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Error in list_product_commitments: {str(e)}', exc_info=True)
        return Response(
            {
                'detail': 'An error occurred while fetching commitments.',
                'error': str(e) if settings.DEBUG else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_commitment(request, product_id, commitment_id):
    """
    Accept an investment commitment (creates a deal).
    
    POST /api/ventures/products/{product_id}/commitments/{commitment_id}/accept
    Body: {
        "message": "Optional message to investor"  # Optional
    }
    Only the product owner (venture) can accept commitments.
    """
    try:
        # Security: Only product owner can accept commitments
        try:
            product = VentureProduct.objects.get(id=product_id)
        except VentureProduct.DoesNotExist:
            return Response(
                {'detail': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check ownership
        if product.user != request.user and request.user.role != 'ADMIN':
            return Response(
                {'detail': 'You do not have permission to accept commitments for this product.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get commitment
        try:
            commitment = InvestmentCommitment.objects.get(
                id=commitment_id,
                product=product
            )
        except InvestmentCommitment.DoesNotExist:
            return Response(
                {'detail': 'Commitment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already responded
        if commitment.venture_response != 'PENDING':
            return Response(
                {
                    'detail': f'This commitment has already been {commitment.venture_response.lower()}.',
                    'current_response': commitment.venture_response
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get optional message
        message = request.data.get('message', '').strip()
        if message and len(message) > 2000:
            return Response(
                {'detail': 'Message must be 2,000 characters or less.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create conversation if not already linked
        if not commitment.conversation:
            conversation = get_or_create_commitment_conversation(commitment.investor, product.user)
            commitment.conversation = conversation
        else:
            conversation = commitment.conversation
        
        # Accept the commitment (becomes a deal)
        commitment.venture_response = 'ACCEPTED'
        commitment.venture_response_at = timezone.now()
        commitment.venture_response_message = message if message else None
        commitment.responded_by = request.user
        commitment.save(update_fields=['venture_response', 'venture_response_at', 'venture_response_message', 'responded_by', 'conversation', 'updated_at'])
        
        # Create system message in conversation
        create_commitment_system_message(conversation, commitment, 'accepted')
        
        return Response({
            'detail': 'Investment commitment accepted. Deal created successfully.',
            'commitment_id': str(commitment.id),
            'venture_response': commitment.venture_response,
            'is_deal': commitment.is_deal,
            'conversation_id': str(conversation.id)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Error in accept_commitment: {str(e)}', exc_info=True)
        return Response(
            {
                'detail': 'An error occurred while accepting the commitment.',
                'error': str(e) if settings.DEBUG else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def renegotiate_commitment(request, product_id, commitment_id):
    """
    Request renegotiation of an investment commitment.
    
    POST /api/ventures/products/{product_id}/commitments/{commitment_id}/renegotiate
    Body: {
        "message": "Message explaining renegotiation terms"  # Required
    }
    Only the product owner (venture) can request renegotiation.
    """
    try:
        # Security: Only product owner can request renegotiation
        try:
            product = VentureProduct.objects.get(id=product_id)
        except VentureProduct.DoesNotExist:
            return Response(
                {'detail': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check ownership
        if product.user != request.user and request.user.role != 'ADMIN':
            return Response(
                {'detail': 'You do not have permission to renegotiate commitments for this product.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get commitment
        try:
            commitment = InvestmentCommitment.objects.get(
                id=commitment_id,
                product=product
            )
        except InvestmentCommitment.DoesNotExist:
            return Response(
                {'detail': 'Commitment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already accepted (can't renegotiate an accepted deal)
        if commitment.venture_response == 'ACCEPTED':
            return Response(
                {
                    'detail': 'Cannot renegotiate an accepted commitment. Please contact the investor directly.',
                    'current_response': commitment.venture_response
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get message (required for renegotiation)
        message = request.data.get('message', '').strip()
        if not message:
            return Response(
                {'detail': 'Please provide a message explaining the renegotiation terms.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(message) > 2000:
            return Response(
                {'detail': 'Message must be 2,000 characters or less.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create conversation if not already linked
        if not commitment.conversation:
            conversation = get_or_create_commitment_conversation(commitment.investor, product.user)
            commitment.conversation = conversation
        else:
            conversation = commitment.conversation
        
        # Request renegotiation
        commitment.venture_response = 'RENEGOTIATE'
        commitment.venture_response_at = timezone.now()
        commitment.venture_response_message = message
        commitment.responded_by = request.user
        commitment.save(update_fields=['venture_response', 'venture_response_at', 'venture_response_message', 'responded_by', 'conversation', 'updated_at'])
        
        # Create system message in conversation
        create_commitment_system_message(conversation, commitment, 'renegotiate')
        
        return Response({
            'detail': 'Renegotiation request sent to investor.',
            'commitment_id': str(commitment.id),
            'venture_response': commitment.venture_response,
            'message': commitment.venture_response_message,
            'conversation_id': str(conversation.id)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Error in renegotiate_commitment: {str(e)}', exc_info=True)
        return Response(
            {
                'detail': 'An error occurred while requesting renegotiation.',
                'error': str(e) if settings.DEBUG else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
