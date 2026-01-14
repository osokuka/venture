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
      return response.data;
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
   */
  async sendMessage(conversationId: string, body: string): Promise<Message> {
    try {
      const response = await apiClient.post(`/messages/conversations/${conversationId}/messages`, {
        body,
      });
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
   * Get unread message count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get('/messages/conversations/unread-count');
      return response.data.unread_count || 0;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
