import express from 'express';
import authController from '../controllers/auth.controller.js';
const router = express.Router();
/**
 * @route   POST /api/v1/auth/signup/influencer
 * @desc    Register a new influencer
 * @access  Public
 */
router.post('/signup/influencer', authController.influencerSignup.bind(authController));
/**
 * @route   POST /api/v1/auth/signup/salon
 * @desc    Register a new salon
 * @access  Public
 */
router.post('/signup/salon', authController.salonSignup.bind(authController));
/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify email with OTP (for both influencer and salon)
 * @access  Public
 */
router.post('/verify-otp', authController.verifyOtp.bind(authController));
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login (for both influencer and salon)
 * @access  Public
 */
router.post('/login', authController.login.bind(authController));
export default router;
