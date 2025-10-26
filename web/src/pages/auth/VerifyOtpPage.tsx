/**
 * OTP Verification Page
 * Email verification with OTP
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { showToast } from '../../utils/toast';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth.service';

export const VerifyOtpPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      showToast.error('Email not found. Please sign up again.');
      navigate('/signup');
    }
  }, [email, navigate]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const newOtp = pastedData.split('');
    while (newOtp.length < 6) {
      newOtp.push('');
    }
    setOtp(newOtp);
    
    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      showToast.error(t('auth.validation.otpRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.verifyOtp({
        email,
        otp: otpString,
      });

      showToast.success(response.message);
      
      // Navigate to login
      navigate('/login', { 
        state: { 
          message: t('toast.success.otpVerified'),
          email 
        } 
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || t('toast.error.otpFailed');
      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.verifyOtp.title')}
      subtitle={`${t('auth.verifyOtp.subtitle')} ${email}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2 sm:gap-3 flex-wrap max-w-full px-2">
          {otp.map((digit, index) => (
            <motion.input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="w-10 h-12 sm:w-12 sm:h-12 md:w-14 md:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all duration-300"
            />
          ))}
        </div>

        <Button type="submit" fullWidth isLoading={isLoading}>
          {t('auth.verifyOtp.button')}
        </Button>

        <div className="text-center space-y-2">
          <p className="text-gray-600 text-sm">
            {t('auth.verifyOtp.resend')}{' '}
            <button
              type="button"
              className="text-purple-600 hover:text-purple-700 font-semibold"
              disabled={isResending}
              onClick={async () => {
                if (!email) return;
                try {
                  setIsResending(true);
                  await authService.resendOtp(email);
                  showToast.success(t('toast.success.otpSent'));
                } catch (err: any) {
                  showToast.error(err?.response?.data?.error || t('toast.error.somethingWrong'));
                } finally {
                  setIsResending(false);
                }
              }}
            >
              {t('auth.verifyOtp.resendLink')}
            </button>
          </p>
          <p className="text-gray-600 text-sm">
            <Link
              to="/signup"
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              ← {t('common.back')}
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};
