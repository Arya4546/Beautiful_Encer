/**
 * Salon Onboarding Page
 * Complete salon business profile setup
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MultiSelect } from '../../components/ui/MultiSelect';
import { FileUpload } from '../../components/ui/FileUpload';
import { onboardingService } from '../../services/onboarding.service';
import type { SalonOnboardingRequest } from '../../types';

const INFLUENCER_CATEGORIES = [
  'beauty',
  'lifestyle',
  'fashion',
  'fitness',
  'wellness',
  'haircare',
  'skincare',
  'makeup',
  'nails',
  'spa',
];

export const SalonOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SalonOnboardingRequest>();

  const onSubmit = async (data: SalonOnboardingRequest) => {
    if (data.preferredCategories.length === 0) {
      toast.error('Please select at least one preferred category');
      return;
    }

    setIsLoading(true);

    try {
      const response = await onboardingService.salonOnboarding(data);
      
      toast.success(response.message);
      
      // Navigate to dashboard
      navigate('/dashboard', { 
        state: { 
          message: 'Welcome! Your business profile has been created successfully.' 
        } 
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'Onboarding failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Complete Your Business Profile"
      subtitle="Tell us about your salon to get started"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Picture */}
        <Controller
          name="profilePic"
          control={control}
          render={({ field }) => (
            <FileUpload
              label="Business Logo (Optional)"
              accept="image/*"
              onChange={field.onChange}
              value={field.value}
              error={errors.profilePic?.message}
            />
          )}
        />

        {/* Business Name */}
        <Input
          label="Business Name *"
          placeholder="Enter your salon/business name"
          {...register('businessName', { required: 'Business name is required' })}
          error={errors.businessName?.message}
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            rows={4}
            placeholder="Describe your business and what you're looking for..."
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all duration-300 resize-none text-gray-900 bg-white"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Preferred Categories */}
        <Controller
          name="preferredCategories"
          control={control}
          defaultValue={[]}
          rules={{ 
            required: 'Please select at least one category',
            validate: (value) => value.length > 0 || 'Please select at least one category'
          }}
          render={({ field }) => (
            <MultiSelect
              label="Preferred Influencer Categories *"
              options={INFLUENCER_CATEGORIES}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select types of influencers you want to work with"
              error={errors.preferredCategories?.message}
            />
          )}
        />

        {/* Website */}
        <Input
          label="Website (Optional)"
          type="url"
          placeholder="https://yourwebsite.com"
          {...register('website')}
          error={errors.website?.message}
        />

        {/* Established Year */}
        <Input
          label="Established Year (Optional)"
          type="number"
          placeholder="e.g., 2015"
          {...register('establishedYear', {
            valueAsNumber: true,
            min: { value: 1900, message: 'Please enter a valid year' },
            max: { value: new Date().getFullYear(), message: 'Year cannot be in the future' },
          })}
          error={errors.establishedYear?.message}
        />

        {/* Team Size */}
        <Input
          label="Team Size (Optional)"
          type="number"
          placeholder="Number of staff members"
          {...register('teamSize', {
            valueAsNumber: true,
            min: { value: 1, message: 'Must be at least 1' },
          })}
          error={errors.teamSize?.message}
        />

        {/* Operating Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Operating Hours (Optional)
          </label>
          <textarea
            {...register('operatingHours')}
            rows={3}
            placeholder='e.g., {"monday": "9:00-18:00", "tuesday": "9:00-18:00"}'
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all duration-300 resize-none font-mono text-sm text-gray-900 bg-white"
          />
          {errors.operatingHours && (
            <p className="mt-1 text-sm text-red-600">{errors.operatingHours.message}</p>
          )}
        </div>

        {/* Social Media Handles */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-semibold text-gray-900">Social Media (Optional)</h3>
          
          <Input
            label="Instagram Handle"
            placeholder="username (without @)"
            {...register('instagramHandle')}
            error={errors.instagramHandle?.message}
          />

          <Input
            label="TikTok Handle"
            placeholder="username (without @)"
            {...register('tiktokHandle')}
            error={errors.tiktokHandle?.message}
          />

          <Input
            label="Facebook Page"
            type="url"
            placeholder="https://facebook.com/yourpage"
            {...register('facebookPage')}
            error={errors.facebookPage?.message}
          />
        </div>

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
          You can update your business profile anytime from settings
        </p>
      </form>
    </AuthLayout>
  );
};
