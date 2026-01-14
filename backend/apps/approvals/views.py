"""
Views for approvals app.
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from shared.permissions import IsAdminOrReviewer
from apps.approvals.models import ReviewRequest
from apps.approvals.serializers import ApprovalItemSerializer, ApprovalRejectSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrReviewer])
def pending_reviews(request):
    """
    List pending review requests.
    GET /api/reviews/pending?type=venture|investor|mentor
    """
    qs = ReviewRequest.objects.select_related('submitted_by').filter(status='SUBMITTED')

    # Security: Whitelist allowed types to prevent injection
    type_filter = request.query_params.get('type')
    if type_filter:
        allowed_types = ['VENTURE', 'INVESTOR', 'MENTOR']
        role = type_filter.upper()
        if role in allowed_types:
            qs = qs.filter(submitted_by__role=role)

    data = ApprovalItemSerializer(qs.order_by('-created_at'), many=True).data
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrReviewer])
def review_detail(request, review_id):
    """
    Retrieve a review request.
    GET /api/reviews/<id>
    """
    try:
        obj = ReviewRequest.objects.select_related('submitted_by').get(id=review_id)
    except ReviewRequest.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    return Response(ApprovalItemSerializer(obj).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrReviewer])
def approve_review(request, review_id):
    """
    Approve a review request.
    POST /api/reviews/<id>/approve
    """
    try:
        obj = ReviewRequest.objects.get(id=review_id)
    except ReviewRequest.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if obj.status != 'SUBMITTED':
        return Response({'detail': 'Only submitted reviews can be approved.'}, status=status.HTTP_400_BAD_REQUEST)

    obj.status = 'APPROVED'
    obj.reviewer = request.user
    obj.reviewed_at = timezone.now()
    obj.rejection_reason = None
    obj.save(update_fields=['status', 'reviewer', 'reviewed_at', 'rejection_reason'])

    return Response({'detail': 'Approved.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminOrReviewer])
def reject_review(request, review_id):
    """
    Reject a review request.
    POST /api/reviews/<id>/reject
    Body: { "reason": "..." }
    """
    try:
        obj = ReviewRequest.objects.get(id=review_id)
    except ReviewRequest.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if obj.status != 'SUBMITTED':
        return Response({'detail': 'Only submitted reviews can be rejected.'}, status=status.HTTP_400_BAD_REQUEST)

    payload = ApprovalRejectSerializer(data=request.data)
    payload.is_valid(raise_exception=True)

    obj.status = 'REJECTED'
    obj.reviewer = request.user
    obj.reviewed_at = timezone.now()
    obj.rejection_reason = payload.validated_data.get('reason') or ''
    obj.save(update_fields=['status', 'reviewer', 'reviewed_at', 'rejection_reason'])

    return Response({'detail': 'Rejected.'}, status=status.HTTP_200_OK)

