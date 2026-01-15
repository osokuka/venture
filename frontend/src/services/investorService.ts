/**
 * Investor Service
 * Handles all investor-related API calls
 */

import apiClient from './api';

// Helper function to extract error message
function getErrorMessage(error: any): string {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An error occurred';
}

// TypeScript interfaces
export interface InvestorProfile {
  id: string;
  user: string;
  user_email: string;
  user_name: string;
  full_name: string;
  organization_name: string;
  linkedin_or_website: string;
  email: string;
  phone?: string;
  investment_experience_years: number;
  deals_count?: number;
  stage_preferences: string[];
  industry_preferences: string[];
  average_ticket_size: string;
  visible_to_ventures: boolean;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  submitted_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InvestorProfileCreatePayload {
  full_name: string;
  organization_name: string;
  linkedin_or_website: string;
  email: string;
  phone?: string;
  investment_experience_years: number;
  deals_count?: number;
  stage_preferences: string[];
  industry_preferences: string[];
  average_ticket_size: string;
  visible_to_ventures?: boolean;
}

export interface InvestorProfileUpdatePayload extends Partial<InvestorProfileCreatePayload> {}

export const investorService = {
  /**
   * Get current user's investor profile
   */
  async getMyProfile(): Promise<InvestorProfile> {
    try {
      const response = await apiClient.get('/investors/profile/me');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create investor profile (draft)
   */
  async createProfile(data: InvestorProfileCreatePayload): Promise<InvestorProfile> {
    try {
      const response = await apiClient.post('/investors/profile', data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update investor profile (only if DRAFT or REJECTED)
   */
  async updateProfile(data: InvestorProfileUpdatePayload): Promise<InvestorProfile> {
    try {
      const response = await apiClient.patch('/investors/profile/me', data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Submit investor profile for approval
   */
  async submitProfile(): Promise<{ detail: string; review_id: string }> {
    try {
      const response = await apiClient.post('/investors/profile/submit');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get list of visible investors (for approved ventures/admin)
   * Returns investors that are:
   * - Publicly visible (visible_to_ventures=true)
   * - Visible to the current venture user (via incognito grants)
   */
  async getPublicInvestors(params?: {
    search?: string;
    stage?: string;
    industry?: string;
    page?: number;
  }): Promise<InvestorProfile[]> {
    try {
      const response = await apiClient.get('/investors/public', { params });
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
   * Get investor detail by ID
   * Only returns investors visible to the current user
   */
  async getInvestorById(id: string): Promise<InvestorProfile> {
    try {
      const response = await apiClient.get(`/investors/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
