/**
 * Reset Password Page
 * Step 3: Enter new password after OTP verification
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { showToast } from '../../utils/toast';
import { FiLock, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { authService } from '../../services/auth.service';

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const otp = location.state?.otp;

  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordForm>();

  const newPassword = watch('newPassword');

  useEffect(() => {
    if (!email || !otp) {
      showToast.error(t('toast.error.invalidResetSession'));
      navigate('/forgot-password');
    }
  }, [email, otp, navigate, t]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      showToast.error(t('auth.validation.passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(email, otp, data.newPassword);
      showToast.success(t('auth.resetPassword.success'));
      navigate('/login', { 
        state: { 
          message: t('auth.resetPassword.successMessage'),
          email 
        } 
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || t('toast.error.resetPasswordFailed');
      showToast.error(errorMessage);
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
      {/* Decorative Background Elements */}
      <div 
        className="absolute bottom-0 left-0 w-[700px] h-[700px] rounded-full opacity-70 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #ff9ed6 0%, #ffb3e0 40%, #ffc4e8 60%, transparent 80%)',
          transform: 'translate(-35%, 35%)'
        }}
      />
      
      <div 
        className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full opacity-65 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #b99ef5 0%, #c5aff8 40%, #d4c0fc 60%, transparent 80%)',
          transform: 'translate(35%, -35%)'
        }}
      />

      {/* Back Button */}
      <Link
        to="/login"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors group z-10"
      >
        <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">{t('common.back')}</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
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
              {t('auth.resetPassword.title')}
            </h1>
            <p className="text-sm text-gray-600 text-center">
              {t('auth.resetPassword.subtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.resetPassword.newPassword')}
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
                  {...register('newPassword', {
                    required: t('auth.validation.passwordRequired'),
                    minLength: {
                      value: 8,
                      message: t('auth.validation.passwordMinLength'),
                    },
                  })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.resetPassword.confirmPassword')}
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
                  {...register('confirmPassword', {
                    required: t('auth.validation.confirmPasswordRequired'),
                    validate: (value) =>
                      value === newPassword || t('auth.validation.passwordMismatch'),
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

            {/* Password Requirements */}
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-medium mb-1">{t('auth.resetPassword.requirements')}</p>
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                <li>{t('auth.resetPassword.requirement1')}</li>
                <li>{t('auth.resetPassword.requirement2')}</li>
              </ul>
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
                t('auth.resetPassword.button')
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
