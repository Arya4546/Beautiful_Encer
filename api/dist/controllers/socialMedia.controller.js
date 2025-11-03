import { prisma } from '../lib/prisma.js';
import { SocialMediaPlatform, MediaType } from '@prisma/client';
import apifyInstagramService from '../services/apify.instagram.service.js';
import tiktokService from '../services/tiktok.service.js';
import apifyTikTokService from '../services/apify.tiktok.service.js';
import apifyYouTubeService from '../services/apify.youtube.service.js';
import apifyTwitterService from '../services/apify.twitter.service.js';
/**
 * Social Media Account Linking Controller
 * Handles Instagram (via Apify scraping) and TikTok account connections for influencers
 */
class SocialMediaController {
    // ===========================
    // TIKTOK - PUBLIC (APIFY) CONNECT/SYNC (DB)
    // ===========================
    async connectPublicTikTok(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'You must be logged in to connect a TikTok account'
                });
            }
            const { username } = req.body;
            if (!username || typeof username !== 'string' || username.trim() === '') {
                return res.status(400).json({
                    error: 'Invalid username',
                    message: 'Please provide a valid TikTok username'
                });
            }
            // Connect TikTok account using Apify scraping
            const result = await apifyTikTokService.connectTikTokAccount(userId, username);
            return res.status(200).json(result);
        }
        catch (error) {
            console.error('[SocialMediaController.connectPublicTikTok] Error:', error);
            // Handle specific error cases
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    error: 'TikTok account not found',
                    message: 'The TikTok username you provided does not exist or is private'
                });
            }
            if (error.message.includes('influencer')) {
                return res.status(403).json({
                    error: 'Not an influencer',
                    message: 'Only influencer accounts can connect TikTok'
                });
            }
            return res.status(500).json({
                error: 'Failed to connect TikTok',
                message: error.message || 'An unexpected error occurred while connecting your TikTok account'
            });
        }
    }
    async syncPublicTikTok(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'You must be logged in to sync TikTok data'
                });
            }
            const { accountId } = req.body;
            if (!accountId) {
                return res.status(400).json({
                    error: 'Missing account ID',
                    message: 'Please provide the TikTok account ID to sync'
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
                    message: 'The TikTok account you are trying to sync does not exist'
                });
            }
            if (account.influencer.user.id !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have permission to sync this TikTok account'
                });
            }
            // Sync TikTok data
            const result = await apifyTikTokService.syncTikTokData(accountId);
            return res.status(200).json(result);
        }
        catch (error) {
            console.error('[SocialMediaController.syncPublicTikTok] Error:', error);
            return res.status(500).json({
                error: 'Failed to sync TikTok data',
                message: error.message || 'An unexpected error occurred while syncing your TikTok data'
            });
        }
    }
    async getPublicTikTokData(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'You must be logged in to view TikTok data'
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
                    message: 'The TikTok account does not exist'
                });
            }
            if (account.influencer.user.id !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have permission to view this TikTok account'
                });
            }
            // Get TikTok data (from cache or fresh scrape)
            const result = await apifyTikTokService.getTikTokData(accountId);
            return res.status(200).json(result);
        }
        catch (error) {
            console.error('[SocialMediaController.getPublicTikTokData] Error:', error);
            return res.status(500).json({
                error: 'Failed to get TikTok data',
                message: error.message || 'An unexpected error occurred while fetching TikTok data'
            });
        }
    }
    async disconnectPublicTikTok(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'You must be logged in to disconnect TikTok'
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
                    message: 'The TikTok account does not exist'
                });
            }
            if (account.influencer.user.id !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have permission to disconnect this TikTok account'
                });
            }
            // Disconnect TikTok account
            await apifyTikTokService.disconnectTikTokAccount(accountId);
            return res.status(200).json({
                success: true,
                message: 'TikTok account disconnected successfully'
            });
        }
        catch (error) {
            console.error('[SocialMediaController.disconnectPublicTikTok] Error:', error);
            return res.status(500).json({
                error: 'Failed to disconnect TikTok',
                message: error.message || 'An unexpected error occurred while disconnecting TikTok'
            });
        }
    }
    // ===========================
    // TIKTOK - PUBLIC (APIFY) ENDPOINTS
    // ===========================
    async getPublicTikTokProfile(req, res) {
        try {
            const { username } = req.params;
            if (!username) {
                return res.status(400).json({ error: 'Username is required' });
            }
            const data = await apifyTikTokService.scrape(username);
            return res.status(200).json({
                success: true,
                data: {
                    profile: {
                        username: data.profile.username,
                        displayName: data.profile.displayName,
                        avatarUrl: data.profile.avatarUrl,
                        followersCount: data.profile.followersCount,
                        followingCount: data.profile.followingCount,
                        likesCount: data.profile.likesCount,
                        videoCount: data.profile.videoCount,
                        isVerified: data.profile.isVerified,
                        bioDescription: data.profile.bioDescription,
                    },
                    engagementRate: data.engagementRate,
                    topHashtags: data.topHashtags,
                    lastScraped: data.lastScraped,
                    videosCount: data.videos.length,
                },
            });
        }
        catch (error) {
            console.error('[SocialMediaController.getPublicTikTokProfile] Error:', error);
            const notFound = error?.message?.includes('No TikTok data') || error?.message?.toLowerCase?.().includes('not found');
            const msg = notFound
                ? 'TikTok profile not found or unavailable'
                : (error.message || 'Failed to fetch TikTok profile');
            return res.status(notFound ? 404 : 500).json({ error: msg });
        }
    }
    async getPublicTikTokVideos(req, res) {
        try {
            const { username } = req.params;
            if (!username) {
                return res.status(400).json({ error: 'Username is required' });
            }
            const data = await apifyTikTokService.scrape(username);
            return res.status(200).json({
                success: true,
                data: {
                    videos: data.videos.map(v => ({
                        id: v.id,
                        createTime: v.createTime,
                        coverImageUrl: v.coverImageUrl,
                        shareUrl: v.shareUrl,
                        videoDescription: v.videoDescription,
                        duration: v.duration,
                        likesCount: v.likesCount,
                        commentsCount: v.commentsCount,
                        sharesCount: v.sharesCount,
                        viewsCount: v.viewsCount,
                    })),
                    profile: {
                        username: data.profile.username,
                        followersCount: data.profile.followersCount,
                    },
                    engagementRate: data.engagementRate,
                    topHashtags: data.topHashtags,
                },
            });
        }
        catch (error) {
            console.error('[SocialMediaController.getPublicTikTokVideos] Error:', error);
            const notFound = error?.message?.includes('No TikTok data') || error?.message?.toLowerCase?.().includes('not found');
            const msg = notFound
                ? 'TikTok videos not found or unavailable'
                : (error.message || 'Failed to fetch TikTok videos');
            return res.status(notFound ? 404 : 500).json({ error: msg });
        }
    }
    // ===========================
    // INSTAGRAM - CONNECT VIA USERNAME (APIFY SCRAPING)
    // ===========================
    async connectInstagram(req, res) {
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
        }
        catch (error) {
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
    async syncInstagram(req, res) {
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
        }
        catch (error) {
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
    async getInstagramData(req, res) {
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
        }
        catch (error) {
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
    async disconnectInstagram(req, res) {
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
        }
        catch (error) {
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
    async initiateTikTokAuth(req, res) {
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
        }
        catch (error) {
            console.error('[SocialMediaController.initiateTikTokAuth] Error:', error);
            return res.status(500).json({ error: 'Failed to initiate TikTok authentication' });
        }
    }
    // ===========================
    // TIKTOK - OAUTH CALLBACK
    // ===========================
    async tiktokCallback(req, res) {
        try {
            const { code, state } = req.query;
            if (!code || typeof code !== 'string') {
                return res.status(400).json({ error: 'Authorization code is required' });
            }
            // Decode and verify state
            let stateData;
            try {
                stateData = JSON.parse(Buffer.from(state, 'base64').toString());
            }
            catch {
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
            }
            else {
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
        }
        catch (error) {
            console.error('[SocialMediaController.tiktokCallback] Error:', error);
            return res.status(500).json({ error: 'Failed to connect TikTok account' });
        }
    }
    // ===========================
    // GET CONNECTED ACCOUNTS
    // ===========================
    async getConnectedAccounts(req, res) {
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
        }
        catch (error) {
            console.error('[SocialMediaController.getConnectedAccounts] Error:', error);
            return res.status(500).json({ error: 'Failed to fetch connected accounts' });
        }
    }
    // ===========================
    // DISCONNECT ACCOUNT
    // ===========================
    async disconnectAccount(req, res) {
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
                        platform: platform,
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
        }
        catch (error) {
            console.error('[SocialMediaController.disconnectAccount] Error:', error);
            return res.status(500).json({ error: 'Failed to disconnect account' });
        }
    }
    // Instagram sync now handled by Apify scraping service
    // ===========================
    // SYNC TIKTOK DATA (Background)
    // ===========================
    async syncTikTokData(influencerId) {
        try {
            const account = await prisma.socialMediaAccount.findUnique({
                where: {
                    influencerId_platform: {
                        influencerId,
                        platform: SocialMediaPlatform.TIKTOK,
                    },
                },
            });
            if (!account || !account.isActive)
                return;
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
        }
        catch (error) {
            console.error('[SyncTikTok] Error:', error);
            throw error;
        }
    }
    // ===========================
    // MANUAL SYNC TRIGGER
    // ===========================
    async syncAccount(req, res) {
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
            }
            else if (platform === 'TIKTOK') {
                await this.syncTikTokData(user.influencer.id);
            }
            return res.status(200).json({
                message: `${platform} data synced successfully`,
            });
        }
        catch (error) {
            console.error('[SocialMediaController.syncAccount] Error:', error);
            return res.status(500).json({ error: 'Failed to sync account data' });
        }
    }
    // ===========================
    // HELPER: Map Instagram Media Type
    // ===========================
    mapInstagramMediaType(type) {
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
    // ===========================
    // YOUTUBE - CONNECT VIA CHANNEL HANDLE (APIFY SCRAPING)
    // ===========================
    async connectYouTube(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'You must be logged in to connect a YouTube channel'
                });
            }
            const { channelHandle } = req.body;
            if (!channelHandle || typeof channelHandle !== 'string' || channelHandle.trim() === '') {
                return res.status(400).json({
                    error: 'Invalid channel handle',
                    message: 'Please provide a valid YouTube channel handle (e.g., @username)'
                });
            }
            // Remove @ if present
            const cleanHandle = channelHandle.startsWith('@') ? channelHandle.slice(1) : channelHandle;
            // Connect YouTube channel using Apify scraping
            const result = await apifyYouTubeService.connectYouTubeAccount(userId, cleanHandle);
            return res.status(200).json({
                success: true,
                message: 'YouTube channel connected successfully',
                data: result
            });
        }
        catch (error) {
            console.error('[SocialMediaController.connectYouTube] Error:', error);
            // Handle specific error cases
            if (error.message.includes('not found') || error.message.includes('No data')) {
                return res.status(404).json({
                    error: 'YouTube channel not found',
                    message: 'The YouTube channel handle you provided does not exist or is private'
                });
            }
            if (error.message.includes('already connected')) {
                return res.status(409).json({
                    error: 'Channel already connected',
                    message: 'This YouTube channel is already connected to your account'
                });
            }
            if (error.message.includes('influencer')) {
                return res.status(403).json({
                    error: 'Not an influencer',
                    message: 'Only influencer accounts can connect YouTube channels'
                });
            }
            return res.status(500).json({
                error: 'Failed to connect YouTube',
                message: error.message || 'An unexpected error occurred while connecting your YouTube channel'
            });
        }
    }
    // ===========================
    // YOUTUBE - SYNC DATA
    // ===========================
    async syncYouTube(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'You must be logged in to sync YouTube data'
                });
            }
            const { accountId } = req.body;
            if (!accountId) {
                return res.status(400).json({
                    error: 'Missing account ID',
                    message: 'Please provide the YouTube account ID to sync'
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
                    message: 'The YouTube account you are trying to sync does not exist'
                });
            }
            if (account.platform !== SocialMediaPlatform.YOUTUBE) {
                return res.status(400).json({
                    error: 'Invalid platform',
                    message: 'This account is not a YouTube account'
                });
            }
            if (account.influencer.user.id !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have permission to sync this YouTube account'
                });
            }
            // Sync YouTube data
            const result = await apifyYouTubeService.syncYouTubeData(accountId);
            return res.status(200).json({
                success: true,
                message: 'YouTube data synced successfully',
                data: result
            });
        }
        catch (error) {
            console.error('[SocialMediaController.syncYouTube] Error:', error);
            return res.status(500).json({
                error: 'Failed to sync YouTube data',
                message: error.message || 'An unexpected error occurred while syncing your YouTube data'
            });
        }
    }
    // ===========================
    // YOUTUBE - GET DATA
    // ===========================
    async getYouTubeData(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'You must be logged in to view YouTube data'
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
                    message: 'The YouTube account does not exist'
                });
            }
            if (account.platform !== SocialMediaPlatform.YOUTUBE) {
                return res.status(400).json({
                    error: 'Invalid platform',
                    message: 'This account is not a YouTube account'
                });
            }
            if (account.influencer.user.id !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have permission to view this YouTube account'
                });
            }
            // Get YouTube data
            const result = await apifyYouTubeService.getYouTubeData(accountId);
            return res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('[SocialMediaController.getYouTubeData] Error:', error);
            return res.status(500).json({
                error: 'Failed to get YouTube data',
                message: error.message || 'An unexpected error occurred while fetching YouTube data'
            });
        }
    }
    // ===========================
    // YOUTUBE - DISCONNECT
    // ===========================
    async disconnectYouTube(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'You must be logged in to disconnect YouTube'
                });
            }
            const { accountId } = req.params;
            // Disconnect YouTube channel
            await apifyYouTubeService.disconnectYouTubeAccount(accountId, userId);
            return res.status(200).json({
                success: true,
                message: 'YouTube channel disconnected successfully'
            });
        }
        catch (error) {
            console.error('[SocialMediaController.disconnectYouTube] Error:', error);
            if (error.message.includes('not found') || error.message.includes('access denied')) {
                return res.status(404).json({
                    error: 'Account not found',
                    message: 'The YouTube account does not exist or you do not have permission to disconnect it'
                });
            }
            return res.status(500).json({
                error: 'Failed to disconnect YouTube',
                message: error.message || 'An unexpected error occurred while disconnecting YouTube'
            });
        }
    }
    // ===========================
    // TWITTER/X - CONNECT
    // ===========================
    async connectTwitter(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'You must be logged in to connect a Twitter account'
                });
            }
            const { username } = req.body;
            if (!username || typeof username !== 'string' || username.trim() === '') {
                return res.status(400).json({
                    error: 'Invalid username',
                    message: 'Please provide a valid Twitter username (with or without @)'
                });
            }
            // Connect Twitter account using Apify scraping
            const result = await apifyTwitterService.connectTwitterAccount(userId, username);
            return res.status(200).json({
                success: true,
                message: 'Twitter account connected successfully',
                ...result,
            });
        }
        catch (error) {
            console.error('[SocialMediaController.connectTwitter] Error:', error);
            // Handle specific error cases
            if (error.message.includes('not found') || error.message.includes('No data found')) {
                return res.status(404).json({
                    error: 'Twitter account not found',
                    message: 'The Twitter/X username you provided does not exist or is private'
                });
            }
            if (error.message.includes('Only influencers')) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Only influencers can connect social media accounts'
                });
            }
            if (error.message.includes('No space left')) {
                return res.status(507).json({
                    error: 'Storage full',
                    message: 'Account connected but tweets could not be stored. Please contact support.'
                });
            }
            return res.status(500).json({
                error: 'Failed to connect Twitter',
                message: error.message || 'An unexpected error occurred while connecting Twitter'
            });
        }
    }
    // ===========================
    // TWITTER/X - SYNC
    // ===========================
    async syncTwitter(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'You must be logged in to sync Twitter data'
                });
            }
            const { accountId } = req.params;
            // Sync Twitter data
            const result = await apifyTwitterService.syncTwitterData(accountId);
            return res.status(200).json({
                success: true,
                message: result.message || 'Twitter data synchronized successfully',
                ...result,
            });
        }
        catch (error) {
            console.error('[SocialMediaController.syncTwitter] Error:', error);
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    error: 'Account not found',
                    message: 'The Twitter account does not exist'
                });
            }
            if (error.message.includes('No space left')) {
                return res.status(507).json({
                    error: 'Storage full',
                    message: 'Data synced but tweets could not be stored. Please contact support.'
                });
            }
            return res.status(500).json({
                error: 'Failed to sync Twitter',
                message: error.message || 'An unexpected error occurred while syncing Twitter'
            });
        }
    }
    // ===========================
    // TWITTER/X - GET DATA
    // ===========================
    async getTwitterData(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'You must be logged in to view Twitter data'
                });
            }
            const { accountId } = req.params;
            // Get Twitter account data with tweets
            const result = await apifyTwitterService.getTwitterData(accountId);
            return res.status(200).json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            console.error('[SocialMediaController.getTwitterData] Error:', error);
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    error: 'Account not found',
                    message: 'The Twitter account does not exist'
                });
            }
            return res.status(500).json({
                error: 'Failed to get Twitter data',
                message: error.message || 'An unexpected error occurred while retrieving Twitter data'
            });
        }
    }
    // ===========================
    // TWITTER/X - DISCONNECT
    // ===========================
    async disconnectTwitter(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'You must be logged in to disconnect Twitter'
                });
            }
            const { accountId } = req.params;
            // Disconnect Twitter account
            await apifyTwitterService.disconnectTwitterAccount(accountId, userId);
            return res.status(200).json({
                success: true,
                message: 'Twitter account disconnected successfully'
            });
        }
        catch (error) {
            console.error('[SocialMediaController.disconnectTwitter] Error:', error);
            if (error.message.includes('not found') || error.message.includes('access denied')) {
                return res.status(404).json({
                    error: 'Account not found',
                    message: 'The Twitter account does not exist or you do not have permission to disconnect it'
                });
            }
            return res.status(500).json({
                error: 'Failed to disconnect Twitter',
                message: error.message || 'An unexpected error occurred while disconnecting Twitter'
            });
        }
    }
}
export default new SocialMediaController();
