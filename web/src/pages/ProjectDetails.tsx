import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import projectService from '../services/project.service';
import { useAuthStore } from '../store/authStore';
import { ProjectStatus, projectStatusLabels, projectStatusColors, projectTypeLabels, ProjectType } from '../types/project.types';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';

const ProjectDetails: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch project details
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProjectById(id!),
    enabled: !!id,
  });

  // Mutations
  const acceptMutation = useMutation({
    mutationFn: () => projectService.acceptProject(id!),
    onSuccess: () => {
      toast.success(t('projects.acceptSuccess'));
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['influencer-projects'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('common.error'));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => projectService.rejectProject(id!, rejectionReason),
    onSuccess: () => {
      toast.success(t('projects.rejectSuccess'));
      setShowRejectModal(false);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['influencer-projects'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('common.error'));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => projectService.cancelProject(id!),
    onSuccess: () => {
      toast.success(t('projects.cancelSuccess'));
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['salon-projects'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('common.error'));
    },
  });

  const startMutation = useMutation({
    mutationFn: () => projectService.startProject(id!),
    onSuccess: () => {
      toast.success(t('projects.startSuccess'));
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('common.error'));
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => projectService.completeProject(id!),
    onSuccess: () => {
      toast.success(t('projects.completeSuccess'));
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('common.error'));
    },
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <Sidebar />
        <div className="flex items-center justify-center min-h-screen md:ml-64 mt-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
        <BottomNav />
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Header />
        <Sidebar />
        <div className="flex items-center justify-center min-h-screen md:ml-64 mt-16">
          <div className="text-center">
            <p className="text-gray-600">{t('projects.noProjects')}</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-pink-500 hover:text-pink-600">
              {t('common.back')}
            </button>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  const isInfluencer = user?.role === 'INFLUENCER';
  const isSalon = user?.role === 'SALON';
  const canAccept = isInfluencer && project.status === ProjectStatus.PENDING;
  const canReject = isInfluencer && project.status === ProjectStatus.PENDING;
  const canCancel = isSalon && [ProjectStatus.PENDING, ProjectStatus.ACCEPTED].includes(project.status as ProjectStatus);
  const canStart = isSalon && project.status === ProjectStatus.ACCEPTED;
  const canComplete = isSalon && project.status === ProjectStatus.IN_PROGRESS;

  return (
    <>
      <Header />
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 md:ml-64 mt-16">
        <div className="max-w-4xl mx-auto py-8 px-4 pb-24 md:pb-8">{/* Added pb-24 for bottom nav */}
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('common.back')}
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            {t('projects.projectDetails')}
          </h1>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Status Banner */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{project.title}</h2>
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-semibold bg-white ${
                    projectStatusColors[project.status as ProjectStatus]
                  }`}
                >
                  {projectStatusLabels[project.status as ProjectStatus][i18n.language as 'en' | 'ja']}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Parties */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600 mb-2">{t('projects.proposedBy')}</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                    {project.salon.businessName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{project.salon.businessName}</div>
                    <div className="text-sm text-gray-500">{t('common.salon')}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600 mb-2">{t('projects.proposedTo')}</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
                    {project.influencer.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{project.influencer.user.name}</div>
                    <div className="text-sm text-gray-500">{t('common.influencer')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Type */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('projects.type')}</h3>
              <p className="text-gray-900">{projectTypeLabels[project.projectType as ProjectType][i18n.language as 'en' | 'ja']}</p>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('projects.description')}</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{project.description}</p>
            </div>

            {/* Timeline */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('projects.startDate')}</h3>
                <p className="text-gray-900">{new Date(project.startDate).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('projects.endDate')}</h3>
                <p className="text-gray-900">{new Date(project.endDate).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {/* Budget */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('projects.budget')}</h3>
              <p className="text-2xl font-bold text-pink-600">¥{Number(project.budget).toLocaleString()}</p>
            </div>

            {/* Deliverables */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('projects.deliverables')}</h3>
              <ul className="space-y-2">
                {project.deliverables.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-900">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Optional Fields */}
            {project.requirements && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('projects.requirements')}</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{project.requirements}</p>
              </div>
            )}

            {project.location && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('projects.location')}</h3>
                <p className="text-gray-900">{project.location}</p>
              </div>
            )}

            {project.category && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('projects.category')}</h3>
                <p className="text-gray-900">{project.category}</p>
              </div>
            )}

            {/* Rejection Reason */}
            {project.status === ProjectStatus.REJECTED && project.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-red-700 mb-2">{t('projects.rejectionReason')}</h3>
                <p className="text-red-900">{project.rejectionReason}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm text-gray-600">
              <div>{t('projects.proposedAt')}: {new Date(project.proposedAt).toLocaleString(i18n.language)}</div>
              {project.respondedAt && (
                <div>{t('projects.respondedAt')}: {new Date(project.respondedAt).toLocaleString(i18n.language)}</div>
              )}
              {project.completedAt && (
                <div>{t('projects.completedAt')}: {new Date(project.completedAt).toLocaleString(i18n.language)}</div>
              )}
            </div>
          </div>

          {/* Actions */}
          {(canAccept || canReject || canCancel || canStart || canComplete) && (
            <div className="px-6 md:px-8 py-6 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                {canAccept && (
                  <button
                    onClick={() => {
                      if (window.confirm(t('projects.confirmAccept'))) {
                        acceptMutation.mutate();
                      }
                    }}
                    disabled={acceptMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 shadow-lg"
                  >
                    {acceptMutation.isPending ? t('common.loading') : t('projects.acceptProject')}
                  </button>
                )}
                {canReject && (
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 bg-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-600 transition-all duration-300 disabled:opacity-50 shadow-lg"
                  >
                    {t('projects.rejectProject')}
                  </button>
                )}
                {canStart && (
                  <button
                    onClick={() => {
                      if (window.confirm(t('projects.confirmStart'))) {
                        startMutation.mutate();
                      }
                    }}
                    disabled={startMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 shadow-lg"
                  >
                    {startMutation.isPending ? t('common.loading') : t('projects.startProject')}
                  </button>
                )}
                {canComplete && (
                  <button
                    onClick={() => {
                      if (window.confirm(t('projects.confirmComplete'))) {
                        completeMutation.mutate();
                      }
                    }}
                    disabled={completeMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 shadow-lg"
                  >
                    {completeMutation.isPending ? t('common.loading') : t('projects.completeProject')}
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => {
                      if (window.confirm(t('projects.confirmCancel'))) {
                        cancelMutation.mutate();
                      }
                    }}
                    disabled={cancelMutation.isPending}
                    className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300 disabled:opacity-50 shadow-lg"
                  >
                    {cancelMutation.isPending ? t('common.loading') : t('projects.cancelProject')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('projects.rejectProject')}</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t('projects.rejectionReasonPlaceholder')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (window.confirm(t('projects.confirmReject'))) {
                    rejectMutation.mutate();
                  }
                }}
                disabled={rejectMutation.isPending}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {rejectMutation.isPending ? t('common.loading') : t('projects.rejectProject')}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      <BottomNav />
    </>
  );
};

export default ProjectDetails;
