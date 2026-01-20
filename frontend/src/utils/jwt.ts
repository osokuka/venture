/**
 * JWT Token Utilities
 * Decode JWT tokens to extract user information without API calls
 */

export interface JWTPayload {
  user_id: string;
  email: string;
  role: 'VENTURE' | 'INVESTOR' | 'MENTOR' | 'ADMIN';
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  token_type?: string;
}

/**
 * Decode a JWT token without verification (client-side only)
 * Note: This does NOT verify the token signature - backend always verifies
 * This is just for extracting user info to avoid unnecessary API calls
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode base64url encoded payload
    const payload = parts[1];
    // Replace URL-safe base64 characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    
    // Decode and parse JSON
    const decoded = JSON.parse(atob(padded));
    return decoded as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
}

/**
 * Get user info from stored access token
 * 
 * NOTE: With httpOnly cookies, tokens cannot be read by JavaScript (security feature).
 * This function is kept for backward compatibility but always returns null.
 * Use /api/auth/me endpoint to check authentication status.
 * 
 * This function can still be used if tokens are provided in response body/headers
 * (e.g., during initial login before cookies are set).
 */
export function getUserFromToken(token?: string): {
  id: string;
  email: string;
  role: 'VENTURE' | 'INVESTOR' | 'MENTOR' | 'ADMIN';
} | null {
  // If token is provided (e.g., from response), decode it
  if (token) {
    const payload = decodeJWT(token);
    if (!payload) {
      return null;
    }

    // Check if token is expired (with 5 minute buffer for clock skew)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < (now + 300)) {
      return null;
    }

    return {
      id: payload.user_id,
      email: payload.email,
      role: payload.role,
    };
  }

  // httpOnly cookies cannot be read by JavaScript
  // Use /api/auth/me to check authentication
  return null;
}

/**
 * Check if the stored access token is valid (not expired)
 * 
 * NOTE: With httpOnly cookies, tokens cannot be read by JavaScript.
 * This function is kept for backward compatibility but always returns false.
 * Use /api/auth/me endpoint to check authentication status.
 */
export function isTokenValid(): boolean {
  // httpOnly cookies cannot be read by JavaScript (security feature)
  // Use /api/auth/me to check authentication
  return false;
}
