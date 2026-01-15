"""
URL configuration for messaging app.
"""
from django.urls import path
from .views import (
    ConversationListView,
    ConversationDetailView,
    send_message,
    update_message,
    mark_conversation_read,
    get_unread_count,
    delete_conversation
)

urlpatterns = [
    path('conversations', ConversationListView.as_view(), name='conversation_list'),
    path('conversations/unread-count', get_unread_count, name='unread_count'),
    # More specific patterns must come before the generic <uuid:id> pattern
    # Allow 'new' as conversation_id for lazy conversation creation
    # Use str converter to allow 'new' as a string parameter
    path('conversations/<str:conversation_id>/messages', send_message, name='send_message'),
    path('conversations/<uuid:conversation_id>/read', mark_conversation_read, name='mark_read'),
    path('conversations/<uuid:conversation_id>/delete', delete_conversation, name='delete_conversation'),  # DELETE endpoint
    path('conversations/<uuid:id>', ConversationDetailView.as_view(), name='conversation_detail'),  # GET endpoint - must come after specific patterns
    # Message update endpoint - must come after conversations patterns to avoid conflicts
    path('message/<uuid:message_id>', update_message, name='update_message'),  # Full path: /api/messages/message/<id>
]
