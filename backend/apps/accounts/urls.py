"""
URL configuration for accounts app.
"""
from django.urls import path
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    logout_view,
    verify_email,
    resend_verification,
    get_current_user,
    change_password,
    password_reset_request,
    password_reset_confirm,
    AdminUserListView,
    admin_stats
)

urlpatterns = [
    path('register', RegisterView.as_view(), name='register'),
    path('login', CustomTokenObtainPairView.as_view(), name='login'),
    path('refresh', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('logout', logout_view, name='logout'),
    path('verify-email', verify_email, name='verify_email'),
    path('resend-verification', resend_verification, name='resend_verification'),
    path('password-reset-request', password_reset_request, name='password_reset_request'),
    path('password-reset-confirm', password_reset_confirm, name='password_reset_confirm'),
    path('me', get_current_user, name='current_user'),
    path('change-password', change_password, name='change_password'),
]
