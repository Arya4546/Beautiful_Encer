import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

// Pages
import LandingPage from "./pages/LandingPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { VerifyOtpPage } from "./pages/auth/VerifyOtpPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { VerifyForgotOTPPage } from "./pages/auth/VerifyForgotOTPPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
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
import PaymentCheckout from "./pages/PaymentCheckout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

// Project Pages
import ProjectCreate from "./pages/salon/ProjectCreate";
import ProjectList from "./pages/salon/ProjectList";
import ProjectInvitations from "./pages/influencer/ProjectInvitations";
import ProjectDetails from "./pages/ProjectDetails";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminConnections } from "./pages/admin/AdminConnections";
import { AdminActivityLogs } from "./pages/admin/AdminActivityLogs";
import { AdminProfilePage } from "./pages/admin/AdminProfilePage";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminPayments from "./pages/admin/AdminPayments";

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
    <QueryClientProvider client={queryClient}>
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
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/verify-forgot-otp" element={<PublicRoute><VerifyForgotOTPPage /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
        
        {/* Payment Routes - Public (accessed during signup) */}
        <Route path="/payment/checkout" element={<PaymentCheckout />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />

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
        
        {/* Project Routes */}
        <Route 
          path="/salon/projects" 
          element={<ProtectedRoute><ProjectList /></ProtectedRoute>} 
        />
        <Route 
          path="/salon/projects/create" 
          element={<ProtectedRoute><ProjectCreate /></ProtectedRoute>} 
        />
        <Route 
          path="/salon/projects/:id" 
          element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} 
        />
        <Route 
          path="/influencer/projects" 
          element={<ProtectedRoute><ProjectInvitations /></ProtectedRoute>} 
        />
        <Route 
          path="/projects/:id" 
          element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} 
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

        {/* Admin Routes - Only accessible for ADMIN role */}
        <Route 
          path="/admin/dashboard" 
          element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/users" 
          element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/connections" 
          element={<ProtectedRoute><AdminConnections /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/projects" 
          element={<ProtectedRoute><AdminProjects /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/payments" 
          element={<ProtectedRoute><AdminPayments /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/activity-logs" 
          element={<ProtectedRoute><AdminActivityLogs /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/profile" 
          element={<ProtectedRoute><AdminProfilePage /></ProtectedRoute>} 
        />

        {/* 404 - Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </QueryClientProvider>
  );
};

export default App;
