import express from 'express';
import socialMediaController from '../controllers/socialMedia.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { socialMediaLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

// ===========================
// INSTAGRAM ROUTES
// ===========================

/**
 * @route   GET /api/v1/social-media/instagram/auth
 * @desc    Initiate Instagram OAuth flow
 * @access  Protected (Influencer)
 */
router.get(
  '/instagram/auth',
  protect,
  socialMediaController.initiateInstagramAuth.bind(socialMediaController)
);

/**
 * @route   GET /api/v1/social-media/instagram/callback
 * @desc    Instagram OAuth callback handler
 * @access  Public (but validates state parameter)
 */
router.get(
  '/instagram/callback',
  socialMediaController.instagramCallback.bind(socialMediaController)
);

/**
 * @route   POST /api/v1/social-media/instagram/sync
 * @desc    Manually trigger Instagram data sync
 * @access  Protected (Influencer) + Rate Limited
 */
router.post(
  '/instagram/sync',
  protect,
  socialMediaLimiter,
  socialMediaController.syncAccount.bind(socialMediaController)
);

// ===========================
// TIKTOK ROUTES
// ===========================

/**
 * @route   GET /api/v1/social-media/tiktok/auth
 * @desc    Initiate TikTok OAuth flow
 * @access  Protected (Influencer)
 */
router.get(
  '/tiktok/auth',
  protect,
  socialMediaController.initiateTikTokAuth.bind(socialMediaController)
);

/**
 * @route   GET /api/v1/social-media/tiktok/callback
 * @desc    TikTok OAuth callback handler
 * @access  Public (but validates state parameter)
 */
router.get(
  '/tiktok/callback',
  socialMediaController.tiktokCallback.bind(socialMediaController)
);

/**
 * @route   POST /api/v1/social-media/tiktok/sync
 * @desc    Manually trigger TikTok data sync
 * @access  Protected (Influencer) + Rate Limited
 */
router.post(
  '/tiktok/sync',
  protect,
  socialMediaLimiter,
  socialMediaController.syncAccount.bind(socialMediaController)
);

// ===========================
// GENERAL ROUTES
// ===========================

/**
 * @route   GET /api/v1/social-media/accounts
 * @desc    Get all connected social media accounts
 * @access  Protected (Influencer)
 */
router.get(
  '/accounts',
  protect,
  socialMediaController.getConnectedAccounts.bind(socialMediaController)
);

/**
 * @route   DELETE /api/v1/social-media/:platform
 * @desc    Disconnect a social media account
 * @access  Protected (Influencer)
 */
router.delete(
  '/:platform',
  protect,
  socialMediaController.disconnectAccount.bind(socialMediaController)
);

export default router;
