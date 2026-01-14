"""
URL configuration for accounts app.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    verify_email,
    resend_verification,
    get_current_user,
    change_password,
    AdminUserListView,
    admin_stats
)

urlpatterns = [
    path('register', RegisterView.as_view(), name='register'),
    path('login', CustomTokenObtainPairView.as_view(), name='login'),
    path('refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify-email', verify_email, name='verify_email'),
    path('resend-verification', resend_verification, name='resend_verification'),
    path('me', get_current_user, name='current_user'),
    path('change-password', change_password, name='change_password'),
]
