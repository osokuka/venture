/**
 * User Service
 * Handles user profile and account-related API calls
 */

import apiClient, { getErrorMessage } from './api';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_email_verified: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export const userService = {
  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserProfile> {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await apiClient.patch('/auth/me', data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Change user password
   */
  async changePassword(data: PasswordChangeData): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
