/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL ,
  TIMEOUT: 30000, // 30 seconds
} as const;

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    INFLUENCER_SIGNUP: '/auth/signup/influencer',
    SALON_SIGNUP: '/auth/signup/salon',
    VERIFY_OTP: '/auth/verify-otp',
    LOGIN: '/auth/login',
  },
  // Onboarding endpoints
  ONBOARDING: {
    INFLUENCER: '/onboarding/influencer',
    SALON: '/onboarding/salon',
  },
  // Social Media endpoints
  SOCIAL_MEDIA: {
    INSTAGRAM_CONNECT: '/social-media/instagram/connect',
    INSTAGRAM_SYNC: '/social-media/instagram/sync',
    INSTAGRAM_DATA: (accountId: string) => `/social-media/instagram/${accountId}`,
    INSTAGRAM_DISCONNECT: (accountId: string) => `/social-media/instagram/${accountId}`,
    TIKTOK_AUTH: '/social-media/tiktok/auth',
    ACCOUNTS: '/social-media/accounts',
    SYNC: (platform: string) => `/social-media/${platform}/sync`,
    DISCONNECT: (platform: string) => `/social-media/${platform}`,
  },
  // Discovery endpoints
  DISCOVERY: {
    INFLUENCERS: '/discovery/influencers',
    SALONS: '/discovery/salons',
    REGIONS: '/discovery/regions',
    CATEGORIES: '/discovery/categories',
  },
} as const;
