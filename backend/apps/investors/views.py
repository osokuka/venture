"""
Views for investors app.
"""
from django.utils import timezone
from django.db.models import Q
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from shared.permissions import IsApprovedUser, IsAdminOrReviewer
from .models import InvestorProfile, InvestorVisibleToVenture
from .serializers import (
    InvestorProfileSerializer,
    InvestorProfileCreateSerializer,
    InvestorProfileUpdateSerializer
)
from apps.approvals.models import ReviewRequest
from apps.ventures.models import (
    PitchDeckShare, PitchDeckInterest, InvestmentCommitment, VentureDocument, VentureProduct
)
from apps.ventures.serializers import InvestorSharedPitchDeckSerializer
from django.contrib.contenttypes.models import ContentType
from django.conf import settings


class InvestorProfileCreateUpdateView(generics.CreateAPIView, generics.RetrieveUpdateAPIView):
    """
    Create or update investor profile.
    
    POST /api/investors/profile - Create investor profile (draft)
    GET /api/investors/profile/me - Get own investor profile
    PATCH /api/investors/profile/me - Update own profile
    """
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        """Get investor profile for current user."""
        try:
            return InvestorProfile.objects.get(user=self.request.user)
        except InvestorProfile.DoesNotExist:
            return None
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InvestorProfileCreateSerializer
        elif self.request.method == 'PATCH':
            return InvestorProfileUpdateSerializer
        return InvestorProfileSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create investor profile and automatically submit for approval.
        
        This endpoint is called during registration (via AuthContext.completeRegistration)
        and automatically sets status='SUBMITTED' and creates a ReviewRequest.
        This ensures all new investor profiles immediately appear in /dashboard/admin/approvals
        without requiring any manual "Submit for approval" action from the user.
        
        Workflow:
        1. User completes registration form → AuthContext.completeRegistration()
        2. Frontend calls investorService.createProfile() → POST /api/investors/profile
        3. This view creates profile (serializer sets DRAFT initially)
        4. View immediately sets status='SUBMITTED', submitted_at=now(), creates ReviewRequest
        5. Profile appears in admin approvals queue automatically
        
        Note: Serializer defaults to DRAFT, but this view overrides it to SUBMITTED.
        This ensures backward compatibility if serializer is called directly elsewhere.
        """
        # Check if profile already exists
        if InvestorProfile.objects.filter(user=request.user).exists():
            return Response(
                {'detail': 'Investor profile already exists. Use PATCH to update.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        
        # Automatically submit profile for approval (set status to SUBMITTED and create ReviewRequest)
        from django.contrib.contenttypes.models import ContentType
        content_type = ContentType.objects.get_for_model(InvestorProfile)
        
        # Check if review request already exists (shouldn't happen on create, but defensive)
        existing_review = ReviewRequest.objects.filter(
            content_type=content_type,
            object_id=profile.id,
            status='SUBMITTED'
        ).exists()
        
        if not existing_review:
            # Create review request for admin approval
            ReviewRequest.objects.create(
                content_type=content_type,
                object_id=profile.id,
                submitted_by=request.user,
                status='SUBMITTED'
            )
            
            # Update profile status to SUBMITTED
            profile.status = 'SUBMITTED'
            profile.submitted_at = timezone.now()
            profile.save(update_fields=['status', 'submitted_at'])
        
        # Refresh serializer to return updated status
        serializer = InvestorProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def retrieve(self, request, *args, **kwargs):
        """Get own investor profile."""
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
    
    def get(self, request, *args, **kwargs):
        """Handle GET requests for /profile/me (no pk in URL)."""
        return self.retrieve(request, *args, **kwargs)
    
    def patch(self, request, *args, **kwargs):
        """Handle PATCH requests for /profile/me (no pk in URL)."""
        return self.update(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """
        Update own investor profile (upsert pattern).
        If profile doesn't exist, create it automatically.
        If profile was REJECTED, automatically resubmit for approval.
        
        This handles edge cases where profile creation failed during registration
        (e.g., validation errors that were caught but didn't block account creation).
        """
        profile = self.get_object()
        
        # If profile doesn't exist, create it (upsert pattern)
        # This handles cases where profile creation failed during registration
        if not profile:
            # Use create serializer to validate and create the profile
            create_serializer = InvestorProfileCreateSerializer(
                data=request.data,
                context={'request': request}
            )
            create_serializer.is_valid(raise_exception=True)
            profile = create_serializer.save()
            
            # Automatically submit the newly created profile for approval
            content_type = ContentType.objects.get_for_model(InvestorProfile)
            existing_review = ReviewRequest.objects.filter(
                content_type=content_type,
                object_id=profile.id,
                status='SUBMITTED'
            ).exists()
            
            if not existing_review:
                ReviewRequest.objects.create(
                    content_type=content_type,
                    object_id=profile.id,
                    submitted_by=request.user,
                    status='SUBMITTED'
                )
                
                profile.status = 'SUBMITTED'
                profile.submitted_at = timezone.now()
                profile.save(update_fields=['status', 'submitted_at'])
            
            # Return the newly created profile
            serializer = InvestorProfileSerializer(profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # Profile exists - proceed with normal update
        was_rejected = profile.status == 'REJECTED'
        
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        
        # Auto-resubmit if profile was REJECTED (user fixed issues and updated)
        if was_rejected:
            # Use module-level ContentType import to avoid shadowing/local binding issues
            content_type = ContentType.objects.get_for_model(InvestorProfile)
            
            # Check if there's already a pending review
            existing_review = ReviewRequest.objects.filter(
                content_type=content_type,
                object_id=profile.id,
                status='SUBMITTED'
            ).exists()
            
            if not existing_review:
                # Create new review request for resubmission
                ReviewRequest.objects.create(
                    content_type=content_type,
                    object_id=profile.id,
                    submitted_by=request.user,
                    status='SUBMITTED'
                )
                
                # Update profile status to SUBMITTED
                profile.status = 'SUBMITTED'
                profile.submitted_at = timezone.now()
                profile.save(update_fields=['status', 'submitted_at'])
        
        # Refresh serializer to return updated status
        serializer = InvestorProfileSerializer(profile)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_investor_profile(request):
    """
    Submit investor profile for admin approval.
    
    POST /api/investors/profile/submit
    """
    try:
        profile = InvestorProfile.objects.get(user=request.user)
    except InvestorProfile.DoesNotExist:
        return Response(
            {'detail': 'Investor profile not found. Create one first.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if profile can be submitted
    if profile.status not in ['DRAFT', 'REJECTED']:
        return Response(
            {'detail': f'Profile with status {profile.status} cannot be submitted.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if there's already a pending review
    content_type = ContentType.objects.get_for_model(InvestorProfile)
    existing_review = ReviewRequest.objects.filter(
        content_type=content_type,
        object_id=profile.id,
        status='SUBMITTED'
    ).exists()
    
    if existing_review:
        return Response(
            {'detail': 'This profile already has a pending review request.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create review request
    review_request = ReviewRequest.objects.create(
        content_type=content_type,
        object_id=profile.id,
        submitted_by=request.user,
        status='SUBMITTED'
    )
    
    # Update profile status
    profile.status = 'SUBMITTED'
    profile.submitted_at = timezone.now()
    profile.save(update_fields=['status', 'submitted_at'])
    
    return Response(
        {'detail': 'Profile submitted for approval.', 'review_id': str(review_request.id)},
        status=status.HTTP_200_OK
    )


class PublicInvestorListView(generics.ListAPIView):
    """
    List visible investors (public endpoint - accessible to all authenticated users).
    
    GET /api/investors/public
    Returns:
    - Investors with visible_to_ventures=True (publicly visible)
    - Investors visible to the current venture user (via InvestorVisibleToVenture)
    
    Note: This is a public listing, so authenticated users can view it even without
    approved profiles. However, only approved ventures can see investors who have
    made themselves visible to specific ventures.
    """
    permission_classes = [IsAuthenticated]  # Allow all authenticated users, not just approved ones
    serializer_class = InvestorProfileSerializer
    
    def get_queryset(self):
        """Return investors visible to the current user."""
        # Show both APPROVED and SUBMITTED investors
        # APPROVED: Fully approved and visible
        # SUBMITTED: Pending approval but visible so ventures can share pitch decks with them
        queryset = InvestorProfile.objects.filter(
            status__in=['APPROVED', 'SUBMITTED']
        ).select_related('user')
        
        # If user is a venture, show:
        # 1. Investors with visible_to_ventures=True (publicly visible)
        # 2. Investors who have made themselves visible to this venture
        if self.request.user.role == 'VENTURE':
            # Get investors visible to this venture
            visible_investor_ids = InvestorVisibleToVenture.objects.filter(
                venture_user=self.request.user
            ).values_list('investor_id', flat=True)
            
            queryset = queryset.filter(
                Q(visible_to_ventures=True) | Q(id__in=visible_investor_ids)
            )
        # Admin can see all approved and submitted investors
        elif self.request.user.role == 'ADMIN':
            pass  # Show all approved and submitted investors
        
        return queryset.order_by('-created_at')


class PublicInvestorDetailView(generics.RetrieveAPIView):
    """
    Get investor detail (public endpoint - accessible to all authenticated users).
    
    GET /api/investors/{id}
    Only returns investors that are visible to the current user.
    
    Note: This is a public endpoint, so authenticated users can view investor details
    even without approved profiles. However, only approved ventures can see investors
    who have made themselves visible to specific ventures.
    """
    permission_classes = [IsAuthenticated]  # Allow all authenticated users, not just approved ones
    serializer_class = InvestorProfileSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return investors visible to the current user."""
        # Show both APPROVED and SUBMITTED investors
        # APPROVED: Fully approved and visible
        # SUBMITTED: Pending approval but visible so ventures can share pitch decks with them
        queryset = InvestorProfile.objects.filter(
            status__in=['APPROVED', 'SUBMITTED']
        ).select_related('user')
        
        # If user is a venture, show:
        # 1. Investors with visible_to_ventures=True (publicly visible)
        # 2. Investors who have made themselves visible to this venture
        if self.request.user.role == 'VENTURE':
            # Get investors visible to this venture
            visible_investor_ids = InvestorVisibleToVenture.objects.filter(
                venture_user=self.request.user
            ).values_list('investor_id', flat=True)
            
            queryset = queryset.filter(
                Q(visible_to_ventures=True) | Q(id__in=visible_investor_ids)
            )
        # Admin can see all approved and submitted investors
        elif self.request.user.role == 'ADMIN':
            pass  # Show all approved and submitted investors
        
        return queryset


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_shared_pitch_decks(request):
    """
    List pitch decks shared with the current investor.
    
    GET /api/investors/shared-pitch-decks
    Returns pitch decks that have been proactively shared with the investor.
    Only investors can access this endpoint.
    """
    try:
        # Security: Only investors can access this endpoint
        if request.user.role != 'INVESTOR':
            return Response(
                {'detail': 'Only investors can view shared pitch decks.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all pitch decks shared with this investor
        # Include related objects for efficient querying
        shares = PitchDeckShare.objects.filter(
            investor=request.user
        ).select_related(
            'document',
            'document__product',
            'document__product__user',
            'shared_by'
        ).order_by('-shared_at')
        
        # Serialize the shares with full product/document details
        # Pass request context so serializer can check interest/commitment status
        serializer = InvestorSharedPitchDeckSerializer(shares, many=True, context={'request': request})
        
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Error in list_shared_pitch_decks: {str(e)}', exc_info=True)
        
        # Return a safe error response
        return Response(
            {
                'detail': 'An error occurred while fetching shared pitch decks.',
                'error': str(e) if settings.DEBUG else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def follow_pitch_deck(request, product_id, doc_id):
    """
    Follow/monitor a pitch deck (express interest).
    
    POST /api/investors/products/{product_id}/documents/{doc_id}/follow
    Creates or reactivates a PitchDeckInterest record.
    Only investors can follow pitch decks.
    """
    try:
        # Security: Only investors can follow pitch decks
        if request.user.role != 'INVESTOR':
            return Response(
                {'detail': 'Only investors can follow pitch decks.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate UUIDs
        try:
            product = VentureProduct.objects.get(id=product_id, status='APPROVED', is_active=True)
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
        
        # Create or reactivate interest
        interest, created = PitchDeckInterest.objects.get_or_create(
            document=document,
            investor=request.user,
            defaults={'is_active': True}
        )
        
        if not created:
            # Reactivate if previously unfollowed
            interest.is_active = True
            interest.save(update_fields=['is_active'])
        
        return Response({
            'detail': 'Pitch deck followed successfully.',
            'is_following': True
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Error in follow_pitch_deck: {str(e)}', exc_info=True)
        return Response(
            {
                'detail': 'An error occurred while following the pitch deck.',
                'error': str(e) if settings.DEBUG else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unfollow_pitch_deck(request, product_id, doc_id):
    """
    Unfollow a pitch deck (remove interest).
    
    POST /api/investors/products/{product_id}/documents/{doc_id}/unfollow
    Deactivates the PitchDeckInterest record.
    Only investors can unfollow pitch decks.
    """
    try:
        # Security: Only investors can unfollow pitch decks
        if request.user.role != 'INVESTOR':
            return Response(
                {'detail': 'Only investors can unfollow pitch decks.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate UUIDs
        try:
            product = VentureProduct.objects.get(id=product_id, status='APPROVED', is_active=True)
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
        
        # Deactivate interest
        interest = PitchDeckInterest.objects.filter(
            document=document,
            investor=request.user
        ).first()
        
        if interest:
            interest.is_active = False
            interest.save(update_fields=['is_active'])
            return Response({
                'detail': 'Pitch deck unfollowed successfully.',
                'is_following': False
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'detail': 'You are not following this pitch deck.',
                'is_following': False
            }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Error in unfollow_pitch_deck: {str(e)}', exc_info=True)
        return Response(
            {
                'detail': 'An error occurred while unfollowing the pitch deck.',
                'error': str(e) if settings.DEBUG else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def commit_to_invest(request, product_id, doc_id):
    """
    Commit to investing in a venture (express investment intent).
    
    POST /api/investors/products/{product_id}/documents/{doc_id}/commit
    Body: {
        "amount": "500000",  # Optional: intended investment amount
        "message": "Interested in Series A round"  # Optional: message to venture
    }
    Creates or updates an InvestmentCommitment record.
    Only investors can commit to invest.
    """
    try:
        # Security: Only investors can commit to invest
        if request.user.role != 'INVESTOR':
            return Response(
                {'detail': 'Only investors can commit to invest.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate UUIDs
        try:
            product = VentureProduct.objects.get(id=product_id, status='APPROVED', is_active=True)
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
        
        # Get amount and message from request
        amount = request.data.get('amount')
        message = request.data.get('message', '')
        
        # Validate amount if provided
        if amount:
            try:
                from decimal import Decimal
                amount_decimal = Decimal(str(amount))
                if amount_decimal < 0:
                    return Response(
                        {'detail': 'Investment amount must be positive.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {'detail': 'Invalid investment amount format.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            amount_decimal = None
        
        # Validate message length
        if message and len(message) > 2000:
            return Response(
                {'detail': 'Message must be 2,000 characters or less.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create conversation between investor and venture user
        from apps.messaging.models import Conversation
        from django.db.models import Q, Count
        
        # Helper function to get or create conversation
        existing_conversation = Conversation.objects.filter(
            Q(participants=request.user) & Q(participants=product.user)
        ).annotate(
            participant_count=Count('participants')
        ).filter(
            participant_count=2
        ).distinct().first()
        
        if existing_conversation:
            conversation = existing_conversation
        else:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, product.user)
        
        # Create or update commitment
        previous_amount = None
        commitment, created = InvestmentCommitment.objects.get_or_create(
            document=document,
            investor=request.user,
            defaults={
                'product': product,
                'status': 'COMMITTED',
                'amount': amount_decimal,
                'message': message.strip() if message else None,
                'conversation': conversation  # Link conversation to commitment
            }
        )
        
        if not created:
            # Update existing commitment
            previous_amount = commitment.amount
            commitment.status = 'COMMITTED'
            if amount_decimal is not None:
                commitment.amount = amount_decimal
            if message:
                commitment.message = message.strip()
            # Link conversation if not already linked
            if not commitment.conversation:
                commitment.conversation = conversation
            commitment.save(update_fields=['status', 'amount', 'message', 'conversation', 'updated_at'])
        
        # Create system message in conversation
        from apps.messaging.models import Message
        from django.utils import timezone
        from decimal import Decimal
        
        amount_str = f"${commitment.amount:,.0f}" if commitment.amount else "Amount not specified"
        
        if created:
            body = f"💰 Investment commitment created: {amount_str} for {product.name}"
            if commitment.message:
                body += f"\n\nMessage: {commitment.message}"
        else:
            prev_amount_str = f"${previous_amount:,.0f}" if previous_amount else "Amount not specified"
            body = f"📝 Investment commitment updated: {amount_str} (previously {prev_amount_str}) for {product.name}"
            if commitment.message:
                body += f"\n\nMessage: {commitment.message}"
        
        # Create system message (use product.user as sender for context)
        system_message = Message.objects.create(
            conversation=conversation,
            sender=product.user,  # Use venture user as sender for system messages
            body=body
        )
        
        # Update conversation's last_message_at
        conversation.last_message_at = timezone.now()
        conversation.save(update_fields=['last_message_at'])
        
        return Response({
            'detail': 'Investment commitment recorded successfully.',
            'commitment_id': str(commitment.id),
            'status': commitment.status,
            'amount': str(commitment.amount) if commitment.amount else None,
            'conversation_id': str(conversation.id)  # Return conversation ID for frontend
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Error in commit_to_invest: {str(e)}', exc_info=True)
        return Response(
            {
                'detail': 'An error occurred while recording investment commitment.',
                'error': str(e) if settings.DEBUG else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_commitment(request, product_id, commitment_id):
    """
    Update an investment commitment after renegotiation request.
    
    POST /api/investors/products/{product_id}/commitments/{commitment_id}/update
    Body: {
        "amount": "600000",  # Optional: new investment amount
        "message": "Updated terms based on negotiation"  # Optional: message to venture
    }
    Only the investor who made the commitment can update it.
    Can only update if venture_response is 'RENEGOTIATE'.
    """
    try:
        # Security: Only investors can update commitments
        if request.user.role != 'INVESTOR':
            return Response(
                {'detail': 'Only investors can update commitments.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate UUIDs
        try:
            product = VentureProduct.objects.get(id=product_id, status='APPROVED', is_active=True)
        except VentureProduct.DoesNotExist:
            return Response(
                {'detail': 'Product not found or not available.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get commitment
        try:
            commitment = InvestmentCommitment.objects.get(
                id=commitment_id,
                product=product,
                investor=request.user
            )
        except InvestmentCommitment.DoesNotExist:
            return Response(
                {'detail': 'Commitment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if commitment can be updated (must be in RENEGOTIATE status)
        if commitment.venture_response != 'RENEGOTIATE':
            return Response(
                {
                    'detail': 'Commitment can only be updated when renegotiation has been requested.',
                    'current_status': commitment.venture_response
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get amount and message from request
        amount = request.data.get('amount')
        message = request.data.get('message', '')
        
        # Validate amount if provided
        previous_amount = commitment.amount
        if amount:
            try:
                from decimal import Decimal
                amount_decimal = Decimal(str(amount))
                if amount_decimal < 0:
                    return Response(
                        {'detail': 'Investment amount must be positive.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {'detail': 'Invalid investment amount format.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            amount_decimal = commitment.amount  # Keep existing amount if not provided
        
        # Validate message length
        if message and len(message) > 2000:
            return Response(
                {'detail': 'Message must be 2,000 characters or less.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update commitment (reset venture_response to PENDING for new review)
        commitment.amount = amount_decimal
        commitment.message = message.strip() if message else commitment.message
        commitment.venture_response = 'PENDING'  # Reset to pending for venture to review
        commitment.venture_response_at = None
        commitment.venture_response_message = None
        commitment.responded_by = None
        commitment.updated_at = timezone.now()
        commitment.save(update_fields=['amount', 'message', 'venture_response', 'venture_response_at', 'venture_response_message', 'responded_by', 'updated_at'])
        
        # Get or create conversation if not already linked
        if not commitment.conversation:
            from apps.messaging.models import Conversation
            from django.db.models import Q, Count
            
            existing_conversation = Conversation.objects.filter(
                Q(participants=request.user) & Q(participants=product.user)
            ).annotate(
                participant_count=Count('participants')
            ).filter(
                participant_count=2
            ).distinct().first()
            
            if existing_conversation:
                conversation = existing_conversation
            else:
                conversation = Conversation.objects.create()
                conversation.participants.add(request.user, product.user)
            
            commitment.conversation = conversation
            commitment.save(update_fields=['conversation'])
        else:
            conversation = commitment.conversation
        
        # Create system message in conversation
        from apps.messaging.models import Message
        
        amount_str = f"${commitment.amount:,.0f}" if commitment.amount else "Amount not specified"
        prev_amount_str = f"${previous_amount:,.0f}" if previous_amount else "Amount not specified"
        
        body = f"📝 Investment commitment updated: {amount_str} (previously {prev_amount_str}) for {product.name}"
        if commitment.message:
            body += f"\n\nMessage: {commitment.message}"
        
        # Create system message (use product.user as sender for context)
        system_message = Message.objects.create(
            conversation=conversation,
            sender=product.user,  # Use venture user as sender for system messages
            body=body
        )
        
        # Update conversation's last_message_at
        conversation.last_message_at = timezone.now()
        conversation.save(update_fields=['last_message_at'])
        
        return Response({
            'detail': 'Investment commitment updated successfully. Waiting for venture response.',
            'commitment_id': str(commitment.id),
            'status': commitment.status,
            'amount': str(commitment.amount) if commitment.amount else None,
            'venture_response': commitment.venture_response,
            'conversation_id': str(conversation.id)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Error in update_commitment: {str(e)}', exc_info=True)
        return Response(
            {
                'detail': 'An error occurred while updating investment commitment.',
                'error': str(e) if settings.DEBUG else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw_commitment(request, product_id, commitment_id):
    """
    Withdraw/retract an investment commitment.
    
    POST /api/investors/products/{product_id}/commitments/{commitment_id}/withdraw
    Body: {
        "message": "Optional reason for withdrawal"  # Optional
    }
    Only the investor who made the commitment can withdraw it.
    Cannot withdraw if commitment has been ACCEPTED (deal already created).
    """
    try:
        # Security: Only investors can withdraw commitments
        if request.user.role != 'INVESTOR':
            return Response(
                {'detail': 'Only investors can withdraw commitments.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate UUIDs
        try:
            product = VentureProduct.objects.get(id=product_id, status='APPROVED', is_active=True)
        except VentureProduct.DoesNotExist:
            return Response(
                {'detail': 'Product not found or not available.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get commitment
        try:
            commitment = InvestmentCommitment.objects.get(
                id=commitment_id,
                product=product,
                investor=request.user
            )
        except InvestmentCommitment.DoesNotExist:
            return Response(
                {'detail': 'Commitment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if commitment can be withdrawn (cannot withdraw accepted deals)
        if commitment.venture_response == 'ACCEPTED':
            return Response(
                {
                    'detail': 'Cannot withdraw an accepted commitment. The deal has already been created. Please contact the venture directly.',
                    'current_status': commitment.venture_response
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already withdrawn
        if commitment.status == 'WITHDRAWN':
            return Response(
                {
                    'detail': 'This commitment has already been withdrawn.',
                    'current_status': commitment.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get optional message
        message = request.data.get('message', '').strip()
        
        # Validate message length
        if message and len(message) > 2000:
            return Response(
                {'detail': 'Message must be 2,000 characters or less.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Store previous status for system message
        previous_status = commitment.status
        previous_amount = commitment.amount
        
        # Withdraw the commitment
        commitment.status = 'WITHDRAWN'
        if message:
            commitment.message = message  # Update message with withdrawal reason
        commitment.updated_at = timezone.now()
        commitment.save(update_fields=['status', 'message', 'updated_at'])
        
        # Get or create conversation if not already linked
        if not commitment.conversation:
            from apps.messaging.models import Conversation
            from django.db.models import Q, Count
            
            existing_conversation = Conversation.objects.filter(
                Q(participants=request.user) & Q(participants=product.user)
            ).annotate(
                participant_count=Count('participants')
            ).filter(
                participant_count=2
            ).distinct().first()
            
            if existing_conversation:
                conversation = existing_conversation
            else:
                conversation = Conversation.objects.create()
                conversation.participants.add(request.user, product.user)
            
            commitment.conversation = conversation
            commitment.save(update_fields=['conversation'])
        else:
            conversation = commitment.conversation
        
        # Create system message in conversation
        from apps.messaging.models import Message
        
        amount_str = f"${previous_amount:,.0f}" if previous_amount else "Amount not specified"
        
        body = f"❌ Investment commitment withdrawn: {amount_str} for {product.name}"
        if message:
            body += f"\n\nReason: {message}"
        
        # Create system message (use product.user as sender for context)
        system_message = Message.objects.create(
            conversation=conversation,
            sender=product.user,  # Use venture user as sender for system messages
            body=body
        )
        
        # Update conversation's last_message_at
        conversation.last_message_at = timezone.now()
        conversation.save(update_fields=['last_message_at'])
        
        return Response({
            'detail': 'Investment commitment withdrawn successfully.',
            'commitment_id': str(commitment.id),
            'status': commitment.status,
            'conversation_id': str(conversation.id)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Error in withdraw_commitment: {str(e)}', exc_info=True)
        return Response(
            {
                'detail': 'An error occurred while withdrawing investment commitment.',
                'error': str(e) if settings.DEBUG else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_investor_portfolio(request):
    """
    Get investor portfolio (committed investments).
    
    GET /api/investors/portfolio
    Returns all InvestmentCommitment records for the current investor with full product/document details.
    Only investors can access their portfolio.
    """
    try:
        # Security: Only investors can view their portfolio
        if request.user.role != 'INVESTOR':
            return Response(
                {'detail': 'Only investors can view their portfolio.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all committed investments for the investor
        commitments = InvestmentCommitment.objects.filter(
            investor=request.user
        ).select_related(
            'document',
            'document__product',
            'document__product__user',
            'product'
        ).order_by('-committed_at')
        
        # Serialize commitments with product/document details
        portfolio_data = []
        total_committed = 0
        
        for commitment in commitments:
            product = commitment.product
            document = commitment.document
            
            # Calculate total committed amount
            if commitment.amount:
                total_committed += float(commitment.amount)
            
            portfolio_data.append({
                'commitment_id': str(commitment.id),
                'status': commitment.status,
                'amount': str(commitment.amount) if commitment.amount else None,
                'message': commitment.message,
                'committed_at': commitment.committed_at.isoformat() if commitment.committed_at else None,
                'updated_at': commitment.updated_at.isoformat() if commitment.updated_at else None,
                # Venture response (deal status)
                'venture_response': commitment.venture_response,
                'venture_response_at': commitment.venture_response_at.isoformat() if commitment.venture_response_at else None,
                'venture_response_message': commitment.venture_response_message,
                'is_deal': commitment.is_deal,
                # Product information
                'product_id': str(product.id) if product else None,
                'product_name': product.name if product else None,
                'product_industry': product.industry_sector if product else None,
                'product_description': product.short_description if product else None,
                'product_status': product.status if product else None,
                'product_user_id': str(product.user.id) if product and product.user else None,
                # Document information
                'document_id': str(document.id) if document else None,
                'document_type': document.document_type if document else None,
                'funding_amount': document.funding_amount if document else None,
                'funding_stage': document.funding_stage if document else None,
            })
        
        return Response({
            'count': len(portfolio_data),
            'total_committed': str(total_committed),
            'results': portfolio_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Error in get_investor_portfolio: {str(e)}', exc_info=True)
        return Response(
            {
                'detail': 'An error occurred while fetching portfolio data.',
                'error': str(e) if settings.DEBUG else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
