"""
Views for messaging app.
"""
import re
from django.utils import timezone
from django.db.models import Q, Count, Prefetch
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from shared.permissions import IsApprovedUser
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer, ConversationDetailSerializer
from apps.accounts.models import User


class ConversationListView(generics.ListCreateAPIView):
    """
    List user's conversations or create a new conversation.
    
    GET /api/messages/conversations - List all user's conversations
    POST /api/messages/conversations - Create new conversation
    """
    permission_classes = [IsAuthenticated, IsApprovedUser]
    serializer_class = ConversationSerializer
    
    def get_queryset(self):
        """Return conversations where current user is a participant."""
        # Annotate with participant count to help identify one-on-one conversations
        return Conversation.objects.filter(
            participants=self.request.user
        ).annotate(
            participant_count=Count('participants')
        ).prefetch_related('participants', 'messages').order_by('-last_message_at', '-created_at')
    
    def get_serializer_context(self):
        """Ensure request context is passed to serializer."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """
        Create a new conversation with another user.
        Body: { "participant_id": "<uuid>" }
        """
        participant_id = request.data.get('participant_id')
        if not participant_id:
            return Response(
                {'detail': 'participant_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Security: Validate UUID format
        try:
            import uuid
            uuid.UUID(str(participant_id))
        except (ValueError, TypeError):
            return Response(
                {'detail': 'Invalid participant_id format.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Security: Prevent self-messaging
        if str(participant_id) == str(request.user.id):
            return Response(
                {'detail': 'Cannot create conversation with yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            participant = User.objects.get(id=participant_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Participant not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Security: Check visibility rules for messaging
        # Ventures can only message visible investors/mentors
        if request.user.role == 'VENTURE':
            if participant.role == 'INVESTOR':
                from apps.investors.models import InvestorProfile, InvestorVisibleToVenture
                try:
                    investor_profile = InvestorProfile.objects.get(user=participant)
                    if investor_profile.status != 'APPROVED':
                        return Response(
                            {'detail': 'This investor is not available for messaging.'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                    # Check if investor is visible to this venture (publicly or via incognito grant)
                    is_visible = investor_profile.visible_to_ventures or \
                        InvestorVisibleToVenture.objects.filter(
                            investor=investor_profile,
                            venture_user=request.user
                        ).exists()
                    if not is_visible:
                        return Response(
                            {'detail': 'This investor is not available for messaging.'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                except InvestorProfile.DoesNotExist:
                    return Response(
                        {'detail': 'Investor profile not found.'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            elif participant.role == 'MENTOR':
                from apps.mentors.models import MentorProfile
                try:
                    mentor_profile = MentorProfile.objects.get(user=participant)
                    if not mentor_profile.visible_to_ventures or mentor_profile.status != 'APPROVED':
                        return Response(
                            {'detail': 'This mentor is not available for messaging.'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                except MentorProfile.DoesNotExist:
                    return Response(
                        {'detail': 'Mentor profile not found.'},
                        status=status.HTTP_404_NOT_FOUND
                    )
        
        # Security: Ensure both users are approved (IsApprovedUser already checked at permission level)
        # Additional check: participant must also be approved
        if participant.role != 'ADMIN':
            if participant.role == 'VENTURE':
                from apps.ventures.models import VentureProduct
                if not VentureProduct.objects.filter(user=participant, status='APPROVED', is_active=True).exists():
                    return Response(
                        {'detail': 'Participant must have an approved profile to receive messages.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif participant.role == 'INVESTOR':
                from apps.investors.models import InvestorProfile
                try:
                    investor_profile = InvestorProfile.objects.get(user=participant)
                    if investor_profile.status != 'APPROVED':
                        return Response(
                            {'detail': 'Participant must have an approved profile to receive messages.'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                except InvestorProfile.DoesNotExist:
                    return Response(
                        {'detail': 'Participant profile not found.'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            elif participant.role == 'MENTOR':
                from apps.mentors.models import MentorProfile
                try:
                    mentor_profile = MentorProfile.objects.get(user=participant)
                    if mentor_profile.status != 'APPROVED':
                        return Response(
                            {'detail': 'Participant must have an approved profile to receive messages.'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                except MentorProfile.DoesNotExist:
                    return Response(
                        {'detail': 'Participant profile not found.'},
                        status=status.HTTP_404_NOT_FOUND
                    )
        
        # Incognito feature: If investor initiates conversation with venture,
        # make investor profile visible to that venture
        if request.user.role == 'INVESTOR' and participant.role == 'VENTURE':
            from apps.investors.models import InvestorProfile, InvestorVisibleToVenture
            try:
                investor_profile = InvestorProfile.objects.get(user=request.user)
                # Grant visibility to this venture (idempotent - won't create duplicate)
                InvestorVisibleToVenture.objects.get_or_create(
                    investor=investor_profile,
                    venture_user=participant
                )
            except InvestorProfile.DoesNotExist:
                # Investor profile doesn't exist yet, skip visibility grant
                pass
        
        # Check if conversation already exists between these two users
        # For a ManyToMany relationship, we need to find conversations where both users are participants
        # Use Q objects to ensure both participants are in the conversation
        existing_conversation = Conversation.objects.filter(
            Q(participants=request.user) & Q(participants=participant)
        ).annotate(
            participant_count=Count('participants')
        ).filter(
            participant_count=2
        ).distinct().first()
        
        if existing_conversation:
            serializer = ConversationDetailSerializer(existing_conversation, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Create new conversation
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, participant)
        
        serializer = ConversationDetailSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ConversationDetailView(generics.RetrieveAPIView):
    """
    Get conversation details with messages.
    
    GET /api/messages/conversations/{id}
    Returns conversation with messages sorted chronologically (oldest first).
    """
    permission_classes = [IsAuthenticated, IsApprovedUser]
    serializer_class = ConversationDetailSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return conversations where current user is a participant."""
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages')
    
    def get_serializer_context(self):
        """Ensure request context is passed to serializer."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsApprovedUser])
def send_message(request, conversation_id):
    """
    Send a message in a conversation (chat thread).
    
    POST /api/messages/conversations/{id}/messages
    Body: { "body": "message text" }
    
    This creates a new message in the conversation, which persists as part of the chat history.
    The message is stored in the database and will be visible to all conversation participants.
    
    If conversation_id is "new" and participant_id is provided in body, creates a new conversation.
    """
    # Special case: Create conversation lazily when sending first message
    # This prevents empty conversations from being created when users click "Contact" but don't send messages
    if conversation_id == 'new' or str(conversation_id).lower() == 'new':
        participant_id = request.data.get('participant_id')
        if not participant_id:
            return Response(
                {'detail': 'participant_id is required when creating a new conversation.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate UUID format
        try:
            import uuid
            uuid.UUID(str(participant_id))
        except (ValueError, TypeError):
            return Response(
                {'detail': 'Invalid participant_id format.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prevent self-messaging
        if str(participant_id) == str(request.user.id):
            return Response(
                {'detail': 'Cannot create conversation with yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            participant = User.objects.get(id=participant_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Participant not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if conversation already exists
        existing_conversation = Conversation.objects.filter(
            Q(participants=request.user) & Q(participants=participant)
        ).annotate(
            participant_count=Count('participants')
        ).filter(
            participant_count=2
        ).distinct().first()
        
        if existing_conversation:
            conversation = existing_conversation
        else:
            # Create new conversation only when first message is sent
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, participant)
    else:
        # Normal case: conversation exists (conversation_id is a UUID)
        try:
            # Validate that conversation_id is a valid UUID
            import uuid
            uuid.UUID(str(conversation_id))
        except (ValueError, TypeError):
            return Response(
                {'detail': 'Invalid conversation ID format.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
        except Conversation.DoesNotExist:
            return Response(
                {'detail': 'Conversation not found or you do not have permission.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    body = request.data.get('body', '').strip()
    if not body:
        return Response(
            {'detail': 'Message body is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Security: Validate message length to prevent DoS
    max_length = 10000  # 10KB max message length
    if len(body) > max_length:
        return Response(
            {'detail': f'Message body cannot exceed {max_length} characters.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Security: Sanitize message content to prevent XSS and injection attacks
    # Remove null bytes and control characters (except newlines, tabs, and carriage returns)
    body = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', body)
    
    # Security: Remove dangerous patterns
    # Prevent file path patterns (e.g., C:\file.txt, /etc/passwd)
    body = re.sub(r'[a-zA-Z]:[\\\/]', '', body, flags=re.IGNORECASE)
    body = re.sub(r'\.\.', '', body)  # Remove path traversal attempts
    
    # Security: Remove data URIs and javascript: protocols
    body = re.sub(r'data:', '', body, flags=re.IGNORECASE)
    body = re.sub(r'javascript:', '', body, flags=re.IGNORECASE)
    body = re.sub(r'vbscript:', '', body, flags=re.IGNORECASE)
    
    # Security: Remove HTML event handlers (onclick, onload, etc.)
    body = re.sub(r'on\w+\s*=', '', body, flags=re.IGNORECASE)
    
    # Security: Remove script, iframe, object, and embed tags (prevent code injection)
    body = re.sub(r'<script[^>]*>.*?</script>', '', body, flags=re.IGNORECASE | re.DOTALL)
    body = re.sub(r'<iframe[^>]*>.*?</iframe>', '', body, flags=re.IGNORECASE | re.DOTALL)
    body = re.sub(r'<object[^>]*>.*?</object>', '', body, flags=re.IGNORECASE | re.DOTALL)
    body = re.sub(r'<embed[^>]*>', '', body, flags=re.IGNORECASE)
    
    # Security: Final validation - ensure message is not empty after sanitization
    body = body.strip()
    if not body or len(body) == 0:
        return Response(
            {'detail': 'Message body cannot be empty after sanitization.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Security: Re-check length after sanitization
    if len(body) > max_length:
        body = body[:max_length]
    
    # Note: We store raw text (sanitized but not HTML-escaped)
    # The frontend will escape HTML when displaying to prevent XSS
    
    # Create message (this persists the message in the conversation thread)
    message = Message.objects.create(
        conversation=conversation,
        sender=request.user,
        body=body
    )
    
    # Update conversation's last_message_at to reflect the new message
    conversation.last_message_at = timezone.now()
    conversation.save(update_fields=['last_message_at'])
    
    # Return the message with proper serialization
    serializer = MessageSerializer(message, context={'request': request})
    response_data = serializer.data
    
    # If this was a newly created conversation, include conversation_id in response
    # so frontend can update the UI properly
    if conversation_id == 'new' or str(conversation_id).lower() == 'new':
        response_data['conversation_id'] = str(conversation.id)
    
    return Response(response_data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsApprovedUser])
def mark_conversation_read(request, conversation_id):
    """
    Mark all messages in a conversation as read.
    
    POST /api/messages/conversations/{id}/read
    """
    try:
        conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
    except Conversation.DoesNotExist:
        return Response(
            {'detail': 'Conversation not found or you do not have permission.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Mark all unread messages as read (only messages from other participants)
    updated_count = Message.objects.filter(
        conversation=conversation
    ).exclude(
        sender=request.user
    ).filter(
        read_at__isnull=True
    ).update(read_at=timezone.now())
    
    return Response(
        {
            'detail': 'Conversation marked as read.',
            'messages_marked_read': updated_count
        },
        status=status.HTTP_200_OK
    )


@api_view(['PATCH', 'PUT'])
@permission_classes([IsAuthenticated, IsApprovedUser])
def update_message(request, message_id):
    """
    Update/edit a message.
    
    PATCH /api/messages/{id}
    Body: { "body": "updated message text" }
    
    Users can only edit their own messages.
    Messages can only be edited within 15 minutes of creation.
    """
    try:
        message = Message.objects.get(id=message_id)
    except Message.DoesNotExist:
        return Response(
            {'detail': 'Message not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Security: Only allow users to edit their own messages
    if message.sender != request.user:
        return Response(
            {'detail': 'You can only edit your own messages.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Security: Only allow editing within 15 minutes of creation
    from datetime import timedelta
    time_limit = timedelta(minutes=15)
    if timezone.now() - message.created_at > time_limit:
        return Response(
            {'detail': 'Messages can only be edited within 15 minutes of sending.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    body = request.data.get('body', '').strip()
    if not body:
        return Response(
            {'detail': 'Message body is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Security: Validate message length to prevent DoS
    max_length = 10000  # 10KB max message length
    if len(body) > max_length:
        return Response(
            {'detail': f'Message body cannot exceed {max_length} characters.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Security: Sanitize message content (same as send_message)
    body = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', body)
    body = re.sub(r'[a-zA-Z]:[\\\/]', '', body, flags=re.IGNORECASE)
    body = re.sub(r'\.\.', '', body)
    body = re.sub(r'data:', '', body, flags=re.IGNORECASE)
    body = re.sub(r'javascript:', '', body, flags=re.IGNORECASE)
    body = re.sub(r'vbscript:', '', body, flags=re.IGNORECASE)
    body = re.sub(r'on\w+\s*=', '', body, flags=re.IGNORECASE)
    body = re.sub(r'<script[^>]*>.*?</script>', '', body, flags=re.IGNORECASE | re.DOTALL)
    body = re.sub(r'<iframe[^>]*>.*?</iframe>', '', body, flags=re.IGNORECASE | re.DOTALL)
    body = re.sub(r'<object[^>]*>.*?</object>', '', body, flags=re.IGNORECASE | re.DOTALL)
    body = re.sub(r'<embed[^>]*>', '', body, flags=re.IGNORECASE)
    body = body.strip()
    
    if not body or len(body) == 0:
        return Response(
            {'detail': 'Message body cannot be empty after sanitization.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(body) > max_length:
        body = body[:max_length]
    
    # Update the message
    message.body = body
    message.save(update_fields=['body'])
    
    # Return the updated message
    serializer = MessageSerializer(message, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count(request):
    """
    Get unread message count for current user.
    
    GET /api/messages/conversations/unread-count
    
    Note: All authenticated users can check their unread count,
    even if they're not approved yet. They just can't send messages.
    """
    unread_count = Message.objects.filter(
        conversation__participants=request.user
    ).exclude(
        sender=request.user
    ).filter(
        read_at__isnull=True
    ).count()
    
    return Response(
        {'unread_count': unread_count},
        status=status.HTTP_200_OK
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsApprovedUser])
def delete_conversation(request, conversation_id):
    """
    Delete a conversation for the current user.
    
    DELETE /api/messages/conversations/{id}
    
    This removes the current user from the conversation's participants,
    effectively removing it from their inbox. Other participants are not affected.
    """
    try:
        conversation = Conversation.objects.get(id=conversation_id)
    except Conversation.DoesNotExist:
        return Response(
            {'detail': 'Conversation not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Security: Only allow users to remove themselves from conversations they're part of
    if request.user not in conversation.participants.all():
        return Response(
            {'detail': 'You are not a participant in this conversation.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Remove the current user from the conversation's participants
    # This effectively removes the conversation from their inbox
    conversation.participants.remove(request.user)
    
    # If no participants remain, delete the conversation entirely
    if conversation.participants.count() == 0:
        conversation.delete()
        return Response(
            {'detail': 'Conversation deleted successfully.'},
            status=status.HTTP_200_OK
        )
    
    return Response(
        {'detail': 'Conversation removed from your inbox.'},
        status=status.HTTP_200_OK
    )
