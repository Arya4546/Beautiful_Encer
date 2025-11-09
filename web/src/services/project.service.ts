import api from '../lib/axios';
import { ProjectType, ProjectStatus } from '../types/project.types.ts';

export interface Project {
  id: string;
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
  status: ProjectStatus;
  proposedAt: string;
  respondedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  salonId: string;
  influencerId: string;
  salon: {
    id: string;
    businessName: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  influencer: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface CreateProjectParams {
  influencerId: string;
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
}

export interface UpdateProjectParams {
  title?: string;
  projectType?: ProjectType;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  deliverables?: string[];
  requirements?: string;
  location?: string;
  category?: string;
}

export interface ProjectsResponse {
  success: boolean;
  projects: Project[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProjectStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  inProgress: number;
  completed: number;
  cancelled?: number;
}

class ProjectService {
  /**
   * Create a new project proposal (salon only)
   */
  async createProject(data: CreateProjectParams): Promise<Project> {
    const response = await api.post('/projects', data);
    return response.data.data;
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId: string): Promise<Project> {
    const response = await api.get(`/projects/${projectId}`);
    return response.data.data;
  }

  /**
   * Get projects with filters
   */
  async getProjects(params?: {
    salonId?: string;
    influencerId?: string;
    status?: ProjectStatus;
    page?: number;
    limit?: number;
  }): Promise<ProjectsResponse> {
    const response = await api.get('/projects', { params });
    return response.data;
  }

  /**
   * Update project (salon only, pending projects only)
   */
  async updateProject(projectId: string, data: UpdateProjectParams): Promise<Project> {
    const response = await api.patch(`/projects/${projectId}`, data);
    return response.data.data;
  }

  /**
   * Delete project (salon only, pending projects only)
   */
  async deleteProject(projectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}`);
  }

  /**
   * Accept project proposal (influencer only)
   */
  async acceptProject(projectId: string): Promise<Project> {
    const response = await api.post(`/projects/${projectId}/accept`);
    return response.data.data;
  }

  /**
   * Reject project proposal (influencer only)
   */
  async rejectProject(projectId: string, reason?: string): Promise<Project> {
    const response = await api.post(`/projects/${projectId}/reject`, { reason });
    return response.data.data;
  }

  /**
   * Cancel project (salon only)
   */
  async cancelProject(projectId: string): Promise<Project> {
    const response = await api.post(`/projects/${projectId}/cancel`);
    return response.data.data;
  }

  /**
   * Start project (salon only)
   */
  async startProject(projectId: string): Promise<Project> {
    const response = await api.post(`/projects/${projectId}/start`);
    return response.data.data;
  }

  /**
   * Complete project (salon only)
   */
  async completeProject(projectId: string): Promise<Project> {
    const response = await api.post(`/projects/${projectId}/complete`);
    return response.data.data;
  }

  /**
   * Get project statistics for salon
   */
  async getSalonStats(salonId: string): Promise<ProjectStats> {
    const response = await api.get(`/projects/stats/salon/${salonId}`);
    return response.data.data;
  }

  /**
   * Get project statistics for influencer
   */
  async getInfluencerStats(influencerId: string): Promise<ProjectStats> {
    const response = await api.get(`/projects/stats/influencer/${influencerId}`);
    return response.data.data;
  }
}

export default new ProjectService();
