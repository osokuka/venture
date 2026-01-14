"""
Investor profile models.
"""
import uuid
from django.db import models
from apps.accounts.models import User


class InvestorProfile(models.Model):
    """Investor profile model."""
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('SUSPENDED', 'Suspended'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='investor_profile')
    full_name = models.CharField(max_length=255)
    organization_name = models.CharField(max_length=255)
    linkedin_or_website = models.URLField()
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    investment_experience_years = models.IntegerField()
    deals_count = models.IntegerField(blank=True, null=True)
    stage_preferences = models.JSONField(default=list)
    industry_preferences = models.JSONField(default=list)
    average_ticket_size = models.CharField(max_length=50)
    visible_to_ventures = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    submitted_at = models.DateTimeField(blank=True, null=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'investor_profiles'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.full_name} ({self.status})"
