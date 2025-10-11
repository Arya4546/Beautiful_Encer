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

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  initializeAuth: () => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');

    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        set({ user, isAuthenticated: true });
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    }
  },
}));
