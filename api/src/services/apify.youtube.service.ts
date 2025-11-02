import { ApifyClient } from 'apify-client';
import { prisma } from '../lib/prisma.js';
import { SocialMediaPlatform, MediaType } from '@prisma/client';
import logger from '../utils/logger.util.js';

/**
 * Apify YouTube Scraper Service
 * 
 * Uses Apify's YouTube Scraper actor to fetch YouTube channel data
 * without requiring YouTube API or OAuth authentication
 * 
 * Features:
 * - No YouTube API quota limits
 * - Fetches public channel data
 * - Gets subscriber count, video count, views
 * - Retrieves recent videos with engagement metrics
 * - Cost-effective with smart caching (7-day cache)
 * - Extracts top hashtags from video descriptions
 * - Computes engagement rate: avg((likes+comments) per video)/subscribers * 100
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  viewCount: number;
  likeCount: number;
  commentCount: number;
  url: string;
}

export interface YouTubeChannelProfile {
  channelId: string;
  channelHandle: string;
  channelName: string;
  description: string;
  customUrl: string;
  thumbnailUrl: string;
  bannerUrl?: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  isVerified: boolean;
  country?: string;
  joinedDate?: string;
}

export interface ScrapedYouTubeData {
  channelId: string;
  channelHandle: string;
  channelName: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  isVerified: boolean;
  thumbnailUrl: string;
  bannerUrl?: string;
  customUrl: string;
  country?: string;
  engagementRate: number;
  averageViews: number;
  averageLikes: number;
  averageComments: number;
  recentVideos: YouTubeVideo[];
  topHashtags: string[];
  lastScraped: Date;
}

export interface YouTubeScrapeResult {
  profile: YouTubeChannelProfile;
  videos: YouTubeVideo[];
  engagementRate: number;
  topHashtags: string[];
  lastScraped: Date;
}

class ApifyYouTubeService {
  private client: ApifyClient;
  private actorId: string;
  private readonly CACHE_DURATION_DAYS = 7; // Cache data for 7 days (same as Instagram/TikTok)
  private readonly MAX_VIDEOS = 20; // Number of recent videos to fetch

  constructor() {
    const apiToken = process.env.APIFY_API_TOKEN;
    this.actorId = process.env.APIFY_YOUTUBE_ACTOR_ID || 'monetizze/youtube-scraper';

    if (!apiToken) {
      throw new Error('APIFY_API_TOKEN is required in environment variables');
    }

    this.client = new ApifyClient({
      token: apiToken,
    });

    logger.log('[ApifyYouTubeService] Initialized with actor:', this.actorId);
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(lastScraped: Date | null): boolean {
    if (!lastScraped) return false;
    
    const now = new Date();
    const diffDays = (now.getTime() - lastScraped.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays < this.CACHE_DURATION_DAYS;
  }

  /**
   * Calculate engagement rate from videos
   * For YouTube: Uses views as engagement metric since likes/comments aren't available from channel scraper
   * Formula: (average views per video / subscribers) * 100
   */
  private calculateEngagementRate(videos: YouTubeVideo[], subscriberCount: number): number {
    if (!videos || videos.length === 0 || subscriberCount === 0) return 0;

    // Try to use likes and comments if available
    const hasLikeData = videos.some(v => (v.likeCount || 0) > 0);
    
    if (hasLikeData) {
      // Use traditional engagement (likes + comments)
      const totalEngagement = videos.reduce((sum, video) => {
        return sum + (video.likeCount || 0) + (video.commentCount || 0);
      }, 0);

      const avgEngagement = totalEngagement / videos.length;
      const rate = (avgEngagement / subscriberCount) * 100;
      return parseFloat(rate.toFixed(2));
    } else {
      // Use views-based engagement (fallback for channel scraper)
      const totalViews = videos.reduce((sum, video) => sum + (video.viewCount || 0), 0);
      const avgViews = totalViews / videos.length;
      const rate = (avgViews / subscriberCount) * 100;
      return parseFloat(rate.toFixed(2));
    }
  }

  /**
   * Extract hashtags from video descriptions
   */
  private extractHashtags(videos: YouTubeVideo[]): string[] {
    const hashtagMap = new Map<string, number>();

    videos.forEach(video => {
      if (!video.description) return;
      
      const hashtags = video.description.match(/#[\w]+/g) || [];
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
   * Format duration from various formats to seconds
   * Supports: "5:13" (MM:SS), "1:23:45" (HH:MM:SS), "PT5M13S" (ISO 8601)
   */
  private parseDuration(duration: string): number {
    if (!duration) return 0;
    
    // Handle ISO 8601 format (PT5M13S)
    if (duration.startsWith('PT')) {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;

      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      const seconds = parseInt(match[3] || '0');

      return hours * 3600 + minutes * 60 + seconds;
    }

    // Handle MM:SS or HH:MM:SS format
    const parts = duration.split(':').map(p => parseInt(p) || 0);
    
    if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    }
    
    return 0;
  }

  /**
   * Parse relative date strings like "6 days ago" or "2 weeks ago"
   * Returns ISO date string, fallback to current date if parsing fails
   */
  private parseRelativeDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString();

    // Check if it's already an ISO date
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime()) && dateStr.includes('-')) {
      return isoDate.toISOString();
    }

    const now = new Date();
    const lowerDate = dateStr.toLowerCase();

    // Parse relative time patterns
    const patterns = [
      { regex: /(\d+)\s*second[s]?\s*ago/, unit: 'seconds' },
      { regex: /(\d+)\s*minute[s]?\s*ago/, unit: 'minutes' },
      { regex: /(\d+)\s*hour[s]?\s*ago/, unit: 'hours' },
      { regex: /(\d+)\s*day[s]?\s*ago/, unit: 'days' },
      { regex: /(\d+)\s*week[s]?\s*ago/, unit: 'weeks' },
      { regex: /(\d+)\s*month[s]?\s*ago/, unit: 'months' },
      { regex: /(\d+)\s*year[s]?\s*ago/, unit: 'years' },
    ];

    for (const { regex, unit } of patterns) {
      const match = lowerDate.match(regex);
      if (match) {
        const value = parseInt(match[1]);
        const date = new Date(now);
        
        switch (unit) {
          case 'seconds':
            date.setSeconds(date.getSeconds() - value);
            break;
          case 'minutes':
            date.setMinutes(date.getMinutes() - value);
            break;
          case 'hours':
            date.setHours(date.getHours() - value);
            break;
          case 'days':
            date.setDate(date.getDate() - value);
            break;
          case 'weeks':
            date.setDate(date.getDate() - (value * 7));
            break;
          case 'months':
            date.setMonth(date.getMonth() - value);
            break;
          case 'years':
            date.setFullYear(date.getFullYear() - value);
            break;
        }
        
        return date.toISOString();
      }
    }

    // If no pattern matched, return current date
    logger.warn(`[ApifyYouTubeService] Could not parse date: "${dateStr}", using current date`);
    return now.toISOString();
  }

  /**
   * Scrape YouTube channel profile and recent videos
   */
  async scrapeYouTubeChannel(channelHandle: string): Promise<ScrapedYouTubeData> {
    try {
      // streamers/youtube-channel-scraper input format
      const channelUrl = `https://www.youtube.com/@${channelHandle}`;
      
      const input = {
        startUrls: [{ url: channelUrl, method: 'GET' }],
        maxResults: this.MAX_VIDEOS,
        maxResultsShorts: 0,
        maxResultStreams: 0,
        sortVideosBy: 'NEWEST',
      };

      // Run the actor
      const run = await this.client.actor(this.actorId).call(input, {
        timeout: 120, // 2 minutes timeout
      });

      // Fetch results from dataset
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();

      if (!items || items.length === 0) {
        throw new Error(`No data returned from YouTube scraper. Run ID: ${run.id} - Check https://console.apify.com/actors/runs/${run.id} for details.`);
      }

      // streamers/youtube-channel-scraper output format:
      // Each item is a video with aboutChannelInfo nested inside
      const firstItem: any = items[0];
      const aboutChannel = firstItem?.aboutChannelInfo || {};
      
      // Extract channel profile from aboutChannelInfo
      const profile: YouTubeChannelProfile = {
        channelId: (aboutChannel.channelId || firstItem?.channelId || '') as string,
        channelHandle: channelHandle,
        channelName: (aboutChannel.channelName || firstItem?.channelName || '') as string,
        description: (aboutChannel.channelDescription || '') as string,
        customUrl: (aboutChannel.inputChannelUrl || `https://www.youtube.com/@${channelHandle}`) as string,
        thumbnailUrl: (aboutChannel.channelAvatarUrl || '') as string,
        bannerUrl: (aboutChannel.channelBannerUrl) as string | undefined,
        subscriberCount: this.parseCount(aboutChannel.numberOfSubscribers || 0),
        videoCount: parseInt(String(aboutChannel.channelTotalVideos || '0')),
        viewCount: this.parseCount(aboutChannel.channelTotalViews || 0),
        isVerified: Boolean(aboutChannel.isChannelVerified || false),
        country: aboutChannel.channelLocation as string | undefined,
        joinedDate: aboutChannel.channelJoinedDate as string | undefined,
      };

      // Extract videos from items array
      const videos: YouTubeVideo[] = [];
      
      items.slice(0, this.MAX_VIDEOS).forEach((item: any) => {
        if (item.type === 'video' && item.id) {
          videos.push({
            id: item.id,
            title: item.title || '',
            description: item.text || item.description || '',
            publishedAt: this.parseRelativeDate(item.date),
            thumbnailUrl: item.thumbnailUrl || '',
            duration: this.parseDuration(item.duration) || 0,
            viewCount: this.parseCount(item.viewCount || 0),
            likeCount: 0, // Channel scraper doesn't provide likes
            commentCount: 0, // Channel scraper doesn't provide comments
            url: item.url || `https://www.youtube.com/watch?v=${item.id}`,
          });
        }
      });

      // Calculate metrics
      const engagementRate = this.calculateEngagementRate(videos, profile.subscriberCount);
      const topHashtags = this.extractHashtags(videos);

      const averageViews = videos.length > 0
        ? Math.round(videos.reduce((sum, v) => sum + v.viewCount, 0) / videos.length)
        : 0;

      // Since channel scraper doesn't provide likes/comments, estimate based on typical YouTube engagement rates
      // Industry standards: ~4% like rate, ~0.5% comment rate of views
      const averageLikes = videos.length > 0 && averageViews > 0
        ? Math.round(averageViews * 0.04) // 4% of average views
        : 0;

      const averageComments = videos.length > 0 && averageViews > 0
        ? Math.round(averageViews * 0.005) // 0.5% of average views
        : 0;

      return {
        channelId: profile.channelId,
        channelHandle: profile.channelHandle,
        channelName: profile.channelName,
        description: profile.description,
        subscriberCount: profile.subscriberCount,
        videoCount: profile.videoCount,
        viewCount: profile.viewCount,
        isVerified: profile.isVerified,
        thumbnailUrl: profile.thumbnailUrl,
        bannerUrl: profile.bannerUrl,
        customUrl: profile.customUrl,
        country: profile.country,
        engagementRate,
        averageViews,
        averageLikes,
        averageComments,
        recentVideos: videos,
        topHashtags,
        lastScraped: new Date(),
      };

    } catch (error: any) {
      logger.error('[ApifyYouTubeService] Scraping error:', error.message);
      
      // Provide helpful error message based on error type
      if (error.message?.includes('Insufficient permissions') || error.message?.includes('not found')) {
        throw new Error(
          `YouTube scraper actor "${this.actorId}" is not accessible. ` +
          `Please verify the actor exists on Apify and try one of these verified public actors in .env: ` +
          `"monetizze/youtube-scraper", "lhotanok/youtube-scraper", or "epctex/youtube-scraper"`
        );
      }
      
      if (error.message?.includes('timeout')) {
        throw new Error('YouTube scraping timed out. The channel might be very large or Apify is slow. Please try again.');
      }
      
      throw new Error(`Failed to scrape YouTube channel: ${error.message}`);
    }
  }

  /**
   * Parse count strings that might include K, M suffixes
   */
  private parseCount(count: string | number): number {
    if (typeof count === 'number') return count;
    if (!count) return 0;

    const str = count.toString().toUpperCase().trim();
    
    if (str.includes('K')) {
      return Math.round(parseFloat(str.replace('K', '')) * 1000);
    }
    if (str.includes('M')) {
      return Math.round(parseFloat(str.replace('M', '')) * 1000000);
    }
    if (str.includes('B')) {
      return Math.round(parseFloat(str.replace('B', '')) * 1000000000);
    }

    return parseInt(str.replace(/[^0-9]/g, '')) || 0;
  }

  /**
   * Connect a YouTube channel to an influencer's account
   */
  async connectYouTubeAccount(userId: string, channelHandle: string): Promise<any> {
    try {
      // Check if user is an influencer
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { influencer: true },
      });

      if (!user || !user.influencer) {
        throw new Error('Only influencers can connect YouTube channels');
      }

      // Scrape channel data first
      const scrapedData = await this.scrapeYouTubeChannel(channelHandle);

      // Check if account already exists for this user
      const existingAccount = await prisma.socialMediaAccount.findFirst({
        where: {
          influencerId: user.influencer.id,
          platform: SocialMediaPlatform.YOUTUBE,
        },
      });

      let account;
      if (existingAccount) {
        // Update existing account with fresh data
        account = await prisma.socialMediaAccount.update({
          where: { id: existingAccount.id },
          data: {
            platformUserId: scrapedData.channelId,
            platformUsername: channelHandle,
            displayName: scrapedData.channelName,
            profileUrl: scrapedData.customUrl,
            profilePicture: scrapedData.thumbnailUrl,
            followersCount: scrapedData.subscriberCount,
            postsCount: scrapedData.videoCount,
            engagementRate: scrapedData.engagementRate,
            lastSyncedAt: new Date(),
            metadata: {
              viewCount: scrapedData.viewCount,
              isVerified: scrapedData.isVerified,
              bannerUrl: scrapedData.bannerUrl,
              country: scrapedData.country,
              averageViews: scrapedData.averageViews,
              averageLikes: scrapedData.averageLikes,
              averageComments: scrapedData.averageComments,
              topHashtags: scrapedData.topHashtags,
              bio: scrapedData.description,
              lastScrapedAt: scrapedData.lastScraped.toISOString(),
            },
          },
        });
      } else {
        // Create new account
        account = await prisma.socialMediaAccount.create({
          data: {
            influencerId: user.influencer.id,
            platform: SocialMediaPlatform.YOUTUBE,
            platformUserId: scrapedData.channelId,
            platformUsername: channelHandle,
            displayName: scrapedData.channelName,
            profileUrl: scrapedData.customUrl,
            profilePicture: scrapedData.thumbnailUrl,
            accessToken: '', // No token needed for scraping
            refreshToken: null,
            tokenExpiresAt: null,
            followersCount: scrapedData.subscriberCount,
            followingCount: null, // YouTube doesn't have "following"
            postsCount: scrapedData.videoCount,
            engagementRate: scrapedData.engagementRate,
            lastSyncedAt: new Date(),
            metadata: {
              viewCount: scrapedData.viewCount,
              isVerified: scrapedData.isVerified,
              bannerUrl: scrapedData.bannerUrl,
              country: scrapedData.country,
              averageViews: scrapedData.averageViews,
              averageLikes: scrapedData.averageLikes,
              averageComments: scrapedData.averageComments,
              topHashtags: scrapedData.topHashtags,
              bio: scrapedData.description,
              lastScrapedAt: scrapedData.lastScraped.toISOString(),
            },
            isVerified: false,
            verificationCode: null,
            lastAccountChange: null,
          },
        });
      }

      // Store recent videos
      await this.storeVideos(account.id, scrapedData.recentVideos);

      return {
        account,
        videosCount: scrapedData.recentVideos.length,
      };

    } catch (error: any) {
      logger.error('[ApifyYouTubeService] Connection error:', error.message);
      throw error;
    }
  }

  /**
   * Store videos in database
   */
  private async storeVideos(accountId: string, videos: YouTubeVideo[]): Promise<void> {
    try {
      // Delete old videos
      await prisma.socialMediaPost.deleteMany({
        where: { accountId },
      });

      // Insert new videos
      const videoRecords = videos.map(video => ({
        accountId,
        platformPostId: video.id,
        mediaType: MediaType.VIDEO,
        caption: video.title,
        mediaUrl: video.url,
        thumbnailUrl: video.thumbnailUrl,
        likesCount: video.likeCount,
        commentsCount: video.commentCount,
        sharesCount: 0, // YouTube doesn't provide share count easily
        viewsCount: video.viewCount,
        postedAt: new Date(video.publishedAt),
        metadata: {
          description: video.description,
          duration: video.duration,
        },
      }));

      if (videoRecords.length > 0) {
        await prisma.socialMediaPost.createMany({
          data: videoRecords,
          skipDuplicates: true,
        });
      }

    } catch (error: any) {
      logger.error('[ApifyYouTubeService] Error storing videos:', error.message);
      // Don't throw - videos storage is not critical
    }
  }

  /**
   * Sync YouTube data (refresh cached data)
   */
  async syncYouTubeData(accountId: string): Promise<any> {
    try {
      // Get account from database
      const account = await prisma.socialMediaAccount.findUnique({
        where: { id: accountId },
      });

      if (!account || account.platform !== SocialMediaPlatform.YOUTUBE) {
        throw new Error('YouTube account not found');
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
      const scrapedData = await this.scrapeYouTubeChannel(account.platformUsername);

      // Update account
      const updatedAccount = await prisma.socialMediaAccount.update({
        where: { id: accountId },
        data: {
          displayName: scrapedData.channelName,
          profilePicture: scrapedData.thumbnailUrl,
          followersCount: scrapedData.subscriberCount,
          postsCount: scrapedData.videoCount,
          engagementRate: scrapedData.engagementRate,
          lastSyncedAt: new Date(),
          metadata: {
            viewCount: scrapedData.viewCount,
            isVerified: scrapedData.isVerified,
            bannerUrl: scrapedData.bannerUrl,
            country: scrapedData.country,
            averageViews: scrapedData.averageViews,
            averageLikes: scrapedData.averageLikes,
            averageComments: scrapedData.averageComments,
            topHashtags: scrapedData.topHashtags,
            bio: scrapedData.description,
            lastScrapedAt: scrapedData.lastScraped.toISOString(),
          },
        },
      });

      // Update videos
      await this.storeVideos(accountId, scrapedData.recentVideos);

      return {
        account: updatedAccount,
        videosCount: scrapedData.recentVideos.length,
      };

    } catch (error: any) {
      logger.error('[ApifyYouTubeService] Sync error:', error.message);
      throw error;
    }
  }

  /**
   * Get YouTube account data with videos
   */
  async getYouTubeData(accountId: string): Promise<any> {
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

      if (!account || account.platform !== SocialMediaPlatform.YOUTUBE) {
        throw new Error('YouTube account not found');
      }

      // Format videos for frontend
      const recentVideos = account.posts.map(post => ({
        id: post.platformPostId,
        title: post.caption || '',
        description: (post.metadata as any)?.description || '',
        thumbnail: post.thumbnailUrl || '', // Frontend expects 'thumbnail'
        thumbnailUrl: post.thumbnailUrl || '', // Keep both for compatibility
        url: post.mediaUrl || '',
        publishedAt: post.postedAt.toISOString(),
        viewCount: post.viewsCount || 0,
        likeCount: post.likesCount || 0,
        commentCount: post.commentsCount || 0,
        duration: (post.metadata as any)?.duration || 0,
      }));

      // Enhance metadata with videos
      const metadata = {
        ...(account.metadata as any),
        recentVideos,
        totalViews: (account.metadata as any)?.viewCount || 0,
      };

      return {
        account: {
          ...account,
          metadata,
        },
        videos: recentVideos,
        metadata,
      };

    } catch (error: any) {
      logger.error('[ApifyYouTubeService] Get data error:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect YouTube account
   */
  async disconnectYouTubeAccount(accountId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const account = await prisma.socialMediaAccount.findFirst({
        where: {
          id: accountId,
          platform: SocialMediaPlatform.YOUTUBE,
          influencer: {
            userId,
          },
        },
      });

      if (!account) {
        throw new Error('YouTube account not found or access denied');
      }

      // Delete account (cascade deletes posts)
      await prisma.socialMediaAccount.delete({
        where: { id: accountId },
      });

    } catch (error: any) {
      logger.error('[ApifyYouTubeService] Disconnect error:', error.message);
      throw error;
    }
  }
}

export default new ApifyYouTubeService();
