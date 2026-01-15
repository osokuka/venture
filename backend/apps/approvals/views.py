"""
Views for approvals app.
"""

from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
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
    
    This endpoint also auto-creates ReviewRequests for products/profiles
    that have status='SUBMITTED' but don't have ReviewRequests yet.
    This ensures backward compatibility with old data.
    """
    # Import models here to avoid circular imports
    from apps.ventures.models import VentureProduct
    from apps.investors.models import InvestorProfile
    from apps.mentors.models import MentorProfile
    
    # Security: Whitelist allowed types to prevent injection
    type_filter = request.query_params.get('type')
    allowed_types = ['VENTURE', 'INVESTOR', 'MENTOR']
    role_filter = None
    if type_filter:
        role = type_filter.upper()
        if role in allowed_types:
            role_filter = role
    
    # Get existing ReviewRequests
    qs = ReviewRequest.objects.select_related('submitted_by').filter(status='SUBMITTED')
    if role_filter:
        qs = qs.filter(submitted_by__role=role_filter)
    
    # Get ContentTypes
    content_type_product = ContentType.objects.get_for_model(VentureProduct)
    content_type_investor = ContentType.objects.get_for_model(InvestorProfile)
    content_type_mentor = ContentType.objects.get_for_model(MentorProfile)
    
    # Get IDs of items that already have ReviewRequests
    existing_review_ids = set(
        ReviewRequest.objects.filter(status='SUBMITTED').values_list('object_id', flat=True)
    )
    
    # Auto-create ReviewRequests for products/profiles with SUBMITTED status that don't have ReviewRequests
    created_count = 0
    
    # Products without ReviewRequests
    products_to_review = VentureProduct.objects.filter(status='SUBMITTED').exclude(id__in=existing_review_ids)
    if role_filter:
        products_to_review = products_to_review.filter(user__role=role_filter)
    
    for product in products_to_review:
        ReviewRequest.objects.get_or_create(
            content_type=content_type_product,
            object_id=product.id,
            defaults={
                'submitted_by': product.user,
                'status': 'SUBMITTED',
            }
        )
        created_count += 1
    
    # Investor profiles without ReviewRequests
    investors_to_review = InvestorProfile.objects.filter(status='SUBMITTED').exclude(id__in=existing_review_ids)
    if role_filter:
        investors_to_review = investors_to_review.filter(user__role=role_filter)
    
    for investor in investors_to_review:
        ReviewRequest.objects.get_or_create(
            content_type=content_type_investor,
            object_id=investor.id,
            defaults={
                'submitted_by': investor.user,
                'status': 'SUBMITTED',
            }
        )
        created_count += 1
    
    # Mentor profiles without ReviewRequests
    mentors_to_review = MentorProfile.objects.filter(status='SUBMITTED').exclude(id__in=existing_review_ids)
    if role_filter:
        mentors_to_review = mentors_to_review.filter(user__role=role_filter)
    
    for mentor in mentors_to_review:
        ReviewRequest.objects.get_or_create(
            content_type=content_type_mentor,
            object_id=mentor.id,
            defaults={
                'submitted_by': mentor.user,
                'status': 'SUBMITTED',
            }
        )
        created_count += 1
    
    # Refresh queryset to include newly created ReviewRequests
    qs = ReviewRequest.objects.select_related('submitted_by').filter(status='SUBMITTED')
    if role_filter:
        qs = qs.filter(submitted_by__role=role_filter)
    
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

