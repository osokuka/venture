"""
Matching models.
"""
import uuid
from django.db import models
from apps.ventures.models import VentureProduct


class Match(models.Model):
    """Match model for venture-investor/mentor matching."""
    
    TARGET_TYPE_CHOICES = [
        ('INVESTOR', 'Investor'),
        ('MENTOR', 'Mentor'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(VentureProduct, on_delete=models.CASCADE, related_name='matches')
    target_type = models.CharField(max_length=20, choices=TARGET_TYPE_CHOICES)
    target_object_id = models.UUIDField()
    score = models.IntegerField(default=0)  # 0-100
    reasons = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    refreshed_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'matches'
        ordering = ['-score', '-refreshed_at']
        indexes = [
            models.Index(fields=['product', 'target_type']),
            models.Index(fields=['score']),
        ]
    
    def __str__(self):
        return f"Match: {self.product.name} -> {self.target_type} (Score: {self.score})"
