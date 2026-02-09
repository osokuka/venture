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

// Request interceptor: send Bearer token when we have one (e.g. from localStorage after login)
// Backend accepts cookie (access_token) or Authorization header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    // Use stored access token when present (login may return tokens in body or cookies)
    const access = typeof localStorage !== 'undefined' ? localStorage.getItem('access') : null;
    if (access && config.headers) {
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Backend accepts refresh from cookie (refresh_token) or body ({ refresh: "..." })
        const refreshFromStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('refresh') : null;
        const body = refreshFromStorage ? { refresh: refreshFromStorage } : {};
        const response = await axios.post<{ access?: string; refresh?: string }>(
          `${API_BASE_URL}/auth/refresh`,
          body,
          { withCredentials: true }
        );

        const access = response.data?.access;
        if (access) {
          localStorage.setItem('access', access);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        }
        if (response.data?.refresh) {
          localStorage.setItem('refresh', response.data.refresh);
        }

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
        }
        // Only redirect to login when not already on a public page (keeps landing at /)
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          const isPublicPage = path === '/' || path === '/login' || path.startsWith('/register') || path === '/forgot-password' || path === '/reset-password' || path === '/verify-email';
          if (!isPublicPage) {
            window.location.href = '/login';
          }
        }
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
