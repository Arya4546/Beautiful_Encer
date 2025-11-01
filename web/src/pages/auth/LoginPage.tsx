/**
 * Login Page
 * User authentication
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { showToast } from '../../utils/toast';
import { FiMail, FiLock, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import type { LoginRequest } from '../../types';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginRequest>();

  useEffect(() => {
    // Show message from previous page if exists
    if (location.state?.message) {
      showToast.success(location.state.message);
    }
    
    // Pre-fill email if provided
    if (location.state?.email) {
      setValue('email', location.state.email);
    }
  }, [location.state, setValue]);

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);

    try {
      const response = await authService.login(data);
      
      setUser(response.user);
      showToast.success(t('toast.success.loginSuccess'));

      // Redirect ADMIN to admin dashboard
      if (response.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
        return;
      }

      // Navigate based on onboarding status
      if (response.user.hasCompletedOnboarding) {
        navigate('/discover');
      } else {
        // Redirect to onboarding if not completed
        if (response.user.role === 'INFLUENCER') {
          navigate('/influencer/onboarding');
        } else if (response.user.role === 'SALON') {
          navigate('/salon/onboarding');
        } else {
          // Fallback: send to discover instead of non-existent dashboard
          navigate('/discover');
        }
      }
    } catch (error: any) {
      const code = error?.response?.data?.code;
      if (code === 'EMAIL_NOT_VERIFIED') {
        const email = error?.response?.data?.email || data.email;
        showToast.error(t('auth.verifyOtp.title'));
        navigate('/verify-otp', { state: { email } });
      } else if (code === 'TERMS_NOT_ACCEPTED') {
        showToast.error(error?.response?.data?.message || t('toast.error.loginFailed'));
      } else {
        const errorMessage = error?.response?.data?.error || t('toast.error.loginFailed');
        showToast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center px-4 py-8 overflow-hidden"
      style={{ 
        background: '#e8d5f0'
      }}
    >
      {/* Decorative Background Elements - Same as signup */}
      {/* Bottom-left pink blur */}
      <div 
        className="absolute bottom-0 left-0 w-[700px] h-[700px] rounded-full opacity-70 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #ff9ed6 0%, #ffb3e0 40%, #ffc4e8 60%, transparent 80%)',
          transform: 'translate(-35%, 35%)'
        }}
      />
      
      {/* Top-right purple/blue blur */}
      <div 
        className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full opacity-65 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #b99ef5 0%, #c5aff8 40%, #d4c0fc 60%, transparent 80%)',
          transform: 'translate(35%, -35%)'
        }}
      />

      {/* Back Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors group z-10"
      >
        <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card Container */}
        <div className="bg-white rounded-[32px] shadow-2xl px-8 py-12 sm:px-12 sm:py-14">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src="/BE.png" 
              alt="Beautiful Encer Logo" 
              className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-2xl mb-6"
              style={{
                filter: 'drop-shadow(0 10px 30px rgba(236, 72, 153, 0.3))'
              }}
            />
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center mb-2">
              {t('auth.login.title')}
            </h1>
            <p className="text-sm text-gray-600 text-center">
              {t('auth.login.subtitle')}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.login.email')}
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder={t('auth.login.emailPlaceholder')}
                  {...register('email', {
                    required: t('auth.validation.emailRequired'),
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: t('auth.validation.emailInvalid'),
                    },
                  })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.login.password')}
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  {...register('password', {
                    required: t('auth.validation.passwordRequired'),
                  })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
                <span className="text-gray-600">{t('auth.login.rememberMe', 'Remember me')}</span>
              </label>
              <button
                type="button"
                className="font-medium hover:underline transition-colors"
                style={{ color: '#ec4899' }}
                onClick={() => navigate('/forgot-password')}
              >
                {t('auth.login.forgotPassword')}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl text-white text-base font-semibold shadow-lg transition-all duration-300 hover:shadow-xl mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #E89BB5 0%, #B8D8E8 100%)'
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('common.loading')}
                </span>
              ) : (
                t('auth.login.button')
              )}
            </button>

            {/* Signup Link */}
            <p className="text-center text-gray-600 text-sm mt-6">
              {t('auth.login.noAccount')}{' '}
              <Link
                to="/signup"
                className="font-semibold hover:underline"
                style={{ color: '#ec4899' }}
              >
                {t('auth.login.signupLink')}
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
