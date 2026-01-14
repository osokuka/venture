/**
 * SafeText Component
 * Safely renders user-generated text content with XSS protection
 */

import { sanitizeForDisplay } from '../utils/security';

interface SafeTextProps {
  text: string | null | undefined;
  maxLength?: number;
  className?: string;
  as?: 'span' | 'p' | 'div';
}

/**
 * Component that safely renders user-generated text
 * Automatically escapes HTML to prevent XSS attacks
 */
export function SafeText({ text, maxLength = 10000, className = '', as: Component = 'span' }: SafeTextProps) {
  const sanitized = sanitizeForDisplay(text, maxLength);
  
  return <Component className={className}>{sanitized}</Component>;
}
