"""
Views for messaging app.
"""
from django.utils import timezone
from django.db.models import Q
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
    
    def get_queryset(self):
        """Return conversations where current user is a participant."""
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages').order_by('-last_message_at', '-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ConversationSerializer
        return ConversationSerializer
    
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
                from apps.investors.models import InvestorProfile
                try:
                    investor_profile = InvestorProfile.objects.get(user=participant)
                    if not investor_profile.visible_to_ventures or investor_profile.status != 'APPROVED':
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
        
        # Check if conversation already exists
        existing_conversation = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=participant
        ).first()
        
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
    """
    permission_classes = [IsAuthenticated, IsApprovedUser]
    serializer_class = ConversationDetailSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return conversations where current user is a participant."""
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages')


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsApprovedUser])
def send_message(request, conversation_id):
    """
    Send a message in a conversation.
    
    POST /api/messages/conversations/{id}/messages
    Body: { "body": "message text" }
    """
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
    
    # Create message
    message = Message.objects.create(
        conversation=conversation,
        sender=request.user,
        body=body
    )
    
    # Update conversation's last_message_at
    conversation.last_message_at = timezone.now()
    conversation.save(update_fields=['last_message_at'])
    
    serializer = MessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


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
    
    # Mark all unread messages as read
    Message.objects.filter(
        conversation=conversation
    ).exclude(
        sender=request.user
    ).filter(
        read_at__isnull=True
    ).update(read_at=timezone.now())
    
    return Response(
        {'detail': 'Conversation marked as read.'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsApprovedUser])
def get_unread_count(request):
    """
    Get unread message count for current user.
    
    GET /api/messages/conversations/unread-count
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
