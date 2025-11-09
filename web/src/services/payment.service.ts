import axiosInstance from '../lib/axios';
import { API_ENDPOINTS } from '../config/api.config';

export interface CreateCheckoutSessionParams {
  salonId: string;
  email: string;
  plan: 'monthly' | 'yearly';
}

export interface CheckoutSessionResponse {
  success: boolean;
  sessionId: string;
  url: string;
}

export interface VerifySessionResponse {
  success: boolean;
  data: {
    paymentStatus: string;
    customerEmail: string;
    salonId: string;
  };
}

export interface SubscriptionStatusResponse {
  success: boolean;
  data: {
    paymentCompleted: boolean;
    hasActiveSubscription: boolean;
    subscription: any;
  };
}

const paymentService = {
  /**
   * Create a Stripe checkout session for salon subscription
   */
  createCheckoutSession: async (params: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.PAYMENT.CREATE_CHECKOUT_SESSION, params);
    return response.data;
  },

  /**
   * Verify checkout session after redirect
   */
  verifySession: async (sessionId: string): Promise<VerifySessionResponse> => {
    const response = await axiosInstance.get(API_ENDPOINTS.PAYMENT.VERIFY_SESSION(sessionId));
    return response.data;
  },

  /**
   * Get subscription status for a salon
   */
  getSubscriptionStatus: async (salonId: string): Promise<SubscriptionStatusResponse> => {
    const response = await axiosInstance.get(API_ENDPOINTS.PAYMENT.SUBSCRIPTION_STATUS(salonId));
    return response.data;
  },
};

export default paymentService;
