/**
 * Frontend Validation Utilities
 * Client-side validation before API calls
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate email format on frontend
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (email.length > 255) {
    return { valid: false, error: 'Email is too long' };
  }

  return { valid: true };
}

/**
 * Validate password strength on frontend
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long (max 128 characters)' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }

  return { valid: true };
}

/**
 * Get password strength level
 */
export function getPasswordStrength(password: string): {
  level: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
  feedback: string;
} {
  if (!password) {
    return { level: 'weak', score: 0, feedback: 'Password is required' };
  }

  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  // Complexity patterns
  if (/[a-z].*[A-Z]|[A-Z].*[a-z]/.test(password)) score += 1;
  if (/\d.*[!@#$%^&*(),.?":{}|<>]|[!@#$%^&*(),.?":{}|<>].*\d/.test(password)) score += 1;

  let level: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak';
  let feedback = '';

  if (score <= 3) {
    level = 'weak';
    feedback = 'Weak password. Add more characters and variety.';
  } else if (score <= 5) {
    level = 'medium';
    feedback = 'Medium strength. Consider adding more special characters.';
  } else if (score <= 7) {
    level = 'strong';
    feedback = 'Strong password!';
  } else {
    level = 'very-strong';
    feedback = 'Very strong password!';
  }

  return { level, score, feedback };
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string | undefined): ValidationResult {
  if (!phone) {
    return { valid: true }; // Phone is optional
  }

  const cleaned = phone.replace(/[\s\-().]/g, '');

  if (cleaned.startsWith('+')) {
    if (!/^\+\d{8,15}$/.test(cleaned)) {
      return { valid: false, error: 'Invalid international phone number' };
    }
  } else {
    if (!/^\d{7,15}$/.test(cleaned)) {
      return { valid: false, error: 'Invalid phone number format' };
    }
  }

  return { valid: true };
}

/**
 * Validate OTP code
 */
export function validateOTP(otp: string): ValidationResult {
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
 * Validate name
 */
export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
  if (!name || !name.trim()) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (name.trim().length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` };
  }

  if (name.length > 100) {
    return { valid: false, error: `${fieldName} is too long` };
  }

  if (!/^[a-zA-Z\s\-',.]+$/.test(name)) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }

  return { valid: true };
}

/**
 * Validate URL format
 */
export function validateURL(url: string | undefined): ValidationResult {
  if (!url) {
    return { valid: true }; // URL is optional
  }

  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}
