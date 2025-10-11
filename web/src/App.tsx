import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pages
import LandingPage from "./pages/LandingPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { VerifyOtpPage } from "./pages/auth/VerifyOtpPage";
import { InfluencerOnboarding } from "./pages/onboarding/InfluencerOnboarding";
import { SalonOnboarding } from "./pages/onboarding/SalonOnboarding";
import { DashboardPage } from "./pages/DashboardPage";

// Store
import { useAuthStore } from "./store/authStore";

const App: React.FC = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        {/* Protected Routes - Onboarding */}
        <Route path="/influencer/onboarding" element={<InfluencerOnboarding />} />
        <Route path="/salon/onboarding" element={<SalonOnboarding />} />

        {/* Protected Routes - Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover
        theme="light"
        limit={3}
        style={{ zIndex: 9999 }}
      />
    </>
  );
};

export default App;
