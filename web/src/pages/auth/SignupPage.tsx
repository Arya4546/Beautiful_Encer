/**
 * Signup Page
 * User registration with role selection
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
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
}

export const SignupPage: React.FC = () => {
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

  const onSubmit = async (data: SignupFormData) => {
    if (!selectedRole) {
      showToast.error('Please select your role');
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...signupData } = data;

      const response =
        selectedRole === 'influencer'
          ? await authService.influencerSignup(signupData)
          : await authService.salonSignup(signupData);

      showToast.success(response.message);
      
      // Navigate to OTP verification with email
      navigate('/verify-otp', { state: { email: data.email } });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'Signup failed. Please try again.';
      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Role selection step
  if (!selectedRole) {
    return (
      <AuthLayout
        title="Join Beautiful Encer"
        subtitle="Choose your account type to get started"
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
                  I'm an Influencer
                </h3>
                <p className="text-gray-600 text-sm">
                  Connect with brands and grow your influence
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
                  I'm a Salon/Business
                </h3>
                <p className="text-gray-600 text-sm">
                  Find and collaborate with influencers
                </p>
              </div>
            </div>
          </motion.button>

          <div className="pt-4 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                Sign in
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
      title={`Sign up as ${selectedRole === 'influencer' ? 'Influencer' : 'Salon'}`}
      subtitle="Create your account to get started"
    >
      <button
        onClick={() => setSelectedRole(null)}
        className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center"
      >
        ← Change role
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Enter your name"
          icon={<FiUser />}
          {...register('name', { required: 'Name is required' })}
          error={errors.name?.message}
        />

        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          icon={<FiMail />}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Invalid email format',
            },
          })}
          error={errors.email?.message}
        />

        <Input
          label="Phone Number (Optional)"
          type="tel"
          placeholder="+1234567890"
          icon={<FiPhone />}
          {...register('phoneNo')}
          error={errors.phoneNo?.message}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Create a password"
          icon={<FiLock />}
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          })}
          error={errors.password?.message}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          icon={<FiLock />}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) =>
              value === password || 'Passwords do not match',
          })}
          error={errors.confirmPassword?.message}
        />

        <Button type="submit" fullWidth isLoading={isLoading} className="mt-6">
          Create Account
        </Button>

        <p className="text-center text-gray-600 text-sm mt-4">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-purple-600 hover:text-purple-700 font-semibold"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
