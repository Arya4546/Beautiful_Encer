/**
 * Login Page
 * User authentication
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { showToast } from '../../utils/toast';
import { FiMail, FiLock } from 'react-icons/fi';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import type { LoginRequest } from '../../types';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);

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
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t('auth.login.email')}
          type="email"
          placeholder={t('auth.login.emailPlaceholder')}
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
          label={t('auth.login.password')}
          type="password"
          placeholder={t('auth.login.passwordPlaceholder')}
          icon={<FiLock />}
          {...register('password', {
            required: t('auth.validation.passwordRequired'),
          })}
          error={errors.password?.message}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2 h-4 w-4 text-purple-600 rounded"
            />
            <span className="text-gray-600">{t('auth.login.rememberMe', 'Remember me')}</span>
          </label>
          <button
            type="button"
            className="text-purple-600 hover:text-purple-700 font-semibold"
            onClick={() => showToast.error(t('toast.error.passwordResetComingSoon'))}
          >
            {t('auth.login.forgotPassword')}
          </button>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading} className="mt-6">
          {t('auth.login.button')}
        </Button>

        <p className="text-center text-gray-600 text-sm mt-4">
          {t('auth.login.noAccount')}{' '}
          <Link
            to="/signup"
            className="text-purple-600 hover:text-purple-700 font-semibold"
          >
            {t('auth.login.signupLink')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
