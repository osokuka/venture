"""
Views for mentors app.
"""
from django.utils import timezone
from django.db.models import Q
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from shared.permissions import IsApprovedUser
from .models import MentorProfile
from .serializers import (
    MentorProfileSerializer,
    MentorProfileCreateSerializer,
    MentorProfileUpdateSerializer
)
from apps.approvals.models import ReviewRequest
from django.contrib.contenttypes.models import ContentType


class PublicMentorListView(generics.ListAPIView):
    """
    List visible mentors (for approved ventures/admin).
    
    GET /api/mentors/public
    Returns:
    - Mentors with visible_to_ventures=True (publicly visible)
    - Only approved mentors
    """
    permission_classes = [IsAuthenticated, IsApprovedUser]
    serializer_class = MentorProfileSerializer
    
    def get_queryset(self):
        """Return mentors visible to the current user."""
        queryset = MentorProfile.objects.filter(
            status='APPROVED',
            visible_to_ventures=True  # Only show mentors who made themselves public
        ).select_related('user')
        
        # Optional search filtering
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(job_title__icontains=search) |
                Q(company__icontains=search) |
                Q(expertise_fields__icontains=search)
            )
        
        # Optional expertise filtering
        expertise = self.request.query_params.get('expertise', '').strip()
        if expertise:
            queryset = queryset.filter(expertise_fields__icontains=expertise)
        
        # Optional industry filtering
        industry = self.request.query_params.get('industry', '').strip()
        if industry:
            queryset = queryset.filter(industries_of_interest__icontains=industry)
        
        return queryset.order_by('-created_at')


class PublicMentorDetailView(generics.RetrieveAPIView):
    """
    Get mentor detail (for approved ventures/admin).
    
    GET /api/mentors/{id}
    Only returns mentors that are visible to the current user.
    """
    permission_classes = [IsAuthenticated, IsApprovedUser]
    serializer_class = MentorProfileSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return mentors visible to the current user."""
        return MentorProfile.objects.filter(
            status='APPROVED',
            visible_to_ventures=True  # Only show mentors who made themselves public
        ).select_related('user')


class MentorProfileCreateUpdateView(generics.CreateAPIView, generics.RetrieveUpdateAPIView):
    """
    Create or update mentor profile.
    
    POST /api/mentors/profile - Create mentor profile (draft)
    GET /api/mentors/profile/me - Get own mentor profile
    PATCH /api/mentors/profile/me - Update own profile
    """
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        """Get mentor profile for current user."""
        try:
            return MentorProfile.objects.get(user=self.request.user)
        except MentorProfile.DoesNotExist:
            return None
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MentorProfileCreateSerializer
        elif self.request.method == 'PATCH':
            return MentorProfileUpdateSerializer
        return MentorProfileSerializer
    
    def create(self, request, *args, **kwargs):
        """Create mentor profile."""
        # Check if profile already exists
        if MentorProfile.objects.filter(user=request.user).exists():
            return Response(
                {'detail': 'Mentor profile already exists. Use PATCH to update.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def retrieve(self, request, *args, **kwargs):
        """Get own mentor profile."""
        profile = self.get_object()
        if not profile:
            return Response(
                {'detail': 'Mentor profile not found. Create one first.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Update own mentor profile."""
        profile = self.get_object()
        if not profile:
            return Response(
                {'detail': 'Mentor profile not found. Create one first.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_mentor_profile(request):
    """
    Submit mentor profile for admin approval.
    
    POST /api/mentors/profile/submit
    """
    try:
        profile = MentorProfile.objects.get(user=request.user)
    except MentorProfile.DoesNotExist:
        return Response(
            {'detail': 'Mentor profile not found. Create one first.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if profile can be submitted
    if profile.status not in ['DRAFT', 'REJECTED']:
        return Response(
            {'detail': f'Profile with status {profile.status} cannot be submitted.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if there's already a pending review
    content_type = ContentType.objects.get_for_model(MentorProfile)
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
