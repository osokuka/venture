/**
 * Admin Service
 * Handles all admin-related API calls
 */

import apiClient from './api';

export interface AdminStats {
  totalUsers: number;
  totalVentures: number;
  totalInvestors: number;
  totalMentors: number;
  pendingApprovals: number;
  approvedProfiles: number;
  rejectedProfiles: number;
  totalMessages: number;
}

export interface UserListItem {
  id: string;
  email: string;
  full_name: string;
  role: 'VENTURE' | 'INVESTOR' | 'MENTOR' | 'ADMIN';
  is_email_verified: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface AdminUserUpsertPayload {
  email: string;
  password?: string;
  full_name: string;
  role: 'VENTURE' | 'INVESTOR' | 'MENTOR' | 'ADMIN';
  is_email_verified?: boolean;
  is_active?: boolean;
}

export interface ApprovalItem {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  role: 'VENTURE' | 'INVESTOR' | 'MENTOR';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

export const adminService = {
  /**
   * Get platform statistics
   * Falls back to empty stats if endpoint doesn't exist yet
   */
  async getStats(): Promise<AdminStats> {
    try {
      // Try admin stats endpoint first
      const response = await apiClient.get('/admin/stats');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      // If endpoint doesn't exist (404), return empty stats
      if (error.response?.status === 404) {
        console.warn('Admin stats endpoint not available yet. Using empty stats.');
      }
      // Return empty stats if API fails
      return {
        totalUsers: 0,
        totalVentures: 0,
        totalInvestors: 0,
        totalMentors: 0,
        pendingApprovals: 0,
        approvedProfiles: 0,
        rejectedProfiles: 0,
        totalMessages: 0,
      };
    }
  },

  /**
   * Get list of all users
   * Uses /api/admin/users endpoint or falls back to empty list
   */
  async getUsers(params?: { role?: string; page?: number; search?: string }): Promise<{
    results: UserListItem[];
    count: number;
    next: string | null;
    previous: string | null;
  }> {
    try {
      const response = await apiClient.get('/admin/users', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      // If endpoint doesn't exist (404), return empty list
      if (error.response?.status === 404) {
        console.warn('Admin users endpoint not available yet. Returning empty list.');
        return {
          results: [],
          count: 0,
          next: null,
          previous: null,
        };
      }
      throw error;
    }
  },

  /**
   * Create a user (admin only)
   */
  async createUser(payload: AdminUserUpsertPayload): Promise<UserListItem> {
    const response = await apiClient.post('/admin/users', payload);
    return response.data;
  },

  /**
   * Update a user (admin only)
   */
  async updateUser(userId: string, payload: Partial<AdminUserUpsertPayload>): Promise<UserListItem> {
    const response = await apiClient.patch(`/admin/users/${userId}`, payload);
    return response.data;
  },

  /**
   * Delete a user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  /**
   * Get pending approvals
   * Uses /api/reviews/pending endpoint (as per project scope)
   */
  async getPendingApprovals(): Promise<ApprovalItem[]> {
    try {
      const response = await apiClient.get('/reviews/pending');
      // Transform response if needed
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    } catch (error: any) {
      console.error('Error fetching pending approvals:', error);
      // If endpoint doesn't exist (404), return empty array
      if (error.response?.status === 404) {
        console.warn('Reviews endpoint not available yet. Returning empty list.');
        return [];
      }
      return [];
    }
  },

  /**
   * Approve a profile
   * Uses /api/reviews/{id}/approve endpoint (as per project scope)
   */
  async approveProfile(approvalId: string): Promise<void> {
    try {
      await apiClient.post(`/reviews/${approvalId}/approve`);
    } catch (error: any) {
      console.error('Error approving profile:', error);
      // Provide more helpful error message
      if (error.response?.status === 404) {
        throw new Error('Approval endpoint not available. Please ensure backend is running.');
      }
      throw error;
    }
  },

  /**
   * Reject a profile
   * Uses /api/reviews/{id}/reject endpoint (as per project scope)
   */
  async rejectProfile(approvalId: string, reason?: string): Promise<void> {
    try {
      await apiClient.post(`/reviews/${approvalId}/reject`, { reason });
    } catch (error: any) {
      console.error('Error rejecting profile:', error);
      // Provide more helpful error message
      if (error.response?.status === 404) {
        throw new Error('Rejection endpoint not available. Please ensure backend is running.');
      }
      throw error;
    }
  },
};
