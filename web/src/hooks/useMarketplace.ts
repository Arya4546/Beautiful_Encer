import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import marketplaceService, {
  type ProjectFilters,
  type CreateProjectData,
  type UpdateProjectData,
  type SubmitApplicationData,
  type ApplicationStatus,
} from '../services/marketplace.service';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Query keys
export const MARKETPLACE_KEYS = {
  all: ['marketplace'] as const,
  projects: () => [...MARKETPLACE_KEYS.all, 'projects'] as const,
  projectList: (filters: ProjectFilters) => [...MARKETPLACE_KEYS.projects(), 'list', filters] as const,
  projectDetail: (id: string) => [...MARKETPLACE_KEYS.projects(), 'detail', id] as const,
  salonProjects: (status?: string) => [...MARKETPLACE_KEYS.projects(), 'salon', status] as const,
  applications: () => [...MARKETPLACE_KEYS.all, 'applications'] as const,
  myApplications: (status?: ApplicationStatus) => [...MARKETPLACE_KEYS.applications(), 'my', status] as const,
  projectApplications: (projectId: string, status?: ApplicationStatus) =>
    [...MARKETPLACE_KEYS.applications(), 'project', projectId, status] as const,
  categories: () => [...MARKETPLACE_KEYS.all, 'categories'] as const,
  tags: () => [...MARKETPLACE_KEYS.all, 'tags'] as const,
};

/**
 * Hook to fetch public projects with filters (Influencer)
 */
export const usePublicProjects = (filters: ProjectFilters = {}) => {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.projectList(filters),
    queryFn: () => marketplaceService.getPublicProjects(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch project by ID
 */
export const useProject = (projectId: string) => {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.projectDetail(projectId),
    queryFn: () => marketplaceService.getProjectById(projectId),
    enabled: !!projectId,
  });
};

/**
 * Hook to fetch salon's projects (Salon)
 */
export const useSalonProjects = (status?: string) => {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.salonProjects(status),
    queryFn: () => marketplaceService.getSalonProjects(status),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook to fetch categories
 */
export const useCategories = () => {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.categories(),
    queryFn: () => marketplaceService.getCategories(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook to fetch popular tags
 */
export const usePopularTags = (limit = 20) => {
  return useQuery({
    queryKey: [...MARKETPLACE_KEYS.tags(), limit],
    queryFn: () => marketplaceService.getPopularTags(limit),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook to create project (Salon)
 */
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CreateProjectData) => marketplaceService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.salonProjects() });
      toast.success(t('marketplace.createProject.saveSuccess'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('marketplace.errors.submitFailed'));
    },
  });
};

/**
 * Hook to update project (Salon)
 */
export const useUpdateProject = (projectId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: UpdateProjectData) => marketplaceService.updateProject(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.projectDetail(projectId) });
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.salonProjects() });
      toast.success(t('marketplace.createProject.updateSuccess'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('marketplace.errors.updateFailed'));
    },
  });
};

/**
 * Hook to publish project (Salon)
 */
export const usePublishProject = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (projectId: string) => marketplaceService.publishProject(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.projectDetail(projectId) });
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.salonProjects() });
      toast.success(t('marketplace.manageProjects.projectCard.publishSuccess'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('marketplace.errors.submitFailed'));
    },
  });
};

/**
 * Hook to close applications (Salon)
 */
export const useCloseApplications = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (projectId: string) => marketplaceService.closeApplications(projectId),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.projectDetail(projectId) });
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.salonProjects() });
      toast.success(t('marketplace.manageProjects.projectCard.closeSuccess'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('marketplace.errors.submitFailed'));
    },
  });
};

/**
 * Hook to delete project (Salon)
 */
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (projectId: string) => marketplaceService.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.salonProjects() });
      toast.success(t('marketplace.manageProjects.projectCard.deleteSuccess'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('marketplace.errors.deleteFailed'));
    },
  });
};

/**
 * Hook to submit application (Influencer)
 */
export const useSubmitApplication = (projectId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: SubmitApplicationData) =>
      marketplaceService.submitApplication(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.projectDetail(projectId) });
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.myApplications() });
      toast.success(t('marketplace.application.successMessage'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('marketplace.errors.submitFailed'));
    },
  });
};

/**
 * Hook to fetch influencer's applications (Influencer)
 */
export const useMyApplications = (status?: ApplicationStatus) => {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.myApplications(status),
    queryFn: () => marketplaceService.getMyApplications(status),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook to fetch project applications (Salon)
 */
export const useProjectApplications = (projectId: string, status?: ApplicationStatus) => {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.projectApplications(projectId, status),
    queryFn: () => marketplaceService.getProjectApplications(projectId, status),
    enabled: !!projectId,
  });
};

/**
 * Hook to accept application (Salon)
 */
export const useAcceptApplication = (projectId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (applicationId: string) => marketplaceService.acceptApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.projectApplications(projectId) });
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.projectDetail(projectId) });
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.salonProjects() });
      toast.success(t('marketplace.applications.applicantCard.acceptSuccess'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('marketplace.errors.submitFailed'));
    },
  });
};

/**
 * Hook to reject application (Salon)
 */
export const useRejectApplication = (projectId: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ applicationId, reason }: { applicationId: string; reason?: string }) =>
      marketplaceService.rejectApplication(applicationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.projectApplications(projectId) });
      toast.success(t('marketplace.applications.applicantCard.rejectSuccess'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('marketplace.errors.submitFailed'));
    },
  });
};

/**
 * Hook to withdraw application (Influencer)
 */
export const useWithdrawApplication = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (applicationId: string) => marketplaceService.withdrawApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEYS.myApplications() });
      toast.success(t('marketplace.myApplications.withdrawSuccess'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('marketplace.errors.submitFailed'));
    },
  });
};
