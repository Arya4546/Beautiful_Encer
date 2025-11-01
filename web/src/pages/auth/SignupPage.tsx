/**
 * Signup Page
 * User registration with role selection
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { showToast } from '../../utils/toast';
import { FiMail, FiLock, FiUser, FiPhone, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/auth.service';
import type { SignupRequest } from '../../types';

type UserRole = 'influencer' | 'salon';

interface SignupFormData extends SignupRequest {
  confirmPassword: string;
  acceptTerms?: boolean;
}

export const SignupPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>();

  const password = watch('password');
  const acceptTerms = watch('acceptTerms');

  const onSubmit = async (data: SignupFormData) => {
    if (!selectedRole) {
      showToast.error(t('auth.validation.roleRequired'));
      return;
    }

    if (!acceptTerms) {
      showToast.error(t('auth.signup.mustAccept'));
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, acceptTerms: agree, ...signupData } = data;

      const response =
        selectedRole === 'influencer'
          ? await authService.influencerSignup({ ...signupData, acceptTerms: true })
          : await authService.salonSignup({ ...signupData, acceptTerms: true });

      showToast.success(response.message);
      
      // Navigate to OTP verification with email
      navigate('/verify-otp', { state: { email: data.email } });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || t('toast.error.signupFailed');
      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Role selection step
  if (!selectedRole) {
    return (
      <div 
        className="min-h-screen relative flex items-center justify-center px-4 py-8 overflow-hidden"
        style={{ 
          background: '#e8d5f0'
        }}
      >
        {/* Decorative Background Elements - Matching Figma exactly */}
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
            <div className="flex flex-col items-center justify-center mb-8">
              {/* BE Logo Image */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <img 
                  src="/BE.png" 
                  alt="Beautiful Encer Logo" 
                  className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-2xl"
                  style={{
                    filter: 'drop-shadow(0 10px 30px rgba(236, 72, 153, 0.3))'
                  }}
                />
              </motion.div>
            </div>

            {/* Sign Up Heading */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-center text-lg sm:text-xl font-semibold text-gray-900 tracking-[0.25em] mb-8 sm:mb-10"
            >
              {t('auth.signup.selectRoleTitle')}
            </motion.h2>

            {/* Role Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="space-y-4 sm:space-y-5"
            >
              {/* Influencer Button */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedRole('influencer')}
                className="w-full py-5 sm:py-6 rounded-2xl text-white text-lg sm:text-xl font-medium shadow-lg transition-all duration-300 hover:shadow-2xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #E89BB5 0%, #B8D8E8 100%)'
                }}
              >
                <span className="relative z-10">{t('auth.signup.roleInfluencerButton')}</span>
              </motion.button>

              {/* Salon Button */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedRole('salon')}
                className="w-full py-5 sm:py-6 rounded-2xl text-white text-lg sm:text-xl font-medium shadow-lg transition-all duration-300 hover:shadow-2xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #E89BB5 0%, #B8D8E8 100%)'
                }}
              >
                <span className="relative z-10">{t('auth.signup.roleSalonButton')}</span>
              </motion.button>
            </motion.div>

            {/* Login Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="mt-10 text-center"
            >
              <p className="text-sm sm:text-base text-gray-600">
                {t('auth.signup.haveAccount')}{' '}
                <Link
                  to="/login"
                  className="font-semibold transition-colors hover:underline"
                  style={{ color: '#ec4899' }}
                >
                  {t('auth.signup.loginLink')}
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Signup form step
  return (
    <div 
      className="min-h-screen relative flex items-center justify-center px-4 py-8 overflow-hidden"
      style={{ 
        background: '#e8d5f0'
      }}
    >
      {/* Decorative Background Elements - Same as role selection */}
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
      <button
        onClick={() => setSelectedRole(null)}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors group z-10"
      >
        <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">{t('auth.signup.back')}</span>
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Scrollable Card Container */}
        <div className="bg-white rounded-[32px] shadow-2xl max-h-[85vh] flex flex-col">
          {/* Fixed Header */}
          <div className="px-8 pt-10 pb-5 sm:px-12 sm:pt-12 sm:pb-6">
            {/* Logo Section */}
            <div className="flex flex-col items-center mb-6">
              <img 
                src="/BE.png" 
                alt="Beautiful Encer Logo" 
                className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-2xl mb-4"
                style={{
                  filter: 'drop-shadow(0 10px 30px rgba(236, 72, 153, 0.3))'
                }}
              />
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center">
                {selectedRole === 'influencer' 
                  ? t('auth.signup.roleInfluencer') 
                  : t('auth.signup.roleSalon')}
              </h1>
              <p className="text-sm text-gray-600 mt-1 text-center">
                {t('auth.signup.subtitle')}
              </p>
            </div>
          </div>

          {/* Scrollable Form Content */}
          <div className="px-8 pb-10 sm:px-12 sm:pb-12 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.signup.name')}
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={t('auth.signup.namePlaceholder')}
                    {...register('name', { required: t('auth.validation.nameRequired') })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.signup.email')}
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    placeholder={t('auth.signup.emailPlaceholder')}
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

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.signup.phone')}
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    placeholder={t('auth.signup.phonePlaceholder')}
                    {...register('phoneNo')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  />
                </div>
                {errors.phoneNo && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNo.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.signup.password')}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.signup.passwordPlaceholder')}
                    {...register('password', {
                      required: t('auth.validation.passwordRequired'),
                      minLength: {
                        value: 8,
                        message: t('auth.validation.passwordMin'),
                      },
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.signup.confirmPassword')}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('auth.signup.confirmPasswordPlaceholder')}
                    {...register('confirmPassword', {
                      required: t('auth.validation.passwordRequired'),
                      validate: (value) =>
                        value === password || t('auth.validation.passwordMismatch'),
                    })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms acceptance */}
              <label className="flex items-start gap-3 text-sm text-gray-700 mt-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  {...register('acceptTerms')}
                />
                <span>
                  {t('auth.signup.agreePrefix')}{' '}
                  <Link to="/legal/terms" className="text-pink-600 hover:underline font-medium">
                    {t('legal.terms.short')}
                  </Link>{' '}
                  {t('common.and')}{' '}
                  <Link to="/legal/privacy" className="text-pink-600 hover:underline font-medium">
                    {t('legal.privacy.short')}
                  </Link>
                </span>
              </label>

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
                  t('auth.signup.button')
                )}
              </button>

              {/* Login Link */}
              <p className="text-center text-gray-600 text-sm mt-6">
                {t('auth.signup.haveAccount')}{' '}
                <Link
                  to="/login"
                  className="font-semibold hover:underline"
                  style={{ color: '#ec4899' }}
                >
                  {t('auth.signup.loginLink')}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
