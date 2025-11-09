import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import projectService from '../../services/project.service';
import { useAuthStore } from '../../store/authStore';
import { ProjectStatus, projectStatusLabels, projectStatusColors, projectTypeLabels, ProjectType } from '../../types/project.types';
import { BottomNav } from '../../components/layout/BottomNav';

const ProjectInvitations: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL' | 'PENDING'>('PENDING');

  const influencerId = user?.influencer?.id;

  // Fetch projects
  const { data, isLoading } = useQuery({
    queryKey: ['influencer-projects', influencerId, statusFilter],
    queryFn: () =>
      projectService.getProjects({
        influencerId,
        status: statusFilter === 'ALL' ? undefined : (statusFilter as ProjectStatus),
      }),
    enabled: !!influencerId,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['influencer-project-stats', influencerId],
    queryFn: () => projectService.getInfluencerStats(influencerId!),
    enabled: !!influencerId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const projects = data?.projects || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            {t('projects.projectInvitations')}
          </h1>
          <p className="mt-2 text-gray-600">{t('projects.createDescription')}</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="text-sm text-gray-600 mb-1">{t('projects.stats.total')}</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 shadow-md border border-yellow-200">
              <div className="text-sm text-yellow-700 mb-1">{t('projects.stats.pending')}</div>
              <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 shadow-md border border-green-200">
              <div className="text-sm text-green-700 mb-1">{t('projects.stats.accepted')}</div>
              <div className="text-2xl font-bold text-green-800">{stats.accepted}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 shadow-md border border-red-200">
              <div className="text-sm text-red-700 mb-1">{t('projects.stats.rejected')}</div>
              <div className="text-2xl font-bold text-red-800">{stats.rejected}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 shadow-md border border-blue-200">
              <div className="text-sm text-blue-700 mb-1">{t('projects.stats.inProgress')}</div>
              <div className="text-2xl font-bold text-blue-800">{stats.inProgress}</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 shadow-md border border-purple-200">
              <div className="text-sm text-purple-700 mb-1">{t('projects.stats.completed')}</div>
              <div className="text-2xl font-bold text-purple-800">{stats.completed}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'PENDING'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('projects.pending')}
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('common.all')}
            </button>
            {[ProjectStatus.ACCEPTED, ProjectStatus.REJECTED, ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {projectStatusLabels[status][i18n.language as 'en' | 'ja']}
              </button>
            ))}
          </div>
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-gray-600 text-lg">
              {statusFilter === 'PENDING' ? t('projects.noPendingInvitations') : t('projects.noProjects')}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: any) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                {/* Status Badge & Type */}
                <div className="p-4 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                        projectStatusColors[project.status as ProjectStatus]
                      }`}
                    >
                      {projectStatusLabels[project.status as ProjectStatus][i18n.language as 'en' | 'ja']}
                    </span>
                    {project.status === ProjectStatus.PENDING && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                        </svg>
                        {t('common.new')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {projectTypeLabels[project.projectType as ProjectType][i18n.language as 'en' | 'ja']}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 pt-2">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{project.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>

                  {/* Salon */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                      {project.salon.businessName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{project.salon.businessName}</div>
                      <div className="text-xs text-gray-500">{t('common.salon')}</div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        {new Date(project.startDate).toLocaleDateString(i18n.language)} -{' '}
                        {new Date(project.endDate).toLocaleDateString(i18n.language)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-semibold text-pink-600">¥{Number(project.budget).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <span>{project.deliverables.length} {t('projects.deliverables').toLowerCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {t('projects.proposedAt')}: {new Date(project.proposedAt).toLocaleDateString(i18n.language)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default ProjectInvitations;
