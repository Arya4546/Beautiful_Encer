import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
const router = express.Router();
/**
 * @route   POST /api/v1/payment/create-checkout-session
 * @desc    Create Stripe checkout session for salon subscription
 * @access  Public (called during signup)
 */
router.post('/create-checkout-session', paymentController.createCheckoutSession);
/**
 * @route   POST /api/v1/payment/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (Stripe webhooks)
 * @note    This endpoint requires raw body (configured in server.ts)
 */
router.post('/webhook', paymentController.handleWebhook);
/**
 * @route   GET /api/v1/payment/subscription-status/:salonId
 * @desc    Get subscription status for a salon
 * @access  Protected (Salon or Admin)
 */
router.get('/subscription-status/:salonId', protect, paymentController.getSubscriptionStatus);
/**
 * @route   GET /api/v1/payment/verify-session/:sessionId
 * @desc    Verify checkout session status after redirect
 * @access  Public
 */
router.get('/verify-session/:sessionId', paymentController.verifySession);
export default router;
