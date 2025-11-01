/**
 * Influencer Onboarding Page
 * Complete influencer profile setup with Figma design
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { showToast } from '../../utils/toast';
import { motion } from 'framer-motion';
import { FiImage } from 'react-icons/fi';
import { onboardingService } from '../../services/onboarding.service';
import type { InfluencerOnboardingRequest } from '../../types';
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

interface OnboardingFormData extends Omit<InfluencerOnboardingRequest, 'profilePic'> {
  profilePic: File | null;
}

export const InfluencerOnboarding: React.FC = () => {
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
    setValue('categories', updated);
  };

  const onSubmit = async (data: OnboardingFormData) => {
    if (!data.profilePic) {
      showToast.error(t('onboarding.influencer.errors.profilePicRequired'));
      return;
    }

    if (selectedCategories.length === 0) {
      showToast.error(t('onboarding.influencer.errors.categoryRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const formData: InfluencerOnboardingRequest = {
        ...data,
        categories: selectedCategories,
        profilePic: data.profilePic,
      };

      const response = await onboardingService.influencerOnboarding(formData);
      
      showToast.success(response.message);
      
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

  const isJapanese = i18n.language === 'ja';

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
                {t('onboarding.influencer.title')}
              </h1>
              <p className="text-sm text-gray-600 mt-1 text-center">
                {t('onboarding.influencer.subtitle')}
              </p>
            </div>
          </div>

          {/* Scrollable Form Content */}
          <div className="px-8 pb-10 sm:px-12 sm:pb-12 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Profile Picture Upload - Figma Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('onboarding.influencer.profilePicture')}
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="profile-pic-upload"
                    />
                    <label
                      htmlFor="profile-pic-upload"
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
                      {t('onboarding.influencer.profilePicHelper')}
                    </p>
                  </div>
                </div>
                {errors.profilePic && (
                  <p className="mt-1 text-sm text-red-600">{errors.profilePic.message}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('onboarding.influencer.bio')}
                </label>
                <textarea
                  {...register('bio', { required: t('onboarding.influencer.errors.bioRequired') })}
                  rows={4}
                  placeholder={t('onboarding.influencer.bioPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
                )}
              </div>

              {/* Categories - Multi-select Pills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('onboarding.influencer.categories')}
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
                {errors.categories && (
                  <p className="mt-1 text-sm text-red-600">{errors.categories.message}</p>
                )}
              </div>

              {/* Region/Area - Japanese Prefectures Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('onboarding.influencer.region')}
                </label>
                <select
                  {...register('region', { required: t('onboarding.influencer.errors.regionRequired') })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                >
                  <option value="">{t('onboarding.influencer.regionPlaceholder')}</option>
                  {PREFECTURES.map((pref) => (
                    <option key={pref.value} value={pref.value}>
                      {isJapanese ? pref.labelJa : pref.label}
                    </option>
                  ))}
                </select>
                {errors.region && (
                  <p className="mt-1 text-sm text-red-600">{errors.region.message}</p>
                )}
              </div>

              {/* Age & Gender - Side by Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('onboarding.influencer.age')}
                  </label>
                  <input
                    type="number"
                    placeholder={t('onboarding.influencer.agePlaceholder')}
                    {...register('age', {
                      required: t('onboarding.influencer.errors.ageRequired'),
                      valueAsNumber: true,
                      min: { value: 13, message: t('onboarding.influencer.errors.ageMin') },
                      max: { value: 120, message: t('onboarding.influencer.errors.ageMax') },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  />
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('onboarding.influencer.gender')}
                  </label>
                  <select
                    {...register('gender', { required: t('onboarding.influencer.errors.genderRequired') })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  >
                    <option value="">{t('onboarding.influencer.genderOptions.select')}</option>
                    <option value="MALE">{t('onboarding.influencer.genderOptions.MALE')}</option>
                    <option value="FEMALE">{t('onboarding.influencer.genderOptions.FEMALE')}</option>
                    <option value="NON_BINARY">{t('onboarding.influencer.genderOptions.NON_BINARY')}</option>
                    <option value="PREFER_NOT_TO_SAY">{t('onboarding.influencer.genderOptions.PREFER_NOT_TO_SAY')}</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl text-white text-base font-semibold shadow-lg transition-all duration-300 hover:shadow-xl mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
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
