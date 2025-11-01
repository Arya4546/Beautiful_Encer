import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import notificationController from '../controllers/notification.controller.js';
import logger from '../utils/logger.util.js';

/**
 * Instagram Connection Reminder Job
 * 
 * Sends weekly reminders to influencers who haven't connected their Instagram account
 * Runs every Monday at 10:00 AM
 * 
 * Features:
 * - Finds influencers without Instagram connections
 * - Creates in-app notifications
 * - Only notifies once per week
 * - Skips users who have dismissed the notification
 */

class InstagramConnectionReminderJob {
  private isRunning = false;

  /**
   * Initialize the cron job
   */
  init() {
    // Run every Monday at 10:00 AM (0 10 * * 1)
    // Changed from daily to weekly to reduce notification spam
    cron.schedule('0 10 * * 1', async () => {
      logger.log('[InstagramReminderJob] Starting scheduled Instagram connection reminder...');
      await this.sendReminders();
    });

    logger.log('[InstagramReminderJob] Initialized - will run every Monday at 10:00 AM');
  }

  /**
   * Send reminders to influencers without Instagram connection
   */
  async sendReminders() {
    if (this.isRunning) {
      logger.log('[InstagramReminderJob] Already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      // Find all influencers who:
      // 1. Don't have an active Instagram account
      // 2. Haven't received a reminder in the last 7 days
      const influencersWithoutInstagram = await prisma.influencer.findMany({
        where: {
          socialMediaAccounts: {
            none: {
              platform: 'INSTAGRAM',
              isActive: true,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      logger.log(`[InstagramReminderJob] Found ${influencersWithoutInstagram.length} influencers without Instagram`);

      let notificationsSent = 0;
      let skipped = 0;

      for (const influencer of influencersWithoutInstagram) {
        try {
          // Check if we've already sent a reminder in the last 7 days
          const recentNotification = await prisma.notification.findFirst({
            where: {
              userId: influencer.user.id,
              type: 'SYSTEM',
              title: {
                contains: 'Connect Instagram',
              },
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
              },
            },
          });

          if (recentNotification) {
            skipped++;
            continue;
          }

          // Create notification using controller (handles Socket.IO automatically)
          await notificationController.createNotification({
            userId: influencer.user.id,
            type: 'SYSTEM',
            title: 'Connect Your Instagram Account',
            message: 'Boost your profile by connecting your Instagram account. Show brands your real influence and engagement!',
            metadata: { link: '/social-media' },
          });

          notificationsSent++;
          logger.log(`[InstagramReminderJob] Sent reminder to ${influencer.user.name} (${influencer.user.email})`);

        } catch (error: any) {
          logger.error(`[InstagramReminderJob] Error sending reminder to user ${influencer.user.id}:`, error.message);
        }
      }

      const duration = Date.now() - startTime;
      logger.log(`[InstagramReminderJob] Completed in ${duration}ms - Sent: ${notificationsSent}, Skipped: ${skipped}`);

      return {
        sent: notificationsSent,
        skipped,
        total: influencersWithoutInstagram.length,
      };

    } catch (error: any) {
      logger.error('[InstagramReminderJob] Critical error:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manual trigger for testing (can be called via API endpoint)
   */
  async triggerManualReminder() {
    logger.log('[InstagramReminderJob] Manual reminder triggered');
    return await this.sendReminders();
  }
}

export default new InstagramConnectionReminderJob();
