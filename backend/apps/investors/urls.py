"""
URL configuration for investors app.
"""
from django.urls import path
from .views import (
    InvestorProfileCreateUpdateView,
    submit_investor_profile,
    PublicInvestorListView,
    PublicInvestorDetailView
)

urlpatterns = [
    # Profile management (user endpoints)
    path('profile', InvestorProfileCreateUpdateView.as_view(), name='investor_profile_create'),
    path('profile/me', InvestorProfileCreateUpdateView.as_view(), name='investor_profile_me'),
    path('profile/submit', submit_investor_profile, name='investor_profile_submit'),
    
    # Public investor views (approved users only)
    path('public', PublicInvestorListView.as_view(), name='public_investors'),
    path('<uuid:id>', PublicInvestorDetailView.as_view(), name='public_investor_detail'),
]
