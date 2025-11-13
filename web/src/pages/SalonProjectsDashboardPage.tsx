import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiUsers, FiDollarSign,
  FiCalendar, FiMapPin, FiLock, FiUnlock, FiBarChart2, FiAlertCircle
} from 'react-icons/fi';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { useAuthStore } from '../store/authStore';
import {
  useSalonProjects,
  useDeleteProject,
  usePublishProject,
  useCloseApplications,
} from '../hooks/useMarketplace';
import { type Project, type ProjectStatus } from '../services/marketplace.service';
import toast from 'react-hot-toast';

// Project Status Badge
const ProjectStatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const { t } = useTranslation();

  const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
    DRAFT: {
      label: t('marketplace.manageProjects.status.draft'),
      className: 'bg-gray-100 text-gray-800',
    },
    OPEN: {
      label: t('marketplace.manageProjects.status.open'),
      className: 'bg-green-100 text-green-800',
    },
    IN_PROGRESS: {
      label: t('marketplace.manageProjects.status.inProgress'),
      className: 'bg-blue-100 text-blue-800',
    },
    COMPLETED: {
      label: t('marketplace.manageProjects.status.completed'),
      className: 'bg-purple-100 text-purple-800',
    },
    REVIEWING_APPLICATIONS: {
      label: t('marketplace.manageProjects.status.reviewing'),
      className: 'bg-yellow-100 text-yellow-800',
    },
    INFLUENCER_SELECTED: {
      label: t('marketplace.manageProjects.status.selected'),
      className: 'bg-indigo-100 text-indigo-800',
    },
    CANCELLED: {
      label: t('marketplace.manageProjects.status.closed'),
      className: 'bg-red-100 text-red-800',
    },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

// Project Type Badge Component
const ProjectTypeBadge: React.FC<{ type: Project['projectType'] }> = ({ type }) => {
  const { t } = useTranslation();

  const typeColors: Record<string, string> = {
    SPONSORED_POST: 'bg-blue-100 text-blue-800',
    PRODUCT_REVIEW: 'bg-green-100 text-green-800',
    BRAND_AMBASSADOR: 'bg-purple-100 text-purple-800',
    EVENT_COVERAGE: 'bg-orange-100 text-orange-800',
    TUTORIAL_VIDEO: 'bg-red-100 text-red-800',
    UNBOXING: 'bg-yellow-100 text-yellow-800',
    GIVEAWAY: 'bg-pink-100 text-pink-800',
    COLLABORATION: 'bg-indigo-100 text-indigo-800',
    STORE_VISIT: 'bg-teal-100 text-teal-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${typeColors[type] || typeColors.OTHER}`}>
      {t(`marketplace.projectTypes.${type.toLowerCase()}`)}
    </span>
  );
};

// Project Card Component
const ProjectCard: React.FC<{
  project: Project;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onClose: (id: string) => void;
  isProcessing: boolean;
}> = ({ project, onDelete, onPublish, onClose, isProcessing }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const applicationCount = project.applicationCount || 0;
  const startDate = new Date(project.startDate).toLocaleDateString('ja-JP');
  const endDate = new Date(project.endDate).toLocaleDateString('ja-JP');

  const handleDelete = () => {
    onDelete(project.id);
    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-soft border border-border p-6 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <ProjectStatusBadge status={project.status} />
              <ProjectTypeBadge type={project.projectType} />
            </div>
            <Link
              to={`/salon/marketplace/projects/${project.id}`}
              className="text-lg font-bold text-text-primary hover:text-magenta transition-colors line-clamp-2"
            >
              {project.title}
            </Link>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary mb-4 line-clamp-2">{project.description}</p>

        {/* Project Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center text-text-secondary">
            <FiDollarSign className="mr-2 text-green-600" />
            <span>¥{project.budget.toLocaleString()}</span>
          </div>
          <div className="flex items-center text-text-secondary">
            <FiUsers className="mr-2 text-blue-600" />
            <span>
              {applicationCount} {t('marketplace.manageProjects.applications')}
            </span>
          </div>
          {project.location && (
            <div className="flex items-center text-text-secondary">
              <FiMapPin className="mr-2 text-red-600" />
              <span className="truncate">{project.location}</span>
            </div>
          )}
          <div className="flex items-center text-text-secondary">
            <FiCalendar className="mr-2 text-purple-600" />
            <span className="truncate">
              {startDate} - {endDate}
            </span>
          </div>
        </div>

        {/* Visibility */}
        <div className="flex items-center text-xs text-text-tertiary mb-4">
          {project.visibility === 'PUBLIC' ? (
            <>
              <FiEye className="mr-1" />
              {t('marketplace.manageProjects.visibility.public')}
            </>
          ) : (
            <>
              <FiEyeOff className="mr-1" />
              {t('marketplace.manageProjects.visibility.private')}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-border">
          {project.status === 'DRAFT' && (
            <button
              onClick={() => onPublish(project.id)}
              disabled={isProcessing}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiUnlock className="mr-1" size={14} />
              {t('marketplace.manageProjects.publish')}
            </button>
          )}

          {project.status === 'OPEN' && applicationCount > 0 && (
            <button
              onClick={() => navigate(`/salon/marketplace/projects/${project.id}/applications`)}
              className="flex-1 px-3 py-2 bg-magenta text-white rounded-lg hover:bg-magenta-dark transition-colors flex items-center justify-center text-sm"
            >
              <FiUsers className="mr-1" size={14} />
              {t('marketplace.manageProjects.viewApplications')}
            </button>
          )}

          {(project.status === 'OPEN' || project.status === 'IN_PROGRESS') && (
            <button
              onClick={() => onClose(project.id)}
              disabled={isProcessing}
              className="flex-1 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiLock className="mr-1" size={14} />
              {t('marketplace.manageProjects.close')}
            </button>
          )}

          <button
            onClick={() => navigate(`/salon/marketplace/projects/${project.id}/edit`)}
            className="px-3 py-2 border border-border text-text-primary rounded-lg hover:bg-background-secondary transition-colors flex items-center justify-center text-sm"
          >
            <FiEdit2 size={14} />
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isProcessing}
            className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-text-primary mb-4">
              {t('marketplace.manageProjects.deleteProject')}
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              {t('marketplace.manageProjects.deleteConfirmMessage')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-border text-text-primary rounded-lg hover:bg-background-secondary transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Main Salon Projects Dashboard
export const SalonProjectsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');

  // Role-based access control - Redirect if not a SALON
  useEffect(() => {
    if (user && user.role !== 'SALON') {
      toast.error('Access denied: Only salons can access this page');
      navigate('/discover', { replace: true });
    }
  }, [user, navigate]);

  const { data: projectsData, isLoading } = useSalonProjects(
    statusFilter === 'ALL' ? undefined : statusFilter
  );
  const deleteProjectMutation = useDeleteProject();
  const publishProjectMutation = usePublishProject();
  const closeApplicationsMutation = useCloseApplications();

  // Don't render content until role is verified
  if (!user || user.role !== 'SALON') {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle size={64} className="mx-auto text-text-tertiary mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Access Denied
          </h2>
          <p className="text-text-secondary">
            Only salons can access this page
          </p>
        </div>
      </div>
    );
  }

  const projects = projectsData?.data || [];
  const stats = projectsData?.statistics || {
    total: 0,
    draft: 0,
    open: 0,
    reviewingApplications: 0,
    influencerSelected: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    totalApplications: 0,
  };

  const handleDelete = (projectId: string) => {
    deleteProjectMutation.mutate(projectId, {
      onSuccess: () => {
        toast.success(t('marketplace.manageProjects.deleteSuccess'));
      },
      onError: () => {
        toast.error(t('marketplace.manageProjects.deleteError'));
      },
    });
  };

  const handlePublish = (projectId: string) => {
    publishProjectMutation.mutate(projectId, {
      onSuccess: () => {
        toast.success(t('marketplace.manageProjects.publishSuccess'));
      },
      onError: () => {
        toast.error(t('marketplace.manageProjects.publishError'));
      },
    });
  };

  const handleClose = (projectId: string) => {
    closeApplicationsMutation.mutate(projectId, {
      onSuccess: () => {
        toast.success(t('marketplace.manageProjects.closeSuccess'));
      },
      onError: () => {
        toast.error(t('marketplace.manageProjects.closeError'));
      },
    });
  };

  return (
    <div className="min-h-screen bg-background-primary">
      <Header />
      <Sidebar />

      <div className="md:ml-64 pt-16 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {t('marketplace.manageProjects.title')}
              </h1>
              <p className="text-text-secondary">{t('marketplace.manageProjects.subtitle')}</p>
            </div>
            <button
              onClick={() => navigate('/salon/marketplace/create')}
              className="px-6 py-3 bg-magenta text-white rounded-lg hover:bg-magenta-dark transition-colors flex items-center shadow-md"
            >
              <FiPlus className="mr-2" />
              {t('marketplace.manageProjects.createProject')}
            </button>
          </div>

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-soft border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-tertiary">{t('marketplace.manageProjects.stats.total')}</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiBarChart2 className="text-blue-600" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-tertiary">{t('marketplace.manageProjects.status.draft')}</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <FiEyeOff className="text-gray-600" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-tertiary">{t('marketplace.manageProjects.status.open')}</p>
                  <p className="text-2xl font-bold text-green-600">{stats.open}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FiUnlock className="text-green-600" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-tertiary">{t('marketplace.manageProjects.status.inProgress')}</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiCalendar className="text-blue-600" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-tertiary">{t('marketplace.manageProjects.status.completed')}</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <FiUsers className="text-purple-600" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-tertiary">{t('marketplace.manageProjects.stats.applications')}</p>
                  <p className="text-2xl font-bold text-magenta">{stats.totalApplications}</p>
                </div>
                <div className="w-10 h-10 bg-magenta-light rounded-full flex items-center justify-center">
                  <FiUsers className="text-magenta" size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { key: 'ALL', label: t('marketplace.manageProjects.allProjects') },
              { key: 'DRAFT', label: t('marketplace.manageProjects.status.draft') },
              { key: 'OPEN', label: t('marketplace.manageProjects.status.open') },
              { key: 'IN_PROGRESS', label: t('marketplace.manageProjects.status.inProgress') },
              { key: 'COMPLETED', label: t('marketplace.manageProjects.status.completed') },
              { key: 'CLOSED', label: t('marketplace.manageProjects.status.closed') },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key as typeof statusFilter)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  statusFilter === tab.key
                    ? 'bg-magenta text-white'
                    : 'bg-white text-text-secondary hover:bg-background-secondary border border-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-soft border border-border p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-3" />
                  <div className="h-4 bg-gray-200 rounded mb-4 w-3/4" />
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-gray-200 rounded" />
                    <div className="w-10 h-10 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={handleDelete}
                  onPublish={handlePublish}
                  onClose={handleClose}
                  isProcessing={
                    deleteProjectMutation.isPending ||
                    publishProjectMutation.isPending ||
                    closeApplicationsMutation.isPending
                  }
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-soft border border-border p-12 text-center">
              <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <FiBarChart2 className="text-text-tertiary" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {t('marketplace.manageProjects.noProjects')}
              </h3>
              <p className="text-text-secondary mb-6">{t('marketplace.manageProjects.noProjectsMessage')}</p>
              <button
                onClick={() => navigate('/salon/marketplace/create')}
                className="px-6 py-3 bg-magenta text-white rounded-lg hover:bg-magenta-dark transition-colors inline-flex items-center"
              >
                <FiPlus className="mr-2" />
                {t('marketplace.manageProjects.createFirstProject')}
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
