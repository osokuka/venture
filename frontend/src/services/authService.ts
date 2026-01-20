/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import apiClient, { LoginResponse, UserResponse, getErrorMessage } from './api';

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  full_name: string;
  role: 'VENTURE' | 'INVESTOR' | 'MENTOR';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface VerifyEmailData {
  token: string;
}

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<UserResponse> {
    try {
      const response = await apiClient.post('/auth/register', data);
      return response.data.user;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Login user - tokens are stored in httpOnly cookies by backend
   */
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/auth/login', data);
      
      // Tokens are stored in httpOnly cookies by backend (more secure)
      // No need to store in localStorage (prevents XSS attacks)
      // Return empty object for backward compatibility
      return { access: '', refresh: '' };
    } catch (error: any) {
      // Preserve the original error so we can check status code in components
      const enhancedError = new Error(getErrorMessage(error));
      (enhancedError as any).response = error.response;
      throw enhancedError;
    }
  },

  /**
   * Logout user - clears httpOnly cookies via backend
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint to clear httpOnly cookies
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Even if logout fails, redirect to login
      console.error('Logout error:', error);
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<UserResponse> {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Verify email with token
   */
  async verifyEmail(data: VerifyEmailData): Promise<void> {
    try {
      await apiClient.post('/auth/verify-email', data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Resend verification email
   */
  async resendVerification(): Promise<void> {
    try {
      await apiClient.post('/auth/resend-verification');
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/password-reset-request', { email });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(token: string, newPassword: string, newPasswordConfirm: string): Promise<void> {
    try {
      await apiClient.post('/auth/password-reset-confirm', {
        token,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Check if user is authenticated
   * Note: Cannot check httpOnly cookies directly (that's the security feature)
   * This is a best-effort check. Real auth check happens via /api/auth/me
   */
  isAuthenticated(): boolean {
    // httpOnly cookies cannot be read by JavaScript (security feature)
    // We'll check authentication via /api/auth/me when needed
    // This method is kept for backward compatibility but always returns false
    // Components should call getCurrentUser() to check auth status
    return false;  // Always false - use getCurrentUser() for real check
  },

  /**
   * Get stored access token
   * Note: httpOnly cookies cannot be read by JavaScript
   * This method is kept for backward compatibility but always returns null
   */
  getAccessToken(): string | null {
    // httpOnly cookies cannot be read by JavaScript (security feature)
    // Tokens are sent automatically by browser with requests
    return null;
  },
};
