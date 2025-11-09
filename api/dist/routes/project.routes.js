import { Router } from 'express';
import projectController from '../controllers/project.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
const router = Router();
// Apply authentication middleware to all routes
router.use(protect);
/**
 * @route   POST /api/v1/projects
 * @desc    Create a new project proposal (salon only)
 * @access  Private (Salon)
 */
router.post('/', projectController.createProject.bind(projectController));
/**
 * @route   GET /api/v1/projects
 * @desc    Get projects with filters
 * @access  Private
 */
router.get('/', projectController.getProjects.bind(projectController));
/**
 * @route   GET /api/v1/projects/stats/salon/:salonId
 * @desc    Get project statistics for salon
 * @access  Private (Salon)
 */
router.get('/stats/salon/:salonId', projectController.getSalonStats.bind(projectController));
/**
 * @route   GET /api/v1/projects/stats/influencer/:influencerId
 * @desc    Get project statistics for influencer
 * @access  Private (Influencer)
 */
router.get('/stats/influencer/:influencerId', projectController.getInfluencerStats.bind(projectController));
/**
 * @route   GET /api/v1/projects/:id
 * @desc    Get project by ID
 * @access  Private (Salon or Influencer involved in project)
 */
router.get('/:id', projectController.getProjectById.bind(projectController));
/**
 * @route   PATCH /api/v1/projects/:id
 * @desc    Update project (salon only, pending projects only)
 * @access  Private (Salon)
 */
router.patch('/:id', projectController.updateProject.bind(projectController));
/**
 * @route   DELETE /api/v1/projects/:id
 * @desc    Delete project (salon only, pending projects only)
 * @access  Private (Salon)
 */
router.delete('/:id', projectController.deleteProject.bind(projectController));
/**
 * @route   POST /api/v1/projects/:id/accept
 * @desc    Accept project proposal (influencer only)
 * @access  Private (Influencer)
 */
router.post('/:id/accept', projectController.acceptProject.bind(projectController));
/**
 * @route   POST /api/v1/projects/:id/reject
 * @desc    Reject project proposal (influencer only)
 * @access  Private (Influencer)
 */
router.post('/:id/reject', projectController.rejectProject.bind(projectController));
/**
 * @route   POST /api/v1/projects/:id/cancel
 * @desc    Cancel project (salon only)
 * @access  Private (Salon)
 */
router.post('/:id/cancel', projectController.cancelProject.bind(projectController));
/**
 * @route   POST /api/v1/projects/:id/start
 * @desc    Mark project as in progress (salon only)
 * @access  Private (Salon)
 */
router.post('/:id/start', projectController.startProject.bind(projectController));
/**
 * @route   POST /api/v1/projects/:id/complete
 * @desc    Mark project as completed (salon only)
 * @access  Private (Salon)
 */
router.post('/:id/complete', projectController.completeProject.bind(projectController));
export default router;
