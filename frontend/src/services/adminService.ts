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
  // User fields
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  role: 'VENTURE' | 'INVESTOR' | 'MENTOR';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
  
  // Product/Pitch deck fields (for VENTURE submissions)
  product_id?: string;
  product_name?: string;
  product_industry?: string;
  product_website?: string;
  product_short_description?: string;
  product_created_at?: string;
  
  // Pitch deck document fields
  pitch_deck_file_url?: string;
  pitch_deck_file_name?: string;
  pitch_deck_problem_statement?: string;
  pitch_deck_solution_description?: string;
  pitch_deck_target_market?: string;
  pitch_deck_funding_amount?: string;
  pitch_deck_funding_stage?: string;
  pitch_deck_traction_metrics?: any;
  pitch_deck_use_of_funds?: string;

  // Investor/Mentor profile fields (only populated for profile reviews)
  profile_id?: string | null;
  profile_type?: 'INVESTOR' | 'MENTOR' | null;
  profile_full_name?: string | null;
  profile_linkedin_or_website?: string | null;
  profile_phone?: string | null;
  profile_visible_to_ventures?: boolean | null;
  profile_status?: string | null;
  profile_submitted_at?: string | null;
  profile_approved_at?: string | null;

  // Investor-specific
  investor_organization_name?: string | null;
  investor_email?: string | null;
  investor_investment_experience_years?: number | null;
  investor_deals_count?: number | null;
  investor_stage_preferences?: string[] | null;
  investor_industry_preferences?: string[] | null;
  investor_average_ticket_size?: string | null;

  // Mentor-specific
  mentor_job_title?: string | null;
  mentor_company?: string | null;
  mentor_contact_email?: string | null;
  mentor_expertise_fields?: string[] | null;
  mentor_experience_overview?: string | null;
  mentor_industries_of_interest?: string[] | null;
  mentor_engagement_type?: string | null;
  mentor_paid_rate_type?: string | null;
  mentor_paid_rate_amount?: string | null;
  mentor_availability_types?: string[] | null;
  mentor_preferred_engagement?: string | null;
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
   * Get user detail (admin only)
   */
  async getUserDetail(userId: string): Promise<UserListItem> {
    const response = await apiClient.get(`/admin/users/${userId}`);
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
  async getPendingApprovals(params?: { type?: 'VENTURE' | 'INVESTOR' | 'MENTOR' }): Promise<ApprovalItem[]> {
    try {
      const response = await apiClient.get('/reviews/pending', { params });
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
   * Get approval/review details by ID
   * GET /api/reviews/<id>
   */
  async getReviewDetail(reviewId: string): Promise<ApprovalItem> {
    const response = await apiClient.get(`/reviews/${reviewId}`);
    return response.data;
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
