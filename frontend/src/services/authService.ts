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
   * Login user and get JWT tokens
   */
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/auth/login', data);
      const { access, refresh } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      return { access, refresh };
    } catch (error: any) {
      // Preserve the original error so we can check status code in components
      const enhancedError = new Error(getErrorMessage(error));
      (enhancedError as any).response = error.response;
      throw enhancedError;
    }
  },

  /**
   * Logout user (clear tokens)
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
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
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },
};
