/**
 * OTP Verification Page
 * Email verification with OTP
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth.service';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      toast.error('Email not found. Please sign up again.');
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
      toast.error('Please enter complete OTP');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.verifyOtp({
        email,
        otp: otpString,
      });

      toast.success(response.message);
      
      // Navigate to login
      navigate('/login', { 
        state: { 
          message: 'Email verified! Please login to continue.',
          email 
        } 
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'OTP verification failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle={`We've sent a 6-digit code to ${email}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center space-x-3">
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
              className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all duration-300"
            />
          ))}
        </div>

        <Button type="submit" fullWidth isLoading={isLoading}>
          Verify OTP
        </Button>

        <div className="text-center space-y-2">
          <p className="text-gray-600 text-sm">
            Didn't receive the code?{' '}
            <button
              type="button"
              className="text-purple-600 hover:text-purple-700 font-semibold"
              onClick={() => toast.info('Resend feature coming soon!')}
            >
              Resend
            </button>
          </p>
          <p className="text-gray-600 text-sm">
            <Link
              to="/signup"
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              ← Back to signup
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};
