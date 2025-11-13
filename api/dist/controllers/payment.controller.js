import paymentService from '../services/payment.service.js';
class PaymentController {
    /**
     * @route   POST /api/v1/payment/create-checkout-session
     * @desc    Create Stripe checkout session for salon subscription
     * @access  Public (called during signup)
     */
    async createCheckoutSession(req, res) {
        try {
            const { salonId, email, plan } = req.body;
            // Validation
            if (!salonId || !email || !plan) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'salonId, email, and plan are required',
                });
            }
            if (!['monthly', 'yearly'].includes(plan)) {
                return res.status(400).json({
                    error: 'Invalid plan',
                    message: 'Plan must be either "monthly" or "yearly"',
                });
            }
            // Create checkout session
            const result = await paymentService.createCheckoutSession({
                salonId,
                email,
                plan,
            });
            return res.status(200).json({
                success: true,
                sessionId: result.sessionId,
                url: result.url,
            });
        }
        catch (error) {
            console.error('[PaymentController.createCheckoutSession] Error:', error);
            return res.status(500).json({
                error: 'Failed to create checkout session',
                message: error.message || 'An error occurred while creating the checkout session',
            });
        }
    }
    /**
     * @route   POST /api/v1/payment/webhook
     * @desc    Handle Stripe webhook events
     * @access  Public (Stripe webhooks)
     */
    async handleWebhook(req, res) {
        try {
            const signature = req.headers['stripe-signature'];
            if (!signature) {
                console.error('[PaymentController.handleWebhook] Missing stripe-signature header');
                return res.status(400).json({
                    error: 'Missing signature',
                    message: 'Stripe signature header is required',
                });
            }
            // Get raw body (must be raw for signature verification)
            const payload = req.body;
            if (!payload) {
                console.error('[PaymentController.handleWebhook] Missing request body');
                return res.status(400).json({
                    error: 'Missing payload',
                    message: 'Request body is required',
                });
            }
            // Verify webhook signature
            let event;
            try {
                event = paymentService.verifyWebhookSignature(typeof payload === 'string' ? payload : JSON.stringify(payload), signature);
            }
            catch (error) {
                console.error('[PaymentController.handleWebhook] Signature verification failed:', error);
                return res.status(400).json({
                    error: 'Invalid signature',
                    message: error.message || 'Webhook signature verification failed',
                });
            }
            console.log(`[PaymentController.handleWebhook] Received event: ${event.type} (ID: ${event.id})`);
            // Handle different event types with error recovery
            try {
                switch (event.type) {
                    case 'checkout.session.completed': {
                        const session = event.data.object;
                        // Check if payment was successful
                        if (session.payment_status === 'paid') {
                            await paymentService.handleSuccessfulPayment(session);
                        }
                        else {
                            console.log(`[PaymentController.handleWebhook] Checkout completed but payment status is: ${session.payment_status}`);
                        }
                        break;
                    }
                    case 'checkout.session.async_payment_succeeded': {
                        const session = event.data.object;
                        await paymentService.handleSuccessfulPayment(session);
                        break;
                    }
                    case 'checkout.session.async_payment_failed': {
                        const session = event.data.object;
                        await paymentService.handleFailedPayment(session);
                        break;
                    }
                    case 'customer.subscription.created':
                    case 'customer.subscription.updated': {
                        const subscription = event.data.object;
                        await paymentService.handleSubscriptionUpdate(subscription);
                        break;
                    }
                    case 'customer.subscription.deleted': {
                        const subscription = event.data.object;
                        await paymentService.handleSubscriptionDeleted(subscription);
                        break;
                    }
                    case 'invoice.payment_succeeded': {
                        // Handle successful recurring payments
                        const invoice = event.data.object;
                        console.log(`[PaymentController.handleWebhook] Invoice paid: ${invoice.id}`);
                        // Update subscription if needed
                        if (invoice.subscription) {
                            try {
                                const subscription = await (await import('../config/stripe.config.js')).stripe.subscriptions.retrieve(invoice.subscription);
                                await paymentService.handleSubscriptionUpdate(subscription);
                            }
                            catch (error) {
                                console.error('[PaymentController.handleWebhook] Failed to update subscription from invoice:', error);
                            }
                        }
                        break;
                    }
                    case 'invoice.payment_failed': {
                        // Handle failed recurring payments
                        const invoice = event.data.object;
                        console.log(`[PaymentController.handleWebhook] Invoice payment failed: ${invoice.id}`);
                        // Could send notification to salon here
                        break;
                    }
                    case 'payment_intent.succeeded':
                    case 'payment_intent.payment_failed':
                    case 'payment_intent.canceled':
                        console.log(`[PaymentController.handleWebhook] Payment intent event: ${event.type}`);
                        break;
                    default:
                        console.log(`[PaymentController.handleWebhook] Unhandled event type: ${event.type}`);
                }
            }
            catch (handlerError) {
                // Log the error but return 200 to Stripe so it doesn't retry
                console.error(`[PaymentController.handleWebhook] Error handling ${event.type}:`, handlerError);
                console.error('[PaymentController.handleWebhook] Event data:', JSON.stringify(event.data.object, null, 2));
                // Still return 200 to prevent Stripe from retrying
                // We've logged the error for investigation
            }
            return res.status(200).json({ received: true });
        }
        catch (error) {
            console.error('[PaymentController.handleWebhook] Error:', error);
            return res.status(500).json({
                error: 'Webhook handler failed',
                message: error.message || 'An error occurred while processing the webhook',
            });
        }
    }
    /**
     * @route   GET /api/v1/payment/subscription-status/:salonId
     * @desc    Get subscription status for a salon
     * @access  Protected (Salon or Admin)
     */
    async getSubscriptionStatus(req, res) {
        try {
            const { salonId } = req.params;
            if (!salonId) {
                return res.status(400).json({
                    error: 'Missing salon ID',
                    message: 'Salon ID is required',
                });
            }
            const status = await paymentService.getSalonSubscriptionStatus(salonId);
            return res.status(200).json({
                success: true,
                data: status,
            });
        }
        catch (error) {
            console.error('[PaymentController.getSubscriptionStatus] Error:', error);
            return res.status(500).json({
                error: 'Failed to get subscription status',
                message: error.message || 'An error occurred while retrieving subscription status',
            });
        }
    }
    /**
     * @route   GET /api/v1/payment/verify-session/:sessionId
     * @desc    Verify checkout session status
     * @access  Public (called after redirect)
     */
    async verifySession(req, res) {
        try {
            const { sessionId } = req.params;
            // Validate session ID
            if (!sessionId) {
                return res.status(400).json({
                    error: 'Missing session ID',
                    message: 'Session ID is required',
                });
            }
            if (typeof sessionId !== 'string' || sessionId.length < 10) {
                return res.status(400).json({
                    error: 'Invalid session ID',
                    message: 'Session ID format is invalid',
                });
            }
            // Import stripe from config
            const { stripe } = await import('../config/stripe.config.js');
            // Retrieve session from Stripe with error handling
            let session;
            try {
                session = await stripe.checkout.sessions.retrieve(sessionId);
            }
            catch (stripeError) {
                console.error('[PaymentController.verifySession] Stripe error:', stripeError);
                if (stripeError.code === 'resource_missing') {
                    return res.status(404).json({
                        error: 'Session not found',
                        message: 'The payment session could not be found. It may have expired.',
                    });
                }
                return res.status(500).json({
                    error: 'Stripe error',
                    message: stripeError.message || 'Failed to retrieve session from Stripe',
                });
            }
            // Validate session data
            if (!session) {
                return res.status(404).json({
                    error: 'Session not found',
                    message: 'Payment session not found',
                });
            }
            // If payment is successful and not yet processed, handle it now
            // This is a fallback for local development where webhooks might not work
            if (session.payment_status === 'paid' && session.metadata?.salonId) {
                try {
                    console.log('[PaymentController.verifySession] Attempting fallback payment processing');
                    await paymentService.handleSuccessfulPayment(session);
                    console.log('[PaymentController.verifySession] Payment processed successfully (fallback)');
                }
                catch (error) {
                    // Log but don't fail - payment might already be processed
                    console.log('[PaymentController.verifySession] Payment processing info:', error.message);
                    // Only return error if it's NOT a duplicate payment error
                    if (!error.message?.includes('already processed') && !error.message?.includes('unique constraint')) {
                        console.error('[PaymentController.verifySession] Unexpected error during fallback:', error);
                    }
                }
            }
            // Get email from session
            const customerEmail = session.customer_email || session.metadata?.email;
            if (!customerEmail) {
                console.warn('[PaymentController.verifySession] No email found in session');
            }
            return res.status(200).json({
                success: true,
                data: {
                    paymentStatus: session.payment_status,
                    customerEmail,
                    salonId: session.metadata?.salonId,
                    subscriptionId: session.subscription,
                },
            });
        }
        catch (error) {
            console.error('[PaymentController.verifySession] Error:', error);
            return res.status(500).json({
                error: 'Failed to verify session',
                message: error.message || 'An error occurred while verifying the session',
            });
        }
    }
    /**
     * @route   POST /api/v1/payment/sync-salon-payment/:salonId
     * @desc    Manually sync payment status for a salon (fix stuck payments)
     * @access  Public
     */
    async syncSalonPayment(req, res) {
        try {
            const { salonId } = req.params;
            if (!salonId) {
                return res.status(400).json({ error: 'Salon ID required' });
            }
            const { prisma } = await import('../lib/prisma.js');
            const { stripe } = await import('../config/stripe.config.js');
            const salon = await prisma.salon.findUnique({
                where: { id: salonId },
                include: { user: true },
            });
            if (!salon || !salon.stripeCustomerId) {
                return res.status(404).json({ error: 'Salon or Stripe customer not found' });
            }
            const subscriptions = await stripe.subscriptions.list({
                customer: salon.stripeCustomerId,
                limit: 10,
            });
            const activeSubscriptions = subscriptions.data.filter((sub) => sub.status === 'active' || sub.status === 'trialing');
            if (activeSubscriptions.length === 0) {
                return res.status(404).json({ error: 'No active subscriptions found' });
            }
            const subscription = activeSubscriptions[0];
            let periodStart = subscription.current_period_start || subscription.billing_cycle_anchor || subscription.created;
            let periodEnd = subscription.current_period_end;
            if (!periodEnd) {
                const interval = subscription.items.data[0]?.price?.recurring?.interval;
                periodEnd = periodStart + (interval === 'year' ? 365 : 30) * 24 * 60 * 60;
            }
            const currentPeriodStart = new Date(periodStart * 1000);
            const currentPeriodEnd = new Date(periodEnd * 1000);
            const interval = subscription.items.data[0]?.price?.recurring?.interval;
            const plan = interval === 'year' ? 'YEARLY' : 'MONTHLY';
            await prisma.$transaction(async (tx) => {
                const dbSubscription = await tx.subscription.upsert({
                    where: { stripeSubscriptionId: subscription.id },
                    create: {
                        stripeSubscriptionId: subscription.id,
                        stripeCustomerId: salon.stripeCustomerId,
                        stripePriceId: subscription.items.data[0]?.price?.id || '',
                        plan,
                        status: 'ACTIVE',
                        salonId: salon.id,
                        currentPeriodStart,
                        currentPeriodEnd,
                    },
                    update: {
                        status: 'ACTIVE',
                        currentPeriodStart,
                        currentPeriodEnd,
                    },
                });
                const existingPayment = await tx.payment.findFirst({
                    where: { salonId: salon.id, subscriptionId: dbSubscription.id },
                });
                if (!existingPayment) {
                    await tx.payment.create({
                        data: {
                            stripePaymentId: subscription.latest_invoice || `manual_${Date.now()}`,
                            stripeSessionId: `sync_${Date.now()}`,
                            amount: subscription.items.data[0]?.price?.unit_amount || 0,
                            currency: subscription.currency || 'usd',
                            status: 'COMPLETED',
                            salonId: salon.id,
                            subscriptionId: dbSubscription.id,
                            description: `${plan} subscription - synced`,
                            paidAt: currentPeriodStart,
                        },
                    });
                }
                await tx.salon.update({
                    where: { id: salon.id },
                    data: { paymentCompleted: true },
                });
            });
            return res.status(200).json({
                success: true,
                message: 'Payment synced successfully. You can now login.',
            });
        }
        catch (error) {
            console.error('[PaymentController.syncSalonPayment] Error:', error);
            return res.status(500).json({ error: 'Sync failed', message: error.message });
        }
    }
}
export default new PaymentController();
