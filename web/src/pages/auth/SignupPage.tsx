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
import { FiMail, FiLock, FiUser, FiPhone } from 'react-icons/fi';
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
      <AuthLayout
        title={t('auth.signup.title')}
        subtitle={t('auth.signup.subtitle')}
      >
        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedRole('influencer')}
            className="w-full p-6 rounded-2xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 text-left group"
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {t('auth.signup.roleInfluencer')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('auth.signup.roleInfluencerDesc')}
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedRole('salon')}
            className="w-full p-6 rounded-2xl border-2 border-gray-200 hover:border-pink-500 hover:bg-pink-50 transition-all duration-300 text-left group"
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-pink-100 rounded-xl group-hover:bg-pink-200 transition-colors">
                <svg
                  className="w-8 h-8 text-pink-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {t('auth.signup.roleSalon')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t('auth.signup.roleSalonDesc')}
                </p>
              </div>
            </div>
          </motion.button>

          <div className="pt-4 text-center">
            <p className="text-gray-600">
              {t('auth.signup.haveAccount')}{' '}
              <Link
                to="/login"
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                {t('auth.signup.loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Signup form step
  return (
    <AuthLayout
      title={`${t('common.signup')} ${selectedRole === 'influencer' ? t('auth.signup.roleInfluencer') : t('auth.signup.roleSalon')}`}
      subtitle={t('auth.signup.subtitle')}
    >
      <button
        onClick={() => setSelectedRole(null)}
        className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center"
      >
        ← {t('auth.signup.back')}
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t('auth.signup.name')}
          placeholder={t('auth.signup.namePlaceholder')}
          icon={<FiUser />}
          {...register('name', { required: t('auth.validation.nameRequired') })}
          error={errors.name?.message}
        />

        <Input
          label={t('auth.signup.email')}
          type="email"
          placeholder={t('auth.signup.emailPlaceholder')}
          icon={<FiMail />}
          {...register('email', {
            required: t('auth.validation.emailRequired'),
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: t('auth.validation.emailInvalid'),
            },
          })}
          error={errors.email?.message}
        />

        <Input
          label={t('auth.signup.phone')}
          type="tel"
          placeholder={t('auth.signup.phonePlaceholder')}
          icon={<FiPhone />}
          {...register('phoneNo')}
          error={errors.phoneNo?.message}
        />

        <Input
          label={t('auth.signup.password')}
          type="password"
          placeholder={t('auth.signup.passwordPlaceholder')}
          icon={<FiLock />}
          {...register('password', {
            required: t('auth.validation.passwordRequired'),
            minLength: {
              value: 8,
              message: t('auth.validation.passwordMin'),
            },
          })}
          error={errors.password?.message}
        />

        <Input
          label={t('auth.signup.confirmPassword')}
          type="password"
          placeholder={t('auth.signup.confirmPasswordPlaceholder')}
          icon={<FiLock />}
          {...register('confirmPassword', {
            required: t('auth.validation.passwordRequired'),
            validate: (value) =>
              value === password || t('auth.validation.passwordMismatch'),
          })}
          error={errors.confirmPassword?.message}
        />

        {/* Terms acceptance */}
        <label className="flex items-start gap-3 text-sm text-gray-700 mt-2">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            {...register('acceptTerms')}
          />
          <span>
            {t('auth.signup.agreePrefix')}{' '}
            <Link to="/legal/terms" className="text-purple-600 hover:underline">
              {t('legal.terms.short')}
            </Link>{' '}
            {t('common.and')}{' '}
            <Link to="/legal/privacy" className="text-purple-600 hover:underline">
              {t('legal.privacy.short')}
            </Link>
          </span>
        </label>

        <Button type="submit" fullWidth isLoading={isLoading} className="mt-4">
          {t('auth.signup.button')}
        </Button>

        <p className="text-center text-gray-600 text-sm mt-4">
          {t('auth.signup.haveAccount')}{' '}
          <Link
            to="/login"
            className="text-purple-600 hover:text-purple-700 font-semibold"
          >
            {t('auth.signup.loginLink')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
