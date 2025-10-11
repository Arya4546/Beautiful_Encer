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
}

// API Request/Response types
export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phoneNo?: string;
}

export interface SignupResponse {
  message: string;
  userId: string;
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
