/**
 * Venture Service
 * Handles all venture-related API calls
 */

import apiClient, { getErrorMessage } from './api';

export interface VentureProfileData {
  name: string;
  industry_sector: string;
  website: string;
  linkedin_url: string;
  address?: string;
  year_founded?: number;
  employees_count?: number;
  short_description: string;
  // Note: problem_statement, solution_description, target_market, traction_metrics,
  // funding_amount, funding_stage, and use_of_funds are now associated with
  // each pitch deck document, not the product itself
}

export interface FounderData {
  full_name: string;
  linkedin_url: string;
  email: string;
  phone?: string;
  role_title?: string;
}

export interface TeamMemberData {
  name: string;
  role_title: string;
  description?: string;
  linkedin_url?: string;
}

export interface VentureNeedData {
  need_type: 'FINANCE' | 'MARKET_ACCESS' | 'EXPERT' | 'OTHER';
  finance_size_range?: string;
  finance_objectives?: string;
  target_markets?: string[];
  expertise_field?: string;
  duration?: string;
  other_notes?: string;
}

export const ventureService = {
  /**
   * Get current user's venture profile
   */
  async getMyProfile() {
    try {
      const response = await apiClient.get('/ventures/profile/me');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create or update venture profile (draft)
   */
  async saveProfile(data: VentureProfileData) {
    try {
      const response = await apiClient.post('/ventures/profile', data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Submit venture profile for approval
   */
  async submitProfile() {
    try {
      const response = await apiClient.post('/ventures/profile/submit');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Upload pitch deck
   */
  async uploadPitchDeck(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/ventures/documents/pitch-deck', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get list of approved ventures (for investors/mentors)
   * Handles both array and paginated responses
   */
  async getPublicVentures(params?: { sector?: string; search?: string; page?: number }) {
    try {
      const response = await apiClient.get('/ventures/public', { params });
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
   * Get venture detail by ID
   */
  async getVentureById(id: string) {
    try {
      const response = await apiClient.get(`/ventures/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
