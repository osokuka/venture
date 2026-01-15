"""
Investor profile models.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator
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
    investment_experience_years = models.IntegerField(validators=[MinValueValidator(0)])
    deals_count = models.IntegerField(blank=True, null=True, validators=[MinValueValidator(0)])
    stage_preferences = models.JSONField(default=list)
    industry_preferences = models.JSONField(default=list)
    average_ticket_size = models.CharField(max_length=50)
    # Incognito mode: if False, investor is hidden from public unless they initiate conversation
    visible_to_ventures = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    submitted_at = models.DateTimeField(blank=True, null=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'investor_profiles'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'visible_to_ventures']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.full_name} ({self.status})"


class InvestorVisibleToVenture(models.Model):
    """
    Tracks which ventures can see an investor's profile.
    Used for incognito mode: when an investor initiates a conversation,
    their profile becomes visible to that specific venture.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    investor = models.ForeignKey(
        InvestorProfile,
        on_delete=models.CASCADE,
        related_name='visibility_grants'
    )
    venture_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='visible_investors'
    )
    # Track when visibility was granted (when investor initiated conversation)
    granted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'investor_visible_to_ventures'
        unique_together = ['investor', 'venture_user']
        indexes = [
            models.Index(fields=['investor', 'venture_user']),
            models.Index(fields=['venture_user']),
        ]
    
    def __str__(self):
        return f"{self.investor.full_name} visible to {self.venture_user.email}"
