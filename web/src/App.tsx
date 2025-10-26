import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from "./pages/LandingPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { VerifyOtpPage } from "./pages/auth/VerifyOtpPage";
import { InfluencerOnboarding } from "./pages/onboarding/InfluencerOnboarding";
import { SalonOnboarding } from "./pages/onboarding/SalonOnboarding";
import { DiscoveryPage } from "./pages/DiscoveryPage";
import { RequestsPage } from "./pages/RequestsPage";
import { ChatPage } from "./pages/ChatPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { UserProfilePage } from "./pages/UserProfilePage";
import SocialMediaPage from "./pages/SocialMediaPage";
import { NotFoundPage } from "./pages/ErrorPage";
import TermsPage from "./pages/legal/TermsPage";
import PrivacyPolicyPage from "./pages/legal/PrivacyPolicyPage";

// Route Protection
import { ProtectedRoute, PublicRoute, OnboardingRoute } from "./components/RouteProtection";

// Store
import { useAuthStore } from "./store/authStore";

const App: React.FC = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1f2937',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            maxWidth: '500px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #10b981',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #ef4444',
            },
          },
          loading: {
            iconTheme: {
              primary: '#e91e8c',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes - Only accessible when NOT logged in */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
  <Route path="/legal/terms" element={<PublicRoute><TermsPage /></PublicRoute>} />
  <Route path="/legal/privacy" element={<PublicRoute><PrivacyPolicyPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/verify-otp" element={<PublicRoute><VerifyOtpPage /></PublicRoute>} />

        {/* Onboarding Routes - Only accessible after signup, before onboarding completion */}
        <Route 
          path="/influencer/onboarding" 
          element={<OnboardingRoute><InfluencerOnboarding /></OnboardingRoute>} 
        />
        <Route 
          path="/salon/onboarding" 
          element={<OnboardingRoute><SalonOnboarding /></OnboardingRoute>} 
        />

        {/* Protected Routes - Only accessible when logged in and onboarded */}
        <Route 
          path="/discover" 
          element={<ProtectedRoute><DiscoveryPage /></ProtectedRoute>} 
        />
        <Route 
          path="/requests" 
          element={<ProtectedRoute><RequestsPage /></ProtectedRoute>} 
        />
        <Route 
          path="/chat" 
          element={<ProtectedRoute><ChatPage /></ProtectedRoute>} 
        />
        <Route 
          path="/notifications" 
          element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} 
        />
        <Route 
          path="/profile" 
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} 
        />
        <Route 
          path="/profile/:userId" 
          element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} 
        />
        <Route 
          path="/social-media" 
          element={<ProtectedRoute><SocialMediaPage /></ProtectedRoute>} 
        />

        {/* 404 - Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

export default App;
