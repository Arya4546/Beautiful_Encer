import express from 'express';
import onboardingController from '../controllers/onboarding.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.config.js';
const router = express.Router();
/**
 * @route   POST /api/v1/onboarding/influencer
 * @desc    Complete influencer onboarding
 * @access  Protected (Influencer)
 */
router.post('/influencer', protect, upload.single('profilePic'), onboardingController.influencerOnboarding.bind(onboardingController));
/**
 * @route   POST /api/v1/onboarding/salon
 * @desc    Complete salon onboarding
 * @access  Protected (Salon)
 */
router.post('/salon', protect, upload.single('profilePic'), onboardingController.salonOnboarding.bind(onboardingController));
export default router;
