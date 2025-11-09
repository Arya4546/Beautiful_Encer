import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required in environment variables');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn('STRIPE_WEBHOOK_SECRET not set - webhook verification will be disabled in development');
}

/**
 * Stripe client instance
 * Initialize with secret key and API version
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
});

/**
 * Stripe configuration constants
 */
export const STRIPE_CONFIG = {
  // Webhook secret for verifying Stripe webhook signatures
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // Salon subscription pricing (in cents)
  salonPricing: {
    monthly: {
      amount: 2900, // $29.00/month
      currency: 'usd',
      name: 'Salon Monthly Subscription',
      description: 'Access to Beautiful_Encer platform for salon businesses',
    },
    yearly: {
      amount: 29000, // $290.00/year (save ~17%)
      currency: 'usd',
      name: 'Salon Yearly Subscription',
      description: 'Annual access to Beautiful_Encer platform for salon businesses',
    },
  },
  
  // Success and cancel redirect URLs
  redirectUrls: {
    success: process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173/payment/success',
    cancel: process.env.STRIPE_CANCEL_URL || 'http://localhost:5173/payment/cancel',
  },
} as const;

export default stripe;
