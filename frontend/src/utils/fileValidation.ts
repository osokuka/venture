/**
 * File Upload Validation Utilities
 * Provides client-side validation for file uploads
 */

import { validateFileType, validateFileSize, sanitizeFilename } from './security';

/**
 * Validate pitch deck file upload
 * @param file - File to validate
 * @returns Object with isValid and error message
 */
export function validatePitchDeckFile(file: File): { isValid: boolean; error?: string } {
  // Check if file exists
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  // Validate file type (PDF or PowerPoint)
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  ];
  const allowedExtensions = ['.pdf', '.ppt', '.pptx'];
  
  if (!validateFileType(file, allowedTypes, allowedExtensions)) {
    return { isValid: false, error: 'Only PDF or PowerPoint files are allowed for pitch decks (.pdf, .ppt, .pptx)' };
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (!validateFileSize(file, maxSize)) {
    return { isValid: false, error: 'File size exceeds 10MB limit' };
  }

  // Validate file is not empty
  if (file.size === 0) {
    return { isValid: false, error: 'File cannot be empty' };
  }

  // Sanitize filename - allow more characters for PowerPoint files
  const sanitizedFilename = sanitizeFilename(file.name);
  if (sanitizedFilename !== file.name) {
    return { isValid: false, error: 'Invalid filename. Please use a valid filename without special characters' };
  }

  return { isValid: true };
}

/**
 * Create a sanitized File object with safe filename
 * @param file - Original file
 * @returns New File object with sanitized name
 */
export function createSanitizedFile(file: File): File {
  const sanitizedName = sanitizeFilename(file.name);
  
  // If filename changed, create new File object
  if (sanitizedName !== file.name) {
    return new File([file], sanitizedName, { type: file.type });
  }
  
  return file;
}
