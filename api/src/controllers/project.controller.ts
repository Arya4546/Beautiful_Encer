import { Request, Response } from 'express';
import projectService from '../services/project.service.js';
import { ProjectType, ProjectStatus } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../lib/prisma.js';

class ProjectController {
  private io: SocketIOServer | null = null;

  setSocketIO(io: SocketIOServer) {
    this.io = io;
    console.log('[ProjectController] Socket.IO instance set');
  }

  /**
   * @route   POST /api/v1/projects
   * @desc    Create a new project proposal (salon only)
   * @access  Private (Salon)
   */
  async createProject(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      if (userRole !== 'SALON') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only salons can create project proposals',
        });
      }

      const {
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
      } = req.body;

      // Validate required fields
      if (!influencerId || !title || !projectType || !description || !startDate || !endDate || !budget || !deliverables) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Missing required fields: influencerId, title, projectType, description, startDate, endDate, budget, deliverables',
        });
      }

      // Validate project type
      if (!Object.values(ProjectType).includes(projectType)) {
        return res.status(400).json({
          error: 'Validation error',
          message: `Invalid project type. Must be one of: ${Object.values(ProjectType).join(', ')}`,
        });
      }

      // Get salon ID from user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { salon: true },
      });

      if (!user?.salon) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Salon profile not found',
        });
      }

      const salonId = user.salon.id;

      // Create project
      const project = await projectService.createProject({
        salonId,
        influencerId,
        title,
        projectType,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget: parseFloat(budget),
        deliverables: Array.isArray(deliverables) ? deliverables : [deliverables],
        requirements,
        location,
        category,
      });

      // Send real-time notification to influencer
      if (this.io) {
        const influencer = await prisma.influencer.findUnique({
          where: { id: influencerId },
          include: { user: true },
        });

        if (influencer) {
          // Create notification in database
          const notification = await prisma.notification.create({
            data: {
              userId: influencer.userId,
              type: 'PROJECT_RECEIVED',
              title: 'New Project Proposal',
              message: `${user.salon.businessName} has sent you a project proposal: ${title}`,
              isRead: false,
              metadata: JSON.stringify({
                projectId: project.id,
                salonId,
                salonName: user.salon.businessName,
              }),
            },
          });

          // Send via Socket.IO
          this.io.to(influencer.userId).emit('notification', notification);
          console.log(`[ProjectController.createProject] Notification sent to influencer ${influencer.userId}`);
        }
      }

      return res.status(201).json({
        success: true,
        data: project,
        message: 'Project proposal sent successfully',
      });
    } catch (error: any) {
      console.error('[ProjectController.createProject] Error:', error);

      if (error.message.includes('not found') || error.message.includes('not active')) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      if (error.message.includes('connected') || error.message.includes('permission')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('date')) {
        return res.status(400).json({
          error: 'Validation error',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to create project proposal',
        details: error.message,
      });
    }
  }

  /**
   * @route   GET /api/v1/projects/:id
   * @desc    Get project by ID
   * @access  Private (Salon or Influencer involved in project)
   */
  async getProjectById(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      const project = await projectService.getProjectById(id, userId);

      return res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error: any) {
      console.error('[ProjectController.getProjectById] Error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      if (error.message.includes('permission')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to fetch project',
        details: error.message,
      });
    }
  }

  /**
   * @route   GET /api/v1/projects
   * @desc    Get projects with filters
   * @access  Private
   */
  async getProjects(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      const { salonId, influencerId, status, page, limit } = req.query;

      const result = await projectService.getProjects(
        {
          salonId: salonId as string,
          influencerId: influencerId as string,
          status: status as ProjectStatus,
          page: page ? parseInt(page as string) : undefined,
          limit: limit ? parseInt(limit as string) : undefined,
        },
        userId
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('[ProjectController.getProjects] Error:', error);

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to fetch projects',
        details: error.message,
      });
    }
  }

  /**
   * @route   PATCH /api/v1/projects/:id
   * @desc    Update project (salon only, pending projects only)
   * @access  Private (Salon)
   */
  async updateProject(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      if (userRole !== 'SALON') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only salons can update projects',
        });
      }

      const {
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
      } = req.body;

      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (projectType !== undefined) updates.projectType = projectType;
      if (description !== undefined) updates.description = description;
      if (startDate !== undefined) updates.startDate = new Date(startDate);
      if (endDate !== undefined) updates.endDate = new Date(endDate);
      if (budget !== undefined) updates.budget = parseFloat(budget);
      if (deliverables !== undefined) updates.deliverables = Array.isArray(deliverables) ? deliverables : [deliverables];
      if (requirements !== undefined) updates.requirements = requirements;
      if (location !== undefined) updates.location = location;
      if (category !== undefined) updates.category = category;

      const project = await projectService.updateProject(id, userId, updates);

      return res.status(200).json({
        success: true,
        data: project,
        message: 'Project updated successfully',
      });
    } catch (error: any) {
      console.error('[ProjectController.updateProject] Error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      if (error.message.includes('Only') || error.message.includes('Can only')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      if (error.message.includes('must be') || error.message.includes('date')) {
        return res.status(400).json({
          error: 'Validation error',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to update project',
        details: error.message,
      });
    }
  }

  /**
   * @route   POST /api/v1/projects/:id/accept
   * @desc    Accept project proposal (influencer only)
   * @access  Private (Influencer)
   */
  async acceptProject(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      if (userRole !== 'INFLUENCER') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only influencers can accept projects',
        });
      }

      const project = await projectService.acceptProject(id, userId);

      // Send notification to salon
      if (this.io) {
        const salon = project.salon;
        const influencer = project.influencer;

        // Create notification
        const notification = await prisma.notification.create({
          data: {
            userId: salon.userId,
            type: 'PROJECT_ACCEPTED',
            title: 'Project Accepted',
            message: `${influencer.user.name} has accepted your project proposal: ${project.title}`,
            isRead: false,
            metadata: JSON.stringify({
              projectId: project.id,
              influencerId: project.influencerId,
              influencerName: influencer.user.name,
            }),
          },
        });

        // Send via Socket.IO
        this.io.to(salon.userId).emit('notification', notification);
        console.log(`[ProjectController.acceptProject] Notification sent to salon ${salon.userId}`);
      }

      return res.status(200).json({
        success: true,
        data: project,
        message: 'Project accepted successfully',
      });
    } catch (error: any) {
      console.error('[ProjectController.acceptProject] Error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      if (error.message.includes('Only') || error.message.includes('already')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to accept project',
        details: error.message,
      });
    }
  }

  /**
   * @route   POST /api/v1/projects/:id/reject
   * @desc    Reject project proposal (influencer only)
   * @access  Private (Influencer)
   */
  async rejectProject(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { id } = req.params;
      const { reason } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      if (userRole !== 'INFLUENCER') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only influencers can reject projects',
        });
      }

      const project = await projectService.rejectProject(id, userId, reason);

      // Send notification to salon
      if (this.io) {
        const salon = project.salon;
        const influencer = project.influencer;

        // Create notification
        const notification = await prisma.notification.create({
          data: {
            userId: salon.userId,
            type: 'PROJECT_REJECTED',
            title: 'Project Rejected',
            message: `${influencer.user.name} has declined your project proposal: ${project.title}`,
            isRead: false,
            metadata: JSON.stringify({
              projectId: project.id,
              influencerId: project.influencerId,
              influencerName: influencer.user.name,
              rejectionReason: reason,
            }),
          },
        });

        // Send via Socket.IO
        this.io.to(salon.userId).emit('notification', notification);
        console.log(`[ProjectController.rejectProject] Notification sent to salon ${salon.userId}`);
      }

      return res.status(200).json({
        success: true,
        data: project,
        message: 'Project rejected',
      });
    } catch (error: any) {
      console.error('[ProjectController.rejectProject] Error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      if (error.message.includes('Only') || error.message.includes('already')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to reject project',
        details: error.message,
      });
    }
  }

  /**
   * @route   POST /api/v1/projects/:id/cancel
   * @desc    Cancel project (salon only)
   * @access  Private (Salon)
   */
  async cancelProject(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      if (userRole !== 'SALON') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only salons can cancel projects',
        });
      }

      const project = await projectService.cancelProject(id, userId);

      // Send notification to influencer
      if (this.io) {
        const influencer = await prisma.influencer.findUnique({
          where: { id: project.influencerId },
          include: { user: true },
        });

        if (influencer) {
          const notification = await prisma.notification.create({
            data: {
              userId: influencer.userId,
              type: 'PROJECT_CANCELLED',
              title: 'Project Cancelled',
              message: `${project.salon.businessName} has cancelled the project: ${project.title}`,
              isRead: false,
              metadata: JSON.stringify({
                projectId: project.id,
                salonId: project.salonId,
                salonName: project.salon.businessName,
              }),
            },
          });

          this.io.to(influencer.userId).emit('notification', notification);
          console.log(`[ProjectController.cancelProject] Notification sent to influencer ${influencer.userId}`);
        }
      }

      return res.status(200).json({
        success: true,
        data: project,
        message: 'Project cancelled successfully',
      });
    } catch (error: any) {
      console.error('[ProjectController.cancelProject] Error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      if (error.message.includes('Only') || error.message.includes('Can only')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to cancel project',
        details: error.message,
      });
    }
  }

  /**
   * @route   POST /api/v1/projects/:id/start
   * @desc    Mark project as in progress (salon only)
   * @access  Private (Salon)
   */
  async startProject(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      if (userRole !== 'SALON') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only salons can start projects',
        });
      }

      const project = await projectService.startProject(id, userId);

      return res.status(200).json({
        success: true,
        data: project,
        message: 'Project started successfully',
      });
    } catch (error: any) {
      console.error('[ProjectController.startProject] Error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      if (error.message.includes('Only') || error.message.includes('must be')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to start project',
        details: error.message,
      });
    }
  }

  /**
   * @route   POST /api/v1/projects/:id/complete
   * @desc    Mark project as completed (salon only)
   * @access  Private (Salon)
   */
  async completeProject(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      if (userRole !== 'SALON') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only salons can complete projects',
        });
      }

      const project = await projectService.completeProject(id, userId);

      // Send notification to influencer
      if (this.io) {
        const influencer = await prisma.influencer.findUnique({
          where: { id: project.influencerId },
          include: { user: true },
        });

        if (influencer) {
          const notification = await prisma.notification.create({
            data: {
              userId: influencer.userId,
              type: 'PROJECT_COMPLETED',
              title: 'Project Completed',
              message: `${project.salon.businessName} has marked the project as completed: ${project.title}`,
              isRead: false,
              metadata: JSON.stringify({
                projectId: project.id,
                salonId: project.salonId,
                salonName: project.salon.businessName,
              }),
            },
          });

          this.io.to(influencer.userId).emit('notification', notification);
          console.log(`[ProjectController.completeProject] Notification sent to influencer ${influencer.userId}`);
        }
      }

      return res.status(200).json({
        success: true,
        data: project,
        message: 'Project completed successfully',
      });
    } catch (error: any) {
      console.error('[ProjectController.completeProject] Error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      if (error.message.includes('Only') || error.message.includes('must be')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to complete project',
        details: error.message,
      });
    }
  }

  /**
   * @route   DELETE /api/v1/projects/:id
   * @desc    Delete project (salon only, pending projects only)
   * @access  Private (Salon)
   */
  async deleteProject(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      if (userRole !== 'SALON') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only salons can delete projects',
        });
      }

      await projectService.deleteProject(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error: any) {
      console.error('[ProjectController.deleteProject] Error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      if (error.message.includes('Only') || error.message.includes('Can only')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to delete project',
        details: error.message,
      });
    }
  }

  /**
   * @route   GET /api/v1/projects/stats/salon/:salonId
   * @desc    Get project statistics for salon
   * @access  Private (Salon)
   */
  async getSalonStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { salonId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      const stats = await projectService.getSalonProjectStats(salonId, userId);

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('[ProjectController.getSalonStats] Error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to fetch statistics',
        details: error.message,
      });
    }
  }

  /**
   * @route   GET /api/v1/projects/stats/influencer/:influencerId
   * @desc    Get project statistics for influencer
   * @access  Private (Influencer)
   */
  async getInfluencerStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { influencerId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      const stats = await projectService.getInfluencerProjectStats(influencerId, userId);

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('[ProjectController.getInfluencerStats] Error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to fetch statistics',
        details: error.message,
      });
    }
  }
}

export default new ProjectController();
