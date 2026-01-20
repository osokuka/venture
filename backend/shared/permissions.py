"""
Custom permission classes for the VentureUP Link API.
"""
from rest_framework import permissions


class IsApprovedUser(permissions.BasePermission):
    """
    Permission check to ensure user's profile is approved.
    """
    message = "Your profile must be approved to perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin users always have permission
        if request.user.role == 'ADMIN':
            return True
        
        # Check if user has at least one approved product
        if request.user.role == 'VENTURE':
            from apps.ventures.models import VentureProduct
            # User needs at least one approved and active product
            return VentureProduct.objects.filter(
                user=request.user,
                status='APPROVED',
                is_active=True
            ).exists()
        
        elif request.user.role == 'INVESTOR':
            from apps.investors.models import InvestorProfile
            try:
                profile = InvestorProfile.objects.get(user=request.user)
                return profile.status == 'APPROVED'
            except InvestorProfile.DoesNotExist:
                return False
        
        elif request.user.role == 'MENTOR':
            from apps.mentors.models import MentorProfile
            try:
                profile = MentorProfile.objects.get(user=request.user)
                return profile.status == 'APPROVED'
            except MentorProfile.DoesNotExist:
                return False
        
        return False


class IsApprovedOrSubmittedUser(permissions.BasePermission):
    """
    Permission check that allows both APPROVED and SUBMITTED users.
    Useful for read-only operations where we want to allow users who have submitted their profiles.
    """
    message = "Your profile must be submitted or approved to perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin users always have permission
        if request.user.role == 'ADMIN':
            return True
        
        # For ventures, still require at least one approved product
        if request.user.role == 'VENTURE':
            from apps.ventures.models import VentureProduct
            # User needs at least one approved and active product
            return VentureProduct.objects.filter(
                user=request.user,
                status='APPROVED',
                is_active=True
            ).exists()
        
        elif request.user.role == 'INVESTOR':
            from apps.investors.models import InvestorProfile
            try:
                profile = InvestorProfile.objects.get(user=request.user)
                # Allow both SUBMITTED and APPROVED investors
                return profile.status in ['SUBMITTED', 'APPROVED']
            except InvestorProfile.DoesNotExist:
                return False
        
        elif request.user.role == 'MENTOR':
            from apps.mentors.models import MentorProfile
            try:
                profile = MentorProfile.objects.get(user=request.user)
                # Allow both SUBMITTED and APPROVED mentors
                return profile.status in ['SUBMITTED', 'APPROVED']
            except MentorProfile.DoesNotExist:
                return False
        
        return False


class IsAdminOrReviewer(permissions.BasePermission):
    """
    Permission check for admin or reviewer roles.
    """
    message = "You must be an admin or reviewer to perform this action."

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners to edit their own objects.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.user == request.user
