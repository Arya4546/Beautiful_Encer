import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { SocialMediaPlatform } from '@prisma/client';
// Instagram now uses Apify scraping service
import apifyInstagramService from '../services/apify.instagram.service.js';
import tiktokService from '../services/tiktok.service.js';

/**
 * Data Sync Scheduler Job
 * 
 * Automatically syncs social media data (followers, posts, engagement) for all active accounts
 * Runs daily at 3:00 AM (after token refresh job)
 * 
 * Features:
 * - Syncs all active accounts
 * - Instagram: Uses Apify scraping (7-day cache)
 * - TikTok: Uses OAuth API
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
      console.log('[DataSyncScheduler] Starting scheduled data sync...');
      await this.syncAllAccounts();
    });

    console.log('[DataSyncScheduler] Initialized - will run daily at 3:00 AM');
  }

  /**
   * Sync all active social media accounts
   */
  async syncAllAccounts() {
    if (this.isRunning) {
      console.log('[DataSyncScheduler] Already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      // Find all active accounts
      const activeAccounts = await prisma.socialMediaAccount.findMany({
        where: {
          isActive: true,
          // Only sync if last sync was more than 12 hours ago
          OR: [
            { lastSyncedAt: null },
            { lastSyncedAt: { lte: new Date(Date.now() - 12 * 60 * 60 * 1000) } },
          ],
        },
        include: {
          influencer: true,
        },
      });

      console.log(`[DataSyncScheduler] Found ${activeAccounts.length} accounts to sync`);

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
            await this.syncTikTokData(account.influencerId, account);
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

          console.error(`[DataSyncScheduler] Failed to sync ${account.platform} for account ${account.id}:`, error.message);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[DataSyncScheduler] Completed in ${duration}ms - Success: ${successCount}, Failed: ${failureCount}`);

      if (failures.length > 0) {
        console.error('[DataSyncScheduler] Failures:', JSON.stringify(failures, null, 2));
      }

      return {
        success: successCount,
        failed: failureCount,
        failures,
      };
    } catch (error: any) {
      console.error('[DataSyncScheduler] Critical error:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sync Instagram account data using Apify
   */
  private async syncInstagramData(influencerId: string, account: any) {
    console.log(`[DataSyncScheduler] Syncing Instagram data for account ${account.id}...`);

    try {
      // Use Apify service to sync data (respects 7-day cache)
      await apifyInstagramService.syncInstagramData(account.id);
      console.log(`[DataSyncScheduler] Instagram sync completed for account ${account.id}`);
    } catch (error: any) {
      console.error(`[DataSyncScheduler] Instagram sync failed for account ${account.id}:`, error.message);
      throw error;
    }
  }

  /**
   * Sync TikTok account data
   */
  private async syncTikTokData(influencerId: string, account: any) {
    console.log(`[DataSyncScheduler] Syncing TikTok data for account ${account.id}...`);

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

    console.log(`[DataSyncScheduler] TikTok sync completed for account ${account.id}`);
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
    console.log('[DataSyncScheduler] Manual sync triggered');
    return await this.syncAllAccounts();
  }
}

export default new DataSyncSchedulerJob();
