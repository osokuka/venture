"""
Messaging models.
"""
import uuid
from django.db import models
from apps.accounts.models import User


class Conversation(models.Model):
    """
    Conversation model for messaging.
    
    A Conversation represents a chat thread between two or more users.
    Messages are stored within conversations, creating a persistent chat history.
    Each conversation has participants (users) and contains multiple messages.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'conversations'
        ordering = ['-last_message_at', '-created_at']  # Most recent conversations first
    
    def __str__(self):
        return f"Conversation {self.id}"


class Message(models.Model):
    """
    Message model for chat messages.
    
    Messages are stored within conversations, creating a persistent chat history.
    Each message belongs to a conversation and has a sender (user).
    Messages are ordered chronologically by created_at (oldest first).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)  # When the message was read by the recipient
    
    class Meta:
        db_table = 'messages'
        ordering = ['created_at']  # Chronological order (oldest first) for chat display
    
    def __str__(self):
        return f"Message from {self.sender.email}"
