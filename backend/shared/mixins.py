"""
Shared mixins for views and serializers.
"""
from rest_framework import status
from rest_framework.response import Response


class SoftDeleteMixin:
    """
    Mixin to add soft delete functionality to models.
    """
    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class TimestampMixin:
    """
    Mixin to add created_at and updated_at timestamps.
    """
    pass  # This will be handled at the model level


class StatusUpdateMixin:
    """
    Mixin for views that update object status.
    """
    def update_status(self, instance, new_status, **kwargs):
        """
        Update the status of an instance and save related timestamps.
        """
        instance.status = new_status
        
        if new_status == 'SUBMITTED' and not instance.submitted_at:
            from django.utils import timezone
            instance.submitted_at = timezone.now()
        
        if new_status == 'APPROVED' and not instance.approved_at:
            from django.utils import timezone
            instance.approved_at = timezone.now()
        
        instance.save()
        return instance
