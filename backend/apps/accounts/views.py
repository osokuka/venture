"""
Views for accounts app.
"""
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db.models import Q, Count
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from .models import User, EmailVerificationToken
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    EmailVerificationSerializer,
    AdminUserUpsertSerializer
)
from .tasks import send_verification_email
from shared.permissions import IsAdminOrReviewer


class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint.
    POST /api/auth/register
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Get the verification token for the user
        verification_token = EmailVerificationToken.objects.filter(
            user=user,
            used_at__isnull=True
        ).order_by('-created_at').first()
        
        # Send verification email via Celery
        if verification_token:
            send_verification_email.delay(str(user.id), verification_token.token)
        
        return Response({
            'message': 'Registration successful. Please check your email for verification.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that updates last_login.
    POST /api/auth/login
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Security: Use get() with exception handling instead of direct get()
            # This prevents information disclosure if email doesn't exist
            try:
                user = User.objects.get(email=request.data.get('email'))
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])
            except User.DoesNotExist:
                # User not found - don't reveal this information
                pass
        
        return response


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Verify user email with token.
    POST /api/auth/verify-email
    """
    serializer = EmailVerificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    token_obj = EmailVerificationToken.objects.get(token=serializer.validated_data['token'])
    token_obj.user.is_email_verified = True
    token_obj.user.save(update_fields=['is_email_verified'])
    
    token_obj.used_at = timezone.now()
    token_obj.save(update_fields=['used_at'])
    
    return Response({
        'message': 'Email verified successfully.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_verification(request):
    """
    Resend verification email.
    POST /api/auth/resend-verification
    """
    if request.user.is_email_verified:
        return Response({
            'message': 'Email is already verified.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create new verification token
    verification_token = EmailVerificationToken.create_for_user(request.user)
    
    # Send verification email via Celery
    send_verification_email.delay(str(request.user.id), verification_token.token)
    
    return Response({
        'message': 'Verification email sent.'
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Get or update current authenticated user.
    GET /api/auth/me - Get current user
    PATCH /api/auth/me - Update current user profile
    """
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    # PATCH - Update user profile
    # Security: Remove any attempt to modify restricted fields
    update_data = request.data.copy()
    # Prevent privilege escalation - remove role, email, is_active, is_email_verified from update
    restricted_fields = ['role', 'email', 'is_active', 'is_email_verified', 'id', 'date_joined']
    for field in restricted_fields:
        update_data.pop(field, None)
    
    serializer = UserSerializer(
        request.user,
        data=update_data,
        partial=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    
    return Response(serializer.data, status=status.HTTP_200_OK)


class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination for admin endpoints."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class AdminUserListView(generics.ListAPIView):
    """
    Admin endpoint to list all users with filtering and pagination.
    GET /api/admin/users
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReviewer]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = User.objects.all()
        
        # Security: Whitelist allowed roles to prevent injection
        role = self.request.query_params.get('role', None)
        if role and role != 'ALL':
            allowed_roles = ['VENTURE', 'INVESTOR', 'MENTOR', 'ADMIN']
            if role.upper() in allowed_roles:
                queryset = queryset.filter(role=role.upper())
        
        # Security: Limit search length to prevent DoS
        search = self.request.query_params.get('search', None)
        if search:
            # Limit search string length
            search = search[:100]  # Max 100 characters
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        return queryset.order_by('-date_joined')


class AdminUserListCreateView(generics.ListCreateAPIView):
    """
    Admin endpoint to list/create users.

    - GET  /api/admin/users
    - POST /api/admin/users
    """
    permission_classes = [IsAuthenticated, IsAdminOrReviewer]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = User.objects.all()

        # Security: Whitelist allowed roles to prevent injection
        role = self.request.query_params.get('role', None)
        if role and role != 'ALL':
            allowed_roles = ['VENTURE', 'INVESTOR', 'MENTOR', 'ADMIN']
            if role.upper() in allowed_roles:
                queryset = queryset.filter(role=role.upper())

        # Security: Limit search length to prevent DoS
        search = self.request.query_params.get('search', None)
        if search:
            # Limit search string length
            search = search[:100]  # Max 100 characters
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search)
            )

        return queryset.order_by('-date_joined')

    def get_serializer_class(self):
        # For list we return the normal user serializer (smaller surface).
        if self.request.method == 'GET':
            return UserSerializer
        return AdminUserUpsertSerializer


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin endpoint to retrieve/update/delete a user.

    - GET    /api/admin/users/<uuid:pk>
    - PATCH  /api/admin/users/<uuid:pk>
    - DELETE /api/admin/users/<uuid:pk>
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsAdminOrReviewer]
    serializer_class = AdminUserUpsertSerializer

    def perform_destroy(self, instance):
        # Prevent admins from deleting themselves by accident.
        if instance.id == self.request.user.id:
            raise PermissionDenied("You cannot delete your own account.")
        return super().perform_destroy(instance)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password.
    POST /api/auth/change-password
    Body: {
        "current_password": "...",
        "new_password": "...",
        "new_password_confirm": "..."
    }
    """
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    new_password_confirm = request.data.get('new_password_confirm')
    
    # Validate required fields
    if not current_password or not new_password or not new_password_confirm:
        return Response(
            {'detail': 'current_password, new_password, and new_password_confirm are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if passwords match
    if new_password != new_password_confirm:
        return Response(
            {'detail': 'New passwords do not match.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify current password
    if not request.user.check_password(current_password):
        return Response(
            {'detail': 'Current password is incorrect.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate new password
    try:
        validate_password(new_password, user=request.user)
    except DjangoValidationError as e:
        error_messages = e.messages if hasattr(e, 'messages') else [str(e)]
        return Response(
            {'detail': 'Password validation failed.', 'errors': error_messages},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update password
    request.user.set_password(new_password)
    request.user.save()
    
    # Update session to prevent logout
    update_session_auth_hash(request, request.user)
    
    return Response(
        {'detail': 'Password changed successfully.'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrReviewer])
def admin_stats(request):
    """
    Admin endpoint to get platform statistics.
    GET /api/admin/stats
    """
    try:
        # Import models here to avoid circular imports
        from apps.ventures.models import VentureProduct
        from apps.investors.models import InvestorProfile
        from apps.mentors.models import MentorProfile
        from apps.messaging.models import Message
        from apps.approvals.models import ReviewRequest
        
        # Count users by role
        total_users = User.objects.count()
        total_ventures = User.objects.filter(role='VENTURE').count()
        total_investors = User.objects.filter(role='INVESTOR').count()
        total_mentors = User.objects.filter(role='MENTOR').count()
        
        # Count profiles by status
        approved_profiles = (
            VentureProduct.objects.filter(status='APPROVED', is_active=True).count() +
            InvestorProfile.objects.filter(status='APPROVED').count() +
            MentorProfile.objects.filter(status='APPROVED').count()
        )
        
        rejected_profiles = (
            VentureProduct.objects.filter(status='REJECTED').count() +
            InvestorProfile.objects.filter(status='REJECTED').count() +
            MentorProfile.objects.filter(status='REJECTED').count()
        )
        
        # Count pending approvals
        pending_approvals = ReviewRequest.objects.filter(status='SUBMITTED').count()
        
        # Count messages
        total_messages = Message.objects.count()
        
        return Response({
            'totalUsers': total_users,
            'totalVentures': total_ventures,
            'totalInvestors': total_investors,
            'totalMentors': total_mentors,
            'pendingApprovals': pending_approvals,
            'approvedProfiles': approved_profiles,
            'rejectedProfiles': rejected_profiles,
            'totalMessages': total_messages,
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
