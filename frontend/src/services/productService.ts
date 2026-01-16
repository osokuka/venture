/**
 * Product Service
 * Handles all product-related API calls for ventures
 */

import apiClient from './api';
import { validatePitchDeckFile, createSanitizedFile } from '../utils/fileValidation';

export interface VentureProduct {
  id: string;
  user: string;
  user_email: string;
  user_name: string;
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
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  is_active: boolean;
  submitted_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  founders?: any[];
  team_members?: any[];
  needs?: any[];
  documents?: any[];
}

export interface ProductCreatePayload {
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

export interface ProductUpdatePayload extends Partial<ProductCreatePayload> {}

export interface TeamMember {
  id: string;
  name: string;
  role_title: string;
  description?: string;
  linkedin_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberCreatePayload {
  name: string;
  role_title: string;
  description?: string;
  linkedin_url?: string;
}

export interface TeamMemberUpdatePayload extends Partial<TeamMemberCreatePayload> {}

export interface Founder {
  id: string;
  full_name: string;
  linkedin_url: string;
  email: string;
  phone?: string;
  role_title?: string;
  created_at: string;
  updated_at: string;
}

export interface FounderCreatePayload {
  full_name: string;
  linkedin_url: string;
  email: string;
  phone?: string;
  role_title?: string;
}

export interface FounderUpdatePayload extends Partial<FounderCreatePayload> {}

export const productService = {
  /**
   * Get all products for the current user
   */
  async getMyProducts(): Promise<VentureProduct[]> {
    const response = await apiClient.get('/ventures/products');
    return response.data;
  },

  /**
   * Get a single product by ID
   */
  async getProduct(productId: string): Promise<VentureProduct> {
    const response = await apiClient.get(`/ventures/products/${productId}`);
    return response.data;
  },

  /**
   * Create a new product (max 3 per user)
   */
  async createProduct(payload: ProductCreatePayload): Promise<VentureProduct> {
    const response = await apiClient.post('/ventures/products', payload);
    return response.data;
  },

  /**
   * Update a product (only if DRAFT or REJECTED)
   */
  async updateProduct(productId: string, payload: ProductUpdatePayload): Promise<VentureProduct> {
    const response = await apiClient.patch(`/ventures/products/${productId}`, payload);
    return response.data;
  },

  /**
   * Activate or deactivate a product
   */
  async activateProduct(productId: string, isActive: boolean): Promise<void> {
    await apiClient.patch(`/ventures/products/${productId}/activate`, { is_active: isActive });
  },

  /**
   * Submit a product for approval
   */
  async submitProduct(productId: string): Promise<void> {
    await apiClient.post(`/ventures/products/${productId}/submit`);
  },

  /**
   * Get public products (approved and active)
   */
  async getPublicProducts(): Promise<VentureProduct[]> {
    const response = await apiClient.get('/ventures/public');
    return response.data;
  },

  /**
   * Upload pitch deck for a product
   * Security: Validates file on client side before upload
   */
  async uploadPitchDeck(productId: string, file: File): Promise<any> {
    // Security: Validate file before upload
    const validation = validatePitchDeckFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid file');
    }

    // Security: Sanitize filename
    const sanitizedFile = createSanitizedFile(file);
    
    const formData = new FormData();
    formData.append('file', sanitizedFile);

    const response = await apiClient.post(
      `/ventures/products/${productId}/documents/pitch-deck`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * List all documents for a product
   */
  async getProductDocuments(productId: string): Promise<any[]> {
    const response = await apiClient.get(`/ventures/products/${productId}/documents`);
    return response.data;
  },

  /**
   * Delete a document from a product
   */
  async deleteProductDocument(productId: string, docId: string): Promise<void> {
    await apiClient.delete(`/ventures/products/${productId}/documents/${docId}`);
  },

  // Team Member Management
  /**
   * Get all team members for a product
   */
  async getTeamMembers(productId: string): Promise<TeamMember[]> {
    const response = await apiClient.get(`/ventures/products/${productId}/team-members`);
    return response.data;
  },

  /**
   * Create a team member for a product
   */
  async createTeamMember(productId: string, payload: TeamMemberCreatePayload): Promise<TeamMember> {
    const response = await apiClient.post(`/ventures/products/${productId}/team-members`, payload);
    return response.data;
  },

  /**
   * Update a team member
   */
  async updateTeamMember(productId: string, memberId: string, payload: TeamMemberUpdatePayload): Promise<TeamMember> {
    const response = await apiClient.patch(`/ventures/products/${productId}/team-members/${memberId}`, payload);
    return response.data;
  },

  /**
   * Delete a team member
   */
  async deleteTeamMember(productId: string, memberId: string): Promise<void> {
    await apiClient.delete(`/ventures/products/${productId}/team-members/${memberId}`);
  },

  // Founder Management
  /**
   * Get all founders for a product
   */
  async getFounders(productId: string): Promise<Founder[]> {
    const response = await apiClient.get(`/ventures/products/${productId}/founders`);
    return response.data;
  },

  /**
   * Create a founder for a product
   */
  async createFounder(productId: string, payload: FounderCreatePayload): Promise<Founder> {
    const response = await apiClient.post(`/ventures/products/${productId}/founders`, payload);
    return response.data;
  },

  /**
   * Update a founder
   */
  async updateFounder(productId: string, founderId: string, payload: FounderUpdatePayload): Promise<Founder> {
    const response = await apiClient.patch(`/ventures/products/${productId}/founders/${founderId}`, payload);
    return response.data;
  },

  /**
   * Delete a founder
   */
  async deleteFounder(productId: string, founderId: string): Promise<void> {
    await apiClient.delete(`/ventures/products/${productId}/founders/${founderId}`);
  },

  // Pitch Deck Access & Download/View (VL-823)
  /**
   * Download a pitch deck document
   * Security: Validates productId and docId as UUIDs
   */
  async downloadPitchDeck(productId: string, docId: string): Promise<Blob> {
    // Security: Validate UUIDs
    if (!productId || !docId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId) || 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId)) {
      throw new Error('Invalid product or document ID');
    }
    
    const response = await apiClient.get(
      `/ventures/products/${productId}/documents/${docId}/download`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  /**
   * View a pitch deck document in browser
   * Security: Validates productId and docId as UUIDs
   * Fetches the file using authenticated API client and returns a blob URL
   * This ensures the new tab has proper authentication
   */
  async viewPitchDeck(productId: string, docId: string): Promise<string> {
    // Security: Validate UUIDs
    if (!productId || !docId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId) || 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId)) {
      throw new Error('Invalid product or document ID');
    }
    
    // Fetch the file using authenticated API client (includes Bearer token)
    // This ensures the request has proper authentication
    const response = await apiClient.get(
      `/ventures/products/${productId}/documents/${docId}/view`,
      { responseType: 'blob' }
    );
    
    // Create a blob URL from the response
    // When responseType is 'blob', axios returns response.data as a Blob
    const blobUrl = URL.createObjectURL(response.data);
    
    // Return the blob URL - this can be opened in a new tab without authentication issues
    // The caller is responsible for cleaning up the blob URL with URL.revokeObjectURL()
    return blobUrl;
  },

  // Pitch Deck Access Control (VL-824)
  /**
   * List who has access to a pitch deck
   */
  async listPitchDeckAccess(productId: string, docId: string): Promise<any[]> {
    // Security: Validate UUIDs
    if (!productId || !docId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId) || 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId)) {
      throw new Error('Invalid product or document ID');
    }
    
    const response = await apiClient.get(`/ventures/products/${productId}/documents/${docId}/access`);
    return response.data;
  },

  /**
   * Grant pitch deck access to an investor
   */
  async grantPitchDeckAccess(productId: string, docId: string, investorId: string): Promise<any> {
    // Security: Validate UUIDs
    if (!productId || !docId || !investorId || 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId) || 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(investorId)) {
      throw new Error('Invalid product, document, or investor ID');
    }
    
    const response = await apiClient.post(
      `/ventures/products/${productId}/documents/${docId}/access/grant`,
      { investor_id: investorId }
    );
    return response.data;
  },

  /**
   * Revoke pitch deck access from an investor
   */
  async revokePitchDeckAccess(productId: string, docId: string, investorId: string): Promise<void> {
    // Security: Validate UUIDs
    if (!productId || !docId || !investorId || 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId) || 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(investorId)) {
      throw new Error('Invalid product, document, or investor ID');
    }
    
    await apiClient.post(
      `/ventures/products/${productId}/documents/${docId}/access/revoke`,
      { investor_id: investorId }
    );
  },

  // Pitch Deck Sharing (VL-825)
  /**
   * Share a pitch deck with an investor
   */
  async sharePitchDeck(productId: string, docId: string, investorId: string, message?: string): Promise<any> {
    // Security: Validate UUIDs
    if (!productId || !docId || !investorId || 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId) || 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(investorId)) {
      throw new Error('Invalid product, document, or investor ID');
    }
    
    // Security: Validate and sanitize message
    let sanitizedMessage = message;
    if (message) {
      if (message.length > 2000) {
        throw new Error('Message must be 2,000 characters or less');
      }
      sanitizedMessage = message.trim().slice(0, 2000);
    }
    
    const response = await apiClient.post(
      `/ventures/products/${productId}/documents/${docId}/share`,
      { investor_id: investorId, message: sanitizedMessage }
    );
    return response.data;
  },

  /**
   * List shares for a pitch deck
   */
  async listPitchDeckShares(productId: string, docId: string): Promise<any[]> {
    // Security: Validate UUIDs
    if (!productId || !docId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId) || 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId)) {
      throw new Error('Invalid product or document ID');
    }
    
    const response = await apiClient.get(`/ventures/products/${productId}/documents/${docId}/shares`);
    return response.data;
  },

  // Pitch Deck Requests (VL-826)
  /**
   * Request access to a pitch deck (investor only)
   */
  async requestPitchDeck(productId: string, docId: string, message?: string): Promise<any> {
    // Security: Validate UUIDs
    if (!productId || !docId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId) || 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId)) {
      throw new Error('Invalid product or document ID');
    }
    
    // Security: Validate and sanitize message
    let sanitizedMessage = message;
    if (message) {
      if (message.length > 2000) {
        throw new Error('Message must be 2,000 characters or less');
      }
      sanitizedMessage = message.trim().slice(0, 2000);
    }
    
    const response = await apiClient.post(
      `/ventures/products/${productId}/documents/${docId}/request`,
      { message: sanitizedMessage }
    );
    return response.data;
  },

  /**
   * List requests for a pitch deck
   */
  async listPitchDeckRequests(productId: string, docId: string): Promise<any[]> {
    // Security: Validate UUIDs
    if (!productId || !docId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId) || 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId)) {
      throw new Error('Invalid product or document ID');
    }
    
    const response = await apiClient.get(`/ventures/products/${productId}/documents/${docId}/requests`);
    return response.data;
  },

  /**
   * Respond to a pitch deck request (approve or deny)
   */
  async respondToPitchDeckRequest(
    productId: string, 
    docId: string, 
    requestId: string, 
    status: 'APPROVED' | 'DENIED', 
    responseMessage?: string
  ): Promise<any> {
    // Security: Validate UUIDs
    if (!productId || !docId || !requestId || 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId) || 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) {
      throw new Error('Invalid product, document, or request ID');
    }
    
    // Security: Validate status
    if (status !== 'APPROVED' && status !== 'DENIED') {
      throw new Error('Status must be APPROVED or DENIED');
    }
    
    // Security: Validate and sanitize response message
    let sanitizedMessage = responseMessage;
    if (responseMessage) {
      if (responseMessage.length > 2000) {
        throw new Error('Response message must be 2,000 characters or less');
      }
      sanitizedMessage = responseMessage.trim().slice(0, 2000);
    }
    
    const response = await apiClient.post(
      `/ventures/products/${productId}/documents/${docId}/requests/${requestId}/respond`,
      { status, response_message: sanitizedMessage }
    );
    return response.data;
  },

  // Pitch Deck Analytics (VL-828)
  /**
   * Get analytics for a pitch deck
   */
  async getPitchDeckAnalytics(productId: string, docId: string): Promise<any> {
    // Security: Validate UUIDs
    if (!productId || !docId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId) || 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId)) {
      throw new Error('Invalid product or document ID');
    }
    
    const response = await apiClient.get(`/ventures/products/${productId}/documents/${docId}/analytics`);
    return response.data;
  },
};
