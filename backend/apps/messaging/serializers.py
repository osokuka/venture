"""
Serializers for messaging app.
"""
from rest_framework import serializers
from .models import Conversation, Message
from apps.accounts.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model."""
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    
    class Meta:
        model = Message
        fields = ('id', 'sender', 'sender_email', 'sender_name', 'body', 'created_at', 'read_at')
        read_only_fields = ('id', 'sender', 'created_at', 'read_at')


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for Conversation model (list view)."""
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ('id', 'participants', 'other_participant', 'created_at', 'last_message_at', 'last_message', 'unread_count')
        read_only_fields = ('id', 'created_at', 'last_message_at')
    
    def get_last_message(self, obj):
        """Get the last message in the conversation."""
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return {
                'id': str(last_msg.id),
                'body': last_msg.body,
                'sender_id': str(last_msg.sender.id),
                'created_at': last_msg.created_at
            }
        return None
    
    def get_unread_count(self, obj):
        """Get unread message count for current user."""
        request = self.context.get('request')
        if not request or not request.user:
            return 0
        
        return Message.objects.filter(
            conversation=obj
        ).exclude(
            sender=request.user
        ).filter(
            read_at__isnull=True
        ).count()
    
    def get_other_participant(self, obj):
        """Get the other participant (not the current user)."""
        request = self.context.get('request')
        if not request or not request.user:
            return None
        
        other_participants = obj.participants.exclude(id=request.user.id)
        if other_participants.exists():
            other = other_participants.first()
            return {
                'id': str(other.id),
                'email': other.email,
                'full_name': other.full_name,
                'role': other.role
            }
        return None


class ConversationDetailSerializer(serializers.ModelSerializer):
    """Serializer for Conversation model (detail view with messages)."""
    participants = UserSerializer(many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    other_participant = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ('id', 'participants', 'other_participant', 'created_at', 'last_message_at', 'messages')
        read_only_fields = ('id', 'created_at', 'last_message_at')
    
    def get_other_participant(self, obj):
        """Get the other participant (not the current user)."""
        request = self.context.get('request')
        if not request or not request.user:
            return None
        
        other_participants = obj.participants.exclude(id=request.user.id)
        if other_participants.exists():
            other = other_participants.first()
            return {
                'id': str(other.id),
                'email': other.email,
                'full_name': other.full_name,
                'role': other.role
            }
        return None
