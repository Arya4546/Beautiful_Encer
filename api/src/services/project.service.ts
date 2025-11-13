import { prisma } from '../lib/prisma.js';
import { ProjectType, ProjectStatus, Prisma } from '@prisma/client';

interface CreateProjectParams {
  salonId: string;
  influencerId: string;
  title: string;
  projectType: ProjectType;
  description: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  deliverables: string[];
  requirements?: string;
  location?: string;
  category?: string;
}

interface UpdateProjectParams {
  title?: string;
  projectType?: ProjectType;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  deliverables?: string[];
  requirements?: string;
  location?: string;
  category?: string;
}

interface GetProjectsQuery {
  salonId?: string;
  influencerId?: string;
  status?: ProjectStatus;
  page?: number;
  limit?: number;
}

class ProjectService {
  /**
   * Create a new project proposal
   */
  async createProject(params: CreateProjectParams) {
    try {
      const {
        salonId,
        influencerId,
        title,
        projectType,
        description,
        startDate,
        endDate,
        budget,
        deliverables,
        requirements,
        location,
        category,
      } = params;

      // Validate inputs
      if (!salonId || !influencerId || !title || !projectType || !description) {
        throw new Error('Missing required fields');
      }

      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }

      if (budget <= 0) {
        throw new Error('Budget must be greater than 0');
      }

      if (!Array.isArray(deliverables) || deliverables.length === 0) {
        throw new Error('At least one deliverable is required');
      }

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();
      
      // Reset time to midnight for date-only comparison
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);

      if (start < now) {
        throw new Error('Start date cannot be in the past');
      }

      if (end <= start) {
        throw new Error('End date must be after start date');
      }

      // Verify salon exists and has active subscription
      const salon = await prisma.salon.findUnique({
        where: { id: salonId },
        include: {
          user: true,
          subscriptions: {
            where: {
              status: 'ACTIVE',
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!salon) {
        throw new Error('Salon not found');
      }

      if (!salon.paymentCompleted) {
        throw new Error('Salon subscription is not active. Please complete payment.');
      }

      // Verify influencer exists
      const influencer = await prisma.influencer.findUnique({
        where: { id: influencerId },
        include: { user: true },
      });

      if (!influencer) {
        throw new Error('Influencer not found');
      }

      // Check if connection exists between salon and influencer
      const connection = await prisma.connectionRequest.findFirst({
        where: {
          OR: [
            { senderId: salon.userId, receiverId: influencer.userId },
            { senderId: influencer.userId, receiverId: salon.userId },
          ],
          status: 'ACCEPTED',
        },
      });

      if (!connection) {
        throw new Error('You must be connected with this influencer to send project proposals');
      }

      // Create project
      const project = await prisma.project.create({
        data: {
          salonId,
          influencerId,
          title,
          projectType,
          description,
          startDate: start,
          endDate: end,
          budget: new Prisma.Decimal(budget),
          deliverables,
          requirements,
          location,
          category,
          status: ProjectStatus.PENDING,
        },
        include: {
          salon: {
            include: { user: true },
          },
          influencer: {
            include: { user: true },
          },
        },
      });

      console.log(`[ProjectService.createProject] Created project ${project.id} from salon ${salonId} to influencer ${influencerId}`);

      return project;
    } catch (error: any) {
      console.error('[ProjectService.createProject] Error:', error);
      throw error;
    }
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId: string, userId: string) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          salon: {
            include: {
              user: true,
            },
          },
          influencer: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Verify user has access to this project
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          salon: true,
          influencer: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const isAuthorized =
        (user.salon && user.salon.id === project.salonId) ||
        (user.influencer && user.influencer.id === project.influencerId);

      if (!isAuthorized) {
        throw new Error('You do not have permission to view this project');
      }

      return project;
    } catch (error: any) {
      console.error('[ProjectService.getProjectById] Error:', error);
      throw error;
    }
  }

  /**
   * Get projects with filters and pagination
   */
  async getProjects(query: GetProjectsQuery, userId: string) {
    try {
      const { salonId, influencerId, status, page = 1, limit = 20 } = query;

      // Verify user has access
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          salon: true,
          influencer: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Build where clause
      const where: any = {};

      if (salonId) {
        // Verify user owns this salon
        if (!user.salon || user.salon.id !== salonId) {
          throw new Error('Unauthorized access to salon projects');
        }
        where.salonId = salonId;
      }

      if (influencerId) {
        // Verify user owns this influencer profile
        if (!user.influencer || user.influencer.id !== influencerId) {
          throw new Error('Unauthorized access to influencer projects');
        }
        where.influencerId = influencerId;
      }

      if (status) {
        where.status = status;
      }

      // If no specific filter, show user's own projects
      if (!salonId && !influencerId) {
        if (user.salon) {
          where.salonId = user.salon.id;
        } else if (user.influencer) {
          where.influencerId = user.influencer.id;
        }
      }

      const skip = (page - 1) * limit;

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
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
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { proposedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.project.count({ where }),
      ]);

      return {
        projects,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('[ProjectService.getProjects] Error:', error);
      throw error;
    }
  }

  /**
   * Update project (only by salon, only if pending)
   */
  async updateProject(projectId: string, userId: string, updates: UpdateProjectParams) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      // Get project and verify salon ownership
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          salon: {
            include: { user: true },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      if (project.salon.userId !== userId) {
        throw new Error('Only the salon that created the project can update it');
      }

      if (project.status !== ProjectStatus.PENDING) {
        throw new Error('Can only update pending projects');
      }

      // Validate updates
      if (updates.startDate) {
        const startDate = new Date(updates.startDate);
        const now = new Date();
        startDate.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        
        if (startDate < now) {
          throw new Error('Start date cannot be in the past');
        }
      }

      if (updates.endDate && updates.startDate) {
        const startDate = new Date(updates.startDate);
        const endDate = new Date(updates.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }

      if (updates.budget && updates.budget <= 0) {
        throw new Error('Budget must be greater than 0');
      }

      // Update project
      const updated = await prisma.project.update({
        where: { id: projectId },
        data: {
          ...updates,
          budget: updates.budget ? new Prisma.Decimal(updates.budget) : undefined,
        },
        include: {
          salon: {
            include: { user: true },
          },
          influencer: {
            include: { user: true },
          },
        },
      });

      console.log(`[ProjectService.updateProject] Updated project ${projectId}`);

      return updated;
    } catch (error: any) {
      console.error('[ProjectService.updateProject] Error:', error);
      throw error;
    }
  }

  /**
   * Accept project (influencer only)
   */
  async acceptProject(projectId: string, userId: string) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      // Get project and verify influencer ownership
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          salon: {
            include: { user: true },
          },
          influencer: {
            include: { user: true },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      if (!project.influencer || project.influencer.userId !== userId) {
        throw new Error('Only the invited influencer can accept this project');
      }

      if (project.status !== ProjectStatus.PENDING) {
        throw new Error('This project has already been responded to');
      }

      // Update project status
      const updated = await prisma.project.update({
        where: { id: projectId },
        data: {
          status: ProjectStatus.ACCEPTED,
          respondedAt: new Date(),
        },
        include: {
          salon: {
            include: { user: true },
          },
          influencer: {
            include: { user: true },
          },
        },
      });

      console.log(`[ProjectService.acceptProject] Influencer ${userId} accepted project ${projectId}`);

      return updated;
    } catch (error: any) {
      console.error('[ProjectService.acceptProject] Error:', error);
      throw error;
    }
  }

  /**
   * Reject project (influencer only)
   */
  async rejectProject(projectId: string, userId: string, reason?: string) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      // Get project and verify influencer ownership
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          salon: {
            include: { user: true },
          },
          influencer: {
            include: { user: true },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      if (!project.influencer || project.influencer.userId !== userId) {
        throw new Error('Only the invited influencer can reject this project');
      }

      if (project.status !== ProjectStatus.PENDING) {
        throw new Error('This project has already been responded to');
      }

      // Update project status
      const updated = await prisma.project.update({
        where: { id: projectId },
        data: {
          status: ProjectStatus.REJECTED,
          respondedAt: new Date(),
          rejectionReason: reason,
        },
        include: {
          salon: {
            include: { user: true },
          },
          influencer: {
            include: { user: true },
          },
        },
      });

      console.log(`[ProjectService.rejectProject] Influencer ${userId} rejected project ${projectId}`);

      return updated;
    } catch (error: any) {
      console.error('[ProjectService.rejectProject] Error:', error);
      throw error;
    }
  }

  /**
   * Cancel project (salon only, only if pending or accepted)
   */
  async cancelProject(projectId: string, userId: string) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      // Get project and verify salon ownership
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          salon: {
            include: { user: true },
          },
          influencer: {
            include: { user: true },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      if (project.salon.userId !== userId) {
        throw new Error('Only the salon that created the project can cancel it');
      }

      const allowedStatuses: ProjectStatus[] = [ProjectStatus.PENDING, ProjectStatus.ACCEPTED];
      if (!allowedStatuses.includes(project.status)) {
        throw new Error('Can only cancel pending or accepted projects');
      }

      // Update project status
      const updated = await prisma.project.update({
        where: { id: projectId },
        data: {
          status: ProjectStatus.CANCELLED,
        },
        include: {
          salon: {
            include: { user: true },
          },
          influencer: {
            include: { user: true },
          },
        },
      });

      console.log(`[ProjectService.cancelProject] Salon ${userId} cancelled project ${projectId}`);

      return updated;
    } catch (error: any) {
      console.error('[ProjectService.cancelProject] Error:', error);
      throw error;
    }
  }

  /**
   * Mark project as in progress (salon only)
   */
  async startProject(projectId: string, userId: string) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          salon: {
            include: { user: true },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      if (project.salon.userId !== userId) {
        throw new Error('Only the salon can start the project');
      }

      if (project.status !== ProjectStatus.ACCEPTED) {
        throw new Error('Project must be accepted before starting');
      }

      const updated = await prisma.project.update({
        where: { id: projectId },
        data: {
          status: ProjectStatus.IN_PROGRESS,
        },
        include: {
          salon: {
            include: { user: true },
          },
          influencer: {
            include: { user: true },
          },
        },
      });

      console.log(`[ProjectService.startProject] Started project ${projectId}`);

      return updated;
    } catch (error: any) {
      console.error('[ProjectService.startProject] Error:', error);
      throw error;
    }
  }

  /**
   * Mark project as completed (salon only)
   */
  async completeProject(projectId: string, userId: string) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          salon: {
            include: { user: true },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      if (project.salon.userId !== userId) {
        throw new Error('Only the salon can complete the project');
      }

      if (project.status !== ProjectStatus.IN_PROGRESS) {
        throw new Error('Project must be in progress to complete');
      }

      const updated = await prisma.project.update({
        where: { id: projectId },
        data: {
          status: ProjectStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          salon: {
            include: { user: true },
          },
          influencer: {
            include: { user: true },
          },
        },
      });

      console.log(`[ProjectService.completeProject] Completed project ${projectId}`);

      return updated;
    } catch (error: any) {
      console.error('[ProjectService.completeProject] Error:', error);
      throw error;
    }
  }

  /**
   * Delete project (salon only, only if pending)
   */
  async deleteProject(projectId: string, userId: string) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          salon: {
            include: { user: true },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      if (project.salon.userId !== userId) {
        throw new Error('Only the salon can delete the project');
      }

      if (project.status !== ProjectStatus.PENDING) {
        throw new Error('Can only delete pending projects');
      }

      await prisma.project.delete({
        where: { id: projectId },
      });

      console.log(`[ProjectService.deleteProject] Deleted project ${projectId}`);

      return { success: true, message: 'Project deleted successfully' };
    } catch (error: any) {
      console.error('[ProjectService.deleteProject] Error:', error);
      throw error;
    }
  }

  /**
   * Get project statistics for salon
   */
  async getSalonProjectStats(salonId: string, userId: string) {
    try {
      // Verify salon ownership
      const salon = await prisma.salon.findUnique({
        where: { id: salonId },
        include: { user: true },
      });

      if (!salon) {
        throw new Error('Salon not found');
      }

      if (salon.userId !== userId) {
        throw new Error('Unauthorized access');
      }

      const [total, pending, accepted, rejected, inProgress, completed, cancelled] = await Promise.all([
        prisma.project.count({ where: { salonId } }),
        prisma.project.count({ where: { salonId, status: ProjectStatus.PENDING } }),
        prisma.project.count({ where: { salonId, status: ProjectStatus.ACCEPTED } }),
        prisma.project.count({ where: { salonId, status: ProjectStatus.REJECTED } }),
        prisma.project.count({ where: { salonId, status: ProjectStatus.IN_PROGRESS } }),
        prisma.project.count({ where: { salonId, status: ProjectStatus.COMPLETED } }),
        prisma.project.count({ where: { salonId, status: ProjectStatus.CANCELLED } }),
      ]);

      return {
        total,
        pending,
        accepted,
        rejected,
        inProgress,
        completed,
        cancelled,
      };
    } catch (error: any) {
      console.error('[ProjectService.getSalonProjectStats] Error:', error);
      throw error;
    }
  }

  /**
   * Get project statistics for influencer
   */
  async getInfluencerProjectStats(influencerId: string, userId: string) {
    try {
      // Verify influencer ownership
      const influencer = await prisma.influencer.findUnique({
        where: { id: influencerId },
        include: { user: true },
      });

      if (!influencer) {
        throw new Error('Influencer not found');
      }

      if (influencer.userId !== userId) {
        throw new Error('Unauthorized access');
      }

      const [total, pending, accepted, rejected, inProgress, completed] = await Promise.all([
        prisma.project.count({ where: { influencerId } }),
        prisma.project.count({ where: { influencerId, status: ProjectStatus.PENDING } }),
        prisma.project.count({ where: { influencerId, status: ProjectStatus.ACCEPTED } }),
        prisma.project.count({ where: { influencerId, status: ProjectStatus.REJECTED } }),
        prisma.project.count({ where: { influencerId, status: ProjectStatus.IN_PROGRESS } }),
        prisma.project.count({ where: { influencerId, status: ProjectStatus.COMPLETED } }),
      ]);

      return {
        total,
        pending,
        accepted,
        rejected,
        inProgress,
        completed,
      };
    } catch (error: any) {
      console.error('[ProjectService.getInfluencerProjectStats] Error:', error);
      throw error;
    }
  }
}

export default new ProjectService();
