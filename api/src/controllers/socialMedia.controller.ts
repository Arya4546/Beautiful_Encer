import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { SocialMediaPlatform, MediaType } from '@prisma/client';
import apifyInstagramService from '../services/apify.instagram.service.js';
import tiktokService from '../services/tiktok.service.js';

/**
 * Social Media Account Linking Controller
 * Handles Instagram (via Apify scraping) and TikTok account connections for influencers
 */

class SocialMediaController {
  // ===========================
  // INSTAGRAM - CONNECT VIA USERNAME (APIFY SCRAPING)
  // ===========================
  async connectInstagram(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'You must be logged in to connect an Instagram account'
        });
      }

      const { username } = req.body;

      if (!username || typeof username !== 'string' || username.trim() === '') {
        return res.status(400).json({ 
          error: 'Invalid username',
          message: 'Please provide a valid Instagram username'
        });
      }

      // Connect Instagram account using Apify scraping
      const result = await apifyInstagramService.connectInstagramAccount(userId, username);

      return res.status(200).json(result);

    } catch (error: any) {
      console.error('[SocialMediaController.connectInstagram] Error:', error);
      
      // Handle specific error cases
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          error: 'Instagram account not found',
          message: 'The Instagram username you provided does not exist or is private'
        });
      }

      if (error.message.includes('influencer')) {
        return res.status(403).json({ 
          error: 'Not an influencer',
          message: 'Only influencer accounts can connect Instagram'
        });
      }

      return res.status(500).json({ 
        error: 'Failed to connect Instagram',
        message: error.message || 'An unexpected error occurred while connecting your Instagram account'
      });
    }
  }

  // ===========================
  // INSTAGRAM - SYNC DATA
  // ===========================
  async syncInstagram(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'You must be logged in to sync Instagram data'
        });
      }

      const { accountId } = req.body;

      if (!accountId) {
        return res.status(400).json({ 
          error: 'Missing account ID',
          message: 'Please provide the Instagram account ID to sync'
        });
      }

      // Verify account belongs to this user
      const account = await prisma.socialMediaAccount.findUnique({
        where: { id: accountId },
        include: { influencer: { include: { user: true } } },
      });

      if (!account) {
        return res.status(404).json({ 
          error: 'Account not found',
          message: 'The Instagram account you are trying to sync does not exist'
        });
      }

      if (account.influencer.user.id !== userId) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You do not have permission to sync this Instagram account'
        });
      }

      // Sync Instagram data
      const result = await apifyInstagramService.syncInstagramData(accountId);

      return res.status(200).json(result);

    } catch (error: any) {
      console.error('[SocialMediaController.syncInstagram] Error:', error);
      
      return res.status(500).json({ 
        error: 'Failed to sync Instagram data',
        message: error.message || 'An unexpected error occurred while syncing your Instagram data'
      });
    }
  }

  // ===========================
  // INSTAGRAM - GET DATA
  // ===========================
  async getInstagramData(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'You must be logged in to view Instagram data'
        });
      }

      const { accountId } = req.params;

      // Verify account belongs to this user
      const account = await prisma.socialMediaAccount.findUnique({
        where: { id: accountId },
        include: { influencer: { include: { user: true } } },
      });

      if (!account) {
        return res.status(404).json({ 
          error: 'Account not found',
          message: 'The Instagram account does not exist'
        });
      }

      if (account.influencer.user.id !== userId) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You do not have permission to view this Instagram account'
        });
      }

      // Get Instagram data (from cache or fresh scrape)
      const result = await apifyInstagramService.getInstagramData(accountId);

      return res.status(200).json(result);

    } catch (error: any) {
      console.error('[SocialMediaController.getInstagramData] Error:', error);
      
      return res.status(500).json({ 
        error: 'Failed to get Instagram data',
        message: error.message || 'An unexpected error occurred while fetching Instagram data'
      });
    }
  }

  // ===========================
  // INSTAGRAM - DISCONNECT
  // ===========================
  async disconnectInstagram(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'You must be logged in to disconnect Instagram'
        });
      }

      const { accountId } = req.params;

      // Verify account belongs to this user
      const account = await prisma.socialMediaAccount.findUnique({
        where: { id: accountId },
        include: { influencer: { include: { user: true } } },
      });

      if (!account) {
        return res.status(404).json({ 
          error: 'Account not found',
          message: 'The Instagram account does not exist'
        });
      }

      if (account.influencer.user.id !== userId) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You do not have permission to disconnect this Instagram account'
        });
      }

      // Disconnect Instagram account
      await apifyInstagramService.disconnectInstagramAccount(accountId);

      return res.status(200).json({
        success: true,
        message: 'Instagram account disconnected successfully'
      });

    } catch (error: any) {
      console.error('[SocialMediaController.disconnectInstagram] Error:', error);
      
      return res.status(500).json({ 
        error: 'Failed to disconnect Instagram',
        message: error.message || 'An unexpected error occurred while disconnecting Instagram'
      });
    }
  }

  // ===========================
  // TIKTOK - INITIATE OAUTH
  // ===========================
  async initiateTikTokAuth(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Generate state with userId for verification after callback
      const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
      
      const authUrl = tiktokService.getAuthorizationUrl(state);

      return res.status(200).json({
        message: 'Redirect user to this URL to connect TikTok',
        authUrl,
      });
    } catch (error: any) {
      console.error('[SocialMediaController.initiateTikTokAuth] Error:', error);
      return res.status(500).json({ error: 'Failed to initiate TikTok authentication' });
    }
  }

  // ===========================
  // TIKTOK - OAUTH CALLBACK
  // ===========================
  async tiktokCallback(req: Request, res: Response) {
    try {
      const { code, state } = req.query;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Authorization code is required' });
      }

      // Decode and verify state
      let stateData: { userId: string; timestamp: number };
      try {
        stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      } catch {
        return res.status(400).json({ error: 'Invalid state parameter' });
      }

      const { userId } = stateData;

      // Verify user exists and is an influencer
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { influencer: true },
      });

      if (!user || !user.influencer) {
        return res.status(404).json({ error: 'Influencer not found' });
      }

      // Exchange code for access token
      const authResponse = await tiktokService.exchangeCodeForToken(code);

      // Fetch user profile
      const profile = await tiktokService.getUserProfile(authResponse.access_token);

      // Encrypt tokens before storing
      const encryptedAccessToken = tiktokService.encryptToken(authResponse.access_token);
      const encryptedRefreshToken = authResponse.refresh_token
        ? tiktokService.encryptToken(authResponse.refresh_token)
        : null;

      // Calculate token expiration
      const tokenExpiresAt = new Date(Date.now() + authResponse.expires_in * 1000);

      // Check if account already exists
      const existingAccount = await prisma.socialMediaAccount.findUnique({
        where: {
          influencerId_platform: {
            influencerId: user.influencer.id,
            platform: SocialMediaPlatform.TIKTOK,
          },
        },
      });

      if (existingAccount) {
        // Update existing account
        await prisma.socialMediaAccount.update({
          where: { id: existingAccount.id },
          data: {
            platformUserId: profile.open_id,
            platformUsername: profile.display_name,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiresAt,
            isActive: true,
            lastSyncedAt: new Date(),
          },
        });
      } else {
        // Create new account
        await prisma.socialMediaAccount.create({
          data: {
            influencerId: user.influencer.id,
            platform: SocialMediaPlatform.TIKTOK,
            platformUserId: profile.open_id,
            platformUsername: profile.display_name,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiresAt,
            isActive: true,
            lastSyncedAt: new Date(),
          },
        });
      }

      // Trigger initial data sync in background (non-blocking)
      this.syncTikTokData(user.influencer.id).catch((err) => {
        console.error('[TikTokCallback] Background sync error:', err);
      });

      return res.status(200).json({
        message: 'TikTok account connected successfully',
        username: profile.display_name,
      });
    } catch (error: any) {
      console.error('[SocialMediaController.tiktokCallback] Error:', error);
      return res.status(500).json({ error: 'Failed to connect TikTok account' });
    }
  }

  // ===========================
  // GET CONNECTED ACCOUNTS
  // ===========================
  async getConnectedAccounts(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          influencer: {
            include: {
              socialMediaAccounts: {
                select: {
                  id: true,
                  platform: true,
                  platformUsername: true,
                  displayName: true,
                  profilePicture: true,
                  profileUrl: true,
                  followersCount: true,
                  followingCount: true,
                  postsCount: true,
                  engagementRate: true,
                  isActive: true,
                  lastSyncedAt: true,
                  metadata: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });

      if (!user || !user.influencer) {
        return res.status(404).json({ error: 'Influencer not found' });
      }

      // Format accounts for frontend
      const formattedAccounts = user.influencer.socialMediaAccounts.map(account => ({
        id: account.id,
        platform: account.platform,
        username: account.platformUsername,
        displayName: account.displayName || account.platformUsername,
        profilePicture: account.profilePicture || '',
        profileUrl: account.profileUrl || '',
        followersCount: account.followersCount || 0,
        followingCount: account.followingCount || 0,
        postsCount: account.postsCount || 0,
        engagementRate: account.engagementRate || 0,
        isActive: account.isActive,
        lastSynced: account.lastSyncedAt?.toISOString() || new Date().toISOString(),
        metadata: account.metadata,
      }));

      return res.status(200).json({
        accounts: formattedAccounts,
      });
    } catch (error: any) {
      console.error('[SocialMediaController.getConnectedAccounts] Error:', error);
      return res.status(500).json({ error: 'Failed to fetch connected accounts' });
    }
  }

  // ===========================
  // DISCONNECT ACCOUNT
  // ===========================
  async disconnectAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { platform } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!platform || !['INSTAGRAM', 'TIKTOK'].includes(platform)) {
        return res.status(400).json({ error: 'Invalid platform' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { influencer: true },
      });

      if (!user || !user.influencer) {
        return res.status(404).json({ error: 'Influencer not found' });
      }

      const account = await prisma.socialMediaAccount.findUnique({
        where: {
          influencerId_platform: {
            influencerId: user.influencer.id,
            platform: platform as SocialMediaPlatform,
          },
        },
      });

      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Delete account and all associated posts (cascade)
      await prisma.socialMediaAccount.delete({
        where: { id: account.id },
      });

      return res.status(200).json({
        message: `${platform} account disconnected successfully`,
      });
    } catch (error: any) {
      console.error('[SocialMediaController.disconnectAccount] Error:', error);
      return res.status(500).json({ error: 'Failed to disconnect account' });
    }
  }

  // Instagram sync now handled by Apify scraping service

  // ===========================
  // SYNC TIKTOK DATA (Background)
  // ===========================
  private async syncTikTokData(influencerId: string): Promise<void> {
    try {
      const account = await prisma.socialMediaAccount.findUnique({
        where: {
          influencerId_platform: {
            influencerId,
            platform: SocialMediaPlatform.TIKTOK,
          },
        },
      });

      if (!account || !account.isActive) return;

      // Decrypt token
      const accessToken = tiktokService.decryptToken(account.accessToken);

      // Fetch insights
      const insights = await tiktokService.getUserInsights(accessToken);

      // Fetch recent videos
      const videos = await tiktokService.getUserVideos(accessToken, 25);

      // Calculate engagement rate
      const engagementRate = tiktokService.calculateEngagementRate(videos, insights.followersCount);

      // Update account metrics
      await prisma.socialMediaAccount.update({
        where: { id: account.id },
        data: {
          followersCount: insights.followersCount,
          followingCount: insights.followingCount,
          postsCount: insights.videoCount,
          engagementRate,
          lastSyncedAt: new Date(),
        },
      });

      // Store videos
      for (const video of videos) {
        await prisma.socialMediaPost.upsert({
          where: {
            accountId_platformPostId: {
              accountId: account.id,
              platformPostId: video.id,
            },
          },
          create: {
            accountId: account.id,
            platformPostId: video.id,
            caption: video.video_description || video.title,
            mediaUrl: video.cover_image_url,
            mediaType: MediaType.VIDEO,
            likesCount: video.like_count || 0,
            commentsCount: video.comment_count || 0,
            sharesCount: video.share_count || 0,
            viewsCount: video.view_count,
            postedAt: new Date(video.create_time * 1000),
          },
          update: {
            likesCount: video.like_count || 0,
            commentsCount: video.comment_count || 0,
            sharesCount: video.share_count || 0,
            viewsCount: video.view_count,
          },
        });
      }

      console.log(`[SyncTikTok] Successfully synced data for influencer ${influencerId}`);
    } catch (error) {
      console.error('[SyncTikTok] Error:', error);
      throw error;
    }
  }

  // ===========================
  // MANUAL SYNC TRIGGER
  // ===========================
  async syncAccount(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { platform } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!platform || !['INSTAGRAM', 'TIKTOK'].includes(platform)) {
        return res.status(400).json({ error: 'Invalid platform' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { influencer: true },
      });

      if (!user || !user.influencer) {
        return res.status(404).json({ error: 'Influencer not found' });
      }

      // Trigger sync based on platform
      if (platform === 'INSTAGRAM') {
        // Instagram now uses Apify scraping service
        // Sync handled through dedicated syncInstagram endpoint
        return res.status(400).json({ 
          error: 'Please use the dedicated Instagram sync endpoint',
          message: 'Instagram syncing is now handled separately'
        });
      } else if (platform === 'TIKTOK') {
        await this.syncTikTokData(user.influencer.id);
      }

      return res.status(200).json({
        message: `${platform} data synced successfully`,
      });
    } catch (error: any) {
      console.error('[SocialMediaController.syncAccount] Error:', error);
      return res.status(500).json({ error: 'Failed to sync account data' });
    }
  }

  // ===========================
  // HELPER: Map Instagram Media Type
  // ===========================
  private mapInstagramMediaType(type: string): MediaType {
    switch (type) {
      case 'IMAGE':
        return MediaType.IMAGE;
      case 'VIDEO':
        return MediaType.VIDEO;
      case 'CAROUSEL_ALBUM':
        return MediaType.CAROUSEL;
      default:
        return MediaType.IMAGE;
    }
  }
}

export default new SocialMediaController();
