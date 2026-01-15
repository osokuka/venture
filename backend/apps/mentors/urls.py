"""
URL configuration for mentors app.
"""
from django.urls import path
from .views import (
    PublicMentorListView,
    PublicMentorDetailView,
    MentorProfileCreateUpdateView,
    submit_mentor_profile
)

urlpatterns = [
    # Mentor profile CRUD (authenticated users)
    path('profile', MentorProfileCreateUpdateView.as_view(), name='mentor_profile_create'),
    path('profile/me', MentorProfileCreateUpdateView.as_view(), name='mentor_profile_me'),
    path('profile/submit', submit_mentor_profile, name='mentor_profile_submit'),
    
    # Public mentor views (approved users only)
    path('public', PublicMentorListView.as_view(), name='public_mentors'),
    path('<uuid:id>', PublicMentorDetailView.as_view(), name='public_mentor_detail'),
]
