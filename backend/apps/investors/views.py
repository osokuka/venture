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
from django.contrib.contenttypes.models import ContentType


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
        """Create investor profile."""
        # Check if profile already exists
        if InvestorProfile.objects.filter(user=request.user).exists():
            return Response(
                {'detail': 'Investor profile already exists. Use PATCH to update.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def retrieve(self, request, *args, **kwargs):
        """Get own investor profile."""
        profile = self.get_object()
        if not profile:
            return Response(
                {'detail': 'Investor profile not found. Create one first.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Update own investor profile."""
        profile = self.get_object()
        if not profile:
            return Response(
                {'detail': 'Investor profile not found. Create one first.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
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
    List visible investors (for approved ventures/admin).
    
    GET /api/investors/public
    Returns:
    - Investors with visible_to_ventures=True (publicly visible)
    - Investors visible to the current venture user (via InvestorVisibleToVenture)
    """
    permission_classes = [IsAuthenticated, IsApprovedUser]
    serializer_class = InvestorProfileSerializer
    
    def get_queryset(self):
        """Return investors visible to the current user."""
        queryset = InvestorProfile.objects.filter(
            status='APPROVED'
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
        # Admin can see all approved investors
        elif self.request.user.role == 'ADMIN':
            pass  # Show all approved investors
        
        return queryset.order_by('-created_at')


class PublicInvestorDetailView(generics.RetrieveAPIView):
    """
    Get investor detail (for approved ventures/admin).
    
    GET /api/investors/{id}
    Only returns investors that are visible to the current user.
    """
    permission_classes = [IsAuthenticated, IsApprovedUser]
    serializer_class = InvestorProfileSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return investors visible to the current user."""
        queryset = InvestorProfile.objects.filter(
            status='APPROVED'
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
        # Admin can see all approved investors
        elif self.request.user.role == 'ADMIN':
            pass  # Show all approved investors
        
        return queryset
