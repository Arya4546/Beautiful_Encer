import { Router } from 'express';
import projectMarketplaceController from '../controllers/projectMarketplace.controller.js';
import projectApplicationController from '../controllers/projectApplication.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// ============================================
// PROJECT MARKETPLACE ROUTES
// ============================================

/**
 * @route   GET /api/v1/marketplace/categories
 * @desc    Get all distinct project categories
 * @access  Public (authenticated)
 */
router.get('/categories', projectMarketplaceController.getCategories.bind(projectMarketplaceController));

/**
 * @route   GET /api/v1/marketplace/tags/popular
 * @desc    Get popular tags with usage counts
 * @access  Public (authenticated)
 */
router.get('/tags/popular', projectMarketplaceController.getPopularTags.bind(projectMarketplaceController));

/**
 * @route   POST /api/v1/marketplace/projects
 * @desc    Create a new project (Salon only)
 * @access  Private (Salon)
 */
router.post('/projects', projectMarketplaceController.createProject.bind(projectMarketplaceController));

/**
 * @route   GET /api/v1/marketplace/projects
 * @desc    Get public projects with filters (Influencer discovery)
 * @access  Private (Influencer)
 */
router.get('/projects', projectMarketplaceController.getPublicProjects.bind(projectMarketplaceController));

/**
 * @route   GET /api/v1/marketplace/projects/salon/my-projects
 * @desc    Get salon's own projects with statistics
 * @access  Private (Salon)
 */
router.get('/projects/salon/my-projects', projectMarketplaceController.getSalonProjects.bind(projectMarketplaceController));

/**
 * @route   GET /api/v1/marketplace/projects/:id
 * @desc    Get project by ID (increments view count)
 * @access  Private
 */
router.get('/projects/:id', projectMarketplaceController.getProjectById.bind(projectMarketplaceController));

/**
 * @route   PUT /api/v1/marketplace/projects/:id
 * @desc    Update project (Salon only, own projects only)
 * @access  Private (Salon)
 */
router.put('/projects/:id', projectMarketplaceController.updateProject.bind(projectMarketplaceController));

/**
 * @route   POST /api/v1/marketplace/projects/:id/publish
 * @desc    Publish a draft project (make it open for applications)
 * @access  Private (Salon)
 */
router.post('/projects/:id/publish', projectMarketplaceController.publishProject.bind(projectMarketplaceController));

/**
 * @route   POST /api/v1/marketplace/projects/:id/close-applications
 * @desc    Close applications for a project
 * @access  Private (Salon)
 */
router.post('/projects/:id/close-applications', projectMarketplaceController.closeApplications.bind(projectMarketplaceController));

/**
 * @route   DELETE /api/v1/marketplace/projects/:id
 * @desc    Delete a project (only if no accepted applications)
 * @access  Private (Salon)
 */
router.delete('/projects/:id', projectMarketplaceController.deleteProject.bind(projectMarketplaceController));

// ============================================
// APPLICATION ROUTES
// ============================================

/**
 * @route   POST /api/v1/marketplace/projects/:projectId/applications
 * @desc    Submit application to a project (Influencer only)
 * @access  Private (Influencer)
 */
router.post('/projects/:projectId/applications', projectApplicationController.submitApplication.bind(projectApplicationController));

/**
 * @route   GET /api/v1/marketplace/projects/:projectId/applications
 * @desc    Get all applications for a project (Salon only)
 * @access  Private (Salon)
 */
router.get('/projects/:projectId/applications', projectApplicationController.getProjectApplications.bind(projectApplicationController));

/**
 * @route   GET /api/v1/marketplace/projects/:projectId/has-applied
 * @desc    Check if influencer has applied to a project
 * @access  Private (Influencer)
 */
router.get('/projects/:projectId/has-applied', projectApplicationController.hasApplied.bind(projectApplicationController));

/**
 * @route   GET /api/v1/marketplace/applications/my-applications
 * @desc    Get influencer's applications with statistics
 * @access  Private (Influencer)
 */
router.get('/applications/my-applications', projectApplicationController.getInfluencerApplications.bind(projectApplicationController));

/**
 * @route   GET /api/v1/marketplace/applications/:id
 * @desc    Get application by ID
 * @access  Private (Owner or related salon/influencer)
 */
router.get('/applications/:id', projectApplicationController.getApplicationById.bind(projectApplicationController));

/**
 * @route   POST /api/v1/marketplace/applications/:id/accept
 * @desc    Accept an application (Salon only, auto-rejects others)
 * @access  Private (Salon)
 */
router.post('/applications/:id/accept', projectApplicationController.acceptApplication.bind(projectApplicationController));

/**
 * @route   POST /api/v1/marketplace/applications/:id/reject
 * @desc    Reject an application (Salon only)
 * @access  Private (Salon)
 */
router.post('/applications/:id/reject', projectApplicationController.rejectApplication.bind(projectApplicationController));

/**
 * @route   POST /api/v1/marketplace/applications/:id/withdraw
 * @desc    Withdraw an application (Influencer only)
 * @access  Private (Influencer)
 */
router.post('/applications/:id/withdraw', projectApplicationController.withdrawApplication.bind(projectApplicationController));

export default router;
