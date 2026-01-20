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
# Note: This alias is kept for backward compatibility, but a new VentureProfile model
# is being added below for user-level profile data (separate from products)
OldVentureProfile = VentureProduct


class VentureProfile(models.Model):
    """
    Venture user profile model.
    
    This model stores user-level profile information for venture users,
    separate from VentureProduct (which represents individual products/companies).
    
    A user can have:
    - One VentureProfile (user-level profile data)
    - Up to 3 VentureProducts (individual products/companies)
    
    This is similar to InvestorProfile and MentorProfile architecture.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='venture_profile')
    
    # Company Information
    company_name = models.CharField(max_length=255, blank=True, null=True)
    sector = models.CharField(max_length=100, blank=True, null=True)
    short_description = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    year_founded = models.IntegerField(blank=True, null=True)
    employees_count = models.IntegerField(blank=True, null=True)
    
    # Founder Information
    founder_name = models.CharField(max_length=255, blank=True, null=True)
    founder_linkedin = models.URLField(blank=True, null=True)
    founder_role = models.CharField(max_length=100, blank=True, null=True)
    
    # Additional Information
    customers = models.TextField(blank=True, null=True)
    key_metrics = models.TextField(blank=True, null=True)
    needs = models.JSONField(default=list, blank=True, null=True)
    
    # Contact Information
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Media
    logo = models.ImageField(upload_to='ventures/profiles/logos/', blank=True, null=True)
    # Alternative: logo_url if storing externally
    logo_url = models.URLField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'venture_profiles'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.company_name or 'Unnamed'} - {self.user.email}"


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
    
    def __str__(self):
        return f"{self.document_type} for {self.product.name}"


class PitchDeckAccess(models.Model):
    """
    Model to track pitch deck access permissions.
    Tracks which investors have been granted access to which pitch decks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(VentureDocument, on_delete=models.CASCADE, related_name='access_permissions')
    investor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pitch_deck_accesses')
    granted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='granted_pitch_deck_accesses')
    granted_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True, help_text="False if access has been revoked")
    
    class Meta:
        db_table = 'pitch_deck_access'
        unique_together = [['document', 'investor']]
        indexes = [
            models.Index(fields=['document', 'investor', 'is_active']),
            models.Index(fields=['investor', 'is_active']),
        ]
    
    def __str__(self):
        return f"Access to {self.document.document_type} for {self.investor.email}"


class PitchDeckAccessEvent(models.Model):
    """
    Model to track pitch deck access events for analytics.
    Records every time a pitch deck is viewed or downloaded.
    """
    EVENT_TYPE_CHOICES = [
        ('VIEW', 'View'),
        ('DOWNLOAD', 'Download'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(VentureDocument, on_delete=models.CASCADE, related_name='access_events')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pitch_deck_access_events')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES)
    accessed_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'pitch_deck_access_events'
        ordering = ['-accessed_at']
        indexes = [
            models.Index(fields=['document', 'accessed_at']),
            models.Index(fields=['user', 'accessed_at']),
            models.Index(fields=['document', 'event_type']),
        ]
    
    def __str__(self):
        return f"{self.event_type} by {self.user.email} at {self.accessed_at}"


class PitchDeckRequest(models.Model):
    """
    Model to track pitch deck requests from investors.
    Investors can request access to pitch decks, and ventures can approve or deny.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('DENIED', 'Denied'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(VentureDocument, on_delete=models.CASCADE, related_name='requests')
    investor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pitch_deck_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    message = models.TextField(blank=True, null=True, help_text="Optional message from investor")
    requested_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(blank=True, null=True)
    responded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='responded_pitch_deck_requests')
    response_message = models.TextField(blank=True, null=True, help_text="Optional response message from venture")
    
    class Meta:
        db_table = 'pitch_deck_requests'
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['document', 'status']),
            models.Index(fields=['investor', 'status']),
            models.Index(fields=['status', 'requested_at']),
        ]
    
    def __str__(self):
        return f"Request from {self.investor.email} for {self.document.document_type} - {self.status}"


class PitchDeckShare(models.Model):
    """
    Model to track pitch deck sharing from ventures to investors.
    Ventures can proactively share pitch decks with specific investors.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(VentureDocument, on_delete=models.CASCADE, related_name='shares')
    investor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_pitch_decks')
    shared_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_pitch_deck_shares')
    message = models.TextField(blank=True, null=True, help_text="Optional message from venture")
    shared_at = models.DateTimeField(auto_now_add=True)
    viewed_at = models.DateTimeField(blank=True, null=True, help_text="When investor first viewed the shared pitch deck")
    
    class Meta:
        db_table = 'pitch_deck_shares'
        ordering = ['-shared_at']
        indexes = [
            models.Index(fields=['document', 'shared_at']),
            models.Index(fields=['investor', 'shared_at']),
        ]
    
    def __str__(self):
        return f"Shared {self.document.document_type} to {self.investor.email} by {self.shared_by.email}"


class PitchDeckInterest(models.Model):
    """
    Model to track investor interest/engagement with pitch decks.
    Investors can follow/monitor pitch decks they're interested in.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(VentureDocument, on_delete=models.CASCADE, related_name='interests')
    investor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pitch_deck_interests')
    interested_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True, help_text="Optional notes from investor about their interest")
    is_active = models.BooleanField(default=True, help_text="False if investor unfollowed")
    
    class Meta:
        db_table = 'pitch_deck_interests'
        unique_together = [['document', 'investor']]
        ordering = ['-interested_at']
        indexes = [
            models.Index(fields=['document', 'investor', 'is_active']),
            models.Index(fields=['investor', 'is_active']),
        ]
    
    def __str__(self):
        return f"Interest from {self.investor.email} for {self.document.document_type}"


class InvestmentCommitment(models.Model):
    """
    Model to track investor commitments to invest in ventures.
    Represents a formal expression of intent to invest.
    When venture accepts, it becomes a "Deal".
    """
    STATUS_CHOICES = [
        ('EXPRESSED', 'Interest Expressed'),
        ('COMMITTED', 'Committed'),
        ('WITHDRAWN', 'Withdrawn'),
        ('COMPLETED', 'Completed'),
    ]
    
    VENTURE_RESPONSE_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('RENEGOTIATE', 'Renegotiate'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(VentureDocument, on_delete=models.CASCADE, related_name='commitments')
    investor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='investment_commitments')
    product = models.ForeignKey(VentureProduct, on_delete=models.CASCADE, related_name='investment_commitments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EXPRESSED')
    amount = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, help_text="Intended investment amount")
    message = models.TextField(blank=True, null=True, help_text="Optional message from investor")
    committed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Venture response fields (for accepting/renegotiating commitments)
    venture_response = models.CharField(
        max_length=20, 
        choices=VENTURE_RESPONSE_CHOICES, 
        default='PENDING',
        help_text="Venture's response to the investment commitment"
    )
    venture_response_at = models.DateTimeField(blank=True, null=True, help_text="When venture responded")
    venture_response_message = models.TextField(
        blank=True, 
        null=True, 
        help_text="Optional message from venture (e.g., counter-offer, terms discussion)"
    )
    responded_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='responded_commitments',
        help_text="Venture user who responded to the commitment"
    )
    
    # Link to conversation for negotiation correspondence
    conversation = models.ForeignKey(
        'messaging.Conversation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='commitments',
        help_text="Linked conversation for negotiation correspondence"
    )
    
    class Meta:
        db_table = 'investment_commitments'
        unique_together = [['document', 'investor']]
        ordering = ['-committed_at']
        indexes = [
            models.Index(fields=['document', 'investor', 'status']),
            models.Index(fields=['investor', 'status']),
            models.Index(fields=['product', 'status']),
            models.Index(fields=['product', 'venture_response']),
            models.Index(fields=['venture_response', 'venture_response_at']),
        ]
    
    def __str__(self):
        return f"Commitment from {self.investor.email} for {self.product.name} - {self.status} ({self.venture_response})"
    
    @property
    def is_deal(self):
        """Returns True if commitment has been accepted by venture (becomes a deal)."""
        return self.venture_response == 'ACCEPTED' and self.status == 'COMMITTED'