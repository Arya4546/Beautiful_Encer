import express from 'express';
import authController from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup/influencer', authController.influencerSignup.bind(authController));
router.post('/verify-otp', authController.verifyOtp.bind(authController));
router.post('/login', authController.login.bind(authController));

export default router;
