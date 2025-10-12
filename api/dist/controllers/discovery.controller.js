import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';
class DiscoveryController {
    /**
     * Get influencers for salon dashboard
     * Supports: pagination, search, region filter, category filter
     */
    async getInfluencers(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Parse query parameters
            const { page = '1', limit = '12', search, region, categories, minFollowers, maxFollowers } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;
            // Build filter conditions
            const where = {
                emailVerified: true, // Only show verified influencers
            };
            // Follower count filter (via social media accounts)
            if (minFollowers || maxFollowers) {
                where.socialMediaAccounts = {
                    some: {
                        followersCount: {
                            ...(minFollowers && { gte: parseInt(minFollowers, 10) }),
                            ...(maxFollowers && { lte: parseInt(maxFollowers, 10) }),
                        },
                    },
                };
            }
            // Search by name or bio
            if (search) {
                where.OR = [
                    { user: { name: { contains: search, mode: 'insensitive' } } },
                    { bio: { contains: search, mode: 'insensitive' } },
                ];
            }
            // Filter by region
            if (region) {
                where.region = region;
            }
            // Filter by categories
            if (categories) {
                const categoryArray = categories.split(',').map(c => c.trim());
                where.categories = {
                    hasSome: categoryArray,
                };
            }
            // Fetch influencers with pagination
            const [influencers, total] = await Promise.all([
                prisma.influencer.findMany({
                    where,
                    skip,
                    take: limitNum,
                    select: {
                        id: true,
                        bio: true,
                        profilePic: true,
                        categories: true,
                        region: true,
                        age: true,
                        gender: true,
                        createdAt: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                        socialMediaAccounts: {
                            select: {
                                id: true,
                                platform: true,
                                platformUsername: true,
                                followersCount: true,
                                followingCount: true,
                                postsCount: true,
                                engagementRate: true,
                                isActive: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
                prisma.influencer.count({ where }),
            ]);
            const totalPages = Math.ceil(total / limitNum);
            const hasMore = pageNum < totalPages;
            return res.status(200).json({
                success: true,
                data: influencers,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasMore,
                },
            });
        }
        catch (error) {
            console.error('[DiscoveryController.getInfluencers] Error:', error);
            return res.status(500).json({ error: 'Failed to fetch influencers' });
        }
    }
    /**
     * Get salons/brands for influencer dashboard
     * Supports: pagination, search, category filter
     */
    async getSalons(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Parse query parameters
            const { page = '1', limit = '12', search, categories } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;
            // Build filter conditions
            const where = {
                emailVerified: true, // Only show verified salons
            };
            // Search by business name or description
            if (search) {
                where.OR = [
                    { businessName: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { user: { name: { contains: search, mode: 'insensitive' } } },
                ];
            }
            // Filter by preferred categories
            if (categories) {
                const categoryArray = categories.split(',').map(c => c.trim());
                where.preferredCategories = {
                    hasSome: categoryArray,
                };
            }
            // Fetch salons with pagination
            const [salons, total] = await Promise.all([
                prisma.salon.findMany({
                    where,
                    skip,
                    take: limitNum,
                    select: {
                        id: true,
                        businessName: true,
                        description: true,
                        profilePic: true,
                        preferredCategories: true,
                        website: true,
                        establishedYear: true,
                        teamSize: true,
                        instagramHandle: true,
                        tiktokHandle: true,
                        facebookPage: true,
                        createdAt: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
                prisma.salon.count({ where }),
            ]);
            const totalPages = Math.ceil(total / limitNum);
            const hasMore = pageNum < totalPages;
            return res.status(200).json({
                success: true,
                data: salons,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasMore,
                },
            });
        }
        catch (error) {
            console.error('[DiscoveryController.getSalons] Error:', error);
            return res.status(500).json({ error: 'Failed to fetch salons' });
        }
    }
    /**
     * Get available regions for filtering
     */
    async getRegions(req, res) {
        try {
            const regions = await prisma.influencer.findMany({
                where: {
                    region: { not: null },
                },
                select: {
                    region: true,
                },
                distinct: ['region'],
            });
            const uniqueRegions = regions
                .map(r => r.region)
                .filter((r) => r !== null)
                .sort();
            return res.status(200).json({
                success: true,
                data: uniqueRegions,
            });
        }
        catch (error) {
            console.error('[DiscoveryController.getRegions] Error:', error);
            return res.status(500).json({ error: 'Failed to fetch regions' });
        }
    }
    /**
     * Get available categories for filtering
     */
    async getCategories(req, res) {
        try {
            const userRole = req.user?.role;
            let categories = [];
            if (userRole === Role.SALON) {
                // Get categories from influencers
                const influencers = await prisma.influencer.findMany({
                    select: { categories: true },
                });
                const allCategories = influencers.flatMap(i => i.categories);
                categories = [...new Set(allCategories)].sort();
            }
            else if (userRole === Role.INFLUENCER) {
                // Get preferred categories from salons
                const salons = await prisma.salon.findMany({
                    select: { preferredCategories: true },
                });
                const allCategories = salons.flatMap(s => s.preferredCategories);
                categories = [...new Set(allCategories)].sort();
            }
            return res.status(200).json({
                success: true,
                data: categories,
            });
        }
        catch (error) {
            console.error('[DiscoveryController.getCategories] Error:', error);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
    }
}
export default new DiscoveryController();
