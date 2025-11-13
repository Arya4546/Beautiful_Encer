import projectMarketplaceService from '../services/projectMarketplace.service.js';
import { ProjectType, ProjectVisibility } from '@prisma/client';
/**
 * Controller for Project Marketplace operations
 * Handles project CRUD, discovery, filtering, and statistics
 */
class ProjectMarketplaceController {
    /**
     * @route   POST /api/v1/projects
     * @desc    Create a new project (Salon only)
     * @access  Private (Salon)
     */
    async createProject(req, res) {
        try {
            const { role, userId, salon } = req.user;
            // Only salons can create projects
            if (role !== 'SALON' || !salon) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Only salons can create projects',
                });
            }
            const { title, projectType, description, startDate, endDate, budget, deliverables, requirements, location, category, tags, visibility, maxApplications, applicationDeadline, } = req.body;
            // Validation
            if (!title || !projectType || !description || !startDate || !endDate || !budget || !deliverables) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Missing required fields: title, projectType, description, startDate, endDate, budget, deliverables',
                });
            }
            if (!Array.isArray(deliverables) || deliverables.length === 0) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'At least one deliverable is required',
                });
            }
            if (typeof budget !== 'number' || budget <= 0) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Budget must be a positive number',
                });
            }
            if (!Object.values(ProjectType).includes(projectType)) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Invalid project type',
                });
            }
            if (visibility && !Object.values(ProjectVisibility).includes(visibility)) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Invalid visibility value',
                });
            }
            // Validate dates
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Invalid date format for startDate or endDate',
                });
            }
            if (end <= start) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'End date must be after start date',
                });
            }
            // Validate application deadline if provided
            if (applicationDeadline) {
                const deadline = new Date(applicationDeadline);
                if (isNaN(deadline.getTime())) {
                    return res.status(400).json({
                        error: 'Validation Error',
                        message: 'Invalid date format for applicationDeadline',
                    });
                }
                if (deadline < new Date()) {
                    return res.status(400).json({
                        error: 'Validation Error',
                        message: 'Application deadline must be in the future',
                    });
                }
            }
            // Create project
            const project = await projectMarketplaceService.createProject(salon.id, {
                title,
                projectType,
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                budget,
                deliverables,
                requirements,
                location,
                category,
                tags: tags || [],
                visibility: visibility || ProjectVisibility.DRAFT,
                maxApplications: maxApplications || 50,
                applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
            });
            return res.status(201).json({
                success: true,
                data: project,
                message: 'Project created successfully',
            });
        }
        catch (error) {
            console.error('[ProjectMarketplaceController.createProject] Error:', error);
            return res.status(500).json({
                error: 'Server Error',
                message: error.message || 'Failed to create project',
            });
        }
    }
    /**
     * @route   GET /api/v1/projects
     * @desc    Get public projects with filters (Influencer discovery)
     * @access  Private (Influencer)
     */
    async getPublicProjects(req, res) {
        try {
            const { role } = req.user;
            // Only influencers can discover public projects
            if (role !== 'INFLUENCER') {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Only influencers can access project marketplace',
                });
            }
            const { category, minBudget, maxBudget, projectType, location, tags, search, page, limit, } = req.query;
            // Parse and validate query parameters
            const pageNum = parseInt(page) || 1;
            const limitNum = Math.min(parseInt(limit) || 20, 100); // Max 100 per page
            const filters = {};
            if (category)
                filters.category = category;
            if (minBudget)
                filters.minBudget = parseFloat(minBudget);
            if (maxBudget)
                filters.maxBudget = parseFloat(maxBudget);
            if (projectType)
                filters.projectType = projectType;
            if (location)
                filters.location = location;
            if (tags) {
                filters.tags = Array.isArray(tags) ? tags : [tags];
            }
            if (search)
                filters.search = search;
            const result = await projectMarketplaceService.getPublicProjects(filters, pageNum, limitNum);
            return res.status(200).json({
                success: true,
                data: result.projects,
                pagination: result.pagination,
            });
        }
        catch (error) {
            console.error('[ProjectMarketplaceController.getPublicProjects] Error:', error);
            return res.status(500).json({
                error: 'Server Error',
                message: error.message || 'Failed to fetch projects',
            });
        }
    }
    /**
     * @route   GET /api/v1/projects/:id
     * @desc    Get project by ID (increments view count)
     * @access  Private
     */
    async getProjectById(req, res) {
        try {
            const { id } = req.params;
            const { role, influencer } = req.user;
            if (!id) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Project ID is required',
                });
            }
            // Increment view count only for influencers viewing public projects
            const incrementView = role === 'INFLUENCER';
            const result = await projectMarketplaceService.getProjectById(id, incrementView);
            const project = result.project;
            // Check if influencer has already applied
            let hasApplied = false;
            let applicationStatus = null;
            if (role === 'INFLUENCER' && influencer && result.project.applications) {
                const application = result.project.applications.find((app) => app.influencerId === influencer.id);
                if (application) {
                    hasApplied = true;
                    applicationStatus = application.status;
                }
            }
            return res.status(200).json({
                success: true,
                data: {
                    ...project,
                    hasApplied,
                    applicationStatus,
                },
            });
        }
        catch (error) {
            console.error('[ProjectMarketplaceController.getProjectById] Error:', error);
            if (error.message === 'Project not found') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Project not found',
                });
            }
            return res.status(500).json({
                error: 'Server Error',
                message: error.message || 'Failed to fetch project',
            });
        }
    }
    /**
     * @route   GET /api/v1/projects/salon/my-projects
     * @desc    Get salon's own projects with statistics
     * @access  Private (Salon)
     */
    async getSalonProjects(req, res) {
        try {
            const { role, salon } = req.user;
            if (role !== 'SALON' || !salon) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Only salons can access this endpoint',
                });
            }
            const { status, page, limit } = req.query;
            const pageNum = parseInt(page) || 1;
            const limitNum = Math.min(parseInt(limit) || 20, 100);
            const result = await projectMarketplaceService.getSalonProjects(salon.id, status, pageNum, limitNum);
            return res.status(200).json({
                success: true,
                data: result.projects,
                statistics: result.statistics,
                pagination: result.pagination,
            });
        }
        catch (error) {
            console.error('[ProjectMarketplaceController.getSalonProjects] Error:', error);
            return res.status(500).json({
                error: 'Server Error',
                message: error.message || 'Failed to fetch projects',
            });
        }
    }
    /**
     * @route   PUT /api/v1/projects/:id
     * @desc    Update project (Salon only, own projects only)
     * @access  Private (Salon)
     */
    async updateProject(req, res) {
        try {
            const { id } = req.params;
            const { role, salon } = req.user;
            if (role !== 'SALON' || !salon) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Only salons can update projects',
                });
            }
            if (!id) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Project ID is required',
                });
            }
            const updates = req.body;
            // Validate dates if provided
            if (updates.startDate) {
                updates.startDate = new Date(updates.startDate);
            }
            if (updates.endDate) {
                updates.endDate = new Date(updates.endDate);
            }
            if (updates.applicationDeadline) {
                updates.applicationDeadline = new Date(updates.applicationDeadline);
            }
            // Validate budget if provided
            if (updates.budget !== undefined && (typeof updates.budget !== 'number' || updates.budget <= 0)) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Budget must be a positive number',
                });
            }
            const project = await projectMarketplaceService.updateProject(id, salon.id, updates);
            return res.status(200).json({
                success: true,
                data: project,
                message: 'Project updated successfully',
            });
        }
        catch (error) {
            console.error('[ProjectMarketplaceController.updateProject] Error:', error);
            if (error.message === 'Project not found') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Project not found',
                });
            }
            if (error.message.includes('not own this project') || error.message.includes('Cannot update')) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: error.message,
                });
            }
            return res.status(500).json({
                error: 'Server Error',
                message: error.message || 'Failed to update project',
            });
        }
    }
    /**
     * @route   POST /api/v1/projects/:id/publish
     * @desc    Publish a draft project (make it open for applications)
     * @access  Private (Salon)
     */
    async publishProject(req, res) {
        try {
            const { id } = req.params;
            const { role, salon } = req.user;
            if (role !== 'SALON' || !salon) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Only salons can publish projects',
                });
            }
            if (!id) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Project ID is required',
                });
            }
            const project = await projectMarketplaceService.publishProject(id, salon.id);
            return res.status(200).json({
                success: true,
                data: project,
                message: 'Project published successfully',
            });
        }
        catch (error) {
            console.error('[ProjectMarketplaceController.publishProject] Error:', error);
            if (error.message === 'Project not found') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Project not found',
                });
            }
            if (error.message.includes('not own') || error.message.includes('Only DRAFT') || error.message.includes('required fields')) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: error.message,
                });
            }
            return res.status(500).json({
                error: 'Server Error',
                message: error.message || 'Failed to publish project',
            });
        }
    }
    /**
     * @route   POST /api/v1/projects/:id/close-applications
     * @desc    Close applications for a project (stop accepting new applications)
     * @access  Private (Salon)
     */
    async closeApplications(req, res) {
        try {
            const { id } = req.params;
            const { role, salon } = req.user;
            if (role !== 'SALON' || !salon) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Only salons can close applications',
                });
            }
            if (!id) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Project ID is required',
                });
            }
            const project = await projectMarketplaceService.closeApplications(id, salon.id);
            return res.status(200).json({
                success: true,
                data: project,
                message: 'Applications closed successfully',
            });
        }
        catch (error) {
            console.error('[ProjectMarketplaceController.closeApplications] Error:', error);
            if (error.message === 'Project not found') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Project not found',
                });
            }
            if (error.message.includes('not own') || error.message.includes('Cannot close')) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: error.message,
                });
            }
            return res.status(500).json({
                error: 'Server Error',
                message: error.message || 'Failed to close applications',
            });
        }
    }
    /**
     * @route   DELETE /api/v1/projects/:id
     * @desc    Delete a project (only if no accepted applications)
     * @access  Private (Salon)
     */
    async deleteProject(req, res) {
        try {
            const { id } = req.params;
            const { role, salon } = req.user;
            if (role !== 'SALON' || !salon) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Only salons can delete projects',
                });
            }
            if (!id) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Project ID is required',
                });
            }
            await projectMarketplaceService.deleteProject(id, salon.id);
            return res.status(200).json({
                success: true,
                message: 'Project deleted successfully',
            });
        }
        catch (error) {
            console.error('[ProjectMarketplaceController.deleteProject] Error:', error);
            if (error.message === 'Project not found') {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Project not found',
                });
            }
            if (error.message.includes('not own') || error.message.includes('Cannot delete')) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: error.message,
                });
            }
            return res.status(500).json({
                error: 'Server Error',
                message: error.message || 'Failed to delete project',
            });
        }
    }
    /**
     * @route   GET /api/v1/projects/categories
     * @desc    Get all distinct project categories
     * @access  Public
     */
    async getCategories(req, res) {
        try {
            const categories = await projectMarketplaceService.getCategories();
            return res.status(200).json({
                success: true,
                data: categories,
            });
        }
        catch (error) {
            console.error('[ProjectMarketplaceController.getCategories] Error:', error);
            return res.status(500).json({
                error: 'Server Error',
                message: error.message || 'Failed to fetch categories',
            });
        }
    }
    /**
     * @route   GET /api/v1/projects/tags/popular
     * @desc    Get popular tags with usage counts
     * @access  Public
     */
    async getPopularTags(req, res) {
        try {
            const { limit } = req.query;
            const limitNum = Math.min(parseInt(limit) || 20, 50);
            const tags = await projectMarketplaceService.getPopularTags(limitNum);
            return res.status(200).json({
                success: true,
                data: tags,
            });
        }
        catch (error) {
            console.error('[ProjectMarketplaceController.getPopularTags] Error:', error);
            return res.status(500).json({
                error: 'Server Error',
                message: error.message || 'Failed to fetch tags',
            });
        }
    }
}
export default new ProjectMarketplaceController();
