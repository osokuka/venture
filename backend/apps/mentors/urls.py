"""
URL configuration for mentors app.
"""
from django.urls import path
from .views import (
    PublicMentorListView,
    PublicMentorDetailView
)

urlpatterns = [
    # Public mentor views (approved users only)
    path('public', PublicMentorListView.as_view(), name='public_mentors'),
    path('<uuid:id>', PublicMentorDetailView.as_view(), name='public_mentor_detail'),
]
