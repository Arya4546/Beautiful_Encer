import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiArrowLeft, FiCheck, FiX, FiClock, FiUser, FiInstagram,
  FiDollarSign, FiCalendar, FiExternalLink, FiAlertCircle
} from 'react-icons/fi';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { useAuthStore } from '../store/authStore';
import {
  useProjectApplications,
  useAcceptApplication,
  useRejectApplication,
  useProject,
} from '../hooks/useMarketplace';
import { type ProjectApplication } from '../services/marketplace.service';
import toast from 'react-hot-toast';

// Application Status Badge
const ApplicationStatusBadge: React.FC<{ status: ProjectApplication['status'] }> = ({ status }) => {
  const { t } = useTranslation();

  const statusConfig = {
    PENDING: {
      label: t('marketplace.applications.status.pending'),
      className: 'bg-yellow-100 text-yellow-800',
      icon: FiClock,
    },
    ACCEPTED: {
      label: t('marketplace.applications.status.accepted'),
      className: 'bg-green-100 text-green-800',
      icon: FiCheck,
    },
    REJECTED: {
      label: t('marketplace.applications.status.rejected'),
      className: 'bg-red-100 text-red-800',
      icon: FiX,
    },
    WITHDRAWN: {
      label: t('marketplace.applications.status.withdrawn'),
      className: 'bg-gray-100 text-gray-800',
      icon: FiAlertCircle,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}
    >
      <Icon className="mr-1" size={14} />
      {config.label}
    </span>
  );
};

// Application Card Component
const ApplicationCard: React.FC<{
  application: ProjectApplication;
  onAccept: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  isProcessing: boolean;
}> = ({ application, onAccept, onReject, isProcessing }) => {
  const { t } = useTranslation();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const influencer = application.influencer;
  const appliedDate = new Date(application.appliedAt).toLocaleDateString('ja-JP');

  if (!influencer) {
    return null; // Skip if no influencer data
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error(t('marketplace.applications.rejectionReasonRequired'));
      return;
    }
    onReject(application.id, rejectionReason);
    setShowRejectModal(false);
    setRejectionReason('');
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-soft border border-border p-6 hover:shadow-md transition-shadow">
        {/* Header: Influencer Info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-magenta to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
              {influencer.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <Link
                to={`/influencer-profile/${influencer.id}`}
                className="font-semibold text-text-primary hover:text-magenta transition-colors"
              >
                {influencer.user.name}
              </Link>
              <p className="text-sm text-text-tertiary">{appliedDate}</p>
            </div>
          </div>
          <ApplicationStatusBadge status={application.status} />
        </div>

        {/* Influencer Details */}
        <div className="bg-background-secondary rounded-lg p-4 mb-4">
          {influencer.bio && (
            <p className="text-sm text-text-secondary">
              {influencer.bio}
            </p>
          )}
          {influencer.categories && influencer.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {influencer.categories.map((category, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-white rounded text-xs text-text-secondary"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Application Details */}
        <div className="space-y-3 mb-4">
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              {t('marketplace.applications.coverLetter')}
            </h4>
            <p className="text-sm text-text-secondary whitespace-pre-wrap line-clamp-3">
              {application.coverLetter}
            </p>
          </div>

          {application.proposedBudget && (
            <div className="flex items-center text-sm">
              <FiDollarSign className="mr-2 text-green-600" />
              <span className="font-semibold text-text-primary">
                {t('marketplace.applications.proposedBudget')}:
              </span>
              <span className="ml-2 text-text-secondary">¥{application.proposedBudget.toLocaleString()}</span>
            </div>
          )}

          {application.estimatedDeliveryDays && (
            <div className="flex items-center text-sm">
              <FiCalendar className="mr-2 text-blue-600" />
              <span className="font-semibold text-text-primary">
                {t('marketplace.applications.estimatedDelivery')}:
              </span>
              <span className="ml-2 text-text-secondary">
                {application.estimatedDeliveryDays} {t('marketplace.createProject.days')}
              </span>
            </div>
          )}

          {application.portfolioLinks && application.portfolioLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-1">
                {t('marketplace.applications.portfolio')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {application.portfolioLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-magenta hover:text-magenta-dark flex items-center"
                  >
                    <FiExternalLink className="mr-1" size={12} />
                    {t('marketplace.applications.link')} {idx + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions (Only for Pending) */}
        {application.status === 'PENDING' && (
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              onClick={() => onAccept(application.id)}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiCheck className="mr-2" />
              {t('marketplace.applications.accept')}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiX className="mr-2" />
              {t('marketplace.applications.reject')}
            </button>
          </div>
        )}

        {/* Rejection Reason Display */}
        {application.status === 'REJECTED' && application.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            <span className="font-semibold">{t('marketplace.applications.rejectionReason')}:</span> {application.rejectionReason}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-text-primary mb-4">
              {t('marketplace.applications.rejectApplication')}
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              {t('marketplace.applications.rejectMessage')}
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t('marketplace.applications.rejectionReasonPlaceholder')}
              rows={4}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-border text-text-primary rounded-lg hover:bg-background-secondary transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('marketplace.applications.reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Main Application Management Page
export const ApplicationManagementPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // Hooks must be called before any conditional returns
  const { data: project, isLoading: projectLoading } = useProject(projectId!);
  const { data: applicationsData, isLoading: applicationsLoading, error: applicationsError } = useProjectApplications(projectId!);
  const acceptMutation = useAcceptApplication(projectId!);
  const rejectMutation = useRejectApplication(projectId!);

  const [statusFilter, setStatusFilter] = useState<ProjectApplication['status'] | 'ALL'>('ALL');

  // Role-based access control - Redirect if not a SALON
  useEffect(() => {
    if (user && user.role !== 'SALON') {
      toast.error(t('common.accessDenied'));
      navigate('/discover', { replace: true });
    }
  }, [user, navigate, t]);

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
            Only salons can manage applications
          </p>
        </div>
      </div>
    );
  }

  // Ensure applications is always an array
  const applications = Array.isArray(applicationsData) ? applicationsData : [];
  const filteredApplications =
    statusFilter === 'ALL' ? applications : applications.filter((app: ProjectApplication) => app.status === statusFilter);

  const stats = {
    total: applications.length,
    pending: applications.filter((app: ProjectApplication) => app.status === 'PENDING').length,
    accepted: applications.filter((app: ProjectApplication) => app.status === 'ACCEPTED').length,
    rejected: applications.filter((app: ProjectApplication) => app.status === 'REJECTED').length,
  };

  const handleAccept = (applicationId: string) => {
    acceptMutation.mutate(applicationId, {
      onSuccess: () => {
        toast.success(t('marketplace.applications.acceptSuccess'));
      },
      onError: () => {
        toast.error(t('marketplace.applications.acceptError'));
      },
    });
  };

  const handleReject = (applicationId: string, reason: string) => {
    rejectMutation.mutate(
      { applicationId, reason },
      {
        onSuccess: () => {
          toast.success(t('marketplace.applications.rejectSuccess'));
        },
        onError: () => {
          toast.error(t('marketplace.applications.rejectError'));
        },
      }
    );
  };

  if (projectLoading || applicationsLoading) {
    return (
      <div className="min-h-screen bg-background-primary">
        <Header />
        <Sidebar />
        <div className="md:ml-64 pt-16 pb-20 md:pb-6">
          <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magenta" />
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (applicationsError) {
    return (
      <div className="min-h-screen bg-background-primary">
        <Header />
        <Sidebar />
        <div className="md:ml-64 pt-16 pb-20 md:pb-6">
          <div className="max-w-6xl mx-auto p-6">
            <div className="text-center py-12">
              <FiAlertCircle size={48} className="mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-text-primary mb-2">
                {t('marketplace.errors.loadFailed')}
              </h2>
              <p className="text-text-secondary mb-4">
                {t('marketplace.errors.tryAgain')}
              </p>
              <button
                onClick={() => navigate(-1)}
                className="btn-primary"
              >
                {t('common.back')}
              </button>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background-primary">
        <Header />
        <Sidebar />
        <div className="md:ml-64 pt-16 pb-20 md:pb-6">
          <div className="max-w-6xl mx-auto p-6">
            <div className="text-center py-12">
              <p className="text-text-secondary">{t('marketplace.projectDetail.notFound')}</p>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary overflow-x-hidden">
      <Header />
      <Sidebar />

      <div className="md:ml-64 pt-16 pb-20 md:pb-6">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate(`/salon/marketplace/projects/${projectId}`)}
              className="flex items-center text-text-secondary hover:text-text-primary mb-4 transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              {t('common.back')}
            </button>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {t('marketplace.applications.title')}
            </h1>
            <p className="text-text-secondary mb-4">{project.title}</p>
          </div>

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-soft border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">{t('marketplace.applications.totalApplications')}</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiUser className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">{t('marketplace.applications.status.pending')}</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <FiClock className="text-yellow-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">{t('marketplace.applications.status.accepted')}</p>
                  <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCheck className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary">{t('marketplace.applications.status.rejected')}</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FiX className="text-red-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2">
            {[
              { key: 'ALL', label: t('marketplace.applications.allApplications') },
              { key: 'PENDING', label: t('marketplace.applications.status.pending') },
              { key: 'ACCEPTED', label: t('marketplace.applications.status.accepted') },
              { key: 'REJECTED', label: t('marketplace.applications.status.rejected') },
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

          {/* Applications Grid */}
          {filteredApplications.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredApplications.map((application: ProjectApplication) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  isProcessing={acceptMutation.isPending || rejectMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-soft border border-border p-12 text-center">
              <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUser className="text-text-tertiary" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {t('marketplace.applications.noApplications')}
              </h3>
              <p className="text-text-secondary">
                {statusFilter === 'ALL'
                  ? t('marketplace.applications.noApplicationsMessage')
                  : t('marketplace.applications.noApplicationsInStatus')}
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
