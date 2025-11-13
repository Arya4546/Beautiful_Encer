import { Request, Response } from 'express';
import projectApplicationService from '../services/projectApplication.service.js';
import { ApplicationStatus } from '@prisma/client';

/**
 * Controller for Project Application operations
 * Handles application submission, review, acceptance, rejection, and withdrawal
 */
class ProjectApplicationController {
  /**
   * @route   POST /api/v1/projects/:projectId/applications
   * @desc    Submit application to a project (Influencer only)
   * @access  Private (Influencer)
   */
  async submitApplication(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { role, influencer } = req.user!;

      // Only influencers can submit applications
      if (role !== 'INFLUENCER' || !influencer) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only influencers can submit applications',
        });
      }

      if (!projectId) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Project ID is required',
        });
      }

      const {
        coverLetter,
        proposedBudget,
        estimatedDeliveryDays,
        portfolioLinks,
      } = req.body;

      // Validate required fields
      if (!coverLetter || coverLetter.trim().length === 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Cover letter is required',
        });
      }

      if (coverLetter.length > 2000) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Cover letter must be 2000 characters or less',
        });
      }

      if (proposedBudget !== undefined && (typeof proposedBudget !== 'number' || proposedBudget <= 0)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Proposed budget must be a positive number',
        });
      }

      if (estimatedDeliveryDays !== undefined && (typeof estimatedDeliveryDays !== 'number' || estimatedDeliveryDays <= 0)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Estimated delivery days must be a positive number',
        });
      }

      if (portfolioLinks && !Array.isArray(portfolioLinks)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Portfolio links must be an array',
        });
      }

      // Submit application
      const result = await projectApplicationService.submitApplication({
        projectId,
        influencerId: influencer.id,
        coverLetter: coverLetter.trim(),
        proposedBudget,
        estimatedDeliveryDays,
        portfolioLinks: portfolioLinks || [],
      });

      return res.status(201).json({
        success: true,
        data: result.application,
        message: result.message,
      });
    } catch (error: any) {
      console.error('[ProjectApplicationController.submitApplication] Error:', error);

      // Handle specific errors
      if (error.message === 'Project not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      if (
        error.message.includes('not accepting applications') ||
        error.message.includes('deadline has passed') ||
        error.message.includes('maximum number of applications') ||
        error.message.includes('already applied')
      ) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server Error',
        message: error.message || 'Failed to submit application',
      });
    }
  }

  /**
   * @route   GET /api/v1/applications/my-applications
   * @desc    Get influencer's applications with statistics
   * @access  Private (Influencer)
   */
  async getInfluencerApplications(req: Request, res: Response) {
    try {
      const { role, influencer } = req.user!;

      if (role !== 'INFLUENCER' || !influencer) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only influencers can access this endpoint',
        });
      }

      const { status, page, limit } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 20, 100);

      // Validate status if provided
      if (status && !Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid application status',
        });
      }

      const result = await projectApplicationService.getInfluencerApplications(
        influencer.id,
        status as ApplicationStatus | undefined,
        pageNum,
        limitNum
      );

      return res.status(200).json({
        success: true,
        data: result.applications,
        statistics: result.statistics,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('[ProjectApplicationController.getInfluencerApplications] Error:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: error.message || 'Failed to fetch applications',
      });
    }
  }

  /**
   * @route   GET /api/v1/projects/:projectId/applications
   * @desc    Get all applications for a project (Salon only)
   * @access  Private (Salon)
   */
  async getProjectApplications(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { role, salon } = req.user!;

      if (role !== 'SALON' || !salon) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only salons can view project applications',
        });
      }

      if (!projectId) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Project ID is required',
        });
      }

      const { status } = req.query;

      // Validate status if provided
      if (status && !Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid application status',
        });
      }

      const applications = await projectApplicationService.getProjectApplications(
        projectId,
        salon.id,
        status as ApplicationStatus | undefined
      );

      return res.status(200).json({
        success: true,
        data: applications,
      });
    } catch (error: any) {
      console.error('[ProjectApplicationController.getProjectApplications] Error:', error);

      if (error.message === 'Project not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      if (error.message.includes('not own this project')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server Error',
        message: error.message || 'Failed to fetch applications',
      });
    }
  }

  /**
   * @route   GET /api/v1/applications/:id
   * @desc    Get application by ID
   * @access  Private (Owner or related salon/influencer)
   */
  async getApplicationById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user!;

      if (!id) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Application ID is required',
        });
      }

      const application = await projectApplicationService.getApplicationById(id, userId, role);

      return res.status(200).json({
        success: true,
        data: application,
      });
    } catch (error: any) {
      console.error('[ProjectApplicationController.getApplicationById] Error:', error);

      if (error.message === 'Application not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Application not found',
        });
      }

      if (error.message.includes('do not have permission')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server Error',
        message: error.message || 'Failed to fetch application',
      });
    }
  }

  /**
   * @route   POST /api/v1/applications/:id/accept
   * @desc    Accept an application (Salon only, auto-rejects others)
   * @access  Private (Salon)
   */
  async acceptApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role, salon } = req.user!;

      if (role !== 'SALON' || !salon) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only salons can accept applications',
        });
      }

      if (!id) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Application ID is required',
        });
      }

      const result = await projectApplicationService.acceptApplication(id, salon.id);

      return res.status(200).json({
        success: true,
        data: result.application,
        message: result.message,
      });
    } catch (error: any) {
      console.error('[ProjectApplicationController.acceptApplication] Error:', error);

      if (error.message === 'Application not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Application not found',
        });
      }

      if (
        error.message.includes('not own this project') ||
        error.message.includes('already been responded to') ||
        error.message.includes('Only PENDING applications')
      ) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server Error',
        message: error.message || 'Failed to accept application',
      });
    }
  }

  /**
   * @route   POST /api/v1/applications/:id/reject
   * @desc    Reject an application (Salon only)
   * @access  Private (Salon)
   */
  async rejectApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role, salon } = req.user!;

      if (role !== 'SALON' || !salon) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only salons can reject applications',
        });
      }

      if (!id) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Application ID is required',
        });
      }

      const { reason } = req.body;

      if (reason && typeof reason !== 'string') {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Rejection reason must be a string',
        });
      }

      if (reason && reason.length > 500) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Rejection reason must be 500 characters or less',
        });
      }

      const result = await projectApplicationService.rejectApplication(
        id,
        salon.id,
        reason?.trim()
      );

      return res.status(200).json({
        success: true,
        data: result.application,
        message: result.message,
      });
    } catch (error: any) {
      console.error('[ProjectApplicationController.rejectApplication] Error:', error);

      if (error.message === 'Application not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Application not found',
        });
      }

      if (
        error.message.includes('not own this project') ||
        error.message.includes('already been responded to') ||
        error.message.includes('Only PENDING applications')
      ) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server Error',
        message: error.message || 'Failed to reject application',
      });
    }
  }

  /**
   * @route   POST /api/v1/applications/:id/withdraw
   * @desc    Withdraw an application (Influencer only)
   * @access  Private (Influencer)
   */
  async withdrawApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role, influencer } = req.user!;

      if (role !== 'INFLUENCER' || !influencer) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only influencers can withdraw applications',
        });
      }

      if (!id) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Application ID is required',
        });
      }

      const result = await projectApplicationService.withdrawApplication(id, influencer.id);

      return res.status(200).json({
        success: true,
        data: result.application,
        message: result.message,
      });
    } catch (error: any) {
      console.error('[ProjectApplicationController.withdrawApplication] Error:', error);

      if (error.message === 'Application not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Application not found',
        });
      }

      if (
        error.message.includes('do not own this application') ||
        error.message.includes('Only PENDING applications')
      ) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message,
        });
      }

      return res.status(500).json({
        error: 'Server Error',
        message: error.message || 'Failed to withdraw application',
      });
    }
  }

  /**
   * @route   GET /api/v1/projects/:projectId/has-applied
   * @desc    Check if influencer has applied to a project
   * @access  Private (Influencer)
   */
  async hasApplied(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { role, influencer } = req.user!;

      if (role !== 'INFLUENCER' || !influencer) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only influencers can check application status',
        });
      }

      if (!projectId) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Project ID is required',
        });
      }

      const result = await projectApplicationService.hasApplied(projectId, influencer.id);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[ProjectApplicationController.hasApplied] Error:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: error.message || 'Failed to check application status',
      });
    }
  }
}

export default new ProjectApplicationController();
