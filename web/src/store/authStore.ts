/**
 * Auth Store - Zustand
 * Global state management for authentication
 */

import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => {
    // Update both state and localStorage
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({
      user,
      isAuthenticated: !!user,
    });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  initializeAuth: () => {
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');

      // If no token, clear everything and return
      if (!token) {
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false });
        return;
      }

      // If token exists but no user data, clear everything
      if (!userStr) {
        localStorage.removeItem('accessToken');
        set({ user: null, isAuthenticated: false });
        return;
      }

      try {
        const user = JSON.parse(userStr);
        
        // Validate that user object has required fields
        if (!user || !user.id || !user.email) {
          throw new Error('Invalid user data');
        }

        // Normalize: some deployments may not include hasCompletedOnboarding
        // Infer completion if role-specific profile exists
        const normalizedUser = {
          ...user,
          hasCompletedOnboarding:
            user.hasCompletedOnboarding ?? Boolean(user.influencer || user.salon),
        } as User;
        
        set({ user: normalizedUser, isAuthenticated: true });
      } catch (parseError) {
        console.error('Failed to parse user from localStorage:', parseError);
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Clear everything on error
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false });
    }
  },
}));
