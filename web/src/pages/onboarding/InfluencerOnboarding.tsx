/**
 * Influencer Onboarding Page
 * Complete influencer profile setup
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { showToast } from '../../utils/toast';
import { motion } from 'framer-motion';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { MultiSelect } from '../../components/ui/MultiSelect';
import { FileUpload } from '../../components/ui/FileUpload';
import { onboardingService } from '../../services/onboarding.service';
import type { InfluencerOnboardingRequest, Gender } from '../../types';

const CATEGORIES = [
  'beauty',
  'lifestyle',
  'fashion',
  'fitness',
  'food',
  'travel',
  'technology',
  'gaming',
  'wellness',
  'parenting',
  'pets',
  'photography',
];

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'NON_BINARY', label: 'Non-Binary' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

export const InfluencerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InfluencerOnboardingRequest>();

  const onSubmit = async (data: InfluencerOnboardingRequest) => {
    if (!data.profilePic) {
      showToast.error('Please upload a profile picture');
      return;
    }

    if (data.categories.length === 0) {
      showToast.error('Please select at least one category');
      return;
    }

    setIsLoading(true);

    try {
      const response = await onboardingService.influencerOnboarding(data);
      
      showToast.success(response.message);
      
      // Navigate to dashboard
      navigate('/dashboard', { 
        state: { 
          message: 'Welcome! Your profile has been created successfully.' 
        } 
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'Onboarding failed. Please try again.';
      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Complete Your Profile"
      subtitle="Tell us about yourself to get started"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Picture */}
        <Controller
          name="profilePic"
          control={control}
          rules={{ required: 'Profile picture is required' }}
          render={({ field }) => (
            <FileUpload
              label="Profile Picture *"
              accept="image/*"
              onChange={field.onChange}
              value={field.value}
              error={errors.profilePic?.message}
            />
          )}
        />

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio *
          </label>
          <textarea
            {...register('bio', { required: 'Bio is required' })}
            rows={4}
            placeholder="Tell us about yourself..."
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all duration-300 resize-none text-gray-900 bg-white"
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
          )}
        </div>

        {/* Categories */}
        <Controller
          name="categories"
          control={control}
          defaultValue={[]}
          rules={{ 
            required: 'Please select at least one category',
            validate: (value) => value.length > 0 || 'Please select at least one category'
          }}
          render={({ field }) => (
            <MultiSelect
              label="Categories *"
              options={CATEGORIES}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select your content categories"
              error={errors.categories?.message}
            />
          )}
        />

        {/* Region */}
        <Input
          label="Region *"
          placeholder="e.g., New York, USA"
          {...register('region', { required: 'Region is required' })}
          error={errors.region?.message}
        />

        {/* Age */}
        <Input
          label="Age *"
          type="number"
          placeholder="Enter your age"
          {...register('age', {
            required: 'Age is required',
            valueAsNumber: true,
            min: { value: 13, message: 'Must be at least 13 years old' },
            max: { value: 120, message: 'Please enter a valid age' },
          })}
          error={errors.age?.message}
        />

        {/* Gender */}
        <Select
          label="Gender *"
          options={GENDER_OPTIONS}
          {...register('gender', { required: 'Gender is required' })}
          error={errors.gender?.message}
        />

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button type="submit" fullWidth isLoading={isLoading} className="mt-6">
            Complete Onboarding
          </Button>
        </motion.div>

        <p className="text-center text-gray-600 text-sm">
          You can update your profile anytime from settings
        </p>
      </form>
    </AuthLayout>
  );
};
