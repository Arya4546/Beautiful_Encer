import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { SocialMediaPlatform } from '@prisma/client';
// Instagram now uses Apify scraping service
import apifyInstagramService from '../services/apify.instagram.service.js';
// TikTok now uses Apify scraping service for public accounts
import apifyTikTokService from '../services/apify.tiktok.service.js';
import tiktokService from '../services/tiktok.service.js';
import logger from '../utils/logger.util.js';

/**
 * Data Sync Scheduler Job
 * 
 * Automatically syncs social media data (followers, posts, engagement) for all active accounts
 * Runs daily at 3:00 AM (after token refresh job)
 * 
 * Features:
 * - Syncs all active accounts
 * - Instagram: Uses Apify scraping (7-day cache)
 * - TikTok Public: Uses Apify scraping (7-day cache)
 * - TikTok OAuth: Uses OAuth API for connected accounts
 * - Updates follower counts and engagement metrics
 * - Fetches latest posts/videos
 * - Rate-limited to avoid API throttling
 * - Tracks last sync time
 */

class DataSyncSchedulerJob {
  private isRunning = false;
  private readonly SYNC_DELAY_MS = 2000; // 2 seconds between accounts to avoid rate limits

  /**
   * Initialize the cron job
   */
  init() {
    // Run daily at 3:00 AM (1 hour after token refresh)
    cron.schedule('0 3 * * *', async () => {
      logger.log('[DataSyncScheduler] Starting scheduled data sync...');
      await this.syncAllAccounts();
    });

    logger.log('[DataSyncScheduler] Initialized - will run daily at 3:00 AM');
  }

  /**
   * Sync all active social media accounts
   */
  async syncAllAccounts() {
    if (this.isRunning) {
      logger.log('[DataSyncScheduler] Already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      // Find all active accounts
      const activeAccounts = await prisma.socialMediaAccount.findMany({
        where: {
          isActive: true,
          // Only sync if last sync was more than 7 days ago (matches Apify cache duration)
          // This reduces Apify API costs by respecting the cache window
          OR: [
            { lastSyncedAt: null },
            { lastSyncedAt: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          ],
        },
        include: {
          influencer: true,
        },
      });

      logger.log(`[DataSyncScheduler] Found ${activeAccounts.length} accounts to sync`);

      let successCount = 0;
      let failureCount = 0;
      const failures: Array<{ accountId: string; platform: string; error: string }> = [];

      // Process each account with delay to respect rate limits
      for (const account of activeAccounts) {
        try {
          if (account.platform === SocialMediaPlatform.INSTAGRAM) {
            await this.syncInstagramData(account.influencerId, account);
            successCount++;
          } else if (account.platform === SocialMediaPlatform.TIKTOK) {
            // Check if this is a public account (Apify) or OAuth account
            const isPublicAccount = !account.accessToken || account.accessToken === '';
            
            if (isPublicAccount) {
              await this.syncTikTokDataApify(account.influencerId, account);
            } else {
              await this.syncTikTokDataOAuth(account.influencerId, account);
            }
            successCount++;
          }

          // Delay between accounts to avoid rate limiting
          if (activeAccounts.indexOf(account) < activeAccounts.length - 1) {
            await this.delay(this.SYNC_DELAY_MS);
          }
        } catch (error: any) {
          failureCount++;
          failures.push({
            accountId: account.id,
            platform: account.platform,
            error: error.message,
          });

          logger.error(`[DataSyncScheduler] Failed to sync ${account.platform} for account ${account.id}:`, error.message);
        }
      }

      const duration = Date.now() - startTime;
      logger.log(`[DataSyncScheduler] Completed in ${duration}ms - Success: ${successCount}, Failed: ${failureCount}`);

      if (failures.length > 0) {
        logger.error('[DataSyncScheduler] Failures:', JSON.stringify(failures, null, 2));
      }

      return {
        success: successCount,
        failed: failureCount,
        failures,
      };
    } catch (error: any) {
      logger.error('[DataSyncScheduler] Critical error:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sync Instagram account data using Apify
   */
  private async syncInstagramData(influencerId: string, account: any) {
    logger.log(`[DataSyncScheduler] Syncing Instagram data for account ${account.id}...`);

    try {
      // Use Apify service to sync data (respects 7-day cache)
      await apifyInstagramService.syncInstagramData(account.id);
      logger.log(`[DataSyncScheduler] Instagram sync completed for account ${account.id}`);
    } catch (error: any) {
      logger.error(`[DataSyncScheduler] Instagram sync failed for account ${account.id}:`, error.message);
      throw error;
    }
  }

  /**
   * Sync TikTok account data using Apify (public accounts)
   */
  private async syncTikTokDataApify(influencerId: string, account: any) {
    logger.log(`[DataSyncScheduler] Syncing TikTok data (Apify) for account ${account.id}...`);

    try {
      // Use Apify service to sync data (respects 7-day cache)
      await apifyTikTokService.syncTikTokData(account.id);
      logger.log(`[DataSyncScheduler] TikTok (Apify) sync completed for account ${account.id}`);
    } catch (error: any) {
      logger.error(`[DataSyncScheduler] TikTok (Apify) sync failed for account ${account.id}:`, error.message);
      throw error;
    }
  }

  /**
   * Sync TikTok account data using OAuth (connected accounts)
   */
  private async syncTikTokDataOAuth(influencerId: string, account: any) {
    logger.log(`[DataSyncScheduler] Syncing TikTok data (OAuth) for account ${account.id}...`);

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

    // Store/update videos
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
          mediaType: 'VIDEO' as any,
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

    logger.log(`[DataSyncScheduler] TikTok sync completed for account ${account.id}`);
  }

  /**
   * Map Instagram media type to database enum
   */
  private mapInstagramMediaType(type: string): any {
    switch (type) {
      case 'IMAGE':
        return 'IMAGE';
      case 'VIDEO':
        return 'VIDEO';
      case 'CAROUSEL_ALBUM':
        return 'CAROUSEL';
      default:
        return 'IMAGE';
    }
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Manual trigger for data sync
   */
  async triggerManualSync() {
    logger.log('[DataSyncScheduler] Manual sync triggered');
    return await this.syncAllAccounts();
  }
}

export default new DataSyncSchedulerJob();
