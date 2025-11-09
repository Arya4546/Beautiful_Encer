/**
 * TypeScript Type Definitions
 */

export type UserRole = 'INFLUENCER' | 'SALON' | 'ADMIN';

export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  hasCompletedOnboarding?: boolean;
  influencer?: {
    id?: string;
    profilePic?: string;
    bio?: string;
    categories?: string[];
  };
  salon?: {
    id?: string;
    businessName?: string;
    profilePic?: string;
    description?: string;
  };
}

export interface Influencer {
  id: string;
  phoneNo?: string;
  emailVerified: boolean;
  bio?: string;
  profilePic?: string;
  categories: string[];
  region?: string;
  age?: number;
  gender?: Gender;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Salon {
  id: string;
  phoneNo?: string;
  emailVerified: boolean;
  businessName?: string;
  description?: string;
  profilePic?: string;
  preferredCategories: string[];
  region?: string;
  website?: string;
  establishedYear?: number;
  teamSize?: number;
  operatingHours?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  facebookPage?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SocialMediaAccount {
  id: string;
  platform: 'INSTAGRAM' | 'TIKTOK';
  platformUsername: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  engagementRate?: number;
  isActive: boolean;
  metadata?: string; // JSON string containing recentPosts and other analytics
}

export interface InfluencerWithDetails extends Influencer {
  user: {
    id: string;
    name: string;
    email: string;
  };
  socialMediaAccounts: SocialMediaAccount[];
}

export interface SalonWithDetails extends Salon {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// API Request/Response types
export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phoneNo?: string;
  acceptTerms?: boolean;
}

export interface SignupResponse {
  message: string;
  userId: string;
  salonId?: string; // Only for salon signups
  email?: string; // Email for payment flow
  requiresPayment?: boolean; // Indicates if payment is required
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: User;
}

export interface InfluencerOnboardingRequest {
  bio: string;
  categories: string[];
  region: string;
  age: number;
  gender: Gender;
  profilePic: File;
}

export interface SalonOnboardingRequest {
  businessName: string;
  description: string;
  preferredCategories: string[];
  region: string;
  website?: string;
  establishedYear?: number;
  teamSize?: number;
  operatingHours?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  facebookPage?: string;
  profilePic?: File;
}

export interface ApiError {
  error: string;
}
