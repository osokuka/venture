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

export interface VentureUserProfile {
  id: string;
  user: string;
  user_email: string;
  user_name: string;
  company_name?: string;
  sector?: string;
  short_description?: string;
  website?: string;
  linkedin_url?: string;
  address?: string;
  year_founded?: number;
  employees_count?: number;
  founder_name?: string;
  founder_linkedin?: string;
  founder_role?: string;
  customers?: string;
  key_metrics?: string;
  needs?: string[] | Record<string, any>;
  phone?: string;
  logo?: string;
  logo_url?: string;
  logo_url_display?: string;
  created_at: string;
  updated_at: string;
}

export interface VentureProfileUpdateData {
  company_name?: string;
  sector?: string;
  short_description?: string;
  website?: string;
  linkedin_url?: string;
  address?: string;
  year_founded?: number;
  employees_count?: number;
  founder_name?: string;
  founder_linkedin?: string;
  founder_role?: string;
  customers?: string;
  key_metrics?: string;
  needs?: string[] | Record<string, any>;
  phone?: string;
  logo?: File;
  logo_url?: string;
}

export const ventureService = {
  /**
   * Get current user's venture profile
   */
  async getMyProfile(): Promise<VentureUserProfile> {
    try {
      const response = await apiClient.get('/ventures/profile/me');
      return response.data;
    } catch (error: any) {
      // Return null if profile doesn't exist (404), throw for other errors
      if (error?.response?.status === 404) {
        return null as any;
      }
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update venture profile
   * Supports both JSON data and FormData (for file uploads)
   */
  async updateProfile(data: VentureProfileUpdateData): Promise<VentureUserProfile> {
    try {
      // Check if we need to send FormData (if logo file is present)
      const hasFile = data.logo instanceof File;
      
      let response;
      if (hasFile) {
        // Use FormData for file upload
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
          if (key === 'logo' && data.logo instanceof File) {
            formData.append('logo', data.logo);
          } else if (key === 'needs' && data.needs) {
            // Handle needs as JSON string
            formData.append('needs', JSON.stringify(data.needs));
          } else if (data[key as keyof VentureProfileUpdateData] !== undefined && data[key as keyof VentureProfileUpdateData] !== null) {
            const value = data[key as keyof VentureProfileUpdateData];
            formData.append(key, String(value));
          }
        });
        
        // Don't set Content-Type header - let axios/browser set it with boundary
        response = await apiClient.patch('/ventures/profile/me', formData);
      } else {
        // Use JSON for regular updates
        const jsonData: any = { ...data };
        // Remove logo if it's not a File
        if (jsonData.logo && !(jsonData.logo instanceof File)) {
          delete jsonData.logo;
        }
        response = await apiClient.patch('/ventures/profile/me', jsonData);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Create or update venture profile (draft) - Legacy method, use updateProfile instead
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
