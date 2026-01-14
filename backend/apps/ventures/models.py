"""
Venture profile models.
"""
import uuid
from django.db import models
from django.core.validators import URLValidator
from apps.accounts.models import User


class VentureProduct(models.Model):
    """
    Venture product model.
    
    IMPORTANT: Users can have multiple products (up to 3).
    Products are separate from user accounts.
    Users can activate/deactivate products but cannot delete them.
    Only admin can delete products.
    """
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('SUSPENDED', 'Suspended'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    industry_sector = models.CharField(max_length=100)
    website = models.URLField()
    linkedin_url = models.URLField()
    address = models.TextField(blank=True, null=True)
    year_founded = models.IntegerField(blank=True, null=True)
    employees_count = models.IntegerField(blank=True, null=True)
    short_description = models.TextField()
    # Removed: problem_statement, solution_description, target_market, traction_metrics
    # These fields are now associated with each pitch deck document
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    is_active = models.BooleanField(default=True, help_text="User can toggle this. Only active products appear in public listings.")
    submitted_at = models.DateTimeField(blank=True, null=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'venture_products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.status})"
    
    def can_be_updated_by_user(self):
        """Check if user can update this product."""
        return self.status == 'DRAFT' or self.status == 'REJECTED'
    
    def can_be_submitted(self):
        """Check if product can be submitted for approval."""
        return self.status == 'DRAFT' or self.status == 'REJECTED'


# Backward compatibility alias (deprecated, use VentureProduct)
VentureProfile = VentureProduct


class Founder(models.Model):
    """Founder model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(VentureProduct, on_delete=models.CASCADE, related_name='founders')
    full_name = models.CharField(max_length=255)
    linkedin_url = models.URLField()
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    role_title = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'founders'
        ordering = ['created_at']


class TeamMember(models.Model):
    """Team member model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(VentureProduct, on_delete=models.CASCADE, related_name='team_members')
    name = models.CharField(max_length=255)
    role_title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'team_members'
        ordering = ['created_at']


class VentureNeed(models.Model):
    """Venture needs model."""
    NEED_TYPE_CHOICES = [
        ('FINANCE', 'Finance'),
        ('MARKET_ACCESS', 'Market Access'),
        ('EXPERT', 'Expert'),
        ('OTHER', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(VentureProduct, on_delete=models.CASCADE, related_name='needs')
    need_type = models.CharField(max_length=20, choices=NEED_TYPE_CHOICES)
    finance_size_range = models.CharField(max_length=100, blank=True, null=True)
    finance_objectives = models.TextField(blank=True, null=True)
    target_markets = models.JSONField(blank=True, null=True)
    expertise_field = models.CharField(max_length=100, blank=True, null=True)
    duration = models.CharField(max_length=50, blank=True, null=True)
    other_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'venture_needs'


class VentureDocument(models.Model):
    """
    Venture document model.
    
    For PITCH_DECK documents, includes additional metadata:
    - problem_statement, solution_description, target_market, traction_metrics
    - funding_amount, funding_stage, use_of_funds
    """
    DOCUMENT_TYPE_CHOICES = [
        ('PITCH_DECK', 'Pitch Deck'),
        ('OTHER', 'Other'),
    ]
    
    FUNDING_STAGE_CHOICES = [
        ('PRE_SEED', 'Pre-Seed'),
        ('SEED', 'Seed'),
        ('SERIES_A', 'Series A'),
        ('SERIES_B', 'Series B'),
        ('SERIES_C', 'Series C'),
        ('GROWTH', 'Growth'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(VentureProduct, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES)
    file = models.FileField(upload_to='ventures/documents/')
    file_size = models.IntegerField()
    mime_type = models.CharField(max_length=100)
    
    # Pitch deck metadata (only used when document_type = 'PITCH_DECK')
    problem_statement = models.TextField(blank=True, null=True, help_text="What problem does your product solve?")
    solution_description = models.TextField(blank=True, null=True, help_text="How does your product solve this problem?")
    target_market = models.TextField(blank=True, null=True, help_text="Describe your target market")
    traction_metrics = models.JSONField(blank=True, null=True, help_text="Current traction, metrics, and achievements")
    funding_amount = models.CharField(max_length=50, blank=True, null=True, help_text="Funding amount (e.g., $2M)")
    funding_stage = models.CharField(max_length=20, choices=FUNDING_STAGE_CHOICES, blank=True, null=True, help_text="Funding stage")
    use_of_funds = models.TextField(blank=True, null=True, help_text="How will the funds be used?")
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'venture_documents'
        ordering = ['-uploaded_at']
