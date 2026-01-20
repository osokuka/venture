/**
 * Mentor Service
 * Handles all mentor-related API calls
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
export interface MentorProfile {
  id: string;
  user: string;
  user_email: string;
  user_name: string;
  full_name: string;
  job_title: string;
  company: string;
  linkedin_or_website: string;
  contact_email: string;
  phone?: string;
  expertise_fields: string[];
  experience_overview: string;
  industries_of_interest: string[];
  engagement_type: 'PAID' | 'PRO_BONO' | 'BOTH';
  paid_rate_type?: 'HOURLY' | 'DAILY' | 'MONTHLY';
  paid_rate_amount?: string;
  availability_types: string[];
  preferred_engagement: 'VIRTUAL' | 'IN_PERSON' | 'BOTH';
  visible_to_ventures: boolean;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  submitted_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MentorProfileCreatePayload {
  full_name: string;
  job_title: string;
  company: string;
  linkedin_or_website: string;
  contact_email: string;
  phone?: string;
  expertise_fields: string[];
  experience_overview: string;
  industries_of_interest: string[];
  engagement_type: 'PAID' | 'PRO_BONO' | 'BOTH';
  paid_rate_type?: 'HOURLY' | 'DAILY' | 'MONTHLY';
  paid_rate_amount?: string;
  availability_types: string[];
  preferred_engagement: 'VIRTUAL' | 'IN_PERSON' | 'BOTH';
  visible_to_ventures?: boolean;
}

export interface MentorProfileUpdatePayload extends Partial<MentorProfileCreatePayload> {}

export const mentorService = {
  /**
   * Get current user's mentor profile
   */
  async getMyProfile(): Promise<MentorProfile> {
    try {
      const response = await apiClient.get('/mentors/profile/me');
      // Backend now returns 200 OK with null when profile doesn't exist (instead of 404)
      // Return null if response data is null/empty
      return response.data || null as any;
    } catch (error: any) {
      // Handle 404 for backward compatibility (in case backend hasn't been updated)
      if (error?.response?.status === 404) {
        return null as any;
      }
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create mentor profile (draft)
   */
  async createProfile(data: MentorProfileCreatePayload): Promise<MentorProfile> {
    try {
      const response = await apiClient.post('/mentors/profile', data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update mentor profile (only if DRAFT or REJECTED)
   */
  async updateProfile(data: MentorProfileUpdatePayload): Promise<MentorProfile> {
    try {
      const response = await apiClient.patch('/mentors/profile/me', data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Submit mentor profile for approval
   */
  async submitProfile(): Promise<{ detail: string; review_id: string }> {
    try {
      const response = await apiClient.post('/mentors/profile/submit');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get list of visible mentors (for approved ventures/admin)
   */
  async getPublicMentors(params?: {
    search?: string;
    expertise?: string;
    industry?: string;
    page?: number;
  }): Promise<MentorProfile[]> {
    try {
      const response = await apiClient.get('/mentors/public', { params });
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
   * Get mentor detail by ID
   */
  async getMentorById(id: string): Promise<MentorProfile> {
    try {
      const response = await apiClient.get(`/mentors/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
