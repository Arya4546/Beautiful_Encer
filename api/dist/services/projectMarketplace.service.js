/**
 * Project Marketplace Service
 * Handles all project marketplace operations: creating, browsing, filtering, and managing projects
 */
import { prisma } from '../lib/prisma.js';
class ProjectMarketplaceService {
    /**
     * Create a new project (Salon only)
     */
    async createProject(salonId, data) {
        try {
            const project = await prisma.project.create({
                data: {
                    salonId,
                    title: data.title,
                    projectType: data.projectType,
                    description: data.description,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                    budget: data.budget,
                    deliverables: data.deliverables,
                    requirements: data.requirements,
                    location: data.location,
                    category: data.category,
                    tags: data.tags || [],
                    visibility: data.visibility || 'PUBLIC',
                    status: data.visibility === 'DRAFT' ? 'DRAFT' : 'OPEN',
                    maxApplications: data.maxApplications || 50,
                    applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
                    isOpen: true,
                },
                include: {
                    salon: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });
            return {
                success: true,
                project,
                message: 'Project created successfully',
            };
        }
        catch (error) {
            console.error('[ProjectMarketplaceService.createProject] Error:', error);
            throw new Error(`Failed to create project: ${error.message}`);
        }
    }
    /**
     * Get all public projects with filtering, sorting, and pagination
     * This is the main discovery page for influencers
     */
    async getPublicProjects(filters = {}, page = 1, limit = 12) {
        try {
            const skip = (page - 1) * limit;
            // Build where clause
            const where = {
                visibility: 'PUBLIC',
                isOpen: true,
                status: {
                    in: ['OPEN', 'REVIEWING_APPLICATIONS'],
                },
            };
            // Apply filters
            if (filters.category) {
                where.category = filters.category;
            }
            if (filters.projectType) {
                where.projectType = filters.projectType;
            }
            if (filters.location) {
                where.location = {
                    contains: filters.location,
                    mode: 'insensitive',
                };
            }
            if (filters.minBudget !== undefined || filters.maxBudget !== undefined) {
                where.budget = {};
                if (filters.minBudget !== undefined) {
                    where.budget.gte = filters.minBudget;
                }
                if (filters.maxBudget !== undefined) {
                    where.budget.lte = filters.maxBudget;
                }
            }
            if (filters.tags && filters.tags.length > 0) {
                where.tags = {
                    hasSome: filters.tags,
                };
            }
            // Search across title, description, and category
            if (filters.search) {
                where.OR = [
                    { title: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } },
                    { category: { contains: filters.search, mode: 'insensitive' } },
                ];
            }
            // Get total count for pagination
            const total = await prisma.project.count({ where });
            // Get projects with salon info
            const projects = await prisma.project.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    { createdAt: 'desc' }, // Latest first
                ],
                include: {
                    salon: {
                        select: {
                            id: true,
                            businessName: true,
                            profilePic: true,
                            region: true,
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            applications: true,
                        },
                    },
                },
            });
            return {
                success: true,
                projects,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: skip + projects.length < total,
                },
            };
        }
        catch (error) {
            console.error('[ProjectMarketplaceService.getPublicProjects] Error:', error);
            throw new Error(`Failed to fetch projects: ${error.message}`);
        }
    }
    /**
     * Get project details by ID
     * Increments view count
     */
    async getProjectById(projectId, incrementView = true) {
        try {
            // Increment view count if requested
            if (incrementView) {
                await prisma.project.update({
                    where: { id: projectId },
                    data: {
                        viewCount: {
                            increment: 1,
                        },
                    },
                });
            }
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                include: {
                    salon: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    influencer: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    applications: {
                        include: {
                            influencer: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                    socialMediaAccounts: true,
                                },
                            },
                        },
                        orderBy: {
                            appliedAt: 'desc',
                        },
                    },
                    _count: {
                        select: {
                            applications: true,
                        },
                    },
                },
            });
            if (!project) {
                throw new Error('Project not found');
            }
            return {
                success: true,
                project,
            };
        }
        catch (error) {
            console.error('[ProjectMarketplaceService.getProjectById] Error:', error);
            throw new Error(`Failed to fetch project: ${error.message}`);
        }
    }
    /**
     * Get salon's own projects with statistics
     */
    async getSalonProjects(salonId, status, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const where = {
                salonId,
            };
            if (status) {
                where.status = status;
            }
            const [projects, total, stats] = await Promise.all([
                prisma.project.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        influencer: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                        _count: {
                            select: {
                                applications: true,
                            },
                        },
                    },
                }),
                prisma.project.count({ where }),
                // Get statistics
                prisma.project.groupBy({
                    by: ['status'],
                    where: { salonId },
                    _count: true,
                }),
            ]);
            // Get total applications count across all projects
            const totalApplications = await prisma.projectApplication.count({
                where: {
                    project: {
                        salonId,
                    },
                },
            });
            // Format stats
            const statistics = {
                total: 0,
                draft: 0,
                open: 0,
                reviewingApplications: 0,
                influencerSelected: 0,
                inProgress: 0,
                completed: 0,
                cancelled: 0,
                totalApplications,
            };
            stats.forEach((stat) => {
                statistics.total += stat._count;
                switch (stat.status) {
                    case 'DRAFT':
                        statistics.draft = stat._count;
                        break;
                    case 'OPEN':
                        statistics.open = stat._count;
                        break;
                    case 'REVIEWING_APPLICATIONS':
                        statistics.reviewingApplications = stat._count;
                        break;
                    case 'INFLUENCER_SELECTED':
                        statistics.influencerSelected = stat._count;
                        break;
                    case 'IN_PROGRESS':
                        statistics.inProgress = stat._count;
                        break;
                    case 'COMPLETED':
                        statistics.completed = stat._count;
                        break;
                    case 'CANCELLED':
                        statistics.cancelled = stat._count;
                        break;
                }
            });
            return {
                success: true,
                projects,
                statistics,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: skip + projects.length < total,
                },
            };
        }
        catch (error) {
            console.error('[ProjectMarketplaceService.getSalonProjects] Error:', error);
            throw new Error(`Failed to fetch salon projects: ${error.message}`);
        }
    }
    /**
     * Update project
     */
    async updateProject(projectId, salonId, data) {
        try {
            // Verify project belongs to salon
            const existing = await prisma.project.findFirst({
                where: { id: projectId, salonId },
            });
            if (!existing) {
                throw new Error('Project not found or access denied');
            }
            const project = await prisma.project.update({
                where: { id: projectId },
                data: {
                    ...(data.title && { title: data.title }),
                    ...(data.projectType && { projectType: data.projectType }),
                    ...(data.description && { description: data.description }),
                    ...(data.startDate && { startDate: new Date(data.startDate) }),
                    ...(data.endDate && { endDate: new Date(data.endDate) }),
                    ...(data.budget && { budget: data.budget }),
                    ...(data.deliverables && { deliverables: data.deliverables }),
                    ...(data.requirements !== undefined && { requirements: data.requirements }),
                    ...(data.location !== undefined && { location: data.location }),
                    ...(data.category !== undefined && { category: data.category }),
                    ...(data.tags && { tags: data.tags }),
                    ...(data.visibility && { visibility: data.visibility }),
                    ...(data.maxApplications && { maxApplications: data.maxApplications }),
                    ...(data.applicationDeadline !== undefined && {
                        applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
                    }),
                },
                include: {
                    salon: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });
            return {
                success: true,
                project,
                message: 'Project updated successfully',
            };
        }
        catch (error) {
            console.error('[ProjectMarketplaceService.updateProject] Error:', error);
            throw new Error(`Failed to update project: ${error.message}`);
        }
    }
    /**
     * Publish a draft project
     */
    async publishProject(projectId, salonId) {
        try {
            const project = await prisma.project.findFirst({
                where: { id: projectId, salonId },
            });
            if (!project) {
                throw new Error('Project not found or access denied');
            }
            if (project.status !== 'DRAFT') {
                throw new Error('Only draft projects can be published');
            }
            const updated = await prisma.project.update({
                where: { id: projectId },
                data: {
                    status: 'OPEN',
                    visibility: 'PUBLIC',
                    isOpen: true,
                    proposedAt: new Date(),
                },
            });
            return {
                success: true,
                project: updated,
                message: 'Project published successfully',
            };
        }
        catch (error) {
            console.error('[ProjectMarketplaceService.publishProject] Error:', error);
            throw new Error(`Failed to publish project: ${error.message}`);
        }
    }
    /**
     * Close project applications
     */
    async closeApplications(projectId, salonId) {
        try {
            const project = await prisma.project.findFirst({
                where: { id: projectId, salonId },
            });
            if (!project) {
                throw new Error('Project not found or access denied');
            }
            const updated = await prisma.project.update({
                where: { id: projectId },
                data: {
                    isOpen: false,
                    status: 'REVIEWING_APPLICATIONS',
                },
            });
            return {
                success: true,
                project: updated,
                message: 'Applications closed successfully',
            };
        }
        catch (error) {
            console.error('[ProjectMarketplaceService.closeApplications] Error:', error);
            throw new Error(`Failed to close applications: ${error.message}`);
        }
    }
    /**
     * Delete project (only if no accepted applications)
     */
    async deleteProject(projectId, salonId) {
        try {
            const project = await prisma.project.findFirst({
                where: { id: projectId, salonId },
                include: {
                    applications: {
                        where: {
                            status: 'ACCEPTED',
                        },
                    },
                },
            });
            if (!project) {
                throw new Error('Project not found or access denied');
            }
            if (project.applications.length > 0) {
                throw new Error('Cannot delete project with accepted applications');
            }
            await prisma.project.delete({
                where: { id: projectId },
            });
            return {
                success: true,
                message: 'Project deleted successfully',
            };
        }
        catch (error) {
            console.error('[ProjectMarketplaceService.deleteProject] Error:', error);
            throw new Error(`Failed to delete project: ${error.message}`);
        }
    }
    /**
     * Get categories for filtering
     */
    async getCategories() {
        try {
            const categories = await prisma.project.findMany({
                where: {
                    visibility: 'PUBLIC',
                    category: {
                        not: null,
                    },
                },
                select: {
                    category: true,
                },
                distinct: ['category'],
            });
            return {
                success: true,
                categories: categories.map((c) => c.category).filter(Boolean),
            };
        }
        catch (error) {
            console.error('[ProjectMarketplaceService.getCategories] Error:', error);
            throw new Error(`Failed to fetch categories: ${error.message}`);
        }
    }
    /**
     * Get popular tags
     */
    async getPopularTags(limit = 20) {
        try {
            const projects = await prisma.project.findMany({
                where: {
                    visibility: 'PUBLIC',
                    tags: {
                        isEmpty: false,
                    },
                },
                select: {
                    tags: true,
                },
            });
            // Count tag frequency
            const tagCounts = {};
            projects.forEach((project) => {
                project.tags.forEach((tag) => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            });
            // Sort and return top tags
            const popularTags = Object.entries(tagCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, limit)
                .map(([tag, count]) => ({ tag, count }));
            return {
                success: true,
                tags: popularTags,
            };
        }
        catch (error) {
            console.error('[ProjectMarketplaceService.getPopularTags] Error:', error);
            throw new Error(`Failed to fetch popular tags: ${error.message}`);
        }
    }
}
export default new ProjectMarketplaceService();
