/**
 * API Client for VentureUP Link Backend
 * Handles all HTTP requests to the Django REST API
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Configuration
// Dynamically determine API base URL based on environment and current protocol
function getApiBaseUrl(): string {
  // If explicitly set in environment, use it
  let envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // Handle protocol-relative URLs (starting with //)
  if (envUrl && envUrl.startsWith('//')) {
    if (typeof window !== 'undefined') {
      envUrl = `${window.location.protocol}${envUrl}`;
    } else {
      envUrl = `http:${envUrl}`; // Default to http for SSR
    }
  }
  
  if (envUrl) {
    return envUrl;
  }
  
  // For production/domain access, use the same protocol as the current page
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol; // 'http:' or 'https:'
    const hostname = window.location.hostname;
    
    // If accessing via domain, use backend subdomain with same protocol
    if (hostname.includes('ventureuplink.com')) {
      return `${protocol}//backend.ventureuplink.com/api`;
    }
  }
  
  // Default to localhost for development
  return 'http://localhost:8001/api';
}

const API_BASE_URL = getApiBaseUrl();

// Debug: Log API base URL in development
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Required for httpOnly cookies to be sent
});

// Request interceptor - Cookies are sent automatically, no manual Authorization header needed
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    
    // Note: httpOnly cookies are sent automatically by browser
    // No need to manually set Authorization header
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token is in httpOnly cookie, sent automatically
        // Backend reads from cookie, no need to send in body
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }  // Ensure cookies are sent
        );

        // New access token is set in httpOnly cookie by backend
        // No need to store in localStorage
        
        // Retry original request (cookies sent automatically)
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user (cookies cleared by backend)
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Types
export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: 'VENTURE' | 'INVESTOR' | 'MENTOR' | 'ADMIN';
  is_email_verified: boolean;
  date_joined: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Helper function to extract error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    if (axiosError.response?.data) {
      const data = axiosError.response.data;
      if (data.message) {
        return data.message;
      }
      if (data.errors) {
        // Format validation errors
        const errorMessages = Object.entries(data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        return errorMessages;
      }
    }
    return axiosError.message || 'An error occurred';
  }
  return 'An unexpected error occurred';
};
