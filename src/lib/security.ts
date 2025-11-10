/**
 * Security utilities for input validation and sanitization
 * Used across all text tools to prevent XSS and injection attacks
 */

import DOMPurify from 'dompurify';

// Maximum text length to prevent DoS attacks (1MB)
export const MAX_TEXT_LENGTH = 1_000_000;

// Maximum file size for uploads (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image MIME types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - Raw HTML string
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text (escape HTML entities)
 * @param text - Raw text string
 * @returns Escaped text safe for rendering
 */
export function sanitizeText(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validate and sanitize URL
 * @param url - URL string to validate
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    // Prevent javascript: protocol and other dangerous schemes
    if (url.toLowerCase().includes('javascript:') || url.toLowerCase().includes('data:')) {
      return null;
    }
    
    return urlObj.toString();
  } catch {
    return null;
  }
}

/**
 * Validate text length
 * @param text - Text to validate
 * @param maxLength - Maximum allowed length
 * @returns true if valid, false otherwise
 */
export function validateTextLength(text: string, maxLength: number = MAX_TEXT_LENGTH): boolean {
  return text.length <= maxLength;
}

/**
 * Truncate text to maximum length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number = MAX_TEXT_LENGTH): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength);
}

/**
 * Validate date string
 * @param dateString - Date string to validate
 * @returns true if valid date, false otherwise
 */
export function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate image file
 * @param file - File object to validate
 * @returns Error message or null if valid
 */
export function validateImageFile(file: File): string | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }
  
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, WebP, and GIF images are allowed';
  }
  
  return null;
}

/**
 * Create safe object URL for file preview
 * Remember to revoke the URL when done: URL.revokeObjectURL(url)
 * @param file - File to create URL for
 * @returns Object URL or null if invalid
 */
export function createSafeObjectUrl(file: File): string | null {
  const error = validateImageFile(file);
  if (error) {
    return null;
  }
  
  return URL.createObjectURL(file);
}

/**
 * Strip all HTML tags from text
 * @param html - HTML string
 * @returns Plain text without HTML tags
 */
export function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  return div.textContent || '';
}

/**
 * Validate email address format
 * @param email - Email string to validate
 * @returns true if valid email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitize filename to prevent directory traversal
 * @param filename - Original filename
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

/**
 * Validate and sanitize number input
 * @param value - Value to validate
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Sanitized number or null if invalid
 */
export function sanitizeNumber(value: string | number, min?: number, max?: number): number | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  
  if (min !== undefined && num < min) {
    return min;
  }
  
  if (max !== undefined && num > max) {
    return max;
  }
  
  return num;
}
