import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiArrowLeft, FiMapPin, FiCalendar, FiDollarSign, FiClock,
  FiFileText, FiTag, FiEye, FiUsers, FiCheckCircle, FiX,
  FiAlertCircle, FiSend, FiExternalLink
} from 'react-icons/fi';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { useAuthStore } from '../store/authStore';
import { useProject, useSubmitApplication } from '../hooks/useMarketplace';
import { type ProjectType } from '../services/marketplace.service';

// Application Modal Component
const ApplicationModal: React.FC<{
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ projectId, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const submitApplicationMutation = useSubmitApplication(projectId);
  
  const [formData, setFormData] = useState({
    coverLetter: '',
    proposedBudget: '',
    estimatedDeliveryDays: '',
    portfolioLinks: [''],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = t('marketplace.application.validation.coverLetterRequired');
    } else if (formData.coverLetter.length > 2000) {
      newErrors.coverLetter = t('marketplace.application.validation.coverLetterTooLong');
    }
    
    if (formData.proposedBudget && Number(formData.proposedBudget) <= 0) {
      newErrors.proposedBudget = t('marketplace.application.validation.budgetPositive');
    }
    
    if (formData.estimatedDeliveryDays && Number(formData.estimatedDeliveryDays) <= 0) {
      newErrors.estimatedDeliveryDays = t('marketplace.application.validation.deliveryPositive');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const applicationData = {
      coverLetter: formData.coverLetter,
      proposedBudget: formData.proposedBudget ? Number(formData.proposedBudget) : undefined,
      estimatedDeliveryDays: formData.estimatedDeliveryDays ? Number(formData.estimatedDeliveryDays) : undefined,
      portfolioLinks: formData.portfolioLinks.filter(link => link.trim() !== ''),
    };
    
    submitApplicationMutation.mutate(
      applicationData,
      {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      }
    );
  };

  const addPortfolioLink = () => {
    setFormData(prev => ({
      ...prev,
      portfolioLinks: [...prev.portfolioLinks, ''],
    }));
  };

  const removePortfolioLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.filter((_, i) => i !== index),
    }));
  };

  const updatePortfolioLink = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.map((link, i) => (i === index ? value : link)),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {t('marketplace.application.title')}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {t('marketplace.application.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('marketplace.application.coverLetter')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.coverLetter}
              onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
              placeholder={t('marketplace.application.coverLetterPlaceholder')}
              rows={6}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent resize-none ${
                errors.coverLetter ? 'border-red-500' : 'border-border'
              }`}
            />
            {errors.coverLetter && (
              <p className="mt-1 text-sm text-red-500">{errors.coverLetter}</p>
            )}
            <p className="mt-1 text-xs text-text-tertiary text-right">
              {formData.coverLetter.length} / 2000
            </p>
          </div>

          {/* Proposed Budget */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('marketplace.application.proposedBudget')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary">
                ¥
              </span>
              <input
                type="number"
                value={formData.proposedBudget}
                onChange={(e) => setFormData(prev => ({ ...prev, proposedBudget: e.target.value }))}
                placeholder={t('marketplace.application.proposedBudgetPlaceholder')}
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent ${
                  errors.proposedBudget ? 'border-red-500' : 'border-border'
                }`}
                min="0"
              />
            </div>
            {errors.proposedBudget && (
              <p className="mt-1 text-sm text-red-500">{errors.proposedBudget}</p>
            )}
          </div>

          {/* Estimated Delivery */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('marketplace.application.estimatedDelivery')}
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.estimatedDeliveryDays}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedDeliveryDays: e.target.value }))}
                placeholder={t('marketplace.application.estimatedDeliveryPlaceholder')}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent ${
                  errors.estimatedDeliveryDays ? 'border-red-500' : 'border-border'
                }`}
                min="0"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary text-sm">
                {t('marketplace.createProject.days')}
              </span>
            </div>
            {errors.estimatedDeliveryDays && (
              <p className="mt-1 text-sm text-red-500">{errors.estimatedDeliveryDays}</p>
            )}
          </div>

          {/* Portfolio Links */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('marketplace.application.portfolioLinks')}
            </label>
            <div className="space-y-2">
              {formData.portfolioLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => updatePortfolioLink(index, e.target.value)}
                    placeholder={t('marketplace.application.portfolioLinkPlaceholder')}
                    className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent"
                  />
                  {formData.portfolioLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePortfolioLink(index)}
                      className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiX size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPortfolioLink}
                className="text-sm text-magenta hover:text-magenta-dark font-medium"
              >
                + {t('marketplace.application.addLink')}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-border text-text-primary rounded-lg hover:bg-background-secondary transition-colors"
            >
              {t('marketplace.application.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitApplicationMutation.isPending}
              className="flex-1 px-6 py-3 bg-magenta text-white rounded-lg hover:bg-magenta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitApplicationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  {t('marketplace.application.submitting')}
                </>
              ) : (
                <>
                  <FiSend className="mr-2" />
                  {t('marketplace.application.submit')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Project Detail Page
export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  
  const { data: project, isLoading, refetch } = useProject(id || '');
  
  const isSalon = user?.role === 'SALON';
  const isInfluencer = user?.role === 'INFLUENCER';
  const isOwnProject = isSalon && project?.salonId === user?.salon?.id;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatBudget = (budget?: number) => {
    if (!budget) return t('marketplace.filters.budgetNotSpecified');
    return `¥${budget.toLocaleString()}`;
  };

  const getProjectTypeBadge = (type: ProjectType) => {
    const typeColors: Record<ProjectType, string> = {
      'SPONSORED_POST': 'bg-blue-100 text-blue-700',
      'PRODUCT_REVIEW': 'bg-purple-100 text-purple-700',
      'BRAND_AMBASSADOR': 'bg-pink-100 text-pink-700',
      'EVENT_COVERAGE': 'bg-red-100 text-red-700',
      'TUTORIAL_VIDEO': 'bg-orange-100 text-orange-700',
      'UNBOXING': 'bg-green-100 text-green-700',
      'GIVEAWAY': 'bg-indigo-100 text-indigo-700',
      'COLLABORATION': 'bg-teal-100 text-teal-700',
      'STORE_VISIT': 'bg-yellow-100 text-yellow-700',
      'OTHER': 'bg-gray-100 text-gray-700',
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeColors[type]}`}>
        {t(`marketplace.projectTypes.${type.toLowerCase().replace('_', '')}`)}
      </span>
    );
  };

  const canApply = isInfluencer && project?.isOpen && !project?.hasApplied;
  const hasApplied = project?.hasApplied;
  const isExpired = project?.applicationDeadline && new Date(project.applicationDeadline) < new Date();
  const isMaxReached = project?.maxApplications && (project?.applicationCount || 0) >= project.maxApplications;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-primary">
        <Header />
        <Sidebar />
        <div className="md:ml-64 pt-16 pb-20 md:pb-6">
          <div className="max-w-5xl mx-auto p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3" />
              <div className="h-64 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
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
          <div className="max-w-5xl mx-auto p-6 text-center">
            <FiAlertCircle size={64} className="mx-auto text-text-tertiary mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {t('marketplace.projectDetail.notFound')}
            </h2>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-6 py-2 bg-magenta text-white rounded-lg hover:bg-magenta-dark transition-colors"
            >
              {t('marketplace.projectDetail.backToList')}
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <Header />
      <Sidebar />
      
      <div className="md:ml-64 pt-16 pb-20 md:pb-6">
        <div className="max-w-5xl mx-auto p-6">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-text-secondary hover:text-text-primary mb-6 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            {t('marketplace.projectDetail.backToList')}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <div className="bg-white rounded-xl shadow-soft p-6 border border-border">
                <div className="flex flex-wrap gap-2 mb-4">
                  {getProjectTypeBadge(project.projectType)}
                  {project.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      <FiTag size={14} className="mr-1" />
                      {project.category}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-text-primary mb-4">
                  {project.title}
                </h1>

                <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                  <div className="flex items-center">
                    <FiEye className="mr-2" />
                    {project.viewCount} {t('marketplace.projectCard.views')}
                  </div>
                  <div className="flex items-center">
                    <FiUsers className="mr-2" />
                    {project.applicationCount} {t('marketplace.projectCard.applications')}
                  </div>
                  {project.applicationDeadline && (
                    <div className="flex items-center">
                      <FiCalendar className="mr-2" />
                      {t('marketplace.projectCard.deadline')}: {formatDate(project.applicationDeadline)}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-xl shadow-soft p-6 border border-border">
                <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center">
                  <FiFileText className="mr-2" />
                  {t('marketplace.projectDetail.about')}
                </h2>
                <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Requirements */}
              {project.requirements && (
                <div className="bg-white rounded-xl shadow-soft p-6 border border-border">
                  <h2 className="text-xl font-bold text-text-primary mb-4">
                    {t('marketplace.projectDetail.requirements')}
                  </h2>
                  <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                    {project.requirements}
                  </p>
                </div>
              )}

              {/* Deliverables */}
              <div className="bg-white rounded-xl shadow-soft p-6 border border-border">
                <h2 className="text-xl font-bold text-text-primary mb-4">
                  {t('marketplace.projectDetail.deliverables')}
                </h2>
                <ul className="space-y-2">
                  {project.deliverables.map((deliverable, index) => (
                    <li key={index} className="flex items-start text-text-secondary">
                      <FiCheckCircle className="mr-2 mt-1 text-green-500 flex-shrink-0" />
                      <span>{deliverable}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="bg-white rounded-xl shadow-soft p-6 border border-border">
                  <h2 className="text-xl font-bold text-text-primary mb-4">
                    {t('marketplace.projectDetail.tags')}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-background-secondary text-text-secondary"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Project Details Card */}
              <div className="bg-white rounded-xl shadow-soft p-6 border border-border sticky top-20">
                <h3 className="text-lg font-bold text-text-primary mb-4">
                  {t('marketplace.projectDetail.timeline')}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <FiDollarSign className="mr-3 mt-1 text-magenta" size={20} />
                    <div>
                      <p className="text-sm text-text-tertiary">
                        {t('marketplace.projectCard.budget')}
                      </p>
                      <p className="font-semibold text-text-primary">
                        {formatBudget(project.budget)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <FiCalendar className="mr-3 mt-1 text-magenta" size={20} />
                    <div>
                      <p className="text-sm text-text-tertiary">
                        {t('marketplace.createProject.startDate')}
                      </p>
                      <p className="font-semibold text-text-primary">
                        {formatDate(project.startDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <FiClock className="mr-3 mt-1 text-magenta" size={20} />
                    <div>
                      <p className="text-sm text-text-tertiary">
                        {t('marketplace.createProject.endDate')}
                      </p>
                      <p className="font-semibold text-text-primary">
                        {formatDate(project.endDate)}
                      </p>
                    </div>
                  </div>

                  {project.location && (
                    <div className="flex items-start">
                      <FiMapPin className="mr-3 mt-1 text-magenta" size={20} />
                      <div>
                        <p className="text-sm text-text-tertiary">
                          {t('marketplace.filters.location')}
                        </p>
                        <p className="font-semibold text-text-primary">
                          {project.location}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-6 border-t border-border">
                  {isInfluencer && (
                    <>
                      {hasApplied ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-center text-green-700">
                          <FiCheckCircle className="mr-2" />
                          {t('marketplace.projectDetail.alreadyApplied')}
                        </div>
                      ) : !project.isOpen ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
                          {t('marketplace.projectDetail.applicationClosed')}
                        </div>
                      ) : isExpired ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-red-600">
                          {t('marketplace.projectDetail.applicationDeadlinePassed')}
                        </div>
                      ) : isMaxReached ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center text-yellow-700">
                          {t('marketplace.projectDetail.maxApplicationsReached')}
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowApplicationModal(true)}
                          className="w-full px-6 py-3 bg-magenta text-white rounded-lg hover:bg-magenta-dark transition-colors flex items-center justify-center font-semibold"
                        >
                          <FiSend className="mr-2" />
                          {t('marketplace.projectDetail.applyButton')}
                        </button>
                      )}
                    </>
                  )}
                  
                  {isSalon && isOwnProject && (
                    <button
                      onClick={() => navigate(`/salon/marketplace/projects/${project.id}/applications`)}
                      className="w-full px-6 py-3 bg-magenta text-white rounded-lg hover:bg-magenta-dark transition-colors flex items-center justify-center font-semibold"
                    >
                      <FiUsers className="mr-2" />
                      {t('marketplace.manageProjects.viewApplications')}
                    </button>
                  )}
                </div>
              </div>

              {/* Salon Info Card */}
              {project.salon && (
                <div className="bg-white rounded-xl shadow-soft p-6 border border-border">
                  <h3 className="text-lg font-bold text-text-primary mb-4">
                    {t('marketplace.projectDetail.aboutSalon')}
                  </h3>
                  
                  <div className="flex items-center mb-4">
                    {project.salon.profilePic ? (
                      <img
                        src={project.salon.profilePic}
                        alt={project.salon.businessName}
                        className="w-16 h-16 rounded-full object-cover mr-4"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-magenta to-magenta-dark flex items-center justify-center text-white text-2xl font-bold mr-4">
                        {project.salon.businessName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-text-primary">
                        {project.salon.businessName}
                      </h4>
                      {project.salon.region && (
                        <p className="text-sm text-text-secondary flex items-center mt-1">
                          <FiMapPin size={14} className="mr-1" />
                          {project.salon.region}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/profile/${project.salon?.id}`)}
                    className="w-full px-4 py-2 border border-magenta text-magenta rounded-lg hover:bg-magenta hover:text-white transition-colors flex items-center justify-center"
                  >
                    <FiExternalLink className="mr-2" />
                    {t('marketplace.projectDetail.viewProfile')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />

      {/* Application Modal */}
      {showApplicationModal && (
        <ApplicationModal
          projectId={project.id}
          onClose={() => setShowApplicationModal(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};
