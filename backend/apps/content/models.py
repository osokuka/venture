"""
Content models for FAQ, success stories, resources, and contacts.
"""
import uuid
from django.db import models
from apps.ventures.models import VentureProduct


class FAQItem(models.Model):
    """FAQ item model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.CharField(max_length=500)
    answer = models.TextField()
    order = models.IntegerField(default=0)
    published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'faq_items'
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return self.question


class SuccessStory(models.Model):
    """Success story model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    summary = models.TextField()
    product = models.ForeignKey(VentureProduct, on_delete=models.SET_NULL, null=True, blank=True, related_name='success_stories')
    logo_image = models.ImageField(upload_to='content/success_stories/', blank=True, null=True)
    published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'success_stories'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class Resource(models.Model):
    """Resource model."""
    CATEGORY_CHOICES = [
        ('MARKET_REPORTS', 'Market Reports'),
        ('LEGAL', 'Legal'),
        ('TEMPLATES', 'Templates'),
        ('OTHER', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    file = models.FileField(upload_to='content/resources/', blank=True, null=True)
    url = models.URLField(blank=True, null=True)
    published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'resources'
        ordering = ['category', '-created_at']
    
    def __str__(self):
        return self.title


class ContactInfo(models.Model):
    """Contact information model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'contact_info'
        verbose_name_plural = 'Contact Info'
    
    def __str__(self):
        return f"Contact: {self.email}"
