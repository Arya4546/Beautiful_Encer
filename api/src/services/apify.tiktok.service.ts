import { ApifyClient } from 'apify-client';
import { prisma } from '../lib/prisma.js';
import { SocialMediaPlatform } from '@prisma/client';

/**
 * Apify TikTok Scraper Service (Public profiles)
 * - Uses Apify actor to fetch TikTok public profile and recent videos
 * - No OAuth required
 * - Caches data for 7 days in memory (API responses are read-through)
 * - Extracts top hashtags from video descriptions
 * - Computes engagement rate: avg((likes+comments+shares) per video)/followers * 100
 */

export interface TikTokPublicVideo {
  id: string;
  create_time?: number; // epoch seconds
  cover_image_url?: string;
  share_url?: string;
  video_description?: string;
  duration?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
}

export interface TikTokPublicProfile {
  username: string;
  display_name?: string;
  avatar_url?: string;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
  is_verified?: boolean;
  bio_description?: string;
}

export interface TikTokScrapeResult {
  profile: TikTokPublicProfile;
  videos: TikTokPublicVideo[];
  engagementRate: number; // percentage
  topHashtags: string[];
  lastScraped: Date;
}

class ApifyTikTokService {
  private client: ApifyClient;
  private actorId: string;
  private readonly CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  private cache: Map<string, { data: TikTokScrapeResult; at: number }>; // username -> result

  constructor() {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) throw new Error('APIFY_API_TOKEN is required');

    this.actorId = process.env.APIFY_TIKTOK_ACTOR_ID || 'clockworks/tiktok-scraper';
    this.client = new ApifyClient({ token });
    this.cache = new Map();
    console.log('[ApifyTikTokService] Initialized with actor:', this.actorId);
  }

  private isFresh(ts: number) {
    return Date.now() - ts < this.CACHE_DURATION_MS;
  }

  private extractTopHashtags(videos: TikTokPublicVideo[], limit = 10): string[] {
    const map = new Map<string, number>();
    for (const v of videos) {
      const text = v.video_description || '';
      const tags = text.match(/#[\w\u0590-\u05ff]+/g) || [];
      for (const raw of tags) {
        const tag = raw.slice(1).toLowerCase();
        map.set(tag, (map.get(tag) || 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([t]) => t);
  }

  private computeEngagement(videos: TikTokPublicVideo[], followers?: number): number {
    const f = followers || 0;
    if (!videos.length || !f) return 0;
    const total = videos.reduce((sum, v) => {
      const likes = v.like_count || 0;
      const comments = v.comment_count || 0;
      const shares = v.share_count || 0;
      return sum + likes + comments + shares;
    }, 0);
    const avg = total / videos.length;
    return parseFloat(((avg / f) * 100).toFixed(2));
  }

  /**
   * Scrape TikTok public data for a username.
   * The actor input differs per actor; we keep it minimal and rely on username/handle.
   */
  async scrape(usernameOrUrl: string): Promise<TikTokScrapeResult> {
    const username = usernameOrUrl.replace('@', '').trim();
    if (!username) throw new Error('TikTok username is required');

    const cached = this.cache.get(username);
    if (cached && this.isFresh(cached.at)) return cached.data;

    // Try multiple input shapes to be resilient to actor schema differences
    const profileUrl = `https://www.tiktok.com/@${username}`;
    const inputVariants: Array<{ label: string; payload: Record<string, any> }> = [
      {
        label: 'handles',
        payload: {
          handles: [username],
          maxVideosPerUser: 24,
          includeUserStats: true,
          includeVideoStats: true,
        },
      },
      {
        label: 'usernames',
        payload: {
          usernames: [username],
          maxVideosPerUser: 24,
          includeUserStats: true,
          includeVideoStats: true,
        },
      },
      {
        label: 'profiles',
        payload: {
          profiles: [profileUrl],
          maxVideosPerUser: 24,
          includeUserStats: true,
          includeVideoStats: true,
        },
      },
      {
        label: 'startUrls',
        payload: {
          startUrls: [profileUrl],
          maxVideosPerUser: 24,
          includeUserStats: true,
          includeVideoStats: true,
        },
      },
    ];

    let items: any[] | undefined;
    let lastRunId: string | undefined;
    let lastDatasetId: string | undefined;
    let triedLabels: string[] = [];

    for (const variant of inputVariants) {
      try {
        triedLabels.push(variant.label);
        const run = await this.client.actor(this.actorId).call(variant.payload);
        lastRunId = run?.id;
        lastDatasetId = run?.defaultDatasetId as any;
        const list = lastDatasetId
          ? await this.client.dataset(lastDatasetId).listItems()
          : { items: [] as any[] };
        if (list.items && list.items.length > 0) {
          items = list.items as any[];
          break;
        }
        // fallthrough to next variant
      } catch (e: any) {
        console.warn(
          `[ApifyTikTokService] Variant '${variant.label}' failed for @${username}:`,
          e?.message || e
        );
        continue;
      }
    }

    if (!items || items.length === 0) {
      const attempted = triedLabels.join(', ');
      const detail = `attempted inputs: [${attempted}]` + (lastRunId ? `, lastRunId=${lastRunId}` : '') + (lastDatasetId ? `, lastDatasetId=${lastDatasetId}` : '');
      throw new Error(`No TikTok data found for @${username} (${detail})`);
    }

    // The dataset may include multiple records (user and videos). Normalize generously.
    // We try to find a record with user/profile and aggregate videos.
    let profile: TikTokPublicProfile | undefined;
    const videos: TikTokPublicVideo[] = [];

    for (const item of items as any[]) {
      // Heuristics: if item has follower_count/display_name/username -> profile-ish
      if ((item.username || item.handle) && (item.follower_count !== undefined || item.display_name)) {
        profile = {
          username: item.username || item.handle || username,
          display_name: item.display_name,
          avatar_url: item.avatar_url || item.avatar || item.profile_image_url,
          follower_count: item.follower_count ?? item.followers ?? item.stats?.followerCount,
          following_count: item.following_count ?? item.stats?.followingCount,
          likes_count: item.likes_count ?? item.stats?.heartCount ?? item.stats?.likes,
          video_count: item.video_count ?? item.stats?.videoCount,
          is_verified: item.is_verified ?? item.verified,
          bio_description: item.bio_description ?? item.signature ?? item.bio,
        };
      }

      // If item looks like a video
      if (item.id && (item.like_count !== undefined || item.comment_count !== undefined || item.share_count !== undefined)) {
        videos.push({
          id: String(item.id),
          create_time: item.create_time || item.timestamp || item.createTime,
          cover_image_url: item.cover_image_url || item.cover || item.video?.cover || item.thumbnail_url,
          share_url: item.share_url || item.url || item.pageUrl,
          video_description: item.video_description || item.description || item.caption,
          duration: item.duration || item.video?.duration,
          like_count: item.like_count ?? item.stats?.diggCount ?? item.likes,
          comment_count: item.comment_count ?? item.stats?.commentCount ?? item.comments,
          share_count: item.share_count ?? item.stats?.shareCount ?? item.shares,
          view_count: item.view_count ?? item.stats?.playCount ?? item.views,
        });
      }

      // Some actors return an array of videos under item.videos
      if (Array.isArray(item.videos)) {
        for (const v of item.videos) {
          videos.push({
            id: String(v.id || v.video_id),
            create_time: v.create_time || v.timestamp || v.createTime,
            cover_image_url: v.cover_image_url || v.cover || v.thumbnail_url,
            share_url: v.share_url || v.url || v.pageUrl,
            video_description: v.video_description || v.description || v.caption,
            duration: v.duration || v.video?.duration,
            like_count: v.like_count ?? v.stats?.diggCount ?? v.likes,
            comment_count: v.comment_count ?? v.stats?.commentCount ?? v.comments,
            share_count: v.share_count ?? v.stats?.shareCount ?? v.shares,
            view_count: v.view_count ?? v.stats?.playCount ?? v.views,
          });
        }
      }
    }

    if (!profile) {
      // Fallback: infer minimal profile from username and aggregate stats if present
      const aggFollowers = items.find((it: any) => it.follower_count || (it as any).stats?.followerCount);
      profile = {
        username,
        display_name: username,
        follower_count: (aggFollowers as any)?.follower_count ?? (aggFollowers as any)?.stats?.followerCount,
      };
    }

    // De-dup videos by id
    const byId = new Map<string, TikTokPublicVideo>();
    for (const v of videos) {
      if (!v.id) continue;
      if (!byId.has(v.id)) byId.set(v.id, v);
    }
    const uniqueVideos = Array.from(byId.values());

    const engagementRate = this.computeEngagement(uniqueVideos, profile.follower_count);
    const topHashtags = this.extractTopHashtags(uniqueVideos);

    const result: TikTokScrapeResult = {
      profile,
      videos: uniqueVideos,
      engagementRate,
      topHashtags,
      lastScraped: new Date(),
    };

    this.cache.set(username, { data: result, at: Date.now() });
    return result;
  }

  // ===========================
  // DB-INTEGRATION HELPERS (Public, no OAuth)
  // ===========================

  private isDbCacheValid(lastSyncedAt: Date | null | undefined): boolean {
    if (!lastSyncedAt) return false;
    return Date.now() - lastSyncedAt.getTime() < this.CACHE_DURATION_MS;
  }

  /**
   * Connect or update a TikTok public account for an influencer (by username)
   */
  async connectPublicAccount(userId: string, usernameOrUrl: string) {
    const clean = usernameOrUrl.replace('@', '').trim();
    if (!clean) throw new Error('TikTok username is required');

    // Ensure influencer exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { influencer: true },
    });
    if (!user) throw new Error('User not found');
    if (!user.influencer) throw new Error('User must be an influencer to connect TikTok');

    // Scrape public data (respects in-memory cache)
    const data = await this.scrape(clean);

    const profileUrl = `https://www.tiktok.com/@${data.profile.username}`;

    // Upsert by unique (influencerId, platform)
    const existing = await prisma.socialMediaAccount.findUnique({
      where: {
        influencerId_platform: {
          influencerId: user.influencer.id,
          platform: SocialMediaPlatform.TIKTOK,
        },
      },
    });

    const metadata = {
      bio: data.profile.bio_description || '',
      isVerified: !!data.profile.is_verified,
      likesCount: data.profile.likes_count || 0,
      topHashtags: data.topHashtags,
      recentVideos: data.videos.slice(0, 12).map(v => ({
        id: v.id,
        cover_image_url: v.cover_image_url,
        share_url: v.share_url,
        video_description: v.video_description,
        like_count: v.like_count,
        comment_count: v.comment_count,
        share_count: v.share_count,
        view_count: v.view_count,
        create_time: v.create_time,
      })),
      scrapingMethod: 'apify',
    };

    let account;
    if (existing) {
      account = await prisma.socialMediaAccount.update({
        where: { id: existing.id },
        data: {
          platformUserId: data.profile.username,
          platformUsername: data.profile.username,
          displayName: data.profile.display_name || data.profile.username,
          profileUrl,
          profilePicture: data.profile.avatar_url || existing.profilePicture,
          followersCount: data.profile.follower_count || 0,
          followingCount: data.profile.following_count || 0,
          postsCount: data.profile.video_count || 0,
          engagementRate: data.engagementRate,
          isActive: true,
          accessToken: existing.accessToken || '', // keep or set empty for scraping
          lastSyncedAt: new Date(),
          metadata,
        },
      });
    } else {
      account = await prisma.socialMediaAccount.create({
        data: {
          influencerId: user.influencer.id,
          platform: SocialMediaPlatform.TIKTOK,
          platformUserId: data.profile.username,
          platformUsername: data.profile.username,
          displayName: data.profile.display_name || data.profile.username,
          profileUrl,
          profilePicture: data.profile.avatar_url || '',
          followersCount: data.profile.follower_count || 0,
          followingCount: data.profile.following_count || 0,
          postsCount: data.profile.video_count || 0,
          engagementRate: data.engagementRate,
          isActive: true,
          accessToken: '',
          lastSyncedAt: new Date(),
          metadata,
        },
      });
    }

    return {
      success: true,
      message: 'TikTok account connected successfully',
      account: {
        id: account.id,
        username: account.platformUsername,
        displayName: account.displayName,
        followersCount: account.followersCount,
        profilePicture: account.profilePicture,
        engagementRate: account.engagementRate,
        isVerified: !!(metadata as any).isVerified,
      },
    };
  }

  /**
   * Sync TikTok public data for a stored account (respects 7-day cache)
   */
  async syncPublicAccount(accountId: string) {
    const account = await prisma.socialMediaAccount.findUnique({ where: { id: accountId } });
    if (!account || account.platform !== SocialMediaPlatform.TIKTOK) {
      throw new Error('TikTok account not found');
    }

    if (this.isDbCacheValid(account.lastSyncedAt)) {
      return {
        success: true,
        message: 'Using cached data (less than 7 days old)',
        account,
        cached: true,
      };
    }

    const data = await this.scrape(account.platformUsername);

    const updated = await prisma.socialMediaAccount.update({
      where: { id: accountId },
      data: {
        displayName: data.profile.display_name || account.displayName,
        profilePicture: data.profile.avatar_url || account.profilePicture,
        followersCount: data.profile.follower_count || 0,
        followingCount: data.profile.following_count || 0,
        postsCount: data.profile.video_count || 0,
        engagementRate: data.engagementRate,
        lastSyncedAt: new Date(),
        metadata: {
          bio: data.profile.bio_description || '',
          isVerified: !!data.profile.is_verified,
          likesCount: data.profile.likes_count || 0,
          topHashtags: data.topHashtags,
          recentVideos: data.videos.slice(0, 12).map(v => ({
            id: v.id,
            cover_image_url: v.cover_image_url,
            share_url: v.share_url,
            video_description: v.video_description,
            like_count: v.like_count,
            comment_count: v.comment_count,
            share_count: v.share_count,
            view_count: v.view_count,
            create_time: v.create_time,
          })),
          scrapingMethod: 'apify',
        },
      },
    });

    return {
      success: true,
      message: 'TikTok data synced successfully',
      account: updated,
      cached: false,
    };
  }
}

export default new ApifyTikTokService();
