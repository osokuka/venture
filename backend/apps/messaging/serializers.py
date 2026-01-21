"""
Serializers for messaging app.
"""
from rest_framework import serializers
from .models import Conversation, Message
from apps.accounts.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model."""
    sender = serializers.UUIDField(source='sender.id', read_only=True)  # Return sender as UUID string
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
        # Use direct query to ensure we get the actual last message
        # This ensures we don't miss messages due to prefetch issues
        last_msg = Message.objects.filter(
            conversation_id=obj.id
        ).select_related('sender').order_by('-created_at').first()
        
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
    
    def get_commitment(self, obj):
        """Get active investment commitment linked to this conversation."""
        try:
            from apps.ventures.models import InvestmentCommitment
            
            # Get the most recent active commitment for this conversation
            commitment = InvestmentCommitment.objects.filter(
                conversation=obj,
                status__in=['COMMITTED', 'EXPRESSED']  # Only show active commitments
            ).order_by('-committed_at').first()
            
            if not commitment:
                return None
            
            request = self.context.get('request')
            if not request or not request.user:
                return None
            
            # Return commitment details
            return {
                'id': str(commitment.id),
                'amount': str(commitment.amount) if commitment.amount else None,
                'status': commitment.status,
                'venture_response': commitment.venture_response,
                'venture_response_message': commitment.venture_response_message,
                'committed_at': commitment.committed_at,
                'updated_at': commitment.updated_at,
                'product_id': str(commitment.product.id),
                'product_name': commitment.product.name,
                'is_deal': commitment.is_deal,
                'investor_completed_at': commitment.investor_completed_at.isoformat() if commitment.investor_completed_at else None,
                'venture_completed_at': commitment.venture_completed_at.isoformat() if commitment.venture_completed_at else None,
                'completed_at': commitment.completed_at.isoformat() if commitment.completed_at else None,
                # Include user-specific actions
                'can_update': (
                    request.user == commitment.investor and 
                    commitment.venture_response == 'RENEGOTIATE'
                ),
                'can_accept': (
                    request.user == commitment.product.user and 
                    commitment.venture_response == 'PENDING'
                ),
                'can_renegotiate': (
                    request.user == commitment.product.user and 
                    commitment.venture_response == 'PENDING'
                ),
                'can_complete': (
                    commitment.is_deal and 
                    commitment.status != 'COMPLETED' and
                    (
                        (request.user == commitment.investor and not commitment.investor_completed_at) or
                        (request.user == commitment.product.user and not commitment.venture_completed_at)
                    )
                ),
            }
        except Exception:
            return None
    
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
    messages = serializers.SerializerMethodField()  # Use SerializerMethodField to control ordering
    other_participant = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    commitment = serializers.SerializerMethodField()  # Include commitment context if exists
    
    class Meta:
        model = Conversation
        fields = ('id', 'participants', 'other_participant', 'created_at', 'last_message_at', 'messages', 'unread_count', 'commitment')
        read_only_fields = ('id', 'created_at', 'last_message_at')
    
    def get_messages(self, obj):
        """
        Get all messages sorted chronologically (oldest first) for chat display.
        
        Returns ALL messages from ALL conversations between the same two participants:
        - User messages (sent by conversation participants)
        - System messages (commitment-related messages created by the system)
        
        This aggregates messages from multiple conversations between the same two users
        into a single unified thread, ensuring users see their complete conversation history.
        
        Security: No filtering by sender - all messages between the participants are returned
        as long as the user is a participant (enforced at view level).
        """
        request = self.context.get('request')
        if not request or not request.user:
            # Fallback to single conversation if no request context
            messages = Message.objects.filter(
                conversation_id=obj.id
            ).select_related('sender').order_by('created_at')
            return MessageSerializer(messages, many=True, context=self.context).data
        
        # Get the other participant (not the current user)
        other_participants = obj.participants.exclude(id=request.user.id)
        if not other_participants.exists():
            # Only one participant (shouldn't happen, but handle gracefully)
            messages = Message.objects.filter(
                conversation_id=obj.id
            ).select_related('sender').order_by('created_at')
            return MessageSerializer(messages, many=True, context=self.context).data
        
        other_participant = other_participants.first()
        
        # Find ALL conversations between these two users
        # This aggregates messages from multiple conversations into a single unified thread
        import logging
        logger = logging.getLogger(__name__)
        conversation_ids = [obj.id]  # Initialize with current conversation as fallback
        
        try:
            from django.db.models import Count, Q
            # Find all conversations where both users are participants
            # SECURITY: Use UUIDs for all comparisons, never emails
            # CRITICAL FIX: Use intersection method as primary - more reliable for ManyToMany
            
            # Get all conversations for each user (using UUIDs)
            user1_conversation_ids = set(
                Conversation.objects.filter(participants=request.user).values_list('id', flat=True)
            )
            user2_conversation_ids = set(
                Conversation.objects.filter(participants=other_participant).values_list('id', flat=True)
            )
            
            # Find intersection: conversations where BOTH users are participants
            common_conversation_ids = list(user1_conversation_ids & user2_conversation_ids)
            
            logger.info(f'User {request.user.id} (UUID) has {len(user1_conversation_ids)} conversations')
            logger.info(f'User {other_participant.id} (UUID) has {len(user2_conversation_ids)} conversations')
            logger.info(f'Found {len(common_conversation_ids)} common conversations (intersection)')
            logger.info(f'Common conversation IDs: {common_conversation_ids}')
            
            # Verify each conversation has exactly 2 participants (one-on-one conversations)
            # This ensures we only aggregate messages from conversations between these two users
            verified_conversation_ids = []
            for conv_id in common_conversation_ids:
                try:
                    conv = Conversation.objects.get(id=conv_id)
                    participant_ids = set(conv.participants.values_list('id', flat=True))
                    participant_count = len(participant_ids)
                    
                    # Security: Verify both users are actually participants (UUID comparison)
                    if request.user.id in participant_ids and other_participant.id in participant_ids:
                        if participant_count == 2:
                            verified_conversation_ids.append(conv_id)
                            message_count = Message.objects.filter(conversation_id=conv_id).count()
                            logger.info(f'  Verified Conversation {conv_id}: participant_count={participant_count}, messages={message_count}')
                        else:
                            logger.warning(f'  Conversation {conv_id} has {participant_count} participants (expected 2), skipping')
                    else:
                        logger.warning(f'  Conversation {conv_id} does not contain both users, skipping')
                except Exception as e:
                    logger.warning(f'  Could not verify conversation {conv_id}: {str(e)}')
            
            conversation_ids = verified_conversation_ids
            
            # If no verified conversations found, fallback to current conversation
            if not conversation_ids:
                logger.warning(f'No verified conversations found between user {request.user.id} (UUID) and {other_participant.id} (UUID)')
                logger.warning(f'Falling back to current conversation {obj.id}')
                conversation_ids = [obj.id]  # Fallback to current conversation
                # Verify current conversation has both users as participants
                try:
                    current_conv = Conversation.objects.get(id=obj.id)
                    current_participant_ids = set(current_conv.participants.values_list('id', flat=True))
                    if request.user.id not in current_participant_ids or other_participant.id not in current_participant_ids:
                        logger.error(f'Current conversation {obj.id} does not contain both users! This is a security issue.')
                except Exception as e:
                    logger.error(f'Could not verify current conversation: {str(e)}')
            
            # Query ALL messages from ALL conversations between these two users
            # This creates a unified thread showing the complete conversation history
            # Debug: Check message count per conversation before aggregation
            logger.info(f'Checking messages in {len(conversation_ids)} conversations:')
            total_messages_before = 0
            for conv_id in conversation_ids:
                msg_count = Message.objects.filter(conversation_id=conv_id).count()
                total_messages_before += msg_count
                logger.info(f'  Conversation {conv_id}: {msg_count} messages')
            logger.info(f'Total messages expected: {total_messages_before}')
            
            # Query ALL messages from ALL conversations
            messages = Message.objects.filter(
                conversation_id__in=conversation_ids
            ).select_related('sender').order_by('created_at')  # Oldest first for chronological chat
            
            # Verify we got all messages
            actual_count = messages.count()
            logger.info(f'Actual messages retrieved: {actual_count} (expected: {total_messages_before})')
            if actual_count != total_messages_before:
                logger.warning(f'MESSAGE COUNT MISMATCH! Expected {total_messages_before} but got {actual_count}')
            
        except Exception as e:
            # Error handling: fallback to single conversation if aggregation fails
            logger.error(f'Error aggregating messages from multiple conversations: {str(e)}', exc_info=True)
            # Fallback to single conversation
            conversation_ids = [obj.id]
            messages = Message.objects.filter(
                conversation_id=obj.id
            ).select_related('sender').order_by('created_at')
        
        # Debug: Log message count and details (temporary - for debugging)
        # SECURITY: Use UUIDs in logs, not emails
        message_count = messages.count()
        logger.info(f'Unified thread for user {request.user.id} (UUID) and {other_participant.id} (UUID): Found {message_count} messages across {len(conversation_ids)} conversations')
        logger.info(f'Conversation IDs: {conversation_ids}')
        if message_count > 0:
            for msg in messages:
                logger.info(f'  - Message {msg.id} (conv: {msg.conversation_id}): sender={msg.sender.id} (UUID), created_at={msg.created_at}, body_preview={msg.body[:50]}...')
        else:
            logger.warning(f'No messages found in conversations: {conversation_ids}')
        
        return MessageSerializer(messages, many=True, context=self.context).data
    
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
    
    def get_commitment(self, obj):
        """Get active investment commitment linked to this conversation."""
        try:
            from apps.ventures.models import InvestmentCommitment
            
            # Get the most recent active commitment for this conversation
            commitment = InvestmentCommitment.objects.filter(
                conversation=obj,
                status__in=['COMMITTED', 'EXPRESSED']  # Only show active commitments
            ).order_by('-committed_at').first()
            
            if not commitment:
                return None
            
            request = self.context.get('request')
            if not request or not request.user:
                return None
            
            # Return commitment details
            return {
                'id': str(commitment.id),
                'amount': str(commitment.amount) if commitment.amount else None,
                'status': commitment.status,
                'venture_response': commitment.venture_response,
                'venture_response_message': commitment.venture_response_message,
                'committed_at': commitment.committed_at,
                'updated_at': commitment.updated_at,
                'product_id': str(commitment.product.id),
                'product_name': commitment.product.name,
                'is_deal': commitment.is_deal,
                # Include user-specific actions
                'can_update': (
                    request.user == commitment.investor and 
                    commitment.venture_response == 'RENEGOTIATE'
                ),
                'can_accept': (
                    request.user == commitment.product.user and 
                    commitment.venture_response == 'PENDING'
                ),
                'can_renegotiate': (
                    request.user == commitment.product.user and 
                    commitment.venture_response == 'PENDING'
                ),
            }
        except Exception:
            return None
