import { ApifyClient } from 'apify-client';
import { prisma } from '../lib/prisma.js';
import { SocialMediaPlatform, MediaType } from '@prisma/client';
import logger from '../utils/logger.util.js';

interface TwitterTweet {
  id: string;
  text: string;
  createdAt: string;
  url: string;
  mediaUrls?: string[];
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  viewCount?: number;
  isRetweet: boolean;
}

interface TwitterProfileData {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  isVerified: boolean;
  profileImageUrl: string;
  bannerUrl?: string;
  location?: string;
  website?: string;
  joinedDate?: string;
  engagementRate: number;
  averageLikes: number;
  averageRetweets: number;
  averageReplies: number;
  recentTweets: TwitterTweet[];
  topHashtags: string[];
  lastScraped: Date;
}

class ApifyTwitterService {
  private client: ApifyClient;
  private actorId: string;
  private readonly CACHE_DURATION_DAYS = 7;
  private readonly MAX_TWEETS = 20;

  constructor() {
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      throw new Error('APIFY_API_TOKEN is not set in environment variables');
    }

    this.client = new ApifyClient({ token: apiToken });
    // Using mikhaiylenko/twitter-scraper - Free actor
    this.actorId = process.env.APIFY_TWITTER_ACTOR_ID || 'mikhaiylenko/twitter-scraper';
    
    logger.log('[ApifyTwitterService] Initialized with actor:', this.actorId);
  }

  /**
   * Scrape Twitter/X profile and recent tweets
   * Using mikhaiylenko/twitter-scraper
   */
  async scrapeTwitterProfile(username: string): Promise<TwitterProfileData> {
    try {
      // Remove @ if present
      const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

      logger.log(`[ApifyTwitterService] Scraping profile for @${cleanUsername}`);

      // Try to use Apify actor
      try {
        const run = await this.client.actor(this.actorId).call({
          searchTerms: [cleanUsername],
          maxTweets: this.MAX_TWEETS,
          mode: 'user',
        });

        logger.log(`[ApifyTwitterService] Actor run completed with status: ${run.status}`);
        logger.log(`[ApifyTwitterService] Run ID: ${run.id}`);
        
        // Check if run failed
        if (run.status === 'FAILED' || run.status === 'ABORTED' || run.status === 'TIMED-OUT') {
          throw new Error(`Actor run failed with status: ${run.status}`);
        }

        // Wait a bit for dataset to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        logger.log(`[ApifyTwitterService] Fetching dataset...`);

      // Fetch results from dataset
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      logger.log(`[ApifyTwitterService] Dataset items count: ${items?.length || 0}`);
      
      if (!items || items.length === 0) {
        // Try to get run log to see what happened
        try {
          const logResponse = await this.client.log(run.id).get();
          logger.error(`[ApifyTwitterService] Actor log (last 500 chars):`, logResponse?.substring(-500));
        } catch (logError) {
          logger.error(`[ApifyTwitterService] Could not fetch actor log`);
        }
        
        throw new Error(`No data found for Twitter user @${cleanUsername}. The actor may have failed, the username doesn't exist, or Twitter is blocking the scraper.`);
      }

      // Log first item structure for debugging
      logger.log(`[ApifyTwitterService] First item keys:`, Object.keys(items[0] || {}));

      // apidojo/twitter-user-scraper returns data in specific format
      // Check multiple possible structures
      let user: any = null;
      let tweetsArray: any[] = [];

      // Try to find user profile data
      const firstItem: any = items[0];
      
      // Structure 1: Direct user object with timeline
      if (firstItem.timeline || firstItem.tweets) {
        user = firstItem;
        tweetsArray = (firstItem.timeline || firstItem.tweets || []) as any[];
      }
      // Structure 2: User in nested property
      else if (firstItem.user) {
        user = firstItem.user;
        tweetsArray = (firstItem.tweets || []) as any[];
      }
      // Structure 3: All items are tweets with author info
      else if (firstItem.author || firstItem.user_info) {
        user = firstItem.author || firstItem.user_info;
        tweetsArray = items;
      }
      // Structure 4: Flat structure
      else {
        user = firstItem;
        // Remaining items might be tweets
        tweetsArray = items.slice(1);
      }

      if (!user) {
        logger.error(`[ApifyTwitterService] Could not find user data in response`);
        throw new Error(`Could not extract profile data for @${cleanUsername}`);
      }

      logger.log(`[ApifyTwitterService] User found:`, user.screen_name || user.username || user.name);
      logger.log(`[ApifyTwitterService] Processing ${tweetsArray.length} potential tweets`);

      // Process tweets - filter and map
      const tweets: TwitterTweet[] = [];
      
      for (const tweet of tweetsArray) {
        // Skip if not a tweet object
        if (!tweet || typeof tweet !== 'object') continue;
        
        const tweetId = tweet.id_str || tweet.id?.toString() || tweet.tweet_id || '';
        const tweetText = tweet.full_text || tweet.text || '';
        
        // Skip if no ID or text
        if (!tweetId || !tweetText) continue;
        
        tweets.push({
          id: tweetId,
          text: tweetText,
          createdAt: tweet.created_at || new Date().toISOString(),
          url: tweet.url || `https://twitter.com/${cleanUsername}/status/${tweetId}`,
          mediaUrls: tweet.entities?.media?.map((m: any) => m.media_url_https) || 
                     tweet.media?.map((m: any) => m.url) || [],
          retweetCount: this.parseCount(tweet.retweet_count || 0),
          replyCount: this.parseCount(tweet.reply_count || 0),
          likeCount: this.parseCount(tweet.favorite_count || tweet.like_count || 0),
          quoteCount: this.parseCount(tweet.quote_count || 0),
          viewCount: 0,
          isRetweet: !!tweet.retweeted_status || tweetText.startsWith('RT @'),
        });
      }

      // Filter out retweets for original content
      const originalTweets = tweets.filter(t => !t.isRetweet).slice(0, this.MAX_TWEETS);

      logger.log(`[ApifyTwitterService] Found ${originalTweets.length} original tweets`);

      // Extract profile information with fallbacks for curious_coder format
      const followersCount = this.parseCount(user.followers_count || 0);
      const followingCount = this.parseCount(user.friends_count || 0);
      const tweetsCount = this.parseCount(user.statuses_count || originalTweets.length);

      // Calculate engagement metrics
      const totalLikes = originalTweets.reduce((sum, t) => sum + t.likeCount, 0);
      const totalRetweets = originalTweets.reduce((sum, t) => sum + t.retweetCount, 0);
      const totalReplies = originalTweets.reduce((sum, t) => sum + t.replyCount, 0);
      const tweetCount = originalTweets.length || 1;

      const averageLikes = Math.round(totalLikes / tweetCount);
      const averageRetweets = Math.round(totalRetweets / tweetCount);
      const averageReplies = Math.round(totalReplies / tweetCount);

      // Engagement rate: (total engagements / followers) * 100
      const totalEngagements = totalLikes + totalRetweets + totalReplies;
      const engagementRate = followersCount > 0 
        ? Number(((totalEngagements / (tweetCount * followersCount)) * 100).toFixed(2))
        : 0;

      // Extract hashtags
      const topHashtags = this.extractHashtags(originalTweets);

      logger.log(`[ApifyTwitterService] Successfully scraped profile for @${cleanUsername}`);

      return {
        userId: user.id_str || user.id || '',
        username: user.screen_name || cleanUsername,
        displayName: user.name || cleanUsername,
        bio: user.description || '',
        followersCount,
        followingCount,
        tweetsCount,
        isVerified: user.verified || false,
        profileImageUrl: (user.profile_image_url_https || user.profile_image_url || '').replace('_normal', '_400x400'),
        bannerUrl: user.profile_banner_url || '',
        location: user.location || '',
        website: user.entities?.url?.urls?.[0]?.expanded_url || user.url || '',
        joinedDate: user.created_at || '',
        engagementRate,
        averageLikes,
        averageRetweets,
        averageReplies,
        recentTweets: originalTweets,
        topHashtags,
        lastScraped: new Date(),
      };

      } catch (apifyError: any) {
        // Re-throw the error instead of using mock data
        logger.error(`[ApifyTwitterService] Apify scraping failed: ${apifyError.message}`);
        throw apifyError;
      }

    } catch (error: any) {
      logger.error('[ApifyTwitterService] Scraping error:', error.message);
      throw new Error(`Failed to scrape Twitter profile: ${error.message}`);
    }
  }

  /**
   * Connect Twitter account for user
   */
  async connectTwitterAccount(userId: string, username: string): Promise<any> {
    try {
      // Get user with influencer relation
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { influencer: true },
      });

      if (!user || !user.influencer) {
        throw new Error('Only influencers can connect Twitter accounts');
      }

      // Scrape Twitter data first
      const scrapedData = await this.scrapeTwitterProfile(username);

      // Check if account already exists for this user
      const existingAccount = await prisma.socialMediaAccount.findFirst({
        where: {
          influencerId: user.influencer.id,
          platform: SocialMediaPlatform.TWITTER,
        },
      });

      let account;
      if (existingAccount) {
        // Update existing account with fresh data
        account = await prisma.socialMediaAccount.update({
          where: { id: existingAccount.id },
          data: {
            platformUserId: scrapedData.userId,
            platformUsername: scrapedData.username,
            displayName: scrapedData.displayName,
            profileUrl: `https://twitter.com/${scrapedData.username}`,
            profilePicture: scrapedData.profileImageUrl,
            followersCount: scrapedData.followersCount,
            followingCount: scrapedData.followingCount,
            postsCount: scrapedData.tweetsCount,
            engagementRate: scrapedData.engagementRate,
            lastSyncedAt: new Date(),
            metadata: {
              bio: scrapedData.bio,
              isVerified: scrapedData.isVerified,
              bannerUrl: scrapedData.bannerUrl,
              location: scrapedData.location,
              website: scrapedData.website,
              joinedDate: scrapedData.joinedDate,
              averageLikes: scrapedData.averageLikes,
              averageRetweets: scrapedData.averageRetweets,
              averageReplies: scrapedData.averageReplies,
              topHashtags: scrapedData.topHashtags,
              lastScrapedAt: scrapedData.lastScraped.toISOString(),
            },
          },
        });
      } else {
        // Create new account
        account = await prisma.socialMediaAccount.create({
          data: {
            influencerId: user.influencer.id,
            platform: SocialMediaPlatform.TWITTER,
            platformUserId: scrapedData.userId,
            platformUsername: scrapedData.username,
            displayName: scrapedData.displayName,
            profileUrl: `https://twitter.com/${scrapedData.username}`,
            profilePicture: scrapedData.profileImageUrl,
            accessToken: '', // No token needed for scraping
            refreshToken: null,
            tokenExpiresAt: null,
            followersCount: scrapedData.followersCount,
            followingCount: scrapedData.followingCount,
            postsCount: scrapedData.tweetsCount,
            engagementRate: scrapedData.engagementRate,
            lastSyncedAt: new Date(),
            metadata: {
              bio: scrapedData.bio,
              isVerified: scrapedData.isVerified,
              bannerUrl: scrapedData.bannerUrl,
              location: scrapedData.location,
              website: scrapedData.website,
              joinedDate: scrapedData.joinedDate,
              averageLikes: scrapedData.averageLikes,
              averageRetweets: scrapedData.averageRetweets,
              averageReplies: scrapedData.averageReplies,
              topHashtags: scrapedData.topHashtags,
              lastScrapedAt: scrapedData.lastScraped.toISOString(),
            },
            isVerified: false,
            verificationCode: null,
            lastAccountChange: null,
          },
        });
      }

      // Store recent tweets (non-critical)
      let tweetsStored = 0;
      try {
        await this.storeTweets(account.id, scrapedData.recentTweets);
        tweetsStored = scrapedData.recentTweets.length;
      } catch (tweetError: any) {
        logger.error('[ApifyTwitterService] Failed to store tweets (non-critical):', tweetError.message);
      }

      return {
        account,
        tweetsCount: tweetsStored,
      };

    } catch (error: any) {
      logger.error('[ApifyTwitterService] Connection error:', error.message);
      
      if (error.message?.includes('No space left on device')) {
        throw new Error('Database storage is full. Account connected but tweets could not be stored. Please contact support.');
      }
      
      throw error;
    }
  }

  /**
   * Store tweets in database
   */
  private async storeTweets(accountId: string, tweets: TwitterTweet[]): Promise<void> {
    try {
      // Delete old tweets
      await prisma.socialMediaPost.deleteMany({
        where: { accountId },
      });

      // Insert new tweets
      const tweetRecords = tweets.map(tweet => ({
        accountId,
        platformPostId: tweet.id,
        mediaType: tweet.mediaUrls && tweet.mediaUrls.length > 0 ? MediaType.IMAGE : MediaType.IMAGE, // Twitter posts default to IMAGE type
        caption: tweet.text,
        mediaUrl: tweet.url,
        thumbnailUrl: tweet.mediaUrls?.[0] || null,
        likesCount: tweet.likeCount,
        commentsCount: tweet.replyCount,
        sharesCount: tweet.retweetCount,
        viewsCount: tweet.viewCount || 0,
        postedAt: new Date(tweet.createdAt),
        metadata: {
          quoteCount: tweet.quoteCount,
          isRetweet: tweet.isRetweet,
          mediaUrls: tweet.mediaUrls || [],
        },
      }));

      if (tweetRecords.length > 0) {
        await prisma.socialMediaPost.createMany({
          data: tweetRecords,
          skipDuplicates: true,
        });
      }

    } catch (error: any) {
      logger.error('[ApifyTwitterService] Error storing tweets:', error.message);
      throw error;
    }
  }

  /**
   * Sync Twitter data (refresh cached data)
   */
  async syncTwitterData(accountId: string): Promise<any> {
    try {
      // Get account from database
      const account = await prisma.socialMediaAccount.findUnique({
        where: { id: accountId },
      });

      if (!account || account.platform !== SocialMediaPlatform.TWITTER) {
        throw new Error('Twitter account not found');
      }

      // Check if cache is still valid
      if (this.isCacheValid(account.lastSyncedAt)) {
        return {
          message: 'Data is up to date',
          lastSynced: account.lastSyncedAt,
          nextSync: new Date(account.lastSyncedAt!.getTime() + this.CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000),
        };
      }

      // Scrape fresh data
      const scrapedData = await this.scrapeTwitterProfile(account.platformUsername);

      // Update account
      const updatedAccount = await prisma.socialMediaAccount.update({
        where: { id: accountId },
        data: {
          displayName: scrapedData.displayName,
          profilePicture: scrapedData.profileImageUrl,
          followersCount: scrapedData.followersCount,
          followingCount: scrapedData.followingCount,
          postsCount: scrapedData.tweetsCount,
          engagementRate: scrapedData.engagementRate,
          lastSyncedAt: new Date(),
          metadata: {
            bio: scrapedData.bio,
            isVerified: scrapedData.isVerified,
            bannerUrl: scrapedData.bannerUrl,
            location: scrapedData.location,
            website: scrapedData.website,
            joinedDate: scrapedData.joinedDate,
            averageLikes: scrapedData.averageLikes,
            averageRetweets: scrapedData.averageRetweets,
            averageReplies: scrapedData.averageReplies,
            topHashtags: scrapedData.topHashtags,
            lastScrapedAt: scrapedData.lastScraped.toISOString(),
          },
        },
      });

      // Update tweets (non-critical)
      let tweetsStored = 0;
      try {
        await this.storeTweets(accountId, scrapedData.recentTweets);
        tweetsStored = scrapedData.recentTweets.length;
      } catch (tweetError: any) {
        logger.error('[ApifyTwitterService] Failed to update tweets (non-critical):', tweetError.message);
      }

      return {
        account: updatedAccount,
        tweetsCount: tweetsStored,
      };

    } catch (error: any) {
      logger.error('[ApifyTwitterService] Sync error:', error.message);
      throw error;
    }
  }

  /**
   * Get Twitter account data with tweets
   */
  async getTwitterData(accountId: string): Promise<any> {
    try {
      const account = await prisma.socialMediaAccount.findUnique({
        where: { id: accountId },
        include: {
          posts: {
            orderBy: { postedAt: 'desc' },
            take: 20,
          },
        },
      });

      if (!account || account.platform !== SocialMediaPlatform.TWITTER) {
        throw new Error('Twitter account not found');
      }

      // Format tweets for frontend
      const recentTweets = account.posts.map(post => ({
        id: post.platformPostId,
        text: post.caption || '',
        url: post.mediaUrl || '',
        thumbnailUrl: post.thumbnailUrl || '',
        thumbnail: post.thumbnailUrl || '',
        mediaUrls: (post.metadata as any)?.mediaUrls || [],
        publishedAt: post.postedAt.toISOString(),
        likeCount: post.likesCount || 0,
        retweetCount: post.sharesCount || 0,
        replyCount: post.commentsCount || 0,
        viewCount: post.viewsCount || 0,
        quoteCount: (post.metadata as any)?.quoteCount || 0,
      }));

      // Enhance metadata with tweets
      const metadata = {
        ...(account.metadata as any),
        recentTweets,
        recentPosts: recentTweets,
      };

      return {
        account: {
          ...account,
          metadata,
        },
        tweets: recentTweets,
        metadata,
      };

    } catch (error: any) {
      logger.error('[ApifyTwitterService] Get data error:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect Twitter account
   */
  async disconnectTwitterAccount(accountId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const account = await prisma.socialMediaAccount.findFirst({
        where: {
          id: accountId,
          platform: SocialMediaPlatform.TWITTER,
          influencer: {
            userId,
          },
        },
      });

      if (!account) {
        throw new Error('Twitter account not found or you do not have permission to disconnect it');
      }

      // Delete account (cascade deletes posts)
      await prisma.socialMediaAccount.delete({
        where: { id: accountId },
      });

    } catch (error: any) {
      logger.error('[ApifyTwitterService] Disconnect error:', error.message);
      throw error;
    }
  }

  /**
   * Helper: Check if cache is still valid
   */
  private isCacheValid(lastSyncedAt: Date | null): boolean {
    if (!lastSyncedAt) return false;
    const cacheExpiry = new Date(lastSyncedAt.getTime() + this.CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000);
    return new Date() < cacheExpiry;
  }

  /**
   * Helper: Extract hashtags from tweets
   */
  private extractHashtags(tweets: TwitterTweet[]): string[] {
    const hashtagMap = new Map<string, number>();

    tweets.forEach(tweet => {
      const hashtags = tweet.text.match(/#\w+/g) || [];
      hashtags.forEach(tag => {
        const cleanTag = tag.toLowerCase();
        hashtagMap.set(cleanTag, (hashtagMap.get(cleanTag) || 0) + 1);
      });
    });

    // Sort by frequency and return top 10
    return Array.from(hashtagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }

  /**
   * Helper: Parse count strings (handles K, M suffixes)
   */
  private parseCount(count: string | number): number {
    if (typeof count === 'number') return count;
    if (!count) return 0;

    const str = count.toString().toUpperCase().trim();
    
    if (str.endsWith('K')) {
      return Math.round(parseFloat(str.slice(0, -1)) * 1000);
    }
    if (str.endsWith('M')) {
      return Math.round(parseFloat(str.slice(0, -1)) * 1000000);
    }
    if (str.endsWith('B')) {
      return Math.round(parseFloat(str.slice(0, -1)) * 1000000000);
    }

    return parseInt(str.replace(/,/g, ''), 10) || 0;
  }
}

export default new ApifyTwitterService();
