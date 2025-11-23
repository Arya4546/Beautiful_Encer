import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiArrowLeft, FiArrowRight, FiX, FiPlus, FiAlertCircle
} from 'react-icons/fi';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { useAuthStore } from '../store/authStore';
import { useCreateProject, useCategories, useProject, useUpdateProject } from '../hooks/useMarketplace';
import { type ProjectType, type CreateProjectData } from '../services/marketplace.service';
import toast from 'react-hot-toast';

// Step Indicator Component - Mobile Optimized
const StepIndicator: React.FC<{ currentStep: number; totalSteps: number }> = ({
  currentStep,
  totalSteps,
}) => {
  const { t } = useTranslation();
  
  const steps = [
    { number: 1, label: t('marketplace.createProject.step1') },
    { number: 2, label: t('marketplace.createProject.step2') },
    { number: 3, label: t('marketplace.createProject.step3') },
  ];

  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-bold transition-all ${
                  step.number === currentStep
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md scale-110'
                    : step.number < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.number < currentStep ? '✓' : step.number}
              </div>
              <p
                className={`text-[10px] md:text-xs mt-1.5 md:mt-2 text-center px-1 ${
                  step.number === currentStep ? 'text-pink-600 font-semibold' : 'text-gray-500'
                }`}
              >
                {step.label}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 md:h-1 mx-1 md:mx-2 rounded transition-all flex-1 max-w-[60px] md:max-w-[100px] ${
                  step.number < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Main Project Creation Form
export const ProjectCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id: projectId } = useParams<{ id: string }>();
  const isEditMode = !!projectId;
  
  const { user } = useAuthStore();
  const { data: categories } = useCategories();
  const { data: existingProject, isLoading: isLoadingProject } = useProject(projectId || '');
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject(projectId || '');

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormPopulated, setIsFormPopulated] = useState(false);

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
            Only salons can create projects
          </p>
        </div>
      </div>
    );
  }

  const projectTypes: { value: ProjectType; label: string }[] = [
    { value: 'SPONSORED_POST', label: t('marketplace.projectTypes.sponsoredpost') },
    { value: 'PRODUCT_REVIEW', label: t('marketplace.projectTypes.productreview') },
    { value: 'BRAND_AMBASSADOR', label: t('marketplace.projectTypes.brandambassador') },
    { value: 'EVENT_COVERAGE', label: t('marketplace.projectTypes.eventcoverage') },
    { value: 'TUTORIAL_VIDEO', label: t('marketplace.projectTypes.tutorialvideo') },
    { value: 'UNBOXING', label: t('marketplace.projectTypes.unboxing') },
    { value: 'GIVEAWAY', label: t('marketplace.projectTypes.giveaway') },
    { value: 'COLLABORATION', label: t('marketplace.projectTypes.collaboration') },
    { value: 'STORE_VISIT', label: t('marketplace.projectTypes.storevisit') },
    { value: 'OTHER', label: t('marketplace.projectTypes.other') },
  ];

  const [formData, setFormData] = useState<{
    title?: string;
    projectType?: ProjectType;
    description?: string;
    category?: string;
    budget?: number;
    startDate?: string;
    endDate?: string;
    location?: string;
    deliverables?: string[];
    requirements?: string;
    tags?: string;
    visibility?: 'PUBLIC' | 'PRIVATE' | 'DRAFT';
    maxApplications?: number;
    applicationDeadline?: string;
  }>({
    title: '',
    projectType: undefined,
    description: '',
    category: '',
    budget: undefined,
    startDate: '',
    endDate: '',
    location: '',
    deliverables: [''],
    requirements: '',
    tags: '',
    visibility: 'PUBLIC',
    maxApplications: undefined,
    applicationDeadline: '',
  });

  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Populate form data when in edit mode
  useEffect(() => {
    if (isEditMode && existingProject && !isFormPopulated) {
      setFormData({
        title: existingProject.title,
        projectType: existingProject.projectType,
        description: existingProject.description,
        category: existingProject.category || '',
        budget: existingProject.budget,
        startDate: existingProject.startDate.split('T')[0],
        endDate: existingProject.endDate.split('T')[0],
        location: existingProject.location || '',
        deliverables: existingProject.deliverables || [''],
        requirements: existingProject.requirements || '',
        tags: existingProject.tags.join(', '),
        visibility: existingProject.visibility,
        maxApplications: existingProject.maxApplications,
        applicationDeadline: existingProject.applicationDeadline?.split('T')[0] || '',
      });
      setIsFormPopulated(true);
    }
  }, [isEditMode, existingProject, isFormPopulated]);

  const addDeliverable = () => {
    setFormData((prev) => ({
      ...prev,
      deliverables: [...(prev.deliverables || []), ''],
    }));
  };

  const removeDeliverable = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      deliverables: (prev.deliverables || []).filter((_, i) => i !== index),
    }));
  };

  const updateDeliverable = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      deliverables: (prev.deliverables || []).map((d, i) => (i === index ? value : d)),
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title?.trim()) {
        newErrors.title = t('marketplace.createProject.validation.titleRequired');
      } else if (formData.title.length > 100) {
        newErrors.title = t('marketplace.createProject.validation.titleTooLong');
      }

      if (!formData.projectType) {
        newErrors.projectType = t('marketplace.createProject.validation.typeRequired');
      }

      if (!formData.category?.trim()) {
        newErrors.category = t('marketplace.createProject.validation.categoryRequired');
      }
    }

    if (step === 2) {
      if (!formData.description?.trim()) {
        newErrors.description = t('marketplace.createProject.validation.descriptionRequired');
      } else if (formData.description.length < 50) {
        newErrors.description = t('marketplace.createProject.validation.descriptionTooShort');
      }

      if (!formData.budget) {
        newErrors.budget = t('marketplace.createProject.validation.budgetRequired');
      } else if (formData.budget <= 0) {
        newErrors.budget = t('marketplace.createProject.validation.budgetPositive');
      }

      if (!formData.startDate) {
        newErrors.startDate = t('marketplace.createProject.validation.datesRequired');
      }

      if (!formData.endDate) {
        newErrors.endDate = t('marketplace.createProject.validation.datesRequired');
      }

      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (end <= start) {
          newErrors.endDate = t('marketplace.createProject.validation.endDateAfterStart');
        }

        // Optional: warn if start date is in the past (but allow it for draft editing)
        if (start < today && !formData.visibility) {
          newErrors.startDate = t('marketplace.createProject.validation.startDateFuture');
        }
      }
    }

    if (step === 3) {
      const validDeliverables = (formData.deliverables || []).filter((d) => d.trim() !== '');
      if (validDeliverables.length === 0) {
        newErrors.deliverables = t('marketplace.createProject.validation.deliverablesRequired');
      }

      if (formData.maxApplications && formData.maxApplications < 1) {
        newErrors.maxApplications = t('marketplace.createProject.validation.maxApplicationsPositive');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (asDraft: boolean = false) => {
    if (!asDraft && !validateStep(currentStep)) {
      return;
    }

    const projectData: CreateProjectData = {
      title: formData.title!,
      projectType: formData.projectType!,
      description: formData.description!,
      category: formData.category,
      budget: formData.budget!,
      startDate: new Date(formData.startDate!),
      endDate: new Date(formData.endDate!),
      location: formData.location,
      deliverables: (formData.deliverables || []).filter((d) => d.trim() !== ''),
      requirements: formData.requirements,
      tags: typeof formData.tags === 'string' 
        ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) 
        : formData.tags,
      visibility: asDraft ? 'DRAFT' : formData.visibility || 'PUBLIC',
      maxApplications: formData.maxApplications,
      applicationDeadline: formData.applicationDeadline ? new Date(formData.applicationDeadline) : undefined,
    };

    if (isEditMode) {
      updateProjectMutation.mutate(projectData, {
        onSuccess: () => {
          navigate('/salon/marketplace');
        },
      });
    } else {
      createProjectMutation.mutate(projectData, {
        onSuccess: () => {
          navigate('/salon/marketplace');
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-background-primary">
      <Header />
      <Sidebar />

      <div className="md:ml-64 pt-16 pb-20 md:pb-6">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {/* Loading state for edit mode */}
          {isEditMode && isLoadingProject ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <button
                  onClick={() => navigate('/salon/marketplace')}
                  className="flex items-center text-text-secondary hover:text-text-primary mb-4 transition-colors"
                >
                  <FiArrowLeft className="mr-2" />
                  {t('common.back')}
                </button>
                <div className="mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                    {isEditMode ? t('marketplace.createProject.editTitle') : t('marketplace.createProject.title')}
                  </h1>
                </div>
                <p className="text-text-secondary">
                  {t('marketplace.createProject.subtitle')}
                </p>
              </div>

              {/* Step Indicator */}
              <StepIndicator currentStep={currentStep} totalSteps={3} />

              {/* Form */}
              <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 lg:p-8 border border-border">
            <form className="space-y-5 md:space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4 md:space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplace.createProject.projectTitle')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    placeholder={t('marketplace.createProject.projectTitlePlaceholder')}
                    className={`w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    maxLength={100}
                  />
                  {errors.title && <p className="mt-1.5 text-xs md:text-sm text-red-600">{errors.title}</p>}
                  <p className="mt-1.5 text-xs text-gray-500 text-right">
                    {formData.title?.length || 0} / 100
                  </p>
                </div>

                {/* Project Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplace.createProject.projectType')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.projectType || ''}
                    onChange={(e) => updateFormData('projectType', e.target.value as ProjectType)}
                    className={`w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all appearance-none bg-white ${
                      errors.projectType ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    <option value="">{t('marketplace.filters.projectType')}</option>
                    {projectTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.projectType && <p className="mt-1.5 text-xs md:text-sm text-red-600">{errors.projectType}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplace.createProject.category')} <span className="text-red-500">*</span>
                  </label>
                  {categories && categories.length > 0 ? (
                    <select
                      value={formData.category || ''}
                      onChange={(e) => updateFormData('category', e.target.value)}
                      className={`w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all appearance-none bg-white ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                    >
                      <option value="">{t('marketplace.filters.category')}</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => updateFormData('category', e.target.value)}
                      placeholder={t('marketplace.createProject.categoryPlaceholder')}
                      className={`w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  )}
                  {errors.category && <p className="mt-1.5 text-xs md:text-sm text-red-600">{errors.category}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {currentStep === 2 && (
              <div className="space-y-4 md:space-y-5">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplace.createProject.description')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder={t('marketplace.createProject.descriptionPlaceholder')}
                    rows={4}
                    className={`w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none transition-all ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.description && <p className="mt-1.5 text-xs md:text-sm text-red-600">{errors.description}</p>}
                  <p className="mt-1.5 text-xs text-gray-500">
                    {t('marketplace.createProject.descriptionMinLength')}
                  </p>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplace.createProject.budget')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm md:text-base">
                      ¥
                    </span>
                    <input
                      type="number"
                      value={formData.budget || ''}
                      onChange={(e) => updateFormData('budget', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder={t('marketplace.createProject.budgetPlaceholder')}
                      className={`w-full pl-7 pr-3 py-2.5 md:pl-8 md:pr-4 md:py-3 text-sm md:text-base border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all ${
                        errors.budget ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min="0"
                    />
                  </div>
                  {errors.budget && <p className="mt-1.5 text-xs md:text-sm text-red-600">{errors.budget}</p>}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('marketplace.createProject.startDate')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => updateFormData('startDate', e.target.value)}
                      className={`w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all ${
                        errors.startDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.startDate && <p className="mt-1.5 text-xs md:text-sm text-red-600">{errors.startDate}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('marketplace.createProject.endDate')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => updateFormData('endDate', e.target.value)}
                      className={`w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all ${
                        errors.endDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.endDate && <p className="mt-1.5 text-xs md:text-sm text-red-600">{errors.endDate}</p>}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplace.createProject.location')}
                  </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => updateFormData('location', e.target.value)}
                      placeholder={t('marketplace.createProject.locationPlaceholder')}
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    />
                </div>
              </div>
            )}

            {/* Step 3: Requirements */}
            {currentStep === 3 && (
              <div className="space-y-4 md:space-y-5">
                {/* Deliverables */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplace.createProject.deliverables')} <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {(formData.deliverables || ['']).map((deliverable, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={deliverable}
                          onChange={(e) => updateDeliverable(index, e.target.value)}
                          placeholder={t('marketplace.createProject.deliverablePlaceholder')}
                          className="flex-1 px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                        />
                        {(formData.deliverables || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDeliverable(index)}
                            className="px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <FiX size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addDeliverable}
                      className="flex items-center text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
                    >
                      <FiPlus className="mr-1" size={16} />
                      {t('marketplace.createProject.addDeliverable')}
                    </button>
                  </div>
                  {errors.deliverables && <p className="mt-1.5 text-xs md:text-sm text-red-600">{errors.deliverables}</p>}
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplace.createProject.requirements')}
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => updateFormData('requirements', e.target.value)}
                    placeholder={t('marketplace.createProject.requirementsPlaceholder')}
                    rows={3}
                    className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none transition-all"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplace.createProject.tags')}
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => updateFormData('tags', e.target.value)}
                    placeholder={t('marketplace.createProject.tagsPlaceholder')}
                    className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    {t('marketplace.createProject.tagsHint')}
                  </p>
                </div>

                {/* Max Applications & Application Deadline */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('marketplace.createProject.maxApplications')}
                    </label>
                    <input
                      type="number"
                      value={formData.maxApplications || ''}
                      onChange={(e) => updateFormData('maxApplications', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder={t('marketplace.createProject.maxApplicationsPlaceholder')}
                      className={`w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all ${
                        errors.maxApplications ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min="1"
                    />
                    {errors.maxApplications && <p className="mt-1.5 text-xs md:text-sm text-red-600">{errors.maxApplications}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('marketplace.createProject.applicationDeadline')}
                    </label>
                    <input
                      type="date"
                      value={formData.applicationDeadline}
                      onChange={(e) => updateFormData('applicationDeadline', e.target.value)}
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketplace.createProject.visibility')}
                  </label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => updateFormData('visibility', e.target.value)}
                    className="w-full px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all appearance-none bg-white"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                  >
                    <option value="PUBLIC">{t('marketplace.createProject.visibilityPublic')}</option>
                    <option value="PRIVATE">{t('marketplace.createProject.visibilityPrivate')}</option>
                  </select>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-6 mt-6 border-t border-border">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center font-medium active:scale-95"
                >
                  <FiArrowLeft className="mr-2" size={18} />
                  {t('marketplace.createProject.previous')}
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all flex items-center justify-center font-semibold shadow-md hover:shadow-lg active:scale-95"
                >
                  {t('marketplace.createProject.next')}
                  <FiArrowRight className="ml-2" size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={isEditMode ? updateProjectMutation.isPending : createProjectMutation.isPending}
                  className="flex-1 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all flex items-center justify-center font-semibold shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isEditMode ? updateProjectMutation.isPending : createProjectMutation.isPending) ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      {isEditMode ? t('marketplace.createProject.update') : t('marketplace.createProject.publish')}
                    </>
                  )}
                </button>
              )}
            </div>
            </form>
          </div>
          </>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
