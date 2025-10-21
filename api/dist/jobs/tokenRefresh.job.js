import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { SocialMediaPlatform } from '@prisma/client';
// Instagram now uses Apify scraping - no token refresh needed
// import instagramService from '../services/instagram.service.js';
import tiktokService from '../services/tiktok.service.js';
/**
 * Token Refresh Cron Job
 *
 * Automatically refreshes social media access tokens before they expire
 * Runs daily at 2:00 AM
 *
 * NOTE: Instagram now uses Apify scraping and doesn't require token refresh
 * Only TikTok uses OAuth tokens that need refreshing
 *
 * - Finds tokens expiring within 7 days
 * - Attempts to refresh them
 * - Marks as inactive if refresh fails
 * - Logs all operations for monitoring
 */
class TokenRefreshJob {
    constructor() {
        this.isRunning = false;
    }
    /**
     * Initialize the cron job
     */
    init() {
        // Run daily at 2:00 AM
        cron.schedule('0 2 * * *', async () => {
            console.log('[TokenRefreshJob] Starting scheduled token refresh...');
            await this.refreshExpiringTokens();
        });
        console.log('[TokenRefreshJob] Initialized - will run daily at 2:00 AM');
    }
    /**
     * Main refresh logic - can be called manually
     */
    async refreshExpiringTokens() {
        if (this.isRunning) {
            console.log('[TokenRefreshJob] Already running, skipping...');
            return;
        }
        this.isRunning = true;
        const startTime = Date.now();
        try {
            // Find accounts with tokens expiring within 7 days
            // Skip Instagram accounts (they use Apify scraping, no tokens)
            const expiringAccounts = await prisma.socialMediaAccount.findMany({
                where: {
                    tokenExpiresAt: {
                        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    },
                    isActive: true,
                    platform: {
                        not: SocialMediaPlatform.INSTAGRAM, // Skip Instagram, uses Apify
                    },
                },
                include: {
                    influencer: {
                        include: {
                            user: {
                                select: {
                                    email: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });
            console.log(`[TokenRefreshJob] Found ${expiringAccounts.length} accounts with expiring tokens`);
            let successCount = 0;
            let failureCount = 0;
            const failures = [];
            // Process each account
            for (const account of expiringAccounts) {
                try {
                    // Instagram uses Apify scraping - no token refresh needed
                    if (account.platform === SocialMediaPlatform.TIKTOK) {
                        await this.refreshTikTokToken(account);
                        successCount++;
                    }
                }
                catch (error) {
                    failureCount++;
                    failures.push({
                        accountId: account.id,
                        platform: account.platform,
                        error: error.message,
                    });
                    console.error(`[TokenRefreshJob] Failed to refresh ${account.platform} for account ${account.id}:`, error.message);
                    // Mark account as inactive after failure
                    await this.markAsInactive(account.id, error.message);
                }
            }
            const duration = Date.now() - startTime;
            console.log(`[TokenRefreshJob] Completed in ${duration}ms - Success: ${successCount}, Failed: ${failureCount}`);
            // Log failures for monitoring/alerting
            if (failures.length > 0) {
                console.error('[TokenRefreshJob] Failures:', JSON.stringify(failures, null, 2));
                // TODO: Send alert to monitoring service (e.g., Sentry, Slack)
            }
            return {
                success: successCount,
                failed: failureCount,
                failures,
            };
        }
        catch (error) {
            console.error('[TokenRefreshJob] Critical error:', error);
            throw error;
        }
        finally {
            this.isRunning = false;
        }
    }
    /**
     * Refresh Instagram access token (DEPRECATED - Instagram now uses Apify scraping)
     * This method is kept for reference but is no longer called
     */
    async refreshInstagramToken(account) {
        throw new Error('Instagram token refresh is deprecated. Instagram now uses Apify scraping without OAuth tokens.');
    }
    /**
     * Refresh TikTok access token using refresh token
     */
    async refreshTikTokToken(account) {
        console.log(`[TokenRefreshJob] Refreshing TikTok token for account ${account.id}...`);
        if (!account.refreshToken) {
            throw new Error('No refresh token available for TikTok account');
        }
        // Decrypt refresh token
        const currentRefreshToken = tiktokService.decryptToken(account.refreshToken);
        // Request new tokens
        const newTokenData = await tiktokService.refreshAccessToken(currentRefreshToken);
        // Encrypt new tokens
        const encryptedAccessToken = tiktokService.encryptToken(newTokenData.access_token);
        const encryptedRefreshToken = newTokenData.refresh_token
            ? tiktokService.encryptToken(newTokenData.refresh_token)
            : account.refreshToken; // Keep old refresh token if new one not provided
        // Calculate new expiration
        const newExpiresAt = new Date(Date.now() + newTokenData.expires_in * 1000);
        // Update database
        await prisma.socialMediaAccount.update({
            where: { id: account.id },
            data: {
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                tokenExpiresAt: newExpiresAt,
                updatedAt: new Date(),
            },
        });
        console.log(`[TokenRefreshJob] TikTok token refreshed successfully for account ${account.id}. New expiry: ${newExpiresAt.toISOString()}`);
    }
    /**
     * Mark account as inactive after failed refresh
     */
    async markAsInactive(accountId, reason) {
        await prisma.socialMediaAccount.update({
            where: { id: accountId },
            data: {
                isActive: false,
                updatedAt: new Date(),
            },
        });
        console.log(`[TokenRefreshJob] Marked account ${accountId} as inactive. Reason: ${reason}`);
        // TODO: Notify user that their social media connection needs to be re-authorized
        // Can create a notification in the database or send an email
    }
    /**
     * Manual trigger for token refresh (can be called via API endpoint)
     */
    async triggerManualRefresh() {
        console.log('[TokenRefreshJob] Manual refresh triggered');
        return await this.refreshExpiringTokens();
    }
}
export default new TokenRefreshJob();
