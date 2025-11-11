/**
 * Salon Onboarding Page
 * Complete salon business profile setup with Figma design
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { showToast } from '../../utils/toast';
import { motion } from 'framer-motion';
import { FiImage } from 'react-icons/fi';
import { onboardingService } from '../../services/onboarding.service';
import type { SalonOnboardingRequest } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { PREFECTURES } from '../../constants/prefectures';

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

interface OnboardingFormData extends Omit<SalonOnboardingRequest, 'profilePic'> {
  profilePic: File | null;
}

export const SalonOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { t, i18n } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormData>();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('profilePic', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCategory = (category: string) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(updated);
    setValue('preferredCategories', updated);
  };

  const onSubmit = async (data: OnboardingFormData) => {
    if (selectedCategories.length === 0) {
      showToast.error(t('onboarding.salon.errors.categoryRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const formData: SalonOnboardingRequest = {
        ...data,
        preferredCategories: selectedCategories,
        profilePic: data.profilePic || undefined,
      };

      const response = await onboardingService.salonOnboarding(formData);
      
      showToast.success(response.message);
      
      if (user) {
        setUser({
          ...user,
          hasCompletedOnboarding: true,
          salon: {
            ...(user.salon || {}),
            businessName: response.salon.businessName,
            profilePic: response.salon.profilePic,
            description: response.salon.description,
          },
        });
      }

      navigate('/discover', { 
        state: { 
          message: t('onboarding.salon.success') 
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
    <div 
      className="min-h-screen relative flex items-center justify-center px-4 py-8 overflow-hidden"
      style={{ 
        background: '#e8d5f0'
      }}
    >
      {/* Decorative Background Elements */}
      <div 
        className="absolute bottom-0 left-0 w-[700px] h-[700px] rounded-full opacity-70 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #ff9ed6 0%, #ffb3e0 40%, #ffc4e8 60%, transparent 80%)',
          transform: 'translate(-35%, 35%)'
        }}
      />
      
      <div 
        className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full opacity-65 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #b99ef5 0%, #c5aff8 40%, #d4c0fc 60%, transparent 80%)',
          transform: 'translate(35%, -35%)'
        }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Scrollable Card Container */}
        <div className="bg-white rounded-[32px] shadow-2xl max-h-[90vh] flex flex-col">
          {/* Fixed Header */}
          <div className="px-8 pt-10 pb-5 sm:px-12 sm:pt-12 sm:pb-6">
            <div className="flex flex-col items-center mb-6">
              <img 
                src="/BE.png" 
                alt="Beautiful Encer Logo" 
                className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-2xl mb-4"
                style={{
                  filter: 'drop-shadow(0 10px 30px rgba(236, 72, 153, 0.3))'
                }}
              />
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center">
                {t('onboarding.salon.title')}
              </h1>
              <p className="text-sm text-gray-600 mt-1 text-center">
                {t('onboarding.salon.subtitle')}
              </p>
            </div>
          </div>

          {/* Scrollable Form Content */}
          <div className="px-8 pb-10 sm:px-12 sm:pb-12 overflow-y-auto flex-1 scrollbar-hide">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Profile Picture Upload - Figma Style (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('onboarding.salon.profilePictureOptional')}
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="salon-profile-pic-upload"
                    />
                    <label
                      htmlFor="salon-profile-pic-upload"
                      className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-dashed border-pink-300 hover:border-pink-500 cursor-pointer transition-all bg-pink-50/50"
                    >
                      {profilePreview ? (
                        <img 
                          src={profilePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        <FiImage className="w-8 h-8 text-pink-400" />
                      )}
                    </label>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      {t('onboarding.salon.profilePicHelper') || 'Upload your salon logo or image (optional)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('onboarding.salon.businessName')}
                </label>
                <input
                  type="text"
                  placeholder={t('onboarding.salon.businessNamePlaceholder')}
                  {...register('businessName', { required: 'Business name is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
                {errors.businessName && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('onboarding.salon.description')}
                </label>
                <textarea
                  {...register('description', { required: t('onboarding.salon.errors.descriptionRequired') })}
                  rows={4}
                  placeholder={t('onboarding.salon.descriptionPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Preferred Categories - Multi-select Pills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('onboarding.salon.preferredCategories')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedCategories.includes(category)
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t(`categories.${category}`)}
                    </button>
                  ))}
                </div>
                {errors.preferredCategories && (
                  <p className="mt-1 text-sm text-red-600">{errors.preferredCategories.message}</p>
                )}
              </div>

              {/* Region/Area - Japanese Prefectures Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('onboarding.salon.region') || 'Region/Area'}
                </label>
                <select
                  {...register('region', { required: t('onboarding.salon.errors.regionRequired') || 'Region is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                >
                  <option value="">{t('onboarding.salon.regionPlaceholder') || 'Select your prefecture'}</option>
                  {PREFECTURES.map((pref) => (
                    <option key={pref.value} value={pref.value}>
                      {i18n.language === 'ja' ? pref.labelJa : pref.label}
                    </option>
                  ))}
                </select>
                {errors.region && (
                  <p className="mt-1 text-sm text-red-600">{errors.region.message}</p>
                )}
              </div>

              {/* Website (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('onboarding.salon.websiteOptional')}
                </label>
                <input
                  type="url"
                  placeholder={t('onboarding.salon.websitePlaceholder')}
                  {...register('website')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                )}
              </div>

              {/* Established Year & Team Size - Side by Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('onboarding.salon.establishedYearOptional')}
                  </label>
                  <input
                    type="number"
                    placeholder={t('onboarding.salon.establishedYearPlaceholder')}
                    {...register('establishedYear', {
                      valueAsNumber: true,
                      min: { value: 1900, message: t('onboarding.salon.errors.yearInvalid') },
                      max: { value: new Date().getFullYear(), message: t('onboarding.salon.errors.yearFuture') },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  />
                  {errors.establishedYear && (
                    <p className="mt-1 text-sm text-red-600">{errors.establishedYear.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('onboarding.salon.teamSizeOptional')}
                  </label>
                  <input
                    type="number"
                    placeholder={t('onboarding.salon.teamSizePlaceholder')}
                    {...register('teamSize', {
                      valueAsNumber: true,
                      min: { value: 1, message: t('onboarding.salon.errors.teamSizeMin') },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  />
                  {errors.teamSize && (
                    <p className="mt-1 text-sm text-red-600">{errors.teamSize.message}</p>
                  )}
                </div>
              </div>

              {/* Operating Hours (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('onboarding.salon.operatingHoursOptional')}
                </label>
                <textarea
                  {...register('operatingHours')}
                  rows={3}
                  placeholder={t('onboarding.salon.operatingHoursPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none font-mono text-sm"
                />
                {errors.operatingHours && (
                  <p className="mt-1 text-sm text-red-600">{errors.operatingHours.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl text-white text-base font-semibold shadow-lg transition-all duration-300 hover:shadow-xl mt-6 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
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
                  t('onboarding.complete')
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
