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
  linkedin_or_website?: string; // Legacy field
  website?: string; // Company/personal website URL
  linkedin_url?: string; // LinkedIn profile URL
  email: string;
  phone?: string;
  investor_type?: 'INDIVIDUAL' | 'FIRM' | 'CORPORATE' | 'FAMILY_OFFICE'; // Investor type classification
  bio?: string; // Professional bio
  investment_experience?: string; // Detailed investment experience description
  investment_philosophy?: string; // Investment philosophy and what you look for
  notable_investments?: string; // Notable investments and portfolio companies
  address?: string; // Location/address
  investment_experience_years: number;
  deals_count?: number;
  stage_preferences: string[];
  industry_preferences: string[];
  geographic_focus?: string[]; // Geographic regions of interest
  average_ticket_size: string;
  min_investment?: string; // Minimum investment amount
  max_investment?: string; // Maximum investment amount
  visible_to_ventures: boolean;
  allow_direct_contact?: boolean; // Allow ventures to contact directly
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  submitted_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InvestorProfileCreatePayload {
  full_name: string;
  organization_name: string;
  linkedin_or_website?: string; // Legacy field, optional if website/linkedin_url provided
  website?: string; // Company/personal website URL
  linkedin_url?: string; // LinkedIn profile URL
  email: string;
  phone?: string;
  investor_type?: 'INDIVIDUAL' | 'FIRM' | 'CORPORATE' | 'FAMILY_OFFICE';
  bio?: string; // Professional bio
  investment_experience?: string; // Detailed investment experience description
  investment_philosophy?: string; // Investment philosophy
  notable_investments?: string; // Notable investments
  address?: string; // Location/address
  investment_experience_years: number;
  deals_count?: number;
  stage_preferences: string[];
  industry_preferences: string[];
  geographic_focus?: string[]; // Geographic regions
  average_ticket_size: string;
  min_investment?: string; // Minimum investment
  max_investment?: string; // Maximum investment
  visible_to_ventures?: boolean;
  allow_direct_contact?: boolean; // Allow direct contact
}

export interface InvestorProfileUpdatePayload extends Partial<InvestorProfileCreatePayload> {}

// Shared pitch deck interface
export interface SharedPitchDeck {
  share_id: string;
  shared_at: string;
  viewed_at: string | null;
  message: string | null;
  is_new: boolean;
  shared_by_name: string;
  shared_by_email: string;
  product_id: string;
  product_user_id: string | null;  // User ID of product owner (for messaging)
  product_name: string;
  product_industry: string;
  product_description: string;
  product_status: string;
  document_id: string;
  document_type: string;
  funding_amount: string | null;
  funding_stage: string | null;
  problem_statement: string | null;
  solution_description: string | null;
  target_market: string | null;
  traction_metrics: any;
  use_of_funds: string | null;
  is_following: boolean;  // Whether investor is following this pitch deck
  commitment_status: string | null;  // Investment commitment status (EXPRESSED, COMMITTED, WITHDRAWN, COMPLETED)
  commitment_id: string | null;  // Investment commitment ID (for retract action)
  commitment_amount: string | null;  // Investment commitment amount
  venture_response: string | null;  // Venture response: PENDING, ACCEPTED, RENEGOTIATE
  is_deal: boolean;  // True if venture has accepted the commitment (venture_response === 'ACCEPTED')
}

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

  /**
   * Get pitch decks shared with the current investor
   * Returns pitch decks that have been proactively shared with the investor
   */
  async getSharedPitchDecks(): Promise<SharedPitchDeck[]> {
    try {
      const response = await apiClient.get('/investors/shared-pitch-decks');
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
   * Follow/monitor a pitch deck (express interest)
   * POST /api/investors/products/{product_id}/documents/{doc_id}/follow
   */
  async followPitchDeck(productId: string, docId: string): Promise<{ detail: string; is_following: boolean }> {
    try {
      const response = await apiClient.post(`/investors/products/${productId}/documents/${docId}/follow`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Unfollow a pitch deck (remove interest)
   * POST /api/investors/products/{product_id}/documents/{doc_id}/unfollow
   */
  async unfollowPitchDeck(productId: string, docId: string): Promise<{ detail: string; is_following: boolean }> {
    try {
      const response = await apiClient.post(`/investors/products/${productId}/documents/${docId}/unfollow`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Commit to investing in a venture
   * POST /api/investors/products/{product_id}/documents/{doc_id}/commit
   * Body: { amount?: string, message?: string }
   */
  async commitToInvest(
    productId: string, 
    docId: string, 
    data?: { amount?: string; message?: string }
  ): Promise<{ detail: string; commitment_id: string; status: string; amount: string | null }> {
    try {
      const response = await apiClient.post(
        `/investors/products/${productId}/documents/${docId}/commit`,
        data || {}
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get investor portfolio (committed investments)
   * GET /api/investors/portfolio
   */
  async getPortfolio(): Promise<{
    count: number;
    total_committed: string;
    results: PortfolioInvestment[];
  }> {
    try {
      const response = await apiClient.get('/investors/portfolio');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update an investment commitment after renegotiation request
   * POST /api/investors/products/{product_id}/commitments/{commitment_id}/update
   */
  async updateCommitment(
    productId: string,
    commitmentId: string,
    data?: { amount?: string; message?: string }
  ): Promise<{ detail: string; commitment_id: string; status: string; venture_response: string; conversation_id?: string }> {
    try {
      const response = await apiClient.post(
        `/investors/products/${productId}/commitments/${commitmentId}/update`,
        data || {}
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Withdraw/retract an investment commitment
   * POST /api/investors/products/{product_id}/commitments/{commitment_id}/withdraw
   */
  async withdrawCommitment(
    productId: string,
    commitmentId: string,
    message?: string
  ): Promise<{ detail: string; commitment_id: string; status: string; conversation_id?: string }> {
    try {
      const response = await apiClient.post(
        `/investors/products/${productId}/commitments/${commitmentId}/withdraw`,
        message ? { message } : {}
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

// Portfolio investment interface
export interface PortfolioInvestment {
  commitment_id: string;
  status: string;
  amount: string | null;
  message: string | null;
  committed_at: string | null;
  updated_at: string | null;
  venture_response: string | null;  // PENDING, ACCEPTED, RENEGOTIATE
  venture_response_at: string | null;
  venture_response_message: string | null;
  is_deal: boolean;  // True if venture_response === 'ACCEPTED'
  product_id: string | null;
  product_name: string | null;
  product_industry: string | null;
  product_description: string | null;
  product_status: string | null;
  product_user_id: string | null;
  document_id: string | null;
  document_type: string | null;
  funding_amount: string | null;
  funding_stage: string | null;
}
