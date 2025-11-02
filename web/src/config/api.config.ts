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
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_FORGOT_OTP: '/auth/verify-forgot-otp',
    RESET_PASSWORD: '/auth/reset-password',
    RESEND_FORGOT_OTP: '/auth/resend-forgot-otp',
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
    
    // YouTube endpoints (Apify public scraping)
    YOUTUBE_CONNECT: '/social-media/youtube/connect',
    YOUTUBE_SYNC: '/social-media/youtube/sync',
    YOUTUBE_DATA: (accountId: string) => `/social-media/youtube/${accountId}`,
    YOUTUBE_DISCONNECT: (accountId: string) => `/social-media/youtube/${accountId}`,
    
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
  // Admin endpoints
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    USER_DETAILS: (userId: string) => `/admin/users/${userId}`,
    SUSPEND_USER: (userId: string) => `/admin/users/${userId}/suspend`,
    ACTIVATE_USER: (userId: string) => `/admin/users/${userId}/activate`,
    DELETE_USER: (userId: string) => `/admin/users/${userId}`,
    CONNECTIONS: '/admin/connections',
    DELETE_CONNECTION: (connectionId: string) => `/admin/connections/${connectionId}`,
    ACTIVITY_LOGS: '/admin/activity-logs',
  },
} as const;
