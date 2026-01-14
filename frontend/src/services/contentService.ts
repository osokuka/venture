/**
 * Content Service
 * Handles all content-related API calls (FAQ, success stories, resources, contacts)
 */

import apiClient, { getErrorMessage } from './api';

export const contentService = {
  /**
   * Get FAQ items
   */
  async getFAQ() {
    try {
      const response = await apiClient.get('/content/faq');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get success stories
   */
  async getSuccessStories() {
    try {
      const response = await apiClient.get('/content/success-stories');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get resources
   */
  async getResources(category?: string) {
    try {
      const params = category ? { category } : {};
      const response = await apiClient.get('/content/resources', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Get contact information
   */
  async getContactInfo() {
    try {
      const response = await apiClient.get('/content/contacts');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
