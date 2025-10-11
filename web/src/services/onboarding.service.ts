/**
 * Onboarding Service
 * Handles onboarding API calls
 */

import type { AxiosResponse } from 'axios';
import axiosInstance from '../lib/axios';
import { API_ENDPOINTS } from '../config/api.config';
import type {
  InfluencerOnboardingRequest,
  SalonOnboardingRequest,
  Influencer,
  Salon,
} from '../types';

export const onboardingService = {
  /**
   * Complete Influencer Onboarding
   */
  influencerOnboarding: async (
    data: InfluencerOnboardingRequest
  ): Promise<{ message: string; influencer: Influencer }> => {
    const formData = new FormData();
    
    formData.append('bio', data.bio);
    formData.append('categories', JSON.stringify(data.categories));
    formData.append('region', data.region);
    formData.append('age', data.age.toString());
    formData.append('gender', data.gender);
    formData.append('profilePic', data.profilePic);

    const response: AxiosResponse<{ message: string; influencer: Influencer }> =
      await axiosInstance.post(API_ENDPOINTS.ONBOARDING.INFLUENCER, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

    return response.data;
  },

  /**
   * Complete Salon Onboarding
   */
  salonOnboarding: async (
    data: SalonOnboardingRequest
  ): Promise<{ message: string; salon: Salon }> => {
    const formData = new FormData();

    formData.append('businessName', data.businessName);
    formData.append('description', data.description);
    formData.append('preferredCategories', JSON.stringify(data.preferredCategories));

    if (data.website) formData.append('website', data.website);
    if (data.establishedYear) formData.append('establishedYear', data.establishedYear.toString());
    if (data.teamSize) formData.append('teamSize', data.teamSize.toString());
    if (data.operatingHours) formData.append('operatingHours', data.operatingHours);
    if (data.instagramHandle) formData.append('instagramHandle', data.instagramHandle);
    if (data.tiktokHandle) formData.append('tiktokHandle', data.tiktokHandle);
    if (data.facebookPage) formData.append('facebookPage', data.facebookPage);
    if (data.profilePic) formData.append('profilePic', data.profilePic);

    const response: AxiosResponse<{ message: string; salon: Salon }> =
      await axiosInstance.post(API_ENDPOINTS.ONBOARDING.SALON, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

    return response.data;
  },
};
