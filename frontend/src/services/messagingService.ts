/**
 * Messaging Service
 * Handles all messaging-related API calls
 */

import apiClient, { getErrorMessage } from './api';

export interface Conversation {
  id: string;
  participants: any[];
  other_participant?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  created_at: string;
  last_message_at?: string;
  last_message?: {
    id: string;
    body: string;
    sender_id: string;
    created_at: string;
  };
  unread_count: number;
}

export interface Message {
  id: string;
  sender: string;
  sender_email: string;
  sender_name: string;
  body: string;
  created_at: string;
  read_at?: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export const messagingService = {
  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await apiClient.get('/messages/conversations');
      // Handle both array and paginated response
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // If paginated, return results array
      return response.data.results || response.data.data || [];
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create a new conversation with another user
   */
  async createConversation(participantId: string): Promise<ConversationDetail> {
    try {
      const response = await apiClient.post('/messages/conversations', {
        participant_id: participantId,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get conversation details with messages
   */
  async getConversation(conversationId: string): Promise<ConversationDetail> {
    try {
      const response = await apiClient.get(`/messages/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Send a message in a conversation
   * If conversationId is 'new', creates a new conversation with participantId
   */
  async sendMessage(conversationId: string, body: string, participantId?: string): Promise<Message> {
    try {
      const payload: any = { body };
      // If creating a new conversation, include participant_id
      if (conversationId === 'new' && participantId) {
        payload.participant_id = participantId;
      }
      
      const response = await apiClient.post(`/messages/conversations/${conversationId}/messages`, payload);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Mark conversation as read
   */
  async markConversationRead(conversationId: string): Promise<void> {
    try {
      await apiClient.post(`/messages/conversations/${conversationId}/read`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update/edit a message
   * Users can only edit their own messages within 15 minutes of sending
   */
  async updateMessage(messageId: string, body: string): Promise<Message> {
    try {
      // Backend URL pattern: /api/messages/message/<uuid:message_id>
      const response = await apiClient.patch(`/messages/message/${messageId}`, {
        body,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get unread message count
   * Note: This endpoint only requires IsAuthenticated (not IsApprovedUser),
   * so unapproved users can still see their unread count.
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get('/messages/conversations/unread-count');
      // Handle both direct number and object response
      if (typeof response.data === 'number') {
        return response.data;
      }
      return response.data?.unread_count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0; // Return 0 on error instead of throwing
    }
  },

  /**
   * Delete a conversation (remove from user's inbox)
   * This only removes the conversation from the current user's inbox,
   * other participants are not affected.
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await apiClient.delete(`/messages/conversations/${conversationId}/delete`);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
