import Stripe from 'stripe';
import { stripe, STRIPE_CONFIG } from '../config/stripe.config.js';
import { prisma } from '../lib/prisma.js';
import { PaymentStatus, SubscriptionStatus, SubscriptionPlan } from '@prisma/client';

interface CreateCheckoutSessionParams {
  salonId: string;
  email: string;
  plan: 'monthly' | 'yearly';
}

interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

class PaymentService {
  /**
   * Create a Stripe Checkout session for salon subscription
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
    try {
      const { salonId, email, plan } = params;

      // Validate inputs
      if (!salonId || !email || !plan) {
        throw new Error('Missing required parameters: salonId, email, and plan are required');
      }

      if (!['monthly', 'yearly'].includes(plan)) {
        throw new Error('Invalid plan. Must be "monthly" or "yearly"');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      // Get salon details with user info
      const salon = await prisma.salon.findUnique({
        where: { id: salonId },
        include: { user: true },
      });

      if (!salon) {
        throw new Error(`Salon not found with ID: ${salonId}`);
      }

      if (!salon.user) {
        throw new Error('Salon user not found');
      }

      // Check if payment already completed
      if (salon.paymentCompleted) {
        // Check if they have an active subscription
        const activeSubscription = await prisma.subscription.findFirst({
          where: {
            salonId: salon.id,
            status: {
              in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
            },
          },
        });

        if (activeSubscription) {
          throw new Error('Payment already completed and subscription is active');
        }
        
        // If no active subscription but payment marked complete, allow renewal
        console.log(`[PaymentService.createCheckoutSession] Allowing renewal for salon ${salonId}`);
      }

      // Get or create Stripe customer
      let customerId = salon.stripeCustomerId;
      
      if (!customerId) {
        try {
          // Check if customer already exists in Stripe by email
          const existingCustomers = await stripe.customers.list({
            email,
            limit: 1,
          });

          if (existingCustomers.data.length > 0) {
            customerId = existingCustomers.data[0].id;
            console.log(`[PaymentService.createCheckoutSession] Found existing Stripe customer: ${customerId}`);
          } else {
            // Create new customer
            const customer = await stripe.customers.create({
              email,
              name: salon.businessName || undefined,
              metadata: {
                salonId: salon.id,
                userId: salon.userId,
              },
            });
            customerId = customer.id;
            console.log(`[PaymentService.createCheckoutSession] Created new Stripe customer: ${customerId}`);
          }

          // Save customer ID to database
          await prisma.salon.update({
            where: { id: salonId },
            data: { stripeCustomerId: customerId },
          });
        } catch (stripeError: any) {
          console.error('[PaymentService.createCheckoutSession] Stripe customer error:', stripeError);
          throw new Error(`Failed to create/retrieve Stripe customer: ${stripeError.message}`);
        }
      }

      // Get pricing based on plan
      const pricing = STRIPE_CONFIG.salonPricing[plan];

      if (!pricing) {
        throw new Error(`Pricing configuration not found for plan: ${plan}`);
      }

      // Validate pricing configuration
      if (!pricing.amount || pricing.amount <= 0) {
        throw new Error('Invalid pricing amount');
      }

      // Create checkout session with comprehensive error handling
      let session: Stripe.Checkout.Session;
      try {
        session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: pricing.currency || 'usd',
                product_data: {
                  name: pricing.name,
                  description: pricing.description,
                },
                unit_amount: pricing.amount,
                recurring: plan === 'monthly' 
                  ? { interval: 'month' }
                  : { interval: 'year' },
              },
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: `${STRIPE_CONFIG.redirectUrls.success}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: STRIPE_CONFIG.redirectUrls.cancel,
          metadata: {
            salonId: salon.id,
            userId: salon.userId,
            plan,
            email,
          },
          subscription_data: {
            metadata: {
              salonId: salon.id,
              userId: salon.userId,
              plan,
            },
          },
          // Allow promotion codes
          allow_promotion_codes: true,
          // Collect billing address
          billing_address_collection: 'auto',
          // Set payment timeout (24 hours)
          expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
        });
      } catch (stripeError: any) {
        console.error('[PaymentService.createCheckoutSession] Stripe session creation error:', stripeError);
        throw new Error(`Failed to create checkout session: ${stripeError.message}`);
      }

      if (!session.url) {
        throw new Error('Checkout session created but URL is missing');
      }

      console.log(`[PaymentService.createCheckoutSession] Created session ${session.id} for salon ${salonId}`);

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error: any) {
      console.error('[PaymentService.createCheckoutSession] Error:', error);
      // Re-throw with original message to preserve context
      throw error;
    }
  }

  /**
   * Handle successful payment from Stripe webhook
   */
  async handleSuccessfulPayment(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const salonId = session.metadata?.salonId;
      const plan = session.metadata?.plan as 'monthly' | 'yearly';
      const userId = session.metadata?.userId;

      // Validate required metadata
      if (!salonId) {
        throw new Error('Salon ID not found in session metadata');
      }

      if (!plan || !['monthly', 'yearly'].includes(plan)) {
        throw new Error('Invalid or missing plan in session metadata');
      }

      // Validate payment status
      if (session.payment_status !== 'paid') {
        console.warn(`[PaymentService.handleSuccessfulPayment] Session ${session.id} payment status is ${session.payment_status}, not 'paid'`);
        return;
      }

      // Get salon details
      const salon = await prisma.salon.findUnique({
        where: { id: salonId },
        include: {
          subscriptions: {
            where: { stripeSubscriptionId: session.subscription as string },
          },
        },
      });

      if (!salon) {
        throw new Error(`Salon ${salonId} not found`);
      }

      // Check if payment already processed (to prevent duplicates)
      const existingPayment = await prisma.payment.findFirst({
        where: {
          stripeSessionId: session.id,
        },
      });

      if (existingPayment) {
        console.log(`[PaymentService.handleSuccessfulPayment] Payment already processed for session ${session.id}`);
        
        // Ensure salon is marked as payment completed
        if (!salon.paymentCompleted) {
          await prisma.salon.update({
            where: { id: salonId },
            data: { paymentCompleted: true },
          });
          console.log(`[PaymentService.handleSuccessfulPayment] Updated salon ${salonId} payment status to completed`);
        }
        
        return; // Already processed, skip
      }

      // Validate subscription ID exists
      if (!session.subscription) {
        throw new Error('Subscription ID not found in session');
      }

      // Get subscription details from Stripe with retry logic
      let stripeSubscription: Stripe.Subscription;
      let retries = 3;
      
      while (retries > 0) {
        try {
          stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
          break;
        } catch (error: any) {
          retries--;
          if (retries === 0) {
            throw new Error(`Failed to retrieve subscription from Stripe: ${error.message}`);
          }
          console.warn(`[PaymentService.handleSuccessfulPayment] Retrying subscription retrieval, attempts left: ${retries}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
      }

      // Use transaction for atomicity
      await prisma.$transaction(async (tx) => {
        // Check if subscription already exists
        const existingSubscription = await tx.subscription.findFirst({
          where: { stripeSubscriptionId: session.subscription as string },
        });

        let subscription;
        
        if (existingSubscription) {
          // Update existing subscription
          subscription = await tx.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
              currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
              stripePriceId: stripeSubscription.items.data[0]?.price.id,
              stripeCustomerId: session.customer as string,
            },
          });
          console.log(`[PaymentService.handleSuccessfulPayment] Updated existing subscription ${subscription.id}`);
        } else {
          // Create new subscription record
          subscription = await tx.subscription.create({
            data: {
              stripeSubscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
              stripePriceId: stripeSubscription.items.data[0]?.price.id || '',
              plan: plan === 'monthly' ? SubscriptionPlan.MONTHLY : SubscriptionPlan.YEARLY,
              status: SubscriptionStatus.ACTIVE,
              salonId: salon.id,
              currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
              currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
            },
          });
          console.log(`[PaymentService.handleSuccessfulPayment] Created new subscription ${subscription.id}`);
        }

        // Create payment record
        await tx.payment.create({
          data: {
            stripePaymentId: (session.payment_intent as string) || `pi_${Date.now()}`,
            stripeSessionId: session.id,
            amount: session.amount_total || 0,
            currency: session.currency || 'usd',
            status: PaymentStatus.COMPLETED,
            salonId: salon.id,
            subscriptionId: subscription.id,
            description: `${plan === 'monthly' ? 'Monthly' : 'Yearly'} subscription payment`,
            paidAt: new Date(),
          },
        });

        // Mark salon payment as completed and update customer ID
        await tx.salon.update({
          where: { id: salonId },
          data: { 
            paymentCompleted: true,
            stripeCustomerId: session.customer as string,
          },
        });
      });

      console.log(`[PaymentService.handleSuccessfulPayment] Payment completed successfully for salon ${salonId}`);
    } catch (error: any) {
      console.error('[PaymentService.handleSuccessfulPayment] Error:', error);
      console.error('[PaymentService.handleSuccessfulPayment] Session ID:', session.id);
      console.error('[PaymentService.handleSuccessfulPayment] Metadata:', session.metadata);
      throw error;
    }
  }

  /**
   * Handle failed payment from Stripe webhook
   */
  async handleFailedPayment(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const salonId = session.metadata?.salonId;
      const plan = session.metadata?.plan;

      if (!salonId) {
        console.warn('[PaymentService.handleFailedPayment] No salon ID in metadata');
        return;
      }

      // Verify salon exists
      const salon = await prisma.salon.findUnique({
        where: { id: salonId },
      });

      if (!salon) {
        console.warn(`[PaymentService.handleFailedPayment] Salon ${salonId} not found`);
        return;
      }

      // Check if payment record already exists
      const existingPayment = await prisma.payment.findFirst({
        where: {
          stripeSessionId: session.id,
        },
      });

      if (existingPayment) {
        console.log(`[PaymentService.handleFailedPayment] Failed payment record already exists for session ${session.id}`);
        return;
      }

      // Create failed payment record if payment intent exists
      if (session.payment_intent) {
        try {
          await prisma.payment.create({
            data: {
              stripePaymentId: session.payment_intent as string,
              stripeSessionId: session.id,
              amount: session.amount_total || 0,
              currency: session.currency || 'usd',
              status: PaymentStatus.FAILED,
              salonId,
              description: `Failed ${plan || 'subscription'} payment attempt`,
            },
          });
        } catch (error: any) {
          // Handle unique constraint violation gracefully
          if (error.code === 'P2002') {
            console.log(`[PaymentService.handleFailedPayment] Payment record already exists (unique constraint)`);
          } else {
            throw error;
          }
        }
      }

      console.log(`[PaymentService.handleFailedPayment] Payment failed for salon ${salonId}, session ${session.id}`);
    } catch (error: any) {
      console.error('[PaymentService.handleFailedPayment] Error:', error);
      // Don't re-throw - failed payment logging shouldn't break the flow
    }
  }

  /**
   * Handle subscription updates from Stripe webhook
   */
  async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    try {
      const salonId = subscription.metadata?.salonId;

      if (!salonId) {
        console.warn('[PaymentService.handleSubscriptionUpdate] No salon ID in metadata');
        return;
      }

      // Verify salon exists
      const salon = await prisma.salon.findUnique({
        where: { id: salonId },
      });

      if (!salon) {
        console.warn(`[PaymentService.handleSubscriptionUpdate] Salon ${salonId} not found`);
        return;
      }

      // Find existing subscription
      const existingSubscription = await prisma.subscription.findFirst({
        where: { 
          OR: [
            { stripeSubscriptionId: subscription.id },
            { salonId: salonId, status: SubscriptionStatus.ACTIVE },
          ],
        },
      });

      if (!existingSubscription) {
        console.warn(`[PaymentService.handleSubscriptionUpdate] Subscription ${subscription.id} not found in database`);
        
        // Create subscription if it doesn't exist (edge case recovery)
        try {
          const plan = subscription.metadata?.plan as 'monthly' | 'yearly' | undefined;
          if (!plan) {
            console.warn('[PaymentService.handleSubscriptionUpdate] No plan in metadata, cannot create subscription');
            return;
          }

          await prisma.subscription.create({
            data: {
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer as string,
              stripePriceId: subscription.items.data[0]?.price.id || '',
              plan: plan === 'monthly' ? SubscriptionPlan.MONTHLY : SubscriptionPlan.YEARLY,
              status: this.mapStripeStatusToSubscriptionStatus(subscription.status),
              salonId: salon.id,
              currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              canceledAt: subscription.canceled_at ? new Date((subscription as any).canceled_at * 1000) : null,
            },
          });
          console.log(`[PaymentService.handleSubscriptionUpdate] Created missing subscription ${subscription.id}`);
        } catch (error: any) {
          console.error('[PaymentService.handleSubscriptionUpdate] Failed to create subscription:', error);
        }
        return;
      }

      // Map Stripe status to our status
      const status = this.mapStripeStatusToSubscriptionStatus(subscription.status);

      // Update subscription
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status,
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at ? new Date((subscription as any).canceled_at * 1000) : null,
          stripePriceId: subscription.items.data[0]?.price.id || existingSubscription.stripePriceId,
        },
      });

      // Update salon payment status based on subscription status
      if (status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING) {
        await prisma.salon.update({
          where: { id: salonId },
          data: { paymentCompleted: true },
        });
      } else if (status === SubscriptionStatus.CANCELLED || status === SubscriptionStatus.EXPIRED) {
        await prisma.salon.update({
          where: { id: salonId },
          data: { paymentCompleted: false },
        });
      }

      console.log(`[PaymentService.handleSubscriptionUpdate] Updated subscription ${subscription.id} to status ${status}`);
    } catch (error: any) {
      console.error('[PaymentService.handleSubscriptionUpdate] Error:', error);
      // Don't re-throw - subscription update logging shouldn't break the flow
    }
  }

  /**
   * Map Stripe subscription status to our subscription status
   */
  private mapStripeStatusToSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'canceled':
        return SubscriptionStatus.CANCELLED;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'unpaid':
      case 'incomplete':
      case 'incomplete_expired':
      default:
        return SubscriptionStatus.EXPIRED;
    }
  }

  /**
   * Handle subscription deletion from Stripe webhook
   */
  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      const salonId = subscription.metadata?.salonId;

      if (!salonId) {
        console.warn('[PaymentService.handleSubscriptionDeleted] No salon ID in metadata');
        return;
      }

      // Verify salon exists
      const salon = await prisma.salon.findUnique({
        where: { id: salonId },
      });

      if (!salon) {
        console.warn(`[PaymentService.handleSubscriptionDeleted] Salon ${salonId} not found`);
        return;
      }

      // Use transaction for atomicity
      await prisma.$transaction(async (tx) => {
        // Update subscription status
        const updated = await tx.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: SubscriptionStatus.CANCELLED,
            canceledAt: new Date(),
            cancelAtPeriodEnd: false,
          },
        });

        if (updated.count === 0) {
          console.warn(`[PaymentService.handleSubscriptionDeleted] No subscription found with ID ${subscription.id}`);
        }

        // Check if salon has any other active subscriptions
        const activeSubscriptions = await tx.subscription.findMany({
          where: {
            salonId: salon.id,
            status: {
              in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
            },
          },
        });

        // Only mark payment as incomplete if no other active subscriptions
        if (activeSubscriptions.length === 0) {
          await tx.salon.update({
            where: { id: salonId },
            data: { paymentCompleted: false },
          });
          console.log(`[PaymentService.handleSubscriptionDeleted] Marked salon ${salonId} payment as incomplete`);
        } else {
          console.log(`[PaymentService.handleSubscriptionDeleted] Salon ${salonId} still has ${activeSubscriptions.length} active subscription(s)`);
        }
      });

      console.log(`[PaymentService.handleSubscriptionDeleted] Subscription ${subscription.id} cancelled for salon ${salonId}`);
    } catch (error: any) {
      console.error('[PaymentService.handleSubscriptionDeleted] Error:', error);
      // Don't re-throw - subscription deletion logging shouldn't break the flow
    }
  }

  /**
   * Get salon subscription status
   */
  async getSalonSubscriptionStatus(salonId: string) {
    try {
      // Validate input
      if (!salonId) {
        throw new Error('Salon ID is required');
      }

      const salon = await prisma.salon.findUnique({
        where: { id: salonId },
        include: {
          subscriptions: {
            where: {
              status: {
                in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE],
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!salon) {
        throw new Error(`Salon not found with ID: ${salonId}`);
      }

      const activeSubscription = salon.subscriptions[0] || null;

      // Check if subscription is truly active (not expired)
      let isSubscriptionValid = false;
      if (activeSubscription) {
        const now = new Date();
        const periodEnd = new Date(activeSubscription.currentPeriodEnd);
        isSubscriptionValid = periodEnd > now;

        if (!isSubscriptionValid) {
          console.warn(`[PaymentService.getSalonSubscriptionStatus] Subscription ${activeSubscription.id} has expired`);
        }
      }

      return {
        paymentCompleted: salon.paymentCompleted,
        hasActiveSubscription: isSubscriptionValid,
        subscription: activeSubscription,
        stripeCustomerId: salon.stripeCustomerId,
      };
    } catch (error: any) {
      console.error('[PaymentService.getSalonSubscriptionStatus] Error:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    try {
      // Validate inputs
      if (!payload) {
        throw new Error('Webhook payload is required');
      }

      if (!signature) {
        throw new Error('Webhook signature is required');
      }

      const webhookSecret = STRIPE_CONFIG.webhookSecret;
      
      if (!webhookSecret) {
        console.error('[PaymentService.verifyWebhookSignature] Webhook secret not configured');
        throw new Error('Webhook secret not configured. Set STRIPE_WEBHOOK_SECRET in environment variables.');
      }

      // Construct and verify event
      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
      console.log(`[PaymentService.verifyWebhookSignature] Verified webhook event: ${event.type}`);
      
      return event;
    } catch (error: any) {
      console.error('[PaymentService.verifyWebhookSignature] Error:', error.message);
      
      // Provide more context for common errors
      if (error.message?.includes('No signatures found')) {
        throw new Error('Invalid webhook signature format');
      } else if (error.message?.includes('timestamp')) {
        throw new Error('Webhook timestamp verification failed - possible replay attack or clock skew');
      } else if (error.message?.includes('signature')) {
        throw new Error('Webhook signature verification failed - invalid signature');
      }
      
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }
}

export default new PaymentService();
