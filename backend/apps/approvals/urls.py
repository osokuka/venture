"""
URL configuration for approvals app.
"""
from django.urls import path

from apps.approvals.views import pending_reviews, review_detail, approve_review, reject_review

urlpatterns = [
    # Admin/reviewer endpoints
    path('pending', pending_reviews, name='reviews_pending'),
    path('<uuid:review_id>', review_detail, name='review_detail'),
    path('<uuid:review_id>/approve', approve_review, name='review_approve'),
    path('<uuid:review_id>/reject', reject_review, name='review_reject'),
]
