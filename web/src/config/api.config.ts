/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL ,
  TIMEOUT: 120000, // 120 seconds (2 minutes) - Apify scraping can take time
} as const;

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    INFLUENCER_SIGNUP: '/auth/signup/influencer',
    SALON_SIGNUP: '/auth/signup/salon',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    LOGIN: '/auth/login',
  },
  // Onboarding endpoints
  ONBOARDING: {
    INFLUENCER: '/onboarding/influencer',
    SALON: '/onboarding/salon',
  },
  // Social Media endpoints
  SOCIAL_MEDIA: {
    // Instagram endpoints
    INSTAGRAM_CONNECT: '/social-media/instagram/connect',
    INSTAGRAM_SYNC: '/social-media/instagram/sync',
    INSTAGRAM_DATA: (accountId: string) => `/social-media/instagram/${accountId}`,
    INSTAGRAM_DISCONNECT: (accountId: string) => `/social-media/instagram/${accountId}`,
    
    // TikTok endpoints (Apify public scraping)
    TIKTOK_CONNECT: '/social-media/tiktok/connect-public',
    TIKTOK_SYNC: '/social-media/tiktok/public/sync',
    TIKTOK_DATA: (accountId: string) => `/social-media/tiktok/public/${accountId}`,
    TIKTOK_DISCONNECT: (accountId: string) => `/social-media/tiktok/public/${accountId}`,
    TIKTOK_PROFILE: (username: string) => `/social-media/tiktok/profile/${username}`,
    TIKTOK_VIDEOS: (username: string) => `/social-media/tiktok/videos/${username}`,
    
    // TikTok OAuth (for future connected accounts)
    TIKTOK_AUTH: '/social-media/tiktok/auth',
    
    // General endpoints
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
