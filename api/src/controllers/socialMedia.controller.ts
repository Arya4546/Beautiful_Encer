import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { SocialMediaPlatform, MediaType } from '@prisma/client';
import instagramService from '../services/instagram.service.js';
import tiktokService from '../services/tiktok.service.js';

/**
 * Social Media Account Linking Controller
 * Handles Instagram and TikTok account connections for influencers
 */

class SocialMediaController {
  // ===========================
  // INSTAGRAM - INITIATE OAUTH
  // ===========================
  async initiateInstagramAuth(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Generate state with userId for verification after callback
      const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
      
      const authUrl = instagramService.getAuthorizationUrl(state);

      return res.status(200).json({
        message: 'Redirect user to this URL to connect Instagram',
        authUrl,
      });
    } catch (error: any) {
      console.error('[SocialMediaController.initiateInstagramAuth] Error:', error);
      return res.status(500).json({ error: 'Failed to initiate Instagram authentication' });
    }
  }

  // ===========================
  // INSTAGRAM - OAUTH CALLBACK
  // ===========================
  async instagramCallback(req: Request, res: Response) {
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
      const authResponse = await instagramService.exchangeCodeForToken(code);

      // Get long-lived token (60 days validity)
      const longLivedToken = await instagramService.getLongLivedToken(authResponse.access_token);

      // Fetch user profile
      const profile = await instagramService.getUserProfile(longLivedToken.access_token);

      // Encrypt tokens before storing
      const encryptedAccessToken = instagramService.encryptToken(longLivedToken.access_token);

      // Calculate token expiration
      const tokenExpiresAt = new Date(Date.now() + longLivedToken.expires_in * 1000);

      // Check if account already exists
      const existingAccount = await prisma.socialMediaAccount.findUnique({
        where: {
          influencerId_platform: {
            influencerId: user.influencer.id,
            platform: SocialMediaPlatform.INSTAGRAM,
          },
        },
      });

      if (existingAccount) {
        // Update existing account
        await prisma.socialMediaAccount.update({
          where: { id: existingAccount.id },
          data: {
            platformUserId: profile.id,
            platformUsername: profile.username,
            accessToken: encryptedAccessToken,
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
            platform: SocialMediaPlatform.INSTAGRAM,
            platformUserId: profile.id,
            platformUsername: profile.username,
            accessToken: encryptedAccessToken,
            tokenExpiresAt,
            isActive: true,
            lastSyncedAt: new Date(),
          },
        });
      }

      // Trigger initial data sync in background (non-blocking)
      this.syncInstagramData(user.influencer.id).catch((err) => {
        console.error('[InstagramCallback] Background sync error:', err);
      });

      return res.status(200).json({
        message: 'Instagram account connected successfully',
        username: profile.username,
      });
    } catch (error: any) {
      console.error('[SocialMediaController.instagramCallback] Error:', error);
      return res.status(500).json({ error: 'Failed to connect Instagram account' });
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
                  followersCount: true,
                  followingCount: true,
                  postsCount: true,
                  engagementRate: true,
                  isActive: true,
                  lastSyncedAt: true,
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

      return res.status(200).json({
        accounts: user.influencer.socialMediaAccounts,
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

  // ===========================
  // SYNC INSTAGRAM DATA (Background)
  // ===========================
  private async syncInstagramData(influencerId: string): Promise<void> {
    try {
      const account = await prisma.socialMediaAccount.findUnique({
        where: {
          influencerId_platform: {
            influencerId,
            platform: SocialMediaPlatform.INSTAGRAM,
          },
        },
      });

      if (!account || !account.isActive) return;

      // Decrypt token
      const accessToken = instagramService.decryptToken(account.accessToken);

      // Fetch insights
      const insights = await instagramService.getUserInsights(account.platformUserId, accessToken);

      // Fetch recent posts
      const posts = await instagramService.getUserMedia(accessToken, 25);

      // Calculate engagement rate
      const engagementRate = instagramService.calculateEngagementRate(posts, insights.followersCount);

      // Update account metrics
      await prisma.socialMediaAccount.update({
        where: { id: account.id },
        data: {
          followersCount: insights.followersCount,
          followingCount: insights.followingCount,
          postsCount: insights.mediaCount,
          engagementRate,
          lastSyncedAt: new Date(),
        },
      });

      // Store posts
      for (const post of posts) {
        await prisma.socialMediaPost.upsert({
          where: {
            accountId_platformPostId: {
              accountId: account.id,
              platformPostId: post.id,
            },
          },
          create: {
            accountId: account.id,
            platformPostId: post.id,
            caption: post.caption,
            mediaUrl: post.media_url,
            mediaType: this.mapInstagramMediaType(post.media_type),
            likesCount: post.like_count || 0,
            commentsCount: post.comments_count || 0,
            postedAt: new Date(post.timestamp),
          },
          update: {
            likesCount: post.like_count || 0,
            commentsCount: post.comments_count || 0,
          },
        });
      }

      console.log(`[SyncInstagram] Successfully synced data for influencer ${influencerId}`);
    } catch (error) {
      console.error('[SyncInstagram] Error:', error);
      throw error;
    }
  }

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
        await this.syncInstagramData(user.influencer.id);
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
