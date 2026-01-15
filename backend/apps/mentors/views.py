"""
Views for mentors app.
"""
from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from shared.permissions import IsApprovedUser
from .models import MentorProfile
from .serializers import MentorProfileSerializer


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
