import axios from '../lib/axios';
import { API_ENDPOINTS } from '../config/api.config';

// Types
export interface Project {
  id: string;
  salonId: string;
  influencerId?: string | null;
  title: string;
  projectType: ProjectType;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  deliverables: string[];
  requirements?: string;
  location?: string;
  category?: string;
  tags: string[];
  visibility: ProjectVisibility;
  isOpen: boolean;
  maxApplications?: number;
  applicationDeadline?: string;
  viewCount: number;
  applicationCount: number;
  status: ProjectStatus;
  proposedAt: string;
  respondedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  salon?: {
    id: string;
    businessName: string;
    profilePic?: string;
    region?: string;
  };
  influencer?: {
    id: string;
    user: {
      name: string;
    };
    profilePic?: string;
  };
  hasApplied?: boolean;
  applicationStatus?: ApplicationStatus;
}

export type ProjectType =
  | 'SPONSORED_POST'
  | 'PRODUCT_REVIEW'
  | 'BRAND_AMBASSADOR'
  | 'EVENT_COVERAGE'
  | 'TUTORIAL_VIDEO'
  | 'UNBOXING'
  | 'GIVEAWAY'
  | 'COLLABORATION'
  | 'STORE_VISIT'
  | 'OTHER';

export type ProjectStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'REVIEWING_APPLICATIONS'
  | 'INFLUENCER_SELECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ProjectVisibility = 'PUBLIC' | 'PRIVATE' | 'DRAFT';

export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface ProjectApplication {
  id: string;
  projectId: string;
  influencerId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  proposedBudget?: number;
  estimatedDeliveryDays?: number;
  portfolioLinks: string[];
  appliedAt: string;
  respondedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  influencer?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    profilePic?: string;
    bio?: string;
    categories: string[];
    socialMediaAccounts?: any[];
  };
}

export interface ProjectFilters {
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  projectType?: ProjectType;
  location?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ProjectListResponse {
  success: boolean;
  data: Project[];
  pagination: PaginationMeta;
}

export interface ProjectStatistics {
  total: number;
  draft: number;
  open: number;
  reviewingApplications: number;
  influencerSelected: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalApplications?: number;
  avgApplications?: number;
}

export interface ApplicationStatistics {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
  successRate?: number;
}

export interface CreateProjectData {
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
  tags?: string[];
  visibility?: ProjectVisibility;
  maxApplications?: number;
  applicationDeadline?: Date;
}

export interface UpdateProjectData {
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
  tags?: string[];
  visibility?: ProjectVisibility;
  maxApplications?: number;
  applicationDeadline?: Date;
}

export interface SubmitApplicationData {
  coverLetter: string;
  proposedBudget?: number;
  estimatedDeliveryDays?: number;
  portfolioLinks?: string[];
}

/**
 * Marketplace Service
 * Handles all API calls related to project marketplace and applications
 */
class MarketplaceService {
  // ============================================
  // PROJECT MARKETPLACE
  // ============================================

  /**
   * Get public projects with filters (Influencer)
   */
  async getPublicProjects(filters: ProjectFilters = {}): Promise<ProjectListResponse> {
    const response = await axios.get(API_ENDPOINTS.MARKETPLACE.PROJECTS, {
      params: {
        ...filters,
        tags: filters.tags?.join(','),
      },
    });
    return response.data;
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId: string): Promise<Project> {
    const response = await axios.get(API_ENDPOINTS.MARKETPLACE.PROJECT_DETAIL(projectId));
    return response.data.data;
  }

  /**
   * Get salon's own projects with statistics (Salon)
   */
  async getSalonProjects(status?: string, page = 1, limit = 20): Promise<{
    data: Project[];
    statistics: ProjectStatistics;
    pagination: PaginationMeta;
  }> {
    const response = await axios.get(API_ENDPOINTS.MARKETPLACE.SALON_PROJECTS, {
      params: { status, page, limit },
    });
    // Backend returns { success, data, statistics, pagination }
    return {
      data: response.data.data,
      statistics: response.data.statistics,
      pagination: response.data.pagination,
    };
  }

  /**
   * Create a new project (Salon)
   */
  async createProject(data: CreateProjectData): Promise<Project> {
    const response = await axios.post(API_ENDPOINTS.MARKETPLACE.PROJECTS, data);
    return response.data.data;
  }

  /**
   * Update project (Salon)
   */
  async updateProject(projectId: string, data: UpdateProjectData): Promise<Project> {
    const response = await axios.put(
      API_ENDPOINTS.MARKETPLACE.PROJECT_DETAIL(projectId),
      data
    );
    return response.data.data;
  }

  /**
   * Publish a draft project (Salon)
   */
  async publishProject(projectId: string): Promise<Project> {
    const response = await axios.post(API_ENDPOINTS.MARKETPLACE.PUBLISH_PROJECT(projectId));
    return response.data.data;
  }

  /**
   * Close applications for a project (Salon)
   */
  async closeApplications(projectId: string): Promise<Project> {
    const response = await axios.post(API_ENDPOINTS.MARKETPLACE.CLOSE_APPLICATIONS(projectId));
    return response.data.data;
  }

  /**
   * Delete a project (Salon)
   */
  async deleteProject(projectId: string): Promise<void> {
    await axios.delete(API_ENDPOINTS.MARKETPLACE.PROJECT_DETAIL(projectId));
  }

  /**
   * Get all project categories
   */
  async getCategories(): Promise<string[]> {
    const response = await axios.get(API_ENDPOINTS.MARKETPLACE.CATEGORIES);
    return response.data.data;
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit = 20): Promise<{ tag: string; count: number }[]> {
    const response = await axios.get(API_ENDPOINTS.MARKETPLACE.POPULAR_TAGS, {
      params: { limit },
    });
    return response.data.data;
  }

  // ============================================
  // APPLICATIONS
  // ============================================

  /**
   * Submit application to a project (Influencer)
   */
  async submitApplication(
    projectId: string,
    data: SubmitApplicationData
  ): Promise<ProjectApplication> {
    const response = await axios.post(
      API_ENDPOINTS.MARKETPLACE.SUBMIT_APPLICATION(projectId),
      data
    );
    return response.data.data;
  }

  /**
   * Get influencer's applications with statistics (Influencer)
   */
  async getMyApplications(status?: ApplicationStatus, page = 1, limit = 20): Promise<{
    data: ProjectApplication[];
    statistics: ApplicationStatistics;
    pagination: PaginationMeta;
  }> {
    const response = await axios.get(API_ENDPOINTS.MARKETPLACE.MY_APPLICATIONS, {
      params: { status, page, limit },
    });
    return response.data;
  }

  /**
   * Get all applications for a project (Salon)
   */
  async getProjectApplications(
    projectId: string,
    status?: ApplicationStatus
  ): Promise<ProjectApplication[]> {
    const response = await axios.get(
      API_ENDPOINTS.MARKETPLACE.PROJECT_APPLICATIONS(projectId),
      {
        params: { status },
      }
    );
    return response.data.data;
  }

  /**
   * Get application by ID
   */
  async getApplicationById(applicationId: string): Promise<ProjectApplication> {
    const response = await axios.get(
      API_ENDPOINTS.MARKETPLACE.APPLICATION_DETAIL(applicationId)
    );
    return response.data.data;
  }

  /**
   * Check if influencer has applied to a project
   */
  async hasApplied(projectId: string): Promise<{
    hasApplied: boolean;
    applicationId?: string;
    status?: ApplicationStatus;
  }> {
    const response = await axios.get(API_ENDPOINTS.MARKETPLACE.HAS_APPLIED(projectId));
    return response.data.data;
  }

  /**
   * Accept an application (Salon)
   */
  async acceptApplication(applicationId: string): Promise<ProjectApplication> {
    const response = await axios.post(
      API_ENDPOINTS.MARKETPLACE.ACCEPT_APPLICATION(applicationId)
    );
    return response.data.data;
  }

  /**
   * Reject an application (Salon)
   */
  async rejectApplication(
    applicationId: string,
    reason?: string
  ): Promise<ProjectApplication> {
    const response = await axios.post(
      API_ENDPOINTS.MARKETPLACE.REJECT_APPLICATION(applicationId),
      { reason }
    );
    return response.data.data;
  }

  /**
   * Withdraw an application (Influencer)
   */
  async withdrawApplication(applicationId: string): Promise<ProjectApplication> {
    const response = await axios.post(
      API_ENDPOINTS.MARKETPLACE.WITHDRAW_APPLICATION(applicationId)
    );
    return response.data.data;
  }
}

export default new MarketplaceService();
