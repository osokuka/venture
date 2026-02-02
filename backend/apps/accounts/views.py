"""
Views for accounts app.
"""
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from shared.throttles import PasswordResetRateThrottle, CurrentUserRateThrottle
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db.models import Q, Count
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.contrib.contenttypes.models import ContentType
from .models import User, EmailVerificationToken, PasswordResetToken
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    EmailVerificationSerializer,
    AdminUserUpsertSerializer,
    AdminUserDetailSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from .tasks import send_verification_email, send_password_reset_email
from shared.permissions import IsAdminOrReviewer


class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint.
    POST /api/auth/register
    
    Public endpoint - no authentication required.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # Explicitly disable authentication for registration
    
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
    Custom login view that updates last_login and sets httpOnly cookies.
    POST /api/auth/login
    Body: {"email": "user@example.com", "password": "..."}

    Security: Rate limited to prevent brute force attacks.
    Sets httpOnly cookies for secure token storage (prevents XSS attacks).
    """
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AnonRateThrottle]  # Rate limit: 10/hour for anonymous users
    authentication_classes = []  # Explicitly disable authentication for login (public endpoint)

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
            
            # Set httpOnly cookies for secure token storage
            # Cookies are automatically sent with requests, preventing XSS attacks
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            
            # Determine cookie domain based on environment
            # For production (ventureuplink.com), use parent domain so cookies work across subdomains
            # For development (localhost), don't set domain (browser handles it)
            cookie_domain = None
            if not settings.DEBUG:
                # Production: set domain to .ventureuplink.com for cross-subdomain cookies
                cookie_domain = '.ventureuplink.com'
            
            if access_token:
                # Set access token cookie (httpOnly, Secure in production, SameSite=Lax)
                response.set_cookie(
                    'access_token',
                    access_token,
                    max_age=15 * 60,  # 15 minutes (matches ACCESS_TOKEN_LIFETIME)
                    httponly=True,  # Prevent JavaScript access (XSS protection)
                    samesite='Lax',  # CSRF protection
                    secure=not settings.DEBUG,  # HTTPS only in production
                    path='/',  # Available for entire domain
                    domain=cookie_domain,  # Cross-subdomain support in production
                )
            
            if refresh_token:
                # Set refresh token cookie (httpOnly, Secure in production, SameSite=Lax)
                response.set_cookie(
                    'refresh_token',
                    refresh_token,
                    max_age=7 * 24 * 60 * 60,  # 7 days (matches REFRESH_TOKEN_LIFETIME)
                    httponly=True,  # Prevent JavaScript access (XSS protection)
                    samesite='Lax',  # CSRF protection
                    secure=not settings.DEBUG,  # HTTPS only in production
                    path='/',  # Available for entire domain
                    domain=cookie_domain,  # Cross-subdomain support in production
                )
            
            # Remove tokens from response body for security (cookies are set)
            # Frontend should not store tokens in localStorage
            if hasattr(response, 'data'):
                response.data.pop('access', None)
                response.data.pop('refresh', None)
        
        return response


class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom token refresh view that sets httpOnly cookies.
    POST /api/auth/refresh
    
    Reads refresh token from httpOnly cookie and sets new access token in cookie.
    """
    authentication_classes = []  # Explicitly disable authentication for refresh (public endpoint)
    def post(self, request, *args, **kwargs):
        # Get refresh token from cookie (preferred) or request body (fallback)
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
        
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token not provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create request with refresh token in body for TokenRefreshView
        request.data['refresh'] = refresh_token
        
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Set httpOnly cookie for new access token
            access_token = response.data.get('access')
            
            # Determine cookie domain based on environment
            cookie_domain = None
            if not settings.DEBUG:
                cookie_domain = '.ventureuplink.com'
            
            if access_token:
                response.set_cookie(
                    'access_token',
                    access_token,
                    max_age=15 * 60,  # 15 minutes
                    httponly=True,
                    samesite='Lax',
                    secure=not settings.DEBUG,
                    path='/',
                    domain=cookie_domain,
                )
            
            # If refresh token was rotated, set new refresh token cookie
            if 'refresh' in response.data:
                refresh_token = response.data.get('refresh')
                response.set_cookie(
                    'refresh_token',
                    refresh_token,
                    max_age=7 * 24 * 60 * 60,  # 7 days
                    httponly=True,
                    samesite='Lax',
                    secure=not settings.DEBUG,
                    path='/',
                    domain=cookie_domain,
                )
            
            # Remove tokens from response body for security
            response.data.pop('access', None)
            response.data.pop('refresh', None)
        
        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout user by clearing httpOnly cookies.
    POST /api/auth/logout
    """
    response = Response(
        {'detail': 'Successfully logged out.'},
        status=status.HTTP_200_OK
    )
    
    # Determine cookie domain based on environment
    cookie_domain = None
    if not settings.DEBUG:
        cookie_domain = '.ventureuplink.com'
    
    # Clear httpOnly cookies
    response.delete_cookie('access_token', path='/', samesite='Lax', domain=cookie_domain)
    response.delete_cookie('refresh_token', path='/', samesite='Lax', domain=cookie_domain)
    
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
@throttle_classes([UserRateThrottle])  # Rate limit: 5000/hour for authenticated users (default)
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
@throttle_classes([CurrentUserRateThrottle])  # Higher rate limit: 1000/hour (vs default 100/hour)
def get_current_user(request):
    """
    Get or update current authenticated user.
    GET /api/auth/me - Get current user
    PATCH /api/auth/me - Update current user profile
    
    Rate Limited: 1000 requests/hour (higher than default to prevent legitimate users
    from hitting limits during normal app usage)
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

    def get_serializer_class(self):
        """
        Use a rich detail serializer for GET (includes role-specific profiles),
        and the upsert serializer for write operations (PATCH/DELETE).
        """
        if self.request.method == 'GET':
            return AdminUserDetailSerializer
        return AdminUserUpsertSerializer

    def get_serializer_context(self):
        """
        Ensure request context is passed to serializer so nested serializers
        can build absolute URLs and access request.user if needed.
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_destroy(self, instance):
        # Prevent admins from deleting themselves by accident.
        if instance.id == self.request.user.id:
            raise PermissionDenied("You cannot delete your own account.")
        return super().perform_destroy(instance)

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetRateThrottle])  # Rate limit: 1/hour per email address
def password_reset_request(request):
    """
    Request password reset.
    POST /api/auth/password-reset-request
    Body: { "email": "user@example.com" }
    
    Security: 
    - Always returns success message to prevent email enumeration
    - Rate limited to 1 request per hour per email address
    - Additional check: Prevents multiple requests within 1 hour even if throttle is bypassed
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    email = serializer.validated_data['email']
    
    # Security: Always return success to prevent email enumeration
    # Don't reveal if email exists in system
    try:
        user = User.objects.get(email=email, is_active=True)
        
        # Additional security: Check if a reset was requested recently (within last hour)
        # This provides defense-in-depth even if throttle is bypassed
        # Note: The throttle handles rate limiting, but this check prevents multiple emails
        # if someone bypasses the throttle or if throttle cache is cleared
        recent_reset = PasswordResetToken.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timedelta(hours=1)
        ).exists()
        
        if recent_reset:
            # Rate limit exceeded - but don't reveal this to prevent enumeration
            # Just silently ignore the request (throttle should have caught this, but defense-in-depth)
            pass
        else:
            # Get client IP for security tracking
            ip_address = request.META.get('REMOTE_ADDR') or request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
            
            # Create password reset token
            reset_token = PasswordResetToken.create_for_user(user, ip_address=ip_address)
            
            # Send password reset email via Celery
            send_password_reset_email.delay(str(user.id), reset_token.token)
        
    except User.DoesNotExist:
        # Security: Don't reveal if user exists
        pass
    
    # Always return success message (security best practice)
    return Response({
        'message': 'If an account exists with this email, a password reset link has been sent.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """
    Confirm password reset with token.
    POST /api/auth/password-reset-confirm
    Body: {
        "token": "...",
        "new_password": "...",
        "new_password_confirm": "..."
    }
    
    Security: Token is single-use and expires after 1 hour.
    """
    # Log request data for debugging (without sensitive info)
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Password reset confirm - token present: {'token' in request.data}, password present: {'new_password' in request.data}")
    
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if not serializer.is_valid():
        # Log validation errors for debugging
        logger.warning(f"Password reset confirm validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    token = serializer.validated_data['token']
    new_password = serializer.validated_data['new_password']
    
    # Get token object
    try:
        token_obj = PasswordResetToken.objects.get(token=token)
        
        # Security: Verify token is still valid
        if not token_obj.is_valid():
            return Response(
                {'detail': 'Token is invalid or expired.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update user password
        user = token_obj.user
        user.set_password(new_password)
        user.save()
        
        # Security: Mark token as used (single-use)
        token_obj.mark_as_used()
        
        # Security: Invalidate all user sessions by updating password
        # JWT tokens will remain valid until expiry, but password change
        # ensures old sessions can't be used
        
        return Response({
            'message': 'Password reset successfully. Please log in with your new password.'
        }, status=status.HTTP_200_OK)
        
    except PasswordResetToken.DoesNotExist:
        return Response(
            {'detail': 'Invalid password reset token.'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password (authenticated users).
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
        # Only count ReviewRequests with status='SUBMITTED'
        # Products/profiles with status='SUBMITTED' but no ReviewRequest are handled
        # by the pending_reviews endpoint which auto-creates ReviewRequests
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
