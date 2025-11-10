/**
 * OTP Verification Page
 * Email verification with OTP
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { showToast } from '../../utils/toast';
import { FiArrowLeft } from 'react-icons/fi';
import { authService } from '../../services/auth.service';
import { validateOTP } from '../../utils/validation';

export const VerifyOtpPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const autoResendOtp = location.state?.autoResendOtp;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [hasCheckedEmail, setHasCheckedEmail] = useState(false);
  const [hasAutoResent, setHasAutoResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Only check once to prevent multiple toasts
    if (!hasCheckedEmail) {
      if (!email) {
        showToast.error('Email not found. Please sign up again.');
        navigate('/signup');
      }
      setHasCheckedEmail(true);
    }
  }, [email, navigate, hasCheckedEmail]);

  // Auto-resend OTP when coming from payment success page
  useEffect(() => {
    if (email && autoResendOtp && !hasAutoResent) {
      setHasAutoResent(true);
      handleResendOtp(true); // silent = true (no toast)
    }
  }, [email, autoResendOtp, hasAutoResent]);

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

  // Resend OTP handler - supports both manual and auto resend
  const handleResendOtp = async (silent: boolean = false) => {
    if (!email || isResending) return;
    
    try {
      setIsResending(true);
      await authService.resendOtp(email);
      if (!silent) {
        showToast.success(t('toast.success.otpSent'));
      }
    } catch (err: any) {
      if (!silent) {
        showToast.error(err?.response?.data?.error || t('toast.error.somethingWrong'));
      }
      console.error('[VerifyOtpPage.handleResendOtp] Error:', err);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpString = otp.join('');
    
    // Client-side validation
    const otpValidation = validateOTP(otpString);
    if (!otpValidation.valid) {
      showToast.error(otpValidation.error || t('auth.validation.otpRequired'));
      return;
    }

    // Prevent duplicate submissions
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.verifyOtp({
        email,
        otp: otpString,
      });

      showToast.success(response.message);
      
      // NEW FLOW: Check if user needs to complete payment (salon)
      if (response.requiresPayment && response.salonId) {
        // Salon needs to complete payment
        navigate('/payment/checkout', { 
          state: { 
            salonId: response.salonId,
            email 
          } 
        });
      } else {
        // Influencer or already paid - go to login
        navigate('/login', { 
          state: { 
            message: t('toast.success.otpVerified'),
            email 
          } 
        });
      }
    } catch (error: any) {
      // Handle specific error codes
      if (error.response?.data?.code === 'RATE_LIMIT_EXCEEDED') {
        showToast.error(error.response.data.message || 'Too many attempts. Please try again later.');
      } else {
        const errorMessage = error.response?.data?.error || t('toast.error.otpFailed');
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
      {/* Decorative Background Elements - Same as signup/login */}
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
        to="/signup"
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
              {t('auth.verifyOtp.title')}
            </h1>
            <p className="text-sm text-gray-600 text-center px-4">
              {t('auth.verifyOtp.subtitle')}<br />
              <span className="font-medium text-pink-600">{email}</span>
            </p>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input Boxes */}
            <div className="flex justify-center gap-2 sm:gap-3">
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
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all duration-300"
                />
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl text-white text-base font-semibold shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
                t('auth.verifyOtp.button')
              )}
            </button>

            {/* Resend Link */}
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                {t('auth.verifyOtp.resend')}{' '}
                <button
                  type="button"
                  className="font-semibold hover:underline transition-colors"
                  style={{ color: '#ec4899' }}
                  disabled={isResending}
                  onClick={() => handleResendOtp(false)}
                >
                  {isResending ? t('common.loading') : t('auth.verifyOtp.resendLink')}
                </button>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
