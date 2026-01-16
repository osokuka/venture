/**
 * Frontend Security Utilities
 * Provides sanitization, validation, and XSS protection
 */

/**
 * HTML entity mapping for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape HTML to prevent XSS attacks
 * @param text - Text to escape
 * @returns Escaped HTML string
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  
  return String(text).replace(/[&<>"'\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize user input by removing potentially dangerous characters
 * @param input - Input string to sanitize
 * @param maxLength - Maximum allowed length (default: 10000)
 * @returns Sanitized string
 */
export function sanitizeInput(input: string | null | undefined, maxLength: number = 10000): string {
  if (!input) return '';
  
  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = String(input)
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized.trim();
}

/**
 * Decode HTML entities (for displaying already-escaped content)
 * @param text - Text that may contain HTML entities
 * @returns Decoded text
 */
export function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text) return '';
  
  const entityMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#39;': "'",
    '&apos;': "'",
  };
  
  // Decode numeric entities (&#x2F; and &#47;)
  let decoded = String(text).replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });
  
  // Decode named entities
  for (const [entity, char] of Object.entries(entityMap)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  
  return decoded;
}

/**
 * Sanitize text for display (escapes HTML)
 * Note: In React, we typically don't need to escape HTML as React does it automatically.
 * This function is useful for non-React contexts or when you need to ensure double-escaping.
 * @param text - Text to sanitize
 * @param maxLength - Maximum length
 * @returns Sanitized text safe for display
 */
export function sanitizeForDisplay(text: string | null | undefined, maxLength: number = 10000): string {
  return escapeHtml(sanitizeInput(text, maxLength));
}

/**
 * Safe display text for React (sanitizes input but doesn't double-escape)
 * React automatically escapes HTML, so we only need to sanitize input, not escape HTML
 * @param text - Text to prepare for display
 * @param maxLength - Maximum length
 * @returns Safe text for React display
 */
export function safeDisplayText(text: string | null | undefined, maxLength: number = 10000): string {
  if (!text) return '';
  
  // First decode any HTML entities that might be in the data
  let decoded = decodeHtmlEntities(text);
  
  // Then sanitize input (remove dangerous characters, truncate)
  return sanitizeInput(decoded, maxLength);
}

/**
 * Validate and sanitize URL
 * @param url - URL to validate
 * @param allowedProtocols - Allowed protocols (default: ['http:', 'https:'])
 * @returns Sanitized URL or null if invalid
 */
export function validateAndSanitizeUrl(
  url: string | null | undefined,
  allowedProtocols: string[] = ['http:', 'https:']
): string | null {
  if (!url) return null;
  
  const sanitized = sanitizeInput(url, 2048).trim();
  
  try {
    const urlObj = new URL(sanitized);
    
    // Check protocol
    if (!allowedProtocols.includes(urlObj.protocol.toLowerCase())) {
      return null;
    }
    
    // Prevent javascript: and data: URLs
    const protocol = urlObj.protocol.toLowerCase();
    if (protocol === 'javascript:' || protocol === 'data:') {
      return null;
    }
    
    return urlObj.toString();
  } catch {
    // Invalid URL format
    return null;
  }
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if valid email format
 */
export function validateEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const sanitized = sanitizeInput(email, 254).trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized);
}

/**
 * Validate UUID format
 * @param uuid - UUID string to validate
 * @returns True if valid UUID format
 */
export function validateUuid(uuid: string | null | undefined): boolean {
  if (!uuid) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(String(uuid).trim());
}

/**
 * Validate file type
 * @param file - File object
 * @param allowedTypes - Array of allowed MIME types
 * @param allowedExtensions - Array of allowed file extensions (e.g., ['.pdf', '.png'])
 * @returns True if file type is allowed
 */
export function validateFileType(
  file: File,
  allowedTypes: string[],
  allowedExtensions: string[]
): boolean {
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return false;
  }
  
  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext.toLowerCase()));
  
  if (!hasValidExtension) {
    return false;
  }
  
  return true;
}

/**
 * Validate file size
 * @param file - File object
 * @param maxSizeBytes - Maximum file size in bytes
 * @returns True if file size is within limit
 */
export function validateFileSize(file: File, maxSizeBytes: number): boolean {
  return file.size > 0 && file.size <= maxSizeBytes;
}

/**
 * Sanitize filename to prevent path traversal
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and dangerous characters
  return filename
    .replace(/[\/\\?%*:|"<>]/g, '')
    .replace(/\.\./g, '')
    .trim()
    .substring(0, 255); // Max filename length
}

/**
 * Validate and sanitize message content
 * @param message - Message text
 * @param maxLength - Maximum message length (default: 10000)
 * @returns Sanitized message or null if invalid
 */
export function validateMessage(message: string | null | undefined, maxLength: number = 10000): string | null {
  if (!message) return null;
  
  let sanitized = sanitizeInput(message, maxLength);
  
  // Security: Remove dangerous patterns
  // Prevent file path patterns (e.g., C:\file.txt, /etc/passwd)
  sanitized = sanitized.replace(/[a-zA-Z]:[\\\/]/g, '');
  sanitized = sanitized.replace(/\.\./g, ''); // Remove path traversal attempts
  
  // Security: Remove data URIs and javascript: protocols
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  // Security: Remove event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Security: Remove script tags and iframe tags
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<object[^>]*>.*?<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed[^>]*>/gi, '');
  
  sanitized = sanitized.trim();
  
  if (sanitized.length === 0) {
    return null;
  }
  
  return sanitized;
}

/**
 * Sanitize search query
 * @param query - Search query string
 * @param maxLength - Maximum length (default: 100)
 * @returns Sanitized query
 */
export function sanitizeSearchQuery(query: string | null | undefined, maxLength: number = 100): string {
  if (!query) return '';
  
  return sanitizeInput(query, maxLength);
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with isValid and errors array
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize form data object
 * @param data - Form data object
 * @param fieldLimits - Object mapping field names to max lengths
 * @returns Sanitized form data
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  fieldLimits: Record<string, number> = {}
): T {
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      const maxLength = fieldLimits[key] || 10000;
      sanitized[key] = sanitizeInput(sanitized[key], maxLength);
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) => {
        if (typeof item === 'string') {
          return sanitizeInput(item, 500);
        }
        return item;
      });
    }
  }
  
  return sanitized;
}

/**
 * Prevent open redirect attacks
 * @param url - URL to validate
 * @param allowedDomains - List of allowed domains
 * @returns True if URL is safe (same origin or in allowed domains)
 */
export function isSafeRedirect(url: string, allowedDomains: string[] = []): boolean {
  try {
    const urlObj = new URL(url, window.location.origin);
    
    // Same origin is always safe
    if (urlObj.origin === window.location.origin) {
      return true;
    }
    
    // Check against allowed domains
    return allowedDomains.some(domain => urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}
