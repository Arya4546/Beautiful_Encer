/**
 * Authentication Service
 * Handles all auth-related API calls
 */

import type { AxiosResponse } from 'axios';
import axiosInstance from '../lib/axios';
import { API_ENDPOINTS } from '../config/api.config';
import type {
  SignupRequest,
  SignupResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  LoginRequest,
  LoginResponse,
} from '../types';

export const authService = {
  /**
   * Influencer Signup
   */
  influencerSignup: async (data: SignupRequest): Promise<SignupResponse> => {
    const response: AxiosResponse<SignupResponse> = await axiosInstance.post(
      API_ENDPOINTS.AUTH.INFLUENCER_SIGNUP,
      data
    );
    return response.data;
  },

  /**
   * Salon Signup
   */
  salonSignup: async (data: SignupRequest): Promise<SignupResponse> => {
    const response: AxiosResponse<SignupResponse> = await axiosInstance.post(
      API_ENDPOINTS.AUTH.SALON_SIGNUP,
      data
    );
    return response.data;
  },

  /**
   * Verify OTP
   */
  verifyOtp: async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    const response: AxiosResponse<VerifyOtpResponse> = await axiosInstance.post(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      data
    );
    return response.data;
  },

  /**
   * Login
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response: AxiosResponse<LoginResponse> = await axiosInstance.post(
      API_ENDPOINTS.AUTH.LOGIN,
      data
    );
    
    // Store token and user data
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Logout
   */
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('accessToken');
  },
};
