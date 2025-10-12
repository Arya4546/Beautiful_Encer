import express from 'express';
import authController from '../controllers/auth.controller.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';
const router = express.Router();
/**
 * @route   POST /api/v1/auth/signup/influencer
 * @desc    Register a new influencer
 * @access  Public + Rate Limited
 */
router.post('/signup/influencer', authLimiter, authController.influencerSignup.bind(authController));
/**
 * @route   POST /api/v1/auth/signup/salon
 * @desc    Register a new salon
 * @access  Public + Rate Limited
 */
router.post('/signup/salon', authLimiter, authController.salonSignup.bind(authController));
/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify email with OTP (for both influencer and salon)
 * @access  Public + Rate Limited
 */
router.post('/verify-otp', authLimiter, authController.verifyOtp.bind(authController));
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login (for both influencer and salon)
 * @access  Public + Rate Limited
 */
router.post('/login', authLimiter, authController.login.bind(authController));
export default router;
