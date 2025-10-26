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
import { RegionSelector } from '../../components/common/RegionSelector';
import { onboardingService } from '../../services/onboarding.service';
import type { InfluencerOnboardingRequest, Gender } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';

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
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InfluencerOnboardingRequest>();

  const onSubmit = async (data: InfluencerOnboardingRequest) => {
    if (!data.profilePic) {
      showToast.error(t('onboarding.influencer.errors.profilePicRequired'));
      return;
    }

    if (data.categories.length === 0) {
      showToast.error(t('onboarding.influencer.errors.categoryRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await onboardingService.influencerOnboarding(data);
      
      showToast.success(response.message);
      
      // Mark onboarding complete in auth store so protected routes allow access
      if (user) {
        setUser({
          ...user,
          hasCompletedOnboarding: true,
          influencer: {
            ...(user.influencer || {}),
            profilePic: response.influencer.profilePic,
            bio: response.influencer.bio,
            categories: response.influencer.categories,
          },
        });
      }

      // Redirect to Discover (home after onboarding)
      navigate('/discover', { 
        state: { 
          message: t('onboarding.influencer.success') 
        } 
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || t('onboarding.error');
      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('onboarding.influencer.title')}
      subtitle={t('onboarding.influencer.subtitle')}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Picture */}
        <Controller
          name="profilePic"
          control={control}
          rules={{ required: t('onboarding.influencer.errors.profilePicRequired') as string }}
          render={({ field }) => (
            <FileUpload
              label={t('onboarding.influencer.profilePicture')}
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
            {t('onboarding.influencer.bio')}
          </label>
          <textarea
            {...register('bio', { required: t('onboarding.influencer.errors.bioRequired') })}
            rows={4}
            placeholder={t('onboarding.influencer.bioPlaceholder')}
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
            required: t('onboarding.influencer.errors.categoryRequired') as string,
            validate: (value) => value.length > 0 || (t('onboarding.influencer.errors.categoryRequired') as string)
          }}
          render={({ field }) => (
            <MultiSelect
              label={t('onboarding.influencer.categories')}
              options={CATEGORIES}
              value={field.value}
              onChange={field.onChange}
              placeholder={t('onboarding.influencer.categoriesPlaceholder')}
              error={errors.categories?.message}
            />
          )}
        />

        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('onboarding.influencer.region')}
          </label>
          <Controller
            name="region"
            control={control}
            rules={{ required: t('onboarding.influencer.errors.regionRequired') as string }}
            render={({ field }) => (
              <RegionSelector
                value={field.value || ''}
                onChange={field.onChange}
                placeholder={t('onboarding.influencer.regionPlaceholder')}
                error={errors.region?.message}
              />
            )}
          />
        </div>

        {/* Age */}
        <Input
          label={t('onboarding.influencer.age')}
          type="number"
          placeholder={t('onboarding.influencer.agePlaceholder')}
          {...register('age', {
            required: t('onboarding.influencer.errors.ageRequired'),
            valueAsNumber: true,
            min: { value: 13, message: t('onboarding.influencer.errors.ageMin') },
            max: { value: 120, message: t('onboarding.influencer.errors.ageMax') },
          })}
          error={errors.age?.message}
        />

        {/* Gender */}
        <Select
          label={t('onboarding.influencer.gender')}
          options={GENDER_OPTIONS.map((g) => ({
            ...g,
            label: t(`onboarding.influencer.genderOptions.${g.value || 'select'}`)
          }))}
          {...register('gender', { required: t('onboarding.influencer.errors.genderRequired') })}
          error={errors.gender?.message}
        />

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button type="submit" fullWidth isLoading={isLoading} className="mt-6">
            {t('onboarding.complete')}
          </Button>
        </motion.div>

        <p className="text-center text-gray-600 text-sm">
          {t('onboarding.influencer.footerNote')}
        </p>
      </form>
    </AuthLayout>
  );
};
