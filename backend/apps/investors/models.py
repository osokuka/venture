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
    
    INVESTOR_TYPE_CHOICES = [
        ('INDIVIDUAL', 'Individual'),
        ('FIRM', 'Firm'),
        ('CORPORATE', 'Corporate'),
        ('FAMILY_OFFICE', 'Family Office'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='investor_profile')
    full_name = models.CharField(max_length=255)
    organization_name = models.CharField(max_length=255)
    # Separate website and LinkedIn fields (backward compatible with linkedin_or_website)
    linkedin_or_website = models.URLField(blank=True, null=True, help_text="Legacy field - use website and linkedin_url instead")
    website = models.URLField(blank=True, null=True, help_text="Company or personal website URL")
    linkedin_url = models.URLField(blank=True, null=True, help_text="LinkedIn profile URL")
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    # Investor type classification
    investor_type = models.CharField(
        max_length=20,
        choices=INVESTOR_TYPE_CHOICES,
        blank=True,
        null=True,
        help_text="Type of investor: Individual, Firm, Corporate, or Family Office"
    )
    # Text fields for detailed descriptions
    bio = models.TextField(blank=True, null=True, help_text="Professional bio describing background and interests")
    investment_experience = models.TextField(blank=True, null=True, help_text="Detailed description of investment experience, notable deals, etc.")
    investment_philosophy = models.TextField(blank=True, null=True, help_text="Investment philosophy and what you look for in startups")
    notable_investments = models.TextField(blank=True, null=True, help_text="Notable investments and portfolio companies")
    address = models.CharField(max_length=255, blank=True, null=True, help_text="Location/address (City, State, Country)")
    # Numeric fields
    investment_experience_years = models.IntegerField(validators=[MinValueValidator(0)])
    deals_count = models.IntegerField(blank=True, null=True, validators=[MinValueValidator(0)])
    # Investment preferences
    stage_preferences = models.JSONField(default=list)
    industry_preferences = models.JSONField(default=list)
    geographic_focus = models.JSONField(default=list, blank=True, null=True, help_text="Geographic regions of interest (e.g., ['North America', 'Europe'])")
    average_ticket_size = models.CharField(max_length=50)
    min_investment = models.CharField(max_length=50, blank=True, null=True, help_text="Minimum investment amount (e.g., '100k', '$500K')")
    max_investment = models.CharField(max_length=50, blank=True, null=True, help_text="Maximum investment amount (e.g., '5m', '$10M')")
    # Visibility and contact settings
    visible_to_ventures = models.BooleanField(default=False, help_text="Make profile visible to ventures")
    allow_direct_contact = models.BooleanField(default=True, help_text="Allow ventures to contact directly")
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
