"""
Serializers for approvals app.
"""

from rest_framework import serializers
from apps.approvals.models import ReviewRequest


class ApprovalItemSerializer(serializers.ModelSerializer):
    """
    Serializer shaped to match the frontend's `ApprovalItem`.

    Frontend expects:
    - id
    - user_id
    - user_email
    - user_name
    - role (VENTURE|INVESTOR|MENTOR)
    - status (PENDING|APPROVED|REJECTED)
    - submitted_at
    - reviewed_at?
    - rejection_reason?
    """

    user_id = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    submitted_at = serializers.SerializerMethodField()

    class Meta:
        model = ReviewRequest
        fields = (
            'id',
            'user_id',
            'user_email',
            'user_name',
            'role',
            'status',
            'submitted_at',
            'reviewed_at',
            'rejection_reason',
        )

    def get_user_id(self, obj: ReviewRequest) -> str:
        return str(obj.submitted_by_id)

    def get_user_email(self, obj: ReviewRequest) -> str:
        return obj.submitted_by.email

    def get_user_name(self, obj: ReviewRequest) -> str:
        return obj.submitted_by.full_name

    def get_role(self, obj: ReviewRequest) -> str:
        # ReviewRequest is generic; role lives on the submitting user.
        return obj.submitted_by.role

    def get_status(self, obj: ReviewRequest) -> str:
        if obj.status == 'SUBMITTED':
            return 'PENDING'
        return obj.status

    def get_submitted_at(self, obj: ReviewRequest) -> str:
        # Frontend calls this `submitted_at`; use created_at as submission time.
        return obj.created_at.isoformat()


class ApprovalRejectSerializer(serializers.Serializer):
    """Payload for rejecting an approval."""
    reason = serializers.CharField(required=False, allow_blank=True)
