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
};
