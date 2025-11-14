/**
 * Project Application Service
 * Handles influencer applications to projects
 */
import { prisma } from '../lib/prisma.js';
class ProjectApplicationService {
    /**
     * Submit application to a project (Influencer only)
     */
    async submitApplication(data) {
        try {
            // Check if project exists and is open
            const project = await prisma.project.findUnique({
                where: { id: data.projectId },
                include: {
                    applications: {
                        where: {
                            influencerId: data.influencerId,
                        },
                    },
                },
            });
            if (!project) {
                throw new Error('Project not found');
            }
            if (!project.isOpen) {
                throw new Error('This project is no longer accepting applications');
            }
            if (project.status !== 'OPEN' && project.status !== 'REVIEWING_APPLICATIONS') {
                throw new Error('Project is not currently accepting applications');
            }
            // Check if already applied
            if (project.applications.length > 0) {
                throw new Error('You have already applied to this project');
            }
            // Check application deadline
            if (project.applicationDeadline && new Date() > project.applicationDeadline) {
                throw new Error('Application deadline has passed');
            }
            // Check max applications
            const applicationCount = await prisma.projectApplication.count({
                where: { projectId: data.projectId },
            });
            if (project.maxApplications && applicationCount >= project.maxApplications) {
                throw new Error('Maximum number of applications reached');
            }
            // Create application
            const application = await prisma.projectApplication.create({
                data: {
                    projectId: data.projectId,
                    influencerId: data.influencerId,
                    coverLetter: data.coverLetter,
                    proposedBudget: data.proposedBudget,
                    estimatedDeliveryDays: data.estimatedDeliveryDays,
                    portfolioLinks: data.portfolioLinks || [],
                    status: 'PENDING',
                },
                include: {
                    project: {
                        include: {
                            salon: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                    influencer: {
                        include: {
                            user: true,
                            socialMediaAccounts: true,
                        },
                    },
                },
            });
            // Update project application count
            await prisma.project.update({
                where: { id: data.projectId },
                data: {
                    applicationCount: {
                        increment: 1,
                    },
                },
            });
            // Create notification for salon
            await prisma.notification.create({
                data: {
                    userId: application.project.salon.user.id,
                    type: 'PROJECT_APPLICATION',
                    title: 'New Project Application',
                    message: `${application.influencer.user.name} has applied to your project "${application.project.title}"`,
                    metadata: JSON.stringify({
                        projectId: application.projectId,
                        applicationId: application.id,
                        influencerId: application.influencerId,
                    }),
                },
            });
            return {
                success: true,
                application,
                message: 'Application submitted successfully',
            };
        }
        catch (error) {
            console.error('[ProjectApplicationService.submitApplication] Error:', error);
            throw new Error(`Failed to submit application: ${error.message}`);
        }
    }
    /**
     * Get influencer's applications
     */
    async getInfluencerApplications(influencerId, status, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const where = {
                influencerId,
            };
            if (status) {
                where.status = status;
            }
            const [applications, total, stats] = await Promise.all([
                prisma.projectApplication.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { appliedAt: 'desc' },
                    include: {
                        project: {
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
                        },
                    },
                }),
                prisma.projectApplication.count({ where }),
                // Get statistics
                prisma.projectApplication.groupBy({
                    by: ['status'],
                    where: { influencerId },
                    _count: true,
                }),
            ]);
            // Format stats
            const statistics = {
                total: 0,
                pending: 0,
                accepted: 0,
                rejected: 0,
                withdrawn: 0,
            };
            stats.forEach((stat) => {
                statistics.total += stat._count;
                switch (stat.status) {
                    case 'PENDING':
                        statistics.pending = stat._count;
                        break;
                    case 'ACCEPTED':
                        statistics.accepted = stat._count;
                        break;
                    case 'REJECTED':
                        statistics.rejected = stat._count;
                        break;
                    case 'WITHDRAWN':
                        statistics.withdrawn = stat._count;
                        break;
                }
            });
            return {
                success: true,
                applications,
                statistics,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: skip + applications.length < total,
                },
            };
        }
        catch (error) {
            console.error('[ProjectApplicationService.getInfluencerApplications] Error:', error);
            throw new Error(`Failed to fetch applications: ${error.message}`);
        }
    }
    /**
     * Get applications for a specific project (Salon only)
     */
    async getProjectApplications(projectId, salonId, status) {
        try {
            // Verify project belongs to salon
            const project = await prisma.project.findFirst({
                where: { id: projectId, salonId },
            });
            if (!project) {
                throw new Error('Project not found or access denied');
            }
            const where = {
                projectId,
            };
            if (status) {
                where.status = status;
            }
            const applications = await prisma.projectApplication.findMany({
                where,
                orderBy: { appliedAt: 'desc' },
                include: {
                    influencer: {
                        include: {
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
                                    engagementRate: true,
                                    isActive: true,
                                },
                            },
                        },
                    },
                },
            });
            return applications;
        }
        catch (error) {
            console.error('[ProjectApplicationService.getProjectApplications] Error:', error);
            throw new Error(`Failed to fetch applications: ${error.message}`);
        }
    }
    /**
     * Accept application (Salon only)
     */
    async acceptApplication(applicationId, salonId) {
        try {
            // Get application with project
            const application = await prisma.projectApplication.findUnique({
                where: { id: applicationId },
                include: {
                    project: {
                        include: {
                            salon: true,
                        },
                    },
                    influencer: {
                        include: {
                            user: true,
                        },
                    },
                },
            });
            if (!application) {
                throw new Error('Application not found');
            }
            if (application.project.salonId !== salonId) {
                throw new Error('Access denied');
            }
            if (application.status !== 'PENDING') {
                throw new Error('Application has already been processed');
            }
            // Update application status
            const updatedApplication = await prisma.projectApplication.update({
                where: { id: applicationId },
                data: {
                    status: 'ACCEPTED',
                    respondedAt: new Date(),
                },
            });
            // Update project with selected influencer
            await prisma.project.update({
                where: { id: application.projectId },
                data: {
                    influencerId: application.influencerId,
                    status: 'INFLUENCER_SELECTED',
                    isOpen: false,
                    respondedAt: new Date(),
                },
            });
            // Reject all other pending applications for this project
            await prisma.projectApplication.updateMany({
                where: {
                    projectId: application.projectId,
                    id: {
                        not: applicationId,
                    },
                    status: 'PENDING',
                },
                data: {
                    status: 'REJECTED',
                    respondedAt: new Date(),
                    rejectionReason: 'Another influencer was selected for this project',
                },
            });
            // Create notification for accepted influencer
            await prisma.notification.create({
                data: {
                    userId: application.influencer.user.id,
                    type: 'APPLICATION_ACCEPTED',
                    title: 'Application Accepted!',
                    message: `Your application for "${application.project.title}" has been accepted!`,
                    metadata: JSON.stringify({
                        projectId: application.projectId,
                        applicationId: application.id,
                        salonId,
                    }),
                },
            });
            // Notify rejected influencers
            const rejectedApplications = await prisma.projectApplication.findMany({
                where: {
                    projectId: application.projectId,
                    id: { not: applicationId },
                    status: 'REJECTED',
                },
                include: {
                    influencer: {
                        include: {
                            user: true,
                        },
                    },
                },
            });
            for (const rejected of rejectedApplications) {
                await prisma.notification.create({
                    data: {
                        userId: rejected.influencer.user.id,
                        type: 'APPLICATION_REJECTED',
                        title: 'Application Update',
                        message: `The salon has selected another influencer for "${application.project.title}"`,
                        metadata: JSON.stringify({
                            projectId: application.projectId,
                            applicationId: rejected.id,
                        }),
                    },
                });
            }
            return {
                success: true,
                application: updatedApplication,
                message: 'Application accepted successfully',
            };
        }
        catch (error) {
            console.error('[ProjectApplicationService.acceptApplication] Error:', error);
            throw new Error(`Failed to accept application: ${error.message}`);
        }
    }
    /**
     * Reject application (Salon only)
     */
    async rejectApplication(applicationId, salonId, rejectionReason) {
        try {
            const application = await prisma.projectApplication.findUnique({
                where: { id: applicationId },
                include: {
                    project: {
                        include: {
                            salon: true,
                        },
                    },
                    influencer: {
                        include: {
                            user: true,
                        },
                    },
                },
            });
            if (!application) {
                throw new Error('Application not found');
            }
            if (application.project.salonId !== salonId) {
                throw new Error('Access denied');
            }
            if (application.status !== 'PENDING') {
                throw new Error('Application has already been processed');
            }
            const updatedApplication = await prisma.projectApplication.update({
                where: { id: applicationId },
                data: {
                    status: 'REJECTED',
                    respondedAt: new Date(),
                    rejectionReason,
                },
            });
            // Create notification for influencer
            await prisma.notification.create({
                data: {
                    userId: application.influencer.user.id,
                    type: 'APPLICATION_REJECTED',
                    title: 'Application Update',
                    message: `Your application for "${application.project.title}" was not selected this time`,
                    metadata: JSON.stringify({
                        projectId: application.projectId,
                        applicationId: application.id,
                        reason: rejectionReason,
                    }),
                },
            });
            return {
                success: true,
                application: updatedApplication,
                message: 'Application rejected',
            };
        }
        catch (error) {
            console.error('[ProjectApplicationService.rejectApplication] Error:', error);
            throw new Error(`Failed to reject application: ${error.message}`);
        }
    }
    /**
     * Withdraw application (Influencer only)
     */
    async withdrawApplication(applicationId, influencerId) {
        try {
            const application = await prisma.projectApplication.findUnique({
                where: { id: applicationId },
                include: {
                    project: {
                        include: {
                            salon: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!application) {
                throw new Error('Application not found');
            }
            if (application.influencerId !== influencerId) {
                throw new Error('Access denied');
            }
            if (application.status !== 'PENDING') {
                throw new Error('Cannot withdraw a processed application');
            }
            const updatedApplication = await prisma.projectApplication.update({
                where: { id: applicationId },
                data: {
                    status: 'WITHDRAWN',
                    respondedAt: new Date(),
                },
            });
            // Update project application count
            await prisma.project.update({
                where: { id: application.projectId },
                data: {
                    applicationCount: {
                        decrement: 1,
                    },
                },
            });
            return {
                success: true,
                application: updatedApplication,
                message: 'Application withdrawn successfully',
            };
        }
        catch (error) {
            console.error('[ProjectApplicationService.withdrawApplication] Error:', error);
            throw new Error(`Failed to withdraw application: ${error.message}`);
        }
    }
    /**
     * Get application by ID
     */
    async getApplicationById(applicationId, userId, userRole) {
        try {
            const application = await prisma.projectApplication.findUnique({
                where: { id: applicationId },
                include: {
                    project: {
                        include: {
                            salon: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                    influencer: {
                        include: {
                            user: true,
                            socialMediaAccounts: true,
                        },
                    },
                },
            });
            if (!application) {
                throw new Error('Application not found');
            }
            // Check access permissions
            const isSalonOwner = application.project.salon.user.id === userId;
            const isInfluencerOwner = application.influencer.user.id === userId;
            if (!isSalonOwner && !isInfluencerOwner) {
                throw new Error('Access denied');
            }
            return {
                success: true,
                application,
            };
        }
        catch (error) {
            console.error('[ProjectApplicationService.getApplicationById] Error:', error);
            throw new Error(`Failed to fetch application: ${error.message}`);
        }
    }
    /**
     * Check if influencer has applied to a project
     */
    async hasApplied(projectId, influencerId) {
        try {
            const application = await prisma.projectApplication.findUnique({
                where: {
                    projectId_influencerId: {
                        projectId,
                        influencerId,
                    },
                },
            });
            return {
                success: true,
                hasApplied: !!application,
                application: application || null,
            };
        }
        catch (error) {
            console.error('[ProjectApplicationService.hasApplied] Error:', error);
            throw new Error(`Failed to check application status: ${error.message}`);
        }
    }
}
export default new ProjectApplicationService();
