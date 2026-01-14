"""
URL configuration for messaging app.
"""
from django.urls import path
from .views import (
    ConversationListView,
    ConversationDetailView,
    send_message,
    mark_conversation_read,
    get_unread_count
)

urlpatterns = [
    path('conversations', ConversationListView.as_view(), name='conversation_list'),
    path('conversations/<uuid:id>', ConversationDetailView.as_view(), name='conversation_detail'),
    path('conversations/<uuid:conversation_id>/messages', send_message, name='send_message'),
    path('conversations/<uuid:conversation_id>/read', mark_conversation_read, name='mark_read'),
    path('conversations/unread-count', get_unread_count, name='unread_count'),
]
