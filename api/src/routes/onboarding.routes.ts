import express from 'express';
import onboardingController from '../controllers/onboarding.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.config.js';

const router = express.Router();

router.post(
  '/influencer',
  protect,
  upload.single('profilePic'), // Handles single file upload with field name 'profilePic'
  onboardingController.influencerOnboarding.bind(onboardingController)
);
export default router;
