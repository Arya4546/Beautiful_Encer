import { ApifyClient } from 'apify-client';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
class ApifyInstagramService {
    constructor() {
        this.CACHE_DURATION_DAYS = 7; // Cache data for 7 days
        const apiToken = process.env.APIFY_API_TOKEN;
        this.actorId = process.env.APIFY_ACTOR_ID || 'apify/instagram-profile-scraper';
        if (!apiToken) {
            throw new Error('APIFY_API_TOKEN is required in environment variables');
        }
        this.client = new ApifyClient({
            token: apiToken,
        });
        console.log('[ApifyInstagramService] Initialized with actor:', this.actorId);
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
     * Calculate engagement rate from posts
     */
    calculateEngagementRate(posts, followersCount) {
        if (!posts || posts.length === 0 || followersCount === 0)
            return 0;
        const totalEngagement = posts.reduce((sum, post) => {
            return sum + (post.likesCount || 0) + (post.commentsCount || 0);
        }, 0);
        const avgEngagement = totalEngagement / posts.length;
        return (avgEngagement / followersCount) * 100;
    }
    /**
     * Extract top hashtags from posts
     */
    extractTopHashtags(posts) {
        const hashtagMap = new Map();
        posts.forEach(post => {
            if (post.caption) {
                // Extract hashtags using regex
                const hashtags = post.caption.match(/#[\w\u0590-\u05ff]+/g);
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
     * Scrape Instagram profile data using Apify
     * @param username - Instagram username to scrape
     * @returns Scraped Instagram profile data
     */
    async scrapeInstagramProfile(username) {
        try {
            console.log(`[ApifyInstagramService] Starting scrape for @${username}`);
            // Run the Apify actor (will wait for completion by default)
            const run = await this.client.actor(this.actorId).call({
                usernames: [username],
                resultsLimit: 12, // Get last 12 posts
                addParentData: false,
            });
            console.log(`[ApifyInstagramService] Actor run completed:`, run.id);
            // Fetch results from dataset
            const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
            if (!items || items.length === 0) {
                throw new Error(`No data found for username: ${username}`);
            }
            const profileData = items[0];
            // Debug: Log raw profile data from Apify
            console.log(`[ApifyInstagramService] Raw Apify data for @${username}:`, {
                username: profileData.username,
                followersCount: profileData.followersCount,
                followingCount: profileData.followingCount,
                postsCount: profileData.postsCount,
                isPrivate: profileData.isPrivate,
                latestPostsCount: profileData.latestPosts?.length || 0,
            });
            // Check if account is private
            if (profileData.isPrivate) {
                throw new Error(`Instagram account @${username} is private. Only public accounts can be connected.`);
            }
            // Validate that we got actual data (not all zeros)
            if (!profileData.followersCount && !profileData.postsCount) {
                throw new Error(`Unable to fetch data for @${username}. The account may not exist, be private, or be temporarily unavailable.`);
            }
            // Extract posts data
            const recentPosts = (profileData.latestPosts || []).map((post) => ({
                id: post.id || post.shortCode,
                type: post.type,
                caption: post.caption || '',
                likesCount: post.likesCount || 0,
                commentsCount: post.commentsCount || 0,
                timestamp: post.timestamp,
                url: post.url,
                displayUrl: post.displayUrl,
            }));
            // Calculate metrics
            const followersCount = profileData.followersCount || 0;
            const engagementRate = this.calculateEngagementRate(recentPosts, followersCount);
            const totalLikes = recentPosts.reduce((sum, post) => sum + post.likesCount, 0);
            const totalComments = recentPosts.reduce((sum, post) => sum + post.commentsCount, 0);
            const averageLikes = recentPosts.length > 0 ? totalLikes / recentPosts.length : 0;
            const averageComments = recentPosts.length > 0 ? totalComments / recentPosts.length : 0;
            // Extract top hashtags
            const topHashtags = this.extractTopHashtags(recentPosts);
            const scrapedData = {
                username: profileData.username,
                fullName: profileData.fullName || profileData.username,
                bio: profileData.biography || '',
                followersCount,
                followingCount: profileData.followingCount || 0,
                postsCount: profileData.postsCount || 0,
                isVerified: profileData.isVerified || false,
                isPrivate: profileData.isPrivate || false,
                profilePicUrl: profileData.profilePicUrl || '',
                externalUrl: profileData.externalUrl,
                engagementRate: Number(engagementRate.toFixed(2)),
                averageLikes: Math.round(averageLikes),
                averageComments: Math.round(averageComments),
                recentPosts,
                lastScraped: new Date(),
            };
            console.log(`[ApifyInstagramService] Successfully scraped @${username}:`, {
                followers: scrapedData.followersCount,
                following: scrapedData.followingCount,
                posts: scrapedData.postsCount,
                engagementRate: scrapedData.engagementRate,
            });
            return scrapedData;
        }
        catch (error) {
            console.error(`[ApifyInstagramService] Error scraping @${username}:`, error.message);
            throw new Error(`Failed to scrape Instagram profile: ${error.message}`);
        }
    }
    /**
     * Connect Instagram account using username (no OAuth required)
     * @param userId - User ID from database
     * @param username - Instagram username
     */
    async connectInstagramAccount(userId, username) {
        try {
            // Remove @ if user included it
            const cleanUsername = username.replace('@', '').trim();
            if (!cleanUsername) {
                throw new Error('Instagram username is required');
            }
            console.log(`[ApifyInstagramService] Connecting Instagram @${cleanUsername} for user ${userId}`);
            // Scrape Instagram profile
            const profileData = await this.scrapeInstagramProfile(cleanUsername);
            // Extract top hashtags from posts
            const topHashtags = this.extractTopHashtags(profileData.recentPosts);
            // Find user and their influencer profile
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { influencer: true },
            });
            if (!user) {
                throw new Error('User not found');
            }
            if (!user.influencer) {
                throw new Error('User must be an influencer to connect Instagram');
            }
            // Check if Instagram account already exists
            let socialAccount = await prisma.socialMediaAccount.findFirst({
                where: {
                    influencerId: user.influencer.id,
                    platform: 'INSTAGRAM',
                },
            });
            if (socialAccount) {
                // Update existing account
                socialAccount = await prisma.socialMediaAccount.update({
                    where: { id: socialAccount.id },
                    data: {
                        platformUserId: profileData.username,
                        platformUsername: profileData.username,
                        displayName: profileData.fullName,
                        profileUrl: `https://instagram.com/${profileData.username}`,
                        profilePicture: profileData.profilePicUrl,
                        followersCount: profileData.followersCount,
                        followingCount: profileData.followingCount,
                        postsCount: profileData.postsCount,
                        engagementRate: profileData.engagementRate,
                        isActive: true,
                        accessToken: '', // No token needed for scraping
                        lastSyncedAt: new Date(),
                        metadata: {
                            bio: profileData.bio,
                            isVerified: profileData.isVerified,
                            isPrivate: profileData.isPrivate,
                            externalUrl: profileData.externalUrl,
                            averageLikes: profileData.averageLikes,
                            averageComments: profileData.averageComments,
                            recentPosts: JSON.parse(JSON.stringify(profileData.recentPosts)),
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
                        platform: 'INSTAGRAM',
                        platformUserId: profileData.username,
                        platformUsername: profileData.username,
                        displayName: profileData.fullName,
                        profileUrl: `https://instagram.com/${profileData.username}`,
                        profilePicture: profileData.profilePicUrl,
                        followersCount: profileData.followersCount,
                        followingCount: profileData.followingCount,
                        postsCount: profileData.postsCount,
                        engagementRate: profileData.engagementRate,
                        isActive: true,
                        accessToken: '', // No token needed for scraping
                        lastSyncedAt: new Date(),
                        metadata: {
                            bio: profileData.bio,
                            isVerified: profileData.isVerified,
                            isPrivate: profileData.isPrivate,
                            externalUrl: profileData.externalUrl,
                            averageLikes: profileData.averageLikes,
                            averageComments: profileData.averageComments,
                            recentPosts: JSON.parse(JSON.stringify(profileData.recentPosts)),
                            topHashtags: topHashtags,
                            scrapingMethod: 'apify',
                        },
                    },
                });
            }
            console.log(`[ApifyInstagramService] Instagram @${cleanUsername} connected successfully`);
            return {
                success: true,
                message: 'Instagram account connected successfully',
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
            console.error('[ApifyInstagramService] Error connecting Instagram:', error.message);
            throw error;
        }
    }
    /**
     * Sync Instagram data for an account
     * @param accountId - Social media account ID
     */
    async syncInstagramData(accountId) {
        try {
            const account = await prisma.socialMediaAccount.findUnique({
                where: { id: accountId },
            });
            if (!account || account.platform !== 'INSTAGRAM') {
                throw new Error('Instagram account not found');
            }
            // Check cache
            if (this.isCacheValid(account.lastSyncedAt)) {
                console.log(`[ApifyInstagramService] Using cached data for @${account.platformUsername}`);
                return {
                    success: true,
                    message: 'Using cached data (less than 7 days old)',
                    account,
                    cached: true,
                };
            }
            console.log(`[ApifyInstagramService] Syncing data for @${account.platformUsername}`);
            // Scrape fresh data
            const profileData = await this.scrapeInstagramProfile(account.platformUsername);
            // Extract top hashtags
            const topHashtags = this.extractTopHashtags(profileData.recentPosts);
            // Update account
            const updatedAccount = await prisma.socialMediaAccount.update({
                where: { id: accountId },
                data: {
                    displayName: profileData.fullName,
                    profilePicture: profileData.profilePicUrl,
                    followersCount: profileData.followersCount,
                    followingCount: profileData.followingCount,
                    postsCount: profileData.postsCount,
                    engagementRate: profileData.engagementRate,
                    lastSyncedAt: new Date(),
                    metadata: {
                        bio: profileData.bio,
                        isVerified: profileData.isVerified,
                        isPrivate: profileData.isPrivate,
                        externalUrl: profileData.externalUrl,
                        averageLikes: profileData.averageLikes,
                        averageComments: profileData.averageComments,
                        recentPosts: JSON.parse(JSON.stringify(profileData.recentPosts)),
                        topHashtags: topHashtags,
                        scrapingMethod: 'apify',
                    },
                },
            });
            console.log(`[ApifyInstagramService] Sync completed for @${account.platformUsername}`);
            return {
                success: true,
                message: 'Instagram data synced successfully',
                account: updatedAccount,
                cached: false,
            };
        }
        catch (error) {
            console.error('[ApifyInstagramService] Error syncing Instagram data:', error.message);
            throw error;
        }
    }
    /**
     * Get Instagram account data (from cache or fresh scrape)
     * @param accountId - Social media account ID
     */
    async getInstagramData(accountId) {
        try {
            const account = await prisma.socialMediaAccount.findUnique({
                where: { id: accountId },
            });
            if (!account || account.platform !== 'INSTAGRAM') {
                throw new Error('Instagram account not found');
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
            return await this.syncInstagramData(accountId);
        }
        catch (error) {
            console.error('[ApifyInstagramService] Error getting Instagram data:', error.message);
            throw error;
        }
    }
    /**
     * Disconnect Instagram account
     * @param accountId - Social media account ID
     */
    async disconnectInstagramAccount(accountId) {
        try {
            const account = await prisma.socialMediaAccount.findUnique({
                where: { id: accountId },
            });
            if (!account || account.platform !== 'INSTAGRAM') {
                throw new Error('Instagram account not found');
            }
            await prisma.socialMediaAccount.update({
                where: { id: accountId },
                data: {
                    isActive: false,
                },
            });
            console.log(`[ApifyInstagramService] Disconnected Instagram @${account.platformUsername}`);
        }
        catch (error) {
            console.error('[ApifyInstagramService] Error disconnecting Instagram:', error.message);
            throw error;
        }
    }
}
export default new ApifyInstagramService();
