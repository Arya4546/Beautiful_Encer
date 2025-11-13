import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiFileText, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle,
  FiCalendar, FiDollarSign, FiMapPin, FiEye, FiTag, FiArrowRight
} from 'react-icons/fi';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { useMyApplications, useWithdrawApplication } from '../hooks/useMarketplace';
import { type ApplicationStatus, type ProjectApplication } from '../services/marketplace.service';

// Application Status Badge Component
const ApplicationStatusBadge: React.FC<{ status: ApplicationStatus }> = ({ status }) => {
  const { t } = useTranslation();
  
  const statusConfig: Record<ApplicationStatus, { color: string; icon: React.ReactNode }> = {
    'PENDING': { 
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
      icon: <FiClock size={14} className="mr-1" /> 
    },
    'ACCEPTED': { 
      color: 'bg-green-100 text-green-700 border-green-200', 
      icon: <FiCheckCircle size={14} className="mr-1" /> 
    },
    'REJECTED': { 
      color: 'bg-red-100 text-red-700 border-red-200', 
      icon: <FiXCircle size={14} className="mr-1" /> 
    },
    'WITHDRAWN': { 
      color: 'bg-gray-100 text-gray-700 border-gray-200', 
      icon: <FiAlertCircle size={14} className="mr-1" /> 
    },
  };
  
  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
      {config.icon}
      {t(`marketplace.myApplications.status.${status.toLowerCase()}`)}
    </span>
  );
};

// Application Card Component
const ApplicationCard: React.FC<{
  application: any;
  onWithdraw: (id: string) => void;
  onViewProject: (projectId: string) => void;
}> = ({ application, onWithdraw, onViewProject }) => {
  const { t } = useTranslation();
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canWithdraw = application.status === 'PENDING';

  return (
    <div className="bg-white rounded-xl shadow-soft border border-border p-6 hover:shadow-medium transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
            {application.project?.title || t('marketplace.projectCard.unknownProject')}
          </h3>
          <ApplicationStatusBadge status={application.status} />
        </div>
      </div>

      {/* Project Details */}
      {application.project && (
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          {application.project.budget && (
            <div className="flex items-center text-text-secondary">
              <FiDollarSign size={16} className="mr-2 text-magenta" />
              <span>¥{application.project.budget.toLocaleString()}</span>
            </div>
          )}
          
          {application.project.location && (
            <div className="flex items-center text-text-secondary">
              <FiMapPin size={16} className="mr-2 text-magenta" />
              <span className="truncate">{application.project.location}</span>
            </div>
          )}

          {application.project.category && (
            <div className="flex items-center text-text-secondary">
              <FiTag size={16} className="mr-2 text-magenta" />
              <span>{application.project.category}</span>
            </div>
          )}

          <div className="flex items-center text-text-secondary">
            <FiCalendar size={16} className="mr-2 text-magenta" />
            <span>{formatDate(application.appliedAt)}</span>
          </div>
        </div>
      )}

      {/* Application Details */}
      <div className="bg-background-secondary rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold text-text-primary mb-2">
          {t('marketplace.myApplications.applicationDetails')}
        </h4>
        
        {application.proposedBudget && (
          <p className="text-sm text-text-secondary mb-1">
            <span className="font-medium">{t('marketplace.application.proposedBudget')}:</span> ¥{application.proposedBudget.toLocaleString()}
          </p>
        )}
        
        {application.estimatedDeliveryDays && (
          <p className="text-sm text-text-secondary mb-1">
            <span className="font-medium">{t('marketplace.application.estimatedDelivery')}:</span> {application.estimatedDeliveryDays}{t('marketplace.createProject.days')}
          </p>
        )}
        
        {application.coverLetter && (
          <p className="text-sm text-text-secondary mt-2 line-clamp-3">
            {application.coverLetter}
          </p>
        )}
      </div>

      {/* Response Info */}
      {application.status === 'REJECTED' && application.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-red-700 mb-1">
            {t('marketplace.myApplications.rejectionReason')}
          </p>
          <p className="text-sm text-red-600">
            {application.rejectionReason}
          </p>
        </div>
      )}

      {application.status === 'ACCEPTED' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-green-700">
            {t('marketplace.myApplications.acceptedMessage')}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onViewProject(application.project?.id || '')}
          disabled={!application.project?.id}
          className="flex-1 px-4 py-2 border border-magenta text-magenta rounded-lg hover:bg-magenta hover:text-white transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiEye className="mr-2" />
          {t('marketplace.myApplications.viewProject')}
        </button>
        
        {canWithdraw && !showWithdrawConfirm && (
          <button
            onClick={() => setShowWithdrawConfirm(true)}
            className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
          >
            {t('marketplace.myApplications.withdraw')}
          </button>
        )}
        
        {showWithdrawConfirm && (
          <>
            <button
              onClick={() => onWithdraw(application.id)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              {t('common.confirm')}
            </button>
            <button
              onClick={() => setShowWithdrawConfirm(false)}
              className="px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-background-secondary transition-colors"
            >
              {t('common.cancel')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Main My Applications Page
export const MyApplicationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | undefined>(undefined);
  
  const { data: applicationsData, isLoading } = useMyApplications(statusFilter);
  const withdrawMutation = useWithdrawApplication();

  const applications = applicationsData?.data || [];
  const stats = applicationsData?.statistics;

  const handleWithdraw = (applicationId: string) => {
    withdrawMutation.mutate(applicationId);
  };

  const handleViewProject = (projectId: string) => {
    if (projectId) {
      navigate(`/marketplace/projects/${projectId}`);
    }
  };

  const statusTabs: { key: ApplicationStatus | undefined; label: string }[] = [
    { key: undefined, label: t('marketplace.myApplications.tabs.all') },
    { key: 'PENDING', label: t('marketplace.myApplications.tabs.pending') },
    { key: 'ACCEPTED', label: t('marketplace.myApplications.tabs.accepted') },
    { key: 'REJECTED', label: t('marketplace.myApplications.tabs.rejected') },
    { key: 'WITHDRAWN', label: t('marketplace.myApplications.tabs.withdrawn') },
  ];

  return (
    <div className="min-h-screen bg-background-primary">
      <Header />
      <Sidebar />
      
      <div className="md:ml-64 pt-16 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {t('marketplace.myApplications.title')}
            </h1>
            <p className="text-text-secondary">
              {t('marketplace.myApplications.subtitle')}
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-soft p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary mb-1">
                      {t('marketplace.myApplications.stats.total')}
                    </p>
                    <p className="text-3xl font-bold text-text-primary">
                      {stats.total}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiFileText className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-soft p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary mb-1">
                      {t('marketplace.myApplications.stats.pending')}
                    </p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {stats.pending}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <FiClock className="text-yellow-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-soft p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary mb-1">
                      {t('marketplace.myApplications.stats.accepted')}
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.accepted}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <FiCheckCircle className="text-green-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-soft p-6 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary mb-1">
                      {t('marketplace.myApplications.stats.rejected')}
                    </p>
                    <p className="text-3xl font-bold text-red-600">
                      {stats.rejected}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FiXCircle className="text-red-600" size={24} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl shadow-soft border border-border mb-6 p-2 flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key || 'all'}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === tab.key
                    ? 'bg-magenta text-white'
                    : 'text-text-secondary hover:bg-background-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Applications List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-soft p-6 border border-border animate-pulse"
                >
                  <div className="h-6 bg-gray-200 rounded mb-4" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded mb-4 w-3/4" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : applications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {applications.map((application: ProjectApplication) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  onWithdraw={handleWithdraw}
                  onViewProject={handleViewProject}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FiFileText size={64} className="mx-auto text-text-tertiary mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                {t('marketplace.myApplications.noApplications')}
              </h3>
              <p className="text-text-secondary mb-6">
                {t('marketplace.myApplications.noApplicationsMessage')}
              </p>
              <button
                onClick={() => navigate('/marketplace')}
                className="px-6 py-3 bg-magenta text-white rounded-lg hover:bg-magenta-dark transition-colors inline-flex items-center"
              >
                {t('marketplace.myApplications.browseProjects')}
                <FiArrowRight className="ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
