"""
Messaging models.
"""
import uuid
from django.db import models
from apps.accounts.models import User


class Conversation(models.Model):
    """Conversation model for messaging."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'conversations'
        ordering = ['-last_message_at', '-created_at']
    
    def __str__(self):
        return f"Conversation {self.id}"


class Message(models.Model):
    """Message model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'messages'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message from {self.sender.email}"
