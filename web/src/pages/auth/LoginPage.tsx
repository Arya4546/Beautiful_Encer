/**
 * Login Page
 * User authentication
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiMail, FiLock } from 'react-icons/fi';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import type { LoginRequest } from '../../types';

export const LoginPage: React.FC = () => {
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
      toast.success(location.state.message);
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
      toast.success('Login successful!');

      // Navigate based on user role
      if (response.user.role === 'INFLUENCER') {
        navigate('/influencer/onboarding');
      } else if (response.user.role === 'SALON') {
        navigate('/salon/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'Login failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          label="Password"
          type="password"
          placeholder="Enter your password"
          icon={<FiLock />}
          {...register('password', {
            required: 'Password is required',
          })}
          error={errors.password?.message}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2 h-4 w-4 text-purple-600 rounded"
            />
            <span className="text-gray-600">Remember me</span>
          </label>
          <button
            type="button"
            className="text-purple-600 hover:text-purple-700 font-semibold"
            onClick={() => toast.info('Password reset coming soon!')}
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading} className="mt-6">
          Sign In
        </Button>

        <p className="text-center text-gray-600 text-sm mt-4">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-purple-600 hover:text-purple-700 font-semibold"
          >
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
