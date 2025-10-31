/**
 * Route Protection Components
 * Handles authentication-based route access control
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { PageLoader } from './ui/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute
 * Only allows authenticated users
 * Redirects to login if not authenticated
 * Checks onboarding completion if required
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireOnboarding = true 
}) => {
  const { user, isAuthenticated, initializeAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Initialize auth from localStorage
    initializeAuth();
    setIsLoading(false);
  }, [initializeAuth]);

  if (isLoading) {
    return <PageLoader message="Checking authentication..." />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // ADMIN users - skip onboarding checks, allow all admin routes
  if (user.role === 'ADMIN') {
    return <>{children}</>;
  }

  // Authenticated but onboarding not completed
  if (requireOnboarding && !user.hasCompletedOnboarding) {
    // Allow access to onboarding routes
    if (location.pathname.includes('/onboarding')) {
      return <>{children}</>;
    }
    
    // Redirect to appropriate onboarding page
    const onboardingPath = user.role === 'INFLUENCER' 
      ? '/influencer/onboarding' 
      : '/salon/onboarding';
    
    return <Navigate to={onboardingPath} replace />;
  }

  // Authenticated and onboarding completed - don't allow access to onboarding
  if (user.hasCompletedOnboarding && location.pathname.includes('/onboarding')) {
    return <Navigate to="/discover" replace />;
  }

  return <>{children}</>;
};

/**
 * PublicRoute
 * Only allows non-authenticated users
 * Redirects to discover page if already authenticated
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, isAuthenticated, initializeAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize auth from localStorage
        await initializeAuth();
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, [initializeAuth]);

  if (isLoading) {
    return <PageLoader message="Loading..." />;
  }

  // Already authenticated - redirect based on role
  if (isAuthenticated && user) {
    // ADMIN users go to admin dashboard
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }

    // If onboarding not completed, redirect to onboarding
    if (!user.hasCompletedOnboarding) {
      const onboardingPath = user.role === 'INFLUENCER' 
        ? '/influencer/onboarding' 
        : '/salon/onboarding';
      return <Navigate to={onboardingPath} replace />;
    }
    
    return <Navigate to="/discover" replace />;
  }

  return <>{children}</>;
};

/**
 * OnboardingRoute
 * Special route for onboarding pages
 * Only accessible:
 * 1. After successful signup + OTP verification
 * 2. When user is authenticated but hasn't completed onboarding
 */
export const OnboardingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, initializeAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    initializeAuth();
    setIsLoading(false);
  }, [initializeAuth]);

  if (isLoading) {
    return <PageLoader message="Loading..." />;
  }

  // Not authenticated - redirect to signup
  if (!isAuthenticated || !user) {
    return <Navigate to="/signup" replace />;
  }

  // ADMIN users don't need onboarding - redirect to admin dashboard
  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Already completed onboarding - redirect to discover
  if (user.hasCompletedOnboarding) {
    return <Navigate to="/discover" replace />;
  }

  // Check if user is on correct onboarding page
  const correctOnboardingPath = user.role === 'INFLUENCER' 
    ? '/influencer/onboarding' 
    : '/salon/onboarding';

  if (location.pathname !== correctOnboardingPath) {
    return <Navigate to={correctOnboardingPath} replace />;
  }

  return <>{children}</>;
};

/**
 * AdminRoute
 * Only allows authenticated users with ADMIN role
 * Redirects non-admin users to their appropriate page
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, initializeAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
    setIsLoading(false);
  }, [initializeAuth]);

  if (isLoading) {
    return <PageLoader message="Checking authorization..." />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Not an admin - redirect to appropriate page
  if (user.role !== 'ADMIN') {
    if (!user.hasCompletedOnboarding) {
      const onboardingPath = user.role === 'INFLUENCER' 
        ? '/influencer/onboarding' 
        : '/salon/onboarding';
      return <Navigate to={onboardingPath} replace />;
    }
    return <Navigate to="/discover" replace />;
  }

  return <>{children}</>;
};
