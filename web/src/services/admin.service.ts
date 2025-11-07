/**
 * Admin Service
 * Handles all admin-related API calls
 */

import axiosInstance from '../lib/axios';
import { API_ENDPOINTS } from '../config/api.config';

export const adminService = {
  /**
   * Get dashboard statistics
   */
  getDashboard: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.DASHBOARD);
    return response.data;
  },

  /**
   * Get all users with pagination and filters
   */
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    verified?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.USERS, { params });
    return response.data;
  },

  /**
   * Get single user details
   */
  getUserDetails: async (userId: string) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.USER_DETAILS(userId));
    return response.data;
  },

  /**
   * Suspend user account
   */
  suspendUser: async (userId: string) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.ADMIN.SUSPEND_USER(userId));
    return response.data;
  },

  /**
   * Activate user account
   */
  activateUser: async (userId: string) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.ADMIN.ACTIVATE_USER(userId));
    return response.data;
  },

  /**
   * Delete user account
   */
  deleteUser: async (userId: string) => {
    const response = await axiosInstance.delete(API_ENDPOINTS.ADMIN.DELETE_USER(userId));
    return response.data;
  },

  /**
   * Create a new user
   */
  createUser: async (data: {
    name: string;
    email: string;
    password: string;
    role: 'INFLUENCER' | 'SALON';
    phoneNumber?: string;
    bio?: string;
    region?: string;
    businessName?: string;
    description?: string;
  }) => {
    const response = await axiosInstance.post(API_ENDPOINTS.ADMIN.USERS, data);
    return response.data;
  },

  /**
   * Update user
   */
  updateUser: async (userId: string, data: {
    name?: string;
    email?: string;
    phoneNumber?: string;
    bio?: string;
    region?: string;
    businessName?: string;
    description?: string;
  }) => {
    const response = await axiosInstance.put(`${API_ENDPOINTS.ADMIN.USERS}/${userId}`, data);
    return response.data;
  },

  /**
   * Get all connections with pagination
   */
  getConnections: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.CONNECTIONS, { params });
    return response.data;
  },

  /**
   * Delete connection
   */
  deleteConnection: async (connectionId: string) => {
    const response = await axiosInstance.delete(API_ENDPOINTS.ADMIN.DELETE_CONNECTION(connectionId));
    return response.data;
  },

  /**
   * Get activity logs with pagination
   */
  getActivityLogs: async (params?: {
    page?: number;
    limit?: number;
    action?: string;
    search?: string;
  }) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.ACTIVITY_LOGS, { params });
    return response.data;
  },

  /**
   * Get admin profile
   */
  getAdminProfile: async () => {
    const response = await axiosInstance.get('/admin/profile');
    return response.data;
  },

  /**
   * Update admin profile
   */
  updateAdminProfile: async (data: { name?: string; email?: string }) => {
    const response = await axiosInstance.put('/admin/profile', data);
    return response.data;
  },

  /**
   * Update admin password
   */
  updateAdminPassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await axiosInstance.put('/admin/password', data);
    return response.data;
  },

  /**
   * Trigger manual social media data sync for all accounts
   */
  triggerSocialMediaSync: async () => {
    const response = await axiosInstance.post(API_ENDPOINTS.ADMIN.SYNC_SOCIAL_MEDIA);
    return response.data;
  },
};

export default adminService;
