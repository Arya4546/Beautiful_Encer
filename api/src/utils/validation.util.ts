/**
 * Validation Utilities
 * Comprehensive validation functions for user input
 */

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Additional checks
  if (email.length > 255) {
    return { valid: false, error: 'Email is too long' };
  }

  return { valid: true };
}

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long (max 128 characters)' };
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  // Check for special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)' };
  }

  return { valid: true };
}

/**
 * Validate phone number format
 * Supports international formats with optional country code
 */
export function validatePhoneNumber(phone: string | undefined): { valid: boolean; error?: string } {
  if (!phone) {
    // Phone is optional in most flows
    return { valid: true };
  }

  // Remove all non-digit characters except + for easier validation
  const cleaned = phone.replace(/[\s\-().]/g, '');

  // Check if it starts with + (international format)
  if (cleaned.startsWith('+')) {
    // International format: +[1-3 digits country code][7-15 digits]
    if (!/^\+\d{8,15}$/.test(cleaned)) {
      return { valid: false, error: 'Invalid international phone number format. Use +[country code][number]' };
    }
  } else {
    // Local format: 7-15 digits
    if (!/^\d{7,15}$/.test(cleaned)) {
      return { valid: false, error: 'Invalid phone number format. Must be 7-15 digits or start with +' };
    }
  }

  return { valid: true };
}

/**
 * Validate name (for user names, business names, etc.)
 */
export function validateName(name: string, fieldName: string = 'Name'): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (name.trim().length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters long` };
  }

  if (name.length > 100) {
    return { valid: false, error: `${fieldName} is too long (max 100 characters)` };
  }

  // Check for invalid characters (only letters, spaces, hyphens, apostrophes allowed)
  if (!/^[a-zA-Z\s\-',.]+$/.test(name)) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }

  return { valid: true };
}

/**
 * Validate OTP code
 */
export function validateOTP(otp: string): { valid: boolean; error?: string } {
  if (!otp) {
    return { valid: false, error: 'OTP is required' };
  }

  if (otp.length !== 6) {
    return { valid: false, error: 'OTP must be 6 digits' };
  }

  if (!/^\d{6}$/.test(otp)) {
    return { valid: false, error: 'OTP must contain only numbers' };
  }

  return { valid: true };
}

/**
 * Sanitize string input (remove potentially dangerous characters)
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags and script content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Validate URL format
 */
export function validateURL(url: string | undefined): { valid: boolean; error?: string } {
  if (!url) {
    // URL is optional
    return { valid: true };
  }

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}
