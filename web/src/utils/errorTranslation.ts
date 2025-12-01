/**
 * Error translation utility
 * Maps API error messages to i18n translation keys
 */

import i18n from '../i18n/config';

// Map of API error messages to translation keys
const errorMap: Record<string, string> = {
  // Auth errors
  'No account found with this email address': 'toast.error.emailNotFound',
  'Invalid credentials': 'toast.error.loginFailed',
  'Email already exists': 'toast.error.emailAlreadyExists',
  'Invalid OTP': 'toast.error.otpFailed',
  'OTP has expired': 'toast.error.otpExpired',
  'Failed to verify OTP': 'toast.error.otpVerificationFailed',
  'User not found': 'toast.error.emailNotFound',
  'Email and password are required': 'toast.error.loginFailed',
  'Email and OTP are required': 'toast.error.otpVerificationFailed',
  'Failed to register influencer': 'toast.error.signupFailed',
  'Failed to register salon': 'toast.error.signupFailed',
  'Too many OTP requests': 'toast.error.tooManyOtpRequests',
  'You must accept the Terms of Service and Privacy Policy to sign up.': 'toast.error.termsNotAccepted',
  'Missing required fields: name, email, and password are required': 'toast.error.missingRequiredFields',
  'Password reset failed': 'toast.error.resetPasswordFailed',
  'Invalid password reset session': 'toast.error.invalidResetSession',
  'Invalid or expired reset session': 'toast.error.invalidResetSession',
  'Passwords do not match': 'toast.error.passwordMismatch',
  
  // Connection errors
  'Failed to send connection request': 'toast.error.connectionFailed',
  'Connection request already sent': 'toast.error.connectionAlreadyExists',
  'Already connected': 'toast.error.alreadyConnected',
  
  // Chat errors
  'Failed to send message': 'toast.error.messageFailed',
  'You can only chat with connected users': 'toast.error.onlyConnectedUsers',
  
  // Profile errors
  'Failed to update profile': 'toast.error.profileUpdateFailed',
  'Failed to load profile': 'toast.error.profileLoadFailed',
  
  // Upload errors
  'Failed to upload file': 'toast.error.uploadFailed',
  
  // Payment errors
  'Payment session expired': 'toast.error.paymentSessionExpired',
  'Invalid payment session': 'toast.error.invalidPaymentSession',
  'Payment verification failed': 'toast.error.paymentVerificationFailed',
  
  // Network/general errors
  'Network Error': 'toast.error.networkError',
};

/**
 * Translate an API error message to the user's language
 * @param errorMessage The error message from the API
 * @param fallbackKey Optional fallback translation key if no mapping found
 * @returns Translated error message
 */
export const translateError = (
  errorMessage: string | undefined,
  fallbackKey: string = 'toast.error.somethingWrong'
): string => {
  if (!errorMessage) {
    return i18n.t(fallbackKey);
  }

  // Check if there's a direct mapping for this error
  const translationKey = errorMap[errorMessage];
  
  if (translationKey) {
    return i18n.t(translationKey);
  }

  // Check for partial matches (case-insensitive)
  const lowerError = errorMessage.toLowerCase();
  
  for (const [apiError, key] of Object.entries(errorMap)) {
    if (lowerError.includes(apiError.toLowerCase())) {
      return i18n.t(key);
    }
  }

  // If no mapping found, return the fallback translation
  return i18n.t(fallbackKey);
};

/**
 * Get translated error from axios error response
 * @param error The axios error object
 * @param fallbackKey Optional fallback translation key
 * @returns Translated error message
 */
export const getTranslatedApiError = (
  error: any,
  fallbackKey: string = 'toast.error.somethingWrong'
): string => {
  const apiError = error?.response?.data?.error || error?.message;
  return translateError(apiError, fallbackKey);
};

export default translateError;
