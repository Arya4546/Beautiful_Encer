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
 * @route   POST /api/v1/auth/resend-otp
 * @desc    Resend email verification OTP
 * @access  Public + Rate Limited
 */
router.post('/resend-otp', authLimiter, authController.resendOtp.bind(authController));
/**
 * @route   GET /api/v1/auth/check-status
 * @desc    Check user registration and verification status
 * @access  Public + Rate Limited
 */
router.get('/check-status', authLimiter, authController.checkUserStatus.bind(authController));
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login (for both influencer and salon)
 * @access  Public + Rate Limited
 */
router.post('/login', authLimiter, authController.login.bind(authController));
/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset - Send OTP to email
 * @access  Public + Rate Limited
 */
router.post('/forgot-password', authLimiter, authController.forgotPassword.bind(authController));
/**
 * @route   POST /api/v1/auth/verify-forgot-otp
 * @desc    Verify OTP for password reset
 * @access  Public + Rate Limited
 */
router.post('/verify-forgot-otp', authLimiter, authController.verifyForgotPasswordOtp.bind(authController));
/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with verified OTP
 * @access  Public + Rate Limited
 */
router.post('/reset-password', authLimiter, authController.resetPassword.bind(authController));
/**
 * @route   POST /api/v1/auth/resend-forgot-otp
 * @desc    Resend OTP for password reset
 * @access  Public + Rate Limited
 */
router.post('/resend-forgot-otp', authLimiter, authController.resendForgotPasswordOtp.bind(authController));
export default router;
