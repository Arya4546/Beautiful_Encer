import { ApifyClient } from 'apify-client';
import { prisma } from '../lib/prisma.js';
import { SocialMediaPlatform, MediaType } from '@prisma/client';
class ApifyTikTokService {
    constructor() {
        this.CACHE_DURATION_DAYS = 7; // Cache data for 7 days (same as Instagram)
        const apiToken = process.env.APIFY_API_TOKEN;
        this.actorId = process.env.APIFY_TIKTOK_ACTOR_ID || 'clockworks/tiktok-scraper';
        if (!apiToken) {
            throw new Error('APIFY_API_TOKEN is required in environment variables');
        }
        this.client = new ApifyClient({
            token: apiToken,
        });
        console.log('[ApifyTikTokService] Initialized with actor:', this.actorId);
    }
    /**
     * Check if cached data is still valid
     */
    isCacheValid(lastScraped) {
        if (!lastScraped)
            return false;
        const now = new Date();
        const diffDays = (now.getTime() - lastScraped.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays < this.CACHE_DURATION_DAYS;
    }
    /**
     * Calculate engagement rate from videos
     */
    calculateEngagementRate(videos, followersCount) {
        if (!videos || videos.length === 0 || followersCount === 0)
            return 0;
        const totalEngagement = videos.reduce((sum, video) => {
            return sum + (video.likesCount || 0) + (video.commentsCount || 0) + (video.sharesCount || 0);
        }, 0);
        const avgEngagement = totalEngagement / videos.length;
        return (avgEngagement / followersCount) * 100;
    }
    /**
     * Extract top hashtags from videos
     */
    extractTopHashtags(videos) {
        const hashtagMap = new Map();
        videos.forEach(video => {
            if (video.videoDescription) {
                // Extract hashtags using regex (supports Unicode)
                const hashtags = video.videoDescription.match(/#[\w\u0590-\u05ff\u4e00-\u9fff]+/g);
                if (hashtags) {
                    hashtags.forEach(tag => {
                        // Remove # and convert to lowercase
                        const cleanTag = tag.substring(1).toLowerCase();
                        hashtagMap.set(cleanTag, (hashtagMap.get(cleanTag) || 0) + 1);
                    });
                }
            }
        });
        // Sort by frequency and return top 10
        return Array.from(hashtagMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag]) => tag);
    }
    /**
     * Normalize Apify response data to consistent format
     */
    normalizeProfileData(rawData) {
        if (!rawData)
            return null;
        // Try multiple possible username fields
        const username = rawData.name || rawData.uniqueId || rawData.username || rawData.handle || rawData.id;
        if (!username) {
            console.log(`[ApifyTikTokService] No username found in data:`, Object.keys(rawData));
            return null;
        }
        // Map authorMeta fields (clockworks/tiktok-scraper format)
        const profile = {
            username: username,
            displayName: rawData.nickName || rawData.nickname || rawData.display_name || rawData.displayName || username,
            avatarUrl: rawData.avatar || rawData.originalAvatarUrl || rawData.avatarLarger || rawData.avatarThumb || rawData.avatar_url || rawData.avatarMedium || rawData.profilePicture || '',
            followersCount: rawData.fans ?? rawData.followerCount ?? rawData.follower_count ?? rawData.followers ?? 0,
            followingCount: rawData.following ?? rawData.followingCount ?? rawData.following_count ?? rawData.friend ?? 0,
            likesCount: rawData.heart ?? rawData.heartCount ?? rawData.heart_count ?? rawData.likes ?? rawData.diggCount ?? 0,
            videoCount: rawData.video ?? rawData.videoCount ?? rawData.video_count ?? rawData.videos ?? 0,
            isVerified: rawData.verified ?? rawData.is_verified ?? false,
            bioDescription: rawData.signature || rawData.bio_description || rawData.bio || '',
            profileUrl: rawData.profileUrl || `https://www.tiktok.com/@${username}`,
        };
        console.log(`[ApifyTikTokService] Normalized profile:`, {
            username: profile.username,
            displayName: profile.displayName,
            followers: profile.followersCount,
            videos: profile.videoCount,
            verified: profile.isVerified,
        });
        return profile;
    }
    /**
     * Normalize video data to consistent format
     */
    normalizeVideoData(rawVideo) {
        if (!rawVideo)
            return null;
        const videoId = rawVideo.id || rawVideo.video_id || rawVideo.videoId || rawVideo.aweme_id;
        if (!videoId) {
            console.log(`[ApifyTikTokService] No video ID found in:`, Object.keys(rawVideo));
            return null;
        }
        return {
            id: String(videoId),
            createTime: rawVideo.createTime || rawVideo.create_time || rawVideo.timestamp || rawVideo.createTimeISO || Math.floor(Date.now() / 1000),
            coverImageUrl: rawVideo.videoMeta?.coverUrl || rawVideo.videoMeta?.originalCoverUrl || rawVideo.coverUrl || rawVideo.cover_image_url || rawVideo.cover || rawVideo.thumbnail_url || rawVideo.video?.cover || '',
            shareUrl: rawVideo.webVideoUrl || rawVideo.share_url || rawVideo.url || rawVideo.pageUrl || rawVideo.videoUrl || `https://www.tiktok.com/@user/video/${videoId}`,
            videoDescription: rawVideo.text || rawVideo.video_description || rawVideo.description || rawVideo.caption || rawVideo.desc || '',
            duration: rawVideo.videoMeta?.duration || rawVideo.duration || rawVideo.video?.duration || 0,
            likesCount: rawVideo.diggCount ?? rawVideo.like_count ?? rawVideo.stats?.diggCount ?? rawVideo.likes ?? rawVideo.statistics?.diggCount ?? 0,
            commentsCount: rawVideo.commentCount ?? rawVideo.comment_count ?? rawVideo.stats?.commentCount ?? rawVideo.comments ?? rawVideo.statistics?.commentCount ?? 0,
            sharesCount: rawVideo.shareCount ?? rawVideo.share_count ?? rawVideo.stats?.shareCount ?? rawVideo.shares ?? rawVideo.statistics?.shareCount ?? 0,
            viewsCount: rawVideo.playCount ?? rawVideo.view_count ?? rawVideo.stats?.playCount ?? rawVideo.views ?? rawVideo.statistics?.playCount ?? 0,
        };
    }
    /**
     * Scrape TikTok profile data using Apify
     * @param username - TikTok username to scrape (with or without @)
     * @returns Scraped TikTok profile data
     */
    async scrapeTikTokProfile(username) {
        try {
            // Remove @ if user included it
            const cleanUsername = username.replace('@', '').trim();
            if (!cleanUsername) {
                throw new Error('TikTok username is required');
            }
            console.log(`[ApifyTikTokService] Starting scrape for @${cleanUsername}`);
            // Run the Apify actor
            const run = await this.client.actor(this.actorId).call({
                profiles: [`https://www.tiktok.com/@${cleanUsername}`],
                resultsPerPage: 24, // Get last 24 videos
                shouldDownloadVideos: false,
                shouldDownloadCovers: false,
                shouldDownloadSubtitles: false,
            });
            console.log(`[ApifyTikTokService] Actor run completed:`, run.id);
            // Fetch results from dataset
            const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
            if (!items || items.length === 0) {
                throw new Error(`No data found for username: ${cleanUsername}`);
            }
            // The first item usually contains profile data
            const profileData = items[0];
            console.log(`[ApifyTikTokService] Raw Apify data for @${cleanUsername}:`, JSON.stringify(profileData, null, 2));
            // Check if this is a video object with authorMeta (clockworks/tiktok-scraper format)
            let authorData = profileData;
            if (profileData.authorMeta) {
                console.log(`[ApifyTikTokService] Found authorMeta, extracting profile from there`);
                authorData = profileData.authorMeta;
            }
            else if (profileData.author) {
                console.log(`[ApifyTikTokService] Found author, extracting profile from there`);
                authorData = profileData.author;
            }
            // Check if account is private
            if (authorData.privateAccount || authorData.private) {
                throw new Error(`TikTok account @${cleanUsername} is private. Only public accounts can be connected.`);
            }
            // Normalize profile data from authorData
            const profile = this.normalizeProfileData(authorData);
            if (!profile) {
                console.error(`[ApifyTikTokService] Failed to extract profile. Available keys:`, Object.keys(authorData));
                throw new Error(`Failed to parse profile data for @${cleanUsername}. The data structure may have changed.`);
            }
            // Validate that we got actual data
            if (profile.followersCount === 0 && profile.videoCount === 0) {
                throw new Error(`Unable to fetch data for @${cleanUsername}. The account may not exist, be private, or be temporarily unavailable.`);
            }
            // Extract videos from the response
            const recentVideos = [];
            // For clockworks/tiktok-scraper, all items are videos
            console.log(`[ApifyTikTokService] Processing ${items.length} items from dataset`);
            for (const item of items) {
                const normalizedVideo = this.normalizeVideoData(item);
                if (normalizedVideo) {
                    recentVideos.push(normalizedVideo);
                }
            }
            console.log(`[ApifyTikTokService] Extracted ${recentVideos.length} videos`);
            // Calculate metrics
            const followersCount = profile.followersCount;
            const engagementRate = this.calculateEngagementRate(recentVideos, followersCount);
            const totalLikes = recentVideos.reduce((sum, video) => sum + video.likesCount, 0);
            const totalComments = recentVideos.reduce((sum, video) => sum + video.commentsCount, 0);
            const totalShares = recentVideos.reduce((sum, video) => sum + video.sharesCount, 0);
            const totalViews = recentVideos.reduce((sum, video) => sum + video.viewsCount, 0);
            const averageLikes = recentVideos.length > 0 ? Math.round(totalLikes / recentVideos.length) : 0;
            const averageComments = recentVideos.length > 0 ? Math.round(totalComments / recentVideos.length) : 0;
            const averageShares = recentVideos.length > 0 ? Math.round(totalShares / recentVideos.length) : 0;
            const averageViews = recentVideos.length > 0 ? Math.round(totalViews / recentVideos.length) : 0;
            // Extract top hashtags
            const topHashtags = this.extractTopHashtags(recentVideos);
            const scrapedData = {
                username: profile.username,
                displayName: profile.displayName,
                bioDescription: profile.bioDescription,
                followersCount,
                followingCount: profile.followingCount,
                likesCount: profile.likesCount,
                videoCount: profile.videoCount,
                isVerified: profile.isVerified,
                avatarUrl: profile.avatarUrl,
                profileUrl: profile.profileUrl,
                engagementRate: Number(engagementRate.toFixed(2)),
                averageLikes,
                averageComments,
                averageShares,
                averageViews,
                recentVideos,
                topHashtags,
                lastScraped: new Date(),
            };
            console.log(`[ApifyTikTokService] Successfully scraped @${cleanUsername}:`, {
                followers: scrapedData.followersCount,
                following: scrapedData.followingCount,
                videos: scrapedData.videoCount,
                engagementRate: scrapedData.engagementRate,
                videosScraped: recentVideos.length,
            });
            return scrapedData;
        }
        catch (error) {
            console.error(`[ApifyTikTokService] Error scraping @${username}:`, error.message);
            throw new Error(`Failed to scrape TikTok profile: ${error.message}`);
        }
    }
    /**
     * Connect TikTok account using username (no OAuth required)
     * @param userId - User ID from database
     * @param username - TikTok username
     */
    async connectTikTokAccount(userId, username) {
        try {
            // Remove @ if user included it
            const cleanUsername = username.replace('@', '').trim();
            if (!cleanUsername) {
                throw new Error('TikTok username is required');
            }
            console.log(`[ApifyTikTokService] Connecting TikTok @${cleanUsername} for user ${userId}`);
            // Scrape TikTok profile
            const profileData = await this.scrapeTikTokProfile(cleanUsername);
            // Extract top hashtags from videos
            const topHashtags = this.extractTopHashtags(profileData.recentVideos);
            // Find user and their influencer profile
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { influencer: true },
            });
            if (!user) {
                throw new Error('User not found');
            }
            if (!user.influencer) {
                throw new Error('User must be an influencer to connect TikTok');
            }
            // Check if TikTok account already exists
            let socialAccount = await prisma.socialMediaAccount.findFirst({
                where: {
                    influencerId: user.influencer.id,
                    platform: SocialMediaPlatform.TIKTOK,
                },
            });
            if (socialAccount) {
                // Update existing account
                socialAccount = await prisma.socialMediaAccount.update({
                    where: { id: socialAccount.id },
                    data: {
                        platformUserId: profileData.username,
                        platformUsername: profileData.username,
                        displayName: profileData.displayName,
                        profileUrl: profileData.profileUrl,
                        profilePicture: profileData.avatarUrl,
                        followersCount: profileData.followersCount,
                        followingCount: profileData.followingCount,
                        postsCount: profileData.videoCount,
                        engagementRate: profileData.engagementRate,
                        isActive: true,
                        accessToken: '', // No token needed for scraping
                        lastSyncedAt: new Date(),
                        metadata: {
                            bio: profileData.bioDescription,
                            isVerified: profileData.isVerified,
                            likesCount: profileData.likesCount,
                            averageLikes: profileData.averageLikes,
                            averageComments: profileData.averageComments,
                            averageShares: profileData.averageShares,
                            averageViews: profileData.averageViews,
                            recentVideos: JSON.parse(JSON.stringify(profileData.recentVideos)),
                            topHashtags: topHashtags,
                            scrapingMethod: 'apify',
                        },
                    },
                });
            }
            else {
                // Create new account
                socialAccount = await prisma.socialMediaAccount.create({
                    data: {
                        influencerId: user.influencer.id,
                        platform: SocialMediaPlatform.TIKTOK,
                        platformUserId: profileData.username,
                        platformUsername: profileData.username,
                        displayName: profileData.displayName,
                        profileUrl: profileData.profileUrl,
                        profilePicture: profileData.avatarUrl,
                        followersCount: profileData.followersCount,
                        followingCount: profileData.followingCount,
                        postsCount: profileData.videoCount,
                        engagementRate: profileData.engagementRate,
                        isActive: true,
                        accessToken: '', // No token needed for scraping
                        lastSyncedAt: new Date(),
                        metadata: {
                            bio: profileData.bioDescription,
                            isVerified: profileData.isVerified,
                            likesCount: profileData.likesCount,
                            averageLikes: profileData.averageLikes,
                            averageComments: profileData.averageComments,
                            averageShares: profileData.averageShares,
                            averageViews: profileData.averageViews,
                            recentVideos: JSON.parse(JSON.stringify(profileData.recentVideos)),
                            topHashtags: topHashtags,
                            scrapingMethod: 'apify',
                        },
                    },
                });
            }
            // Store recent videos in database
            for (const video of profileData.recentVideos.slice(0, 12)) {
                await prisma.socialMediaPost.upsert({
                    where: {
                        accountId_platformPostId: {
                            accountId: socialAccount.id,
                            platformPostId: video.id,
                        },
                    },
                    create: {
                        accountId: socialAccount.id,
                        platformPostId: video.id,
                        caption: video.videoDescription,
                        mediaUrl: video.coverImageUrl,
                        mediaType: MediaType.VIDEO,
                        likesCount: video.likesCount,
                        commentsCount: video.commentsCount,
                        sharesCount: video.sharesCount,
                        viewsCount: video.viewsCount,
                        postedAt: new Date(video.createTime * 1000),
                    },
                    update: {
                        caption: video.videoDescription,
                        mediaUrl: video.coverImageUrl,
                        likesCount: video.likesCount,
                        commentsCount: video.commentsCount,
                        sharesCount: video.sharesCount,
                        viewsCount: video.viewsCount,
                    },
                });
            }
            console.log(`[ApifyTikTokService] TikTok @${cleanUsername} connected successfully`);
            return {
                success: true,
                message: 'TikTok account connected successfully',
                account: {
                    id: socialAccount.id,
                    username: socialAccount.platformUsername,
                    displayName: socialAccount.displayName,
                    followersCount: socialAccount.followersCount,
                    profilePicture: socialAccount.profilePicture,
                    engagementRate: profileData.engagementRate,
                    isVerified: profileData.isVerified,
                },
            };
        }
        catch (error) {
            console.error('[ApifyTikTokService] Error connecting TikTok:', error.message);
            throw error;
        }
    }
    /**
     * Sync TikTok data for an account
     * @param accountId - Social media account ID
     */
    async syncTikTokData(accountId) {
        try {
            const account = await prisma.socialMediaAccount.findUnique({
                where: { id: accountId },
            });
            if (!account || account.platform !== SocialMediaPlatform.TIKTOK) {
                throw new Error('TikTok account not found');
            }
            // Check cache
            if (this.isCacheValid(account.lastSyncedAt)) {
                console.log(`[ApifyTikTokService] Using cached data for @${account.platformUsername}`);
                return {
                    success: true,
                    message: 'Using cached data (less than 7 days old)',
                    account,
                    cached: true,
                };
            }
            console.log(`[ApifyTikTokService] Syncing data for @${account.platformUsername}`);
            // Scrape fresh data
            const profileData = await this.scrapeTikTokProfile(account.platformUsername);
            // Extract top hashtags
            const topHashtags = this.extractTopHashtags(profileData.recentVideos);
            // Update account
            const updatedAccount = await prisma.socialMediaAccount.update({
                where: { id: accountId },
                data: {
                    displayName: profileData.displayName,
                    profilePicture: profileData.avatarUrl,
                    followersCount: profileData.followersCount,
                    followingCount: profileData.followingCount,
                    postsCount: profileData.videoCount,
                    engagementRate: profileData.engagementRate,
                    lastSyncedAt: new Date(),
                    metadata: {
                        bio: profileData.bioDescription,
                        isVerified: profileData.isVerified,
                        likesCount: profileData.likesCount,
                        averageLikes: profileData.averageLikes,
                        averageComments: profileData.averageComments,
                        averageShares: profileData.averageShares,
                        averageViews: profileData.averageViews,
                        recentVideos: JSON.parse(JSON.stringify(profileData.recentVideos)),
                        topHashtags: topHashtags,
                        scrapingMethod: 'apify',
                    },
                },
            });
            // Update recent videos in database
            for (const video of profileData.recentVideos.slice(0, 12)) {
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
                        caption: video.videoDescription,
                        mediaUrl: video.coverImageUrl,
                        mediaType: MediaType.VIDEO,
                        likesCount: video.likesCount,
                        commentsCount: video.commentsCount,
                        sharesCount: video.sharesCount,
                        viewsCount: video.viewsCount,
                        postedAt: new Date(video.createTime * 1000),
                    },
                    update: {
                        caption: video.videoDescription,
                        mediaUrl: video.coverImageUrl,
                        likesCount: video.likesCount,
                        commentsCount: video.commentsCount,
                        sharesCount: video.sharesCount,
                        viewsCount: video.viewsCount,
                    },
                });
            }
            console.log(`[ApifyTikTokService] Sync completed for @${account.platformUsername}`);
            return {
                success: true,
                message: 'TikTok data synced successfully',
                account: updatedAccount,
                cached: false,
            };
        }
        catch (error) {
            console.error('[ApifyTikTokService] Error syncing TikTok data:', error.message);
            throw error;
        }
    }
    /**
     * Get TikTok account data (from cache or fresh scrape)
     * @param accountId - Social media account ID
     */
    async getTikTokData(accountId) {
        try {
            const account = await prisma.socialMediaAccount.findUnique({
                where: { id: accountId },
            });
            if (!account || account.platform !== SocialMediaPlatform.TIKTOK) {
                throw new Error('TikTok account not found');
            }
            // Return cached data if valid
            if (this.isCacheValid(account.lastSyncedAt)) {
                return {
                    success: true,
                    account,
                    cached: true,
                    cacheAge: Math.floor((Date.now() - account.lastSyncedAt.getTime()) / (1000 * 60 * 60 * 24)),
                };
            }
            // Otherwise sync and return fresh data
            return await this.syncTikTokData(accountId);
        }
        catch (error) {
            console.error('[ApifyTikTokService] Error getting TikTok data:', error.message);
            throw error;
        }
    }
    /**
     * Disconnect TikTok account
     * @param accountId - Social media account ID
     */
    async disconnectTikTokAccount(accountId) {
        try {
            const account = await prisma.socialMediaAccount.findUnique({
                where: { id: accountId },
            });
            if (!account || account.platform !== SocialMediaPlatform.TIKTOK) {
                throw new Error('TikTok account not found');
            }
            await prisma.socialMediaAccount.update({
                where: { id: accountId },
                data: {
                    isActive: false,
                },
            });
            console.log(`[ApifyTikTokService] Disconnected TikTok @${account.platformUsername}`);
        }
        catch (error) {
            console.error('[ApifyTikTokService] Error disconnecting TikTok:', error.message);
            throw error;
        }
    }
    /**
     * Legacy scrape method for backward compatibility
     * @deprecated Use scrapeTikTokProfile instead
     */
    async scrape(username) {
        const data = await this.scrapeTikTokProfile(username);
        return {
            profile: {
                username: data.username,
                displayName: data.displayName,
                avatarUrl: data.avatarUrl,
                followersCount: data.followersCount,
                followingCount: data.followingCount,
                likesCount: data.likesCount,
                videoCount: data.videoCount,
                isVerified: data.isVerified,
                bioDescription: data.bioDescription,
                profileUrl: data.profileUrl,
            },
            videos: data.recentVideos,
            engagementRate: data.engagementRate,
            topHashtags: data.topHashtags,
            lastScraped: data.lastScraped,
        };
    }
    /**
     * Legacy connect method for backward compatibility
     * @deprecated Use connectTikTokAccount instead
     */
    async connectPublicAccount(userId, username) {
        return this.connectTikTokAccount(userId, username);
    }
    /**
     * Legacy sync method for backward compatibility
     * @deprecated Use syncTikTokData instead
     */
    async syncPublicAccount(accountId) {
        return this.syncTikTokData(accountId);
    }
}
export default new ApifyTikTokService();
