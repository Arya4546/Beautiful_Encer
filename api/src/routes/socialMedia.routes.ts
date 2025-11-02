import express from 'express';
import socialMediaController from '../controllers/socialMedia.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { socialMediaLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

// ===========================
// INSTAGRAM ROUTES (APIFY SCRAPING)
// ===========================

/**
 * @route   POST /api/v1/social-media/instagram/connect
 * @desc    Connect Instagram account using username (Apify scraping)
 * @access  Protected (Influencer)
 */
router.post(
  '/instagram/connect',
  protect,
  socialMediaController.connectInstagram.bind(socialMediaController)
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
  socialMediaController.syncInstagram.bind(socialMediaController)
);

/**
 * @route   GET /api/v1/social-media/instagram/:accountId
 * @desc    Get Instagram account data
 * @access  Protected (Influencer)
 */
router.get(
  '/instagram/:accountId',
  protect,
  socialMediaController.getInstagramData.bind(socialMediaController)
);

/**
 * @route   DELETE /api/v1/social-media/instagram/:accountId
 * @desc    Disconnect Instagram account
 * @access  Protected (Influencer)
 */
router.delete(
  '/instagram/:accountId',
  protect,
  socialMediaController.disconnectInstagram.bind(socialMediaController)
);

// ===========================
// TIKTOK ROUTES
// ===========================

// Public TikTok scraping via Apify
/**
 * @route   POST /api/v1/social-media/tiktok/connect-public
 * @desc    Connect TikTok account via public Apify scraping (no OAuth)
 * @access  Protected (Influencer)
 */
router.post(
  '/tiktok/connect-public',
  protect,
  socialMediaController.connectPublicTikTok.bind(socialMediaController)
);

/**
 * @route   POST /api/v1/social-media/tiktok/public/sync
 * @desc    Manually trigger TikTok public data sync
 * @access  Protected (Influencer)
 */
router.post(
  '/tiktok/public/sync',
  protect,
  socialMediaLimiter,
  socialMediaController.syncPublicTikTok.bind(socialMediaController)
);

/**
 * @route   GET /api/v1/social-media/tiktok/public/:accountId
 * @desc    Get TikTok public account data
 * @access  Protected (Influencer)
 */
router.get(
  '/tiktok/public/:accountId',
  protect,
  socialMediaController.getPublicTikTokData.bind(socialMediaController)
);

/**
 * @route   DELETE /api/v1/social-media/tiktok/public/:accountId
 * @desc    Disconnect TikTok public account
 * @access  Protected (Influencer)
 */
router.delete(
  '/tiktok/public/:accountId',
  protect,
  socialMediaController.disconnectPublicTikTok.bind(socialMediaController)
);

/**
 * @route   GET /api/v1/social-media/tiktok/profile/:username
 * @desc    Get public TikTok profile via Apify (no OAuth)
 * @access  Public (Rate-limited by general limiter)
 */
router.get(
  '/tiktok/profile/:username',
  socialMediaController.getPublicTikTokProfile.bind(socialMediaController)
);

/**
 * @route   GET /api/v1/social-media/tiktok/videos/:username
 * @desc    Get public TikTok recent videos via Apify (no OAuth)
 * @access  Public (Rate-limited by general limiter)
 */
router.get(
  '/tiktok/videos/:username',
  socialMediaController.getPublicTikTokVideos.bind(socialMediaController)
);

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
// YOUTUBE ROUTES (APIFY SCRAPING)
// ===========================

/**
 * @route   POST /api/v1/social-media/youtube/connect
 * @desc    Connect YouTube channel using channel handle (Apify scraping)
 * @access  Protected (Influencer)
 */
router.post(
  '/youtube/connect',
  protect,
  socialMediaController.connectYouTube.bind(socialMediaController)
);

/**
 * @route   POST /api/v1/social-media/youtube/sync
 * @desc    Manually trigger YouTube data sync
 * @access  Protected (Influencer) + Rate Limited
 */
router.post(
  '/youtube/sync',
  protect,
  socialMediaLimiter,
  socialMediaController.syncYouTube.bind(socialMediaController)
);

/**
 * @route   GET /api/v1/social-media/youtube/:accountId
 * @desc    Get YouTube account data
 * @access  Protected (Influencer)
 */
router.get(
  '/youtube/:accountId',
  protect,
  socialMediaController.getYouTubeData.bind(socialMediaController)
);

/**
 * @route   DELETE /api/v1/social-media/youtube/:accountId
 * @desc    Disconnect YouTube channel
 * @access  Protected (Influencer)
 */
router.delete(
  '/youtube/:accountId',
  protect,
  socialMediaController.disconnectYouTube.bind(socialMediaController)
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
