import { prisma } from '../lib/prisma.js';
import { ActivityAction, Role } from '@prisma/client';

interface ActivityLogData {
  action: ActivityAction;
  description: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  targetUserId?: string;
  targetUserName?: string;
  targetUserEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

/**
 * Format IP address for better readability
 * Converts ::1 (IPv6 localhost) to 127.0.0.1
 * Converts ::ffff:127.0.0.1 to 127.0.0.1
 */
function formatIpAddress(ip?: string): string | undefined {
  if (!ip) return undefined;
  
  // Handle IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }
  
  // Handle IPv4-mapped IPv6 addresses
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  
  return ip;
}

class AdminService {
  /**
   * Log admin activity
   */
  async logActivity(data: ActivityLogData): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          action: data.action,
          description: data.description,
          adminId: data.adminId,
          adminName: data.adminName,
          adminEmail: data.adminEmail,
          targetUserId: data.targetUserId,
          targetUserName: data.targetUserName,
          targetUserEmail: data.targetUserEmail,
          ipAddress: formatIpAddress(data.ipAddress),
          userAgent: data.userAgent,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });
    } catch (error) {
      console.error('[AdminService.logActivity] Error:', error);
      // Don't throw - logging failure shouldn't break admin operations
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalUsers,
      totalInfluencers,
      totalSalons,
      totalConnections,
      pendingConnections,
      acceptedConnections,
      totalMessages,
      totalInstagramAccounts,
      totalTikTokAccounts,
      verifiedUsers,
      unverifiedUsers,
      completedOnboarding,
    ] = await Promise.all([
      // Total users
      prisma.user.count({ where: { role: { not: Role.ADMIN } } }),
      
      // Total influencers
      prisma.user.count({ where: { role: Role.INFLUENCER } }),
      
      // Total salons
      prisma.user.count({ where: { role: Role.SALON } }),
      
      // Total connections
      prisma.connectionRequest.count(),
      
      // Pending connections
      prisma.connectionRequest.count({ where: { status: 'PENDING' } }),
      
      // Accepted connections
      prisma.connectionRequest.count({ where: { status: 'ACCEPTED' } }),
      
      // Total messages
      prisma.message.count({ where: { isDeleted: false } }),
      
      // Instagram accounts
      prisma.socialMediaAccount.count({ where: { platform: 'INSTAGRAM', isActive: true } }),
      
      // TikTok accounts
      prisma.socialMediaAccount.count({ where: { platform: 'TIKTOK', isActive: true } }),
      
      // Verified influencers
      prisma.influencer.count({ where: { emailVerified: true } }),
      
      // Unverified influencers
      prisma.influencer.count({ where: { emailVerified: false } }),
      
      // Completed onboarding (users with influencer or salon profile)
      prisma.user.count({ 
        where: { 
          OR: [
            { influencer: { isNot: null } },
            { salon: { isNot: null } }
          ]
        }
      }),
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        role: { not: Role.ADMIN },
      },
    });

    const recentConnections = await prisma.connectionRequest.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    return {
      users: {
        total: totalUsers,
        influencers: totalInfluencers,
        salons: totalSalons,
        verified: verifiedUsers,
        unverified: unverifiedUsers,
        completedOnboarding,
        recentSignups: recentUsers,
      },
      connections: {
        total: totalConnections,
        pending: pendingConnections,
        accepted: acceptedConnections,
        recent: recentConnections,
      },
      socialMedia: {
        instagram: totalInstagramAccounts,
        tiktok: totalTikTokAccounts,
        total: totalInstagramAccounts + totalTikTokAccounts,
      },
      messages: {
        total: totalMessages,
      },
    };
  }

  /**
   * Get user growth data for charts (last 30 days)
   */
  async getUserGrowthData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        role: { not: Role.ADMIN },
      },
      select: {
        createdAt: true,
        role: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const growthMap = new Map<string, { date: string; influencers: number; salons: number }>();

    users.forEach((user) => {
      const dateKey = user.createdAt.toISOString().split('T')[0];
      
      if (!growthMap.has(dateKey)) {
        growthMap.set(dateKey, { date: dateKey, influencers: 0, salons: 0 });
      }

      const entry = growthMap.get(dateKey)!;
      if (user.role === Role.INFLUENCER) {
        entry.influencers++;
      } else if (user.role === Role.SALON) {
        entry.salons++;
      }
    });

    return Array.from(growthMap.values());
  }

  /**
   * Get connection statistics for charts
   */
  async getConnectionStats() {
    const [pending, accepted, rejected] = await Promise.all([
      prisma.connectionRequest.count({ where: { status: 'PENDING' } }),
      prisma.connectionRequest.count({ where: { status: 'ACCEPTED' } }),
      prisma.connectionRequest.count({ where: { status: 'REJECTED' } }),
    ]);

    return [
      { status: 'Pending', count: pending },
      { status: 'Accepted', count: accepted },
      { status: 'Rejected', count: rejected },
    ];
  }
}

export default new AdminService();
