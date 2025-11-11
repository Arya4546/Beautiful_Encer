import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import projectService, { type CreateProjectParams } from '../../services/project.service';
import connectionService from '../../services/connection.service';
import { ProjectType, projectTypeLabels } from '../../types/project.types';
import { useAuthStore } from '../../store/authStore';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { BottomNav } from '../../components/layout/BottomNav';

const ProjectCreate: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState<CreateProjectParams>({
    influencerId: '',
    title: '',
    projectType: ProjectType.SPONSORED_POST,
    description: '',
    startDate: '',
    endDate: '',
    budget: 0,
    deliverables: [''],
    requirements: '',
    location: '',
    category: '',
  });

  // Get connected influencers
  const { data: connectionsData, isLoading: loadingInfluencers } = useQuery({
    queryKey: ['accepted-connections'],
    queryFn: () => connectionService.getRequests('accepted', 1, 100),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectParams) => projectService.createProject(data),
    onSuccess: () => {
      toast.success(t('projects.createSuccess'));
      navigate('/salon/projects');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t('projects.createError');
      toast.error(message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'budget' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleDeliverableChange = (index: number, value: string) => {
    const newDeliverables = [...formData.deliverables];
    newDeliverables[index] = value;
    setFormData((prev) => ({ ...prev, deliverables: newDeliverables }));
  };

  const addDeliverable = () => {
    setFormData((prev) => ({ ...prev, deliverables: [...prev.deliverables, ''] }));
  };

  const removeDeliverable = (index: number) => {
    if (formData.deliverables.length === 1) return;
    const newDeliverables = formData.deliverables.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, deliverables: newDeliverables }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.influencerId) {
      toast.error(t('projects.validation.selectInfluencer'));
      return;
    }

    if (!formData.title.trim()) {
      toast.error(t('projects.validation.titleRequired'));
      return;
    }

    if (!formData.description.trim()) {
      toast.error(t('projects.validation.descriptionRequired'));
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error(t('projects.validation.datesRequired'));
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error(t('projects.validation.endDateAfterStart'));
      return;
    }

    if (formData.budget <= 0) {
      toast.error(t('projects.validation.budgetPositive'));
      return;
    }

    const validDeliverables = formData.deliverables.filter((d) => d.trim());
    if (validDeliverables.length === 0) {
      toast.error(t('projects.validation.deliverablesRequired'));
      return;
    }

    createMutation.mutate({
      ...formData,
      deliverables: validDeliverables,
    });
  };

  if (loadingInfluencers) {
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

  // Filter connections to get only influencers
  const connectedInfluencers = connectionsData?.data
    .filter((conn: any) => {
      // Check if receiver or sender is an influencer
      const isReceiverInfluencer = conn.receiver?.role === 'INFLUENCER';
      const isSenderInfluencer = conn.sender?.role === 'INFLUENCER';
      return isReceiverInfluencer || isSenderInfluencer;
    })
    .map((conn: any) => {
      // Get the influencer from the connection (could be sender or receiver)
      const influencerUser = conn.receiver?.role === 'INFLUENCER' ? conn.receiver : conn.sender;
      
      // IMPORTANT: Backend needs the Influencer profile ID, not the User ID
      // The influencer object contains the profile data with its own ID
      if (!influencerUser.influencer) {
        console.warn('[ProjectCreate] Influencer user missing profile data:', influencerUser);
        return null;
      }
      
      return {
        influencerId: influencerUser.influencer.id, // Influencer profile ID for backend
        userId: influencerUser.id, // User ID (for reference)
        name: influencerUser.name,
        profilePic: influencerUser.influencer?.profilePic,
        bio: influencerUser.influencer?.bio,
        categories: influencerUser.influencer?.categories || [],
      };
    })
    .filter((inf: any) => inf !== null && inf.influencerId) || [];

  console.log('[ProjectCreate] Connected influencers:', connectedInfluencers);
  console.log('[ProjectCreate] Raw connections data:', connectionsData);

  return (
    <>
      <Header />
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 md:ml-64 mt-16">
        <div className="max-w-4xl mx-auto py-8 px-4 pb-24 md:pb-8">{/* Added pb-24 for bottom nav space */}
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('common.back')}
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            {t('projects.createNew')}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">{t('projects.createDescription')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 space-y-6">{/* Made responsive padding */}
          {/* Influencer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('projects.selectInfluencer')} <span className="text-red-500">*</span>
            </label>
            <select
              name="influencerId"
              value={formData.influencerId}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">{t('projects.selectInfluencerPlaceholder')}</option>
              {connectedInfluencers.map((influencer: any) => (
                <option key={influencer.influencerId} value={influencer.influencerId}>
                  {influencer.name}
                </option>
              ))}
            </select>
            {connectedInfluencers.length === 0 && (
              <p className="mt-2 text-sm text-amber-600">{t('projects.noConnectedInfluencers')}</p>
            )}
          </div>

          {/* Project Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('projects.projectTitle')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('projects.titlePlaceholder')}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('projects.type')} <span className="text-red-500">*</span>
            </label>
            <select
              name="projectType"
              value={formData.projectType}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {Object.entries(ProjectType).map(([key, value]) => (
                <option key={value} value={value}>
                  {projectTypeLabels[value][i18n.language as 'en' | 'ja']}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('projects.description')} <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('projects.descriptionPlaceholder')}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('projects.startDate')} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('projects.endDate')} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('projects.budget')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
              <input
                type="number"
                name="budget"
                value={formData.budget || ''}
                onChange={handleChange}
                placeholder="0"
                required
                min="1"
                step="1"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('projects.deliverables')} <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {formData.deliverables.map((deliverable, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={deliverable}
                    onChange={(e) => handleDeliverableChange(index, e.target.value)}
                    placeholder={t('projects.deliverablePlaceholder', { number: index + 1 })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  {formData.deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDeliverable(index)}
                      className="px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addDeliverable}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-pink-500 hover:text-pink-500 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('projects.addDeliverable')}
              </button>
            </div>
          </div>

          {/* Requirements (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('projects.requirements')}</label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder={t('projects.requirementsPlaceholder')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Location (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('projects.location')}</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder={t('projects.locationPlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Category (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('projects.category')}</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder={t('projects.categoryPlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 pb-2">{/* Added bottom padding */}
            <button
              type="submit"
              disabled={createMutation.isPending || connectedInfluencers.length === 0}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 sm:py-4 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm sm:text-base">{/* Made responsive */}
              {createMutation.isPending ? t('projects.creating') : t('projects.sendProposal')}
            </button>
          </div>
        </form>
      </div>
      </div>
      <BottomNav />
    </>
  );
};

export default ProjectCreate;
