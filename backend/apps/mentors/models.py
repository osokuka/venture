"""
Mentor profile models.
"""
import uuid
from django.db import models
from decimal import Decimal
from apps.accounts.models import User


class MentorProfile(models.Model):
    """Mentor profile model."""
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('SUSPENDED', 'Suspended'),
    ]
    
    ENGAGEMENT_TYPE_CHOICES = [
        ('PAID', 'Paid'),
        ('PRO_BONO', 'Pro Bono'),
        ('BOTH', 'Both'),
    ]
    
    RATE_TYPE_CHOICES = [
        ('HOURLY', 'Hourly'),
        ('DAILY', 'Daily'),
        ('MONTHLY', 'Monthly'),
    ]
    
    PREFERRED_ENGAGEMENT_CHOICES = [
        ('VIRTUAL', 'Virtual'),
        ('IN_PERSON', 'In Person'),
        ('BOTH', 'Both'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mentor_profile')
    full_name = models.CharField(max_length=255)
    job_title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    linkedin_or_website = models.URLField()
    contact_email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    expertise_fields = models.JSONField(default=list)
    experience_overview = models.TextField()
    industries_of_interest = models.JSONField(default=list)
    engagement_type = models.CharField(max_length=20, choices=ENGAGEMENT_TYPE_CHOICES)
    paid_rate_type = models.CharField(max_length=20, choices=RATE_TYPE_CHOICES, blank=True, null=True)
    paid_rate_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    availability_types = models.JSONField(default=list)
    preferred_engagement = models.CharField(max_length=20, choices=PREFERRED_ENGAGEMENT_CHOICES)
    visible_to_ventures = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    submitted_at = models.DateTimeField(blank=True, null=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'mentor_profiles'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.full_name} ({self.status})"
