import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

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

// Store
import { useAuthStore } from "./store/authStore";

const App: React.FC = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />

      {/* Protected Routes - Onboarding */}
      <Route path="/influencer/onboarding" element={<InfluencerOnboarding />} />
      <Route path="/salon/onboarding" element={<SalonOnboarding />} />

      {/* Protected Routes - Main App */}
      <Route path="/discover" element={<DiscoveryPage />} />
      <Route path="/requests" element={<RequestsPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/profile" element={<ProfilePage />} />

      {/* Catch all - redirect to discover */}
      <Route path="*" element={<Navigate to="/discover" replace />} />
    </Routes>
  );
};

export default App;
