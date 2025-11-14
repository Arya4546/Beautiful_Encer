import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiArrowLeft, FiArrowRight, FiSave, FiSend, FiCalendar,
  FiDollarSign, FiMapPin, FiFileText, FiTag, FiClock, FiX, FiPlus, FiAlertCircle
} from 'react-icons/fi';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { useAuthStore } from '../store/authStore';
import { useCreateProject, useCategories, useProject, useUpdateProject } from '../hooks/useMarketplace';
import { type ProjectType, type CreateProjectData } from '../services/marketplace.service';
import toast from 'react-hot-toast';

// Step Indicator Component
const StepIndicator: React.FC<{ currentStep: number; totalSteps: number }> = ({
  currentStep,
  totalSteps,
}) => {
  const { t } = useTranslation();
  
  const steps = [
    { number: 1, label: t('marketplace.createProject.step1') },
    { number: 2, label: t('marketplace.createProject.step2') },
    { number: 3, label: t('marketplace.createProject.step3') },
    { number: 4, label: t('marketplace.createProject.step4') },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  step.number === currentStep
                    ? 'bg-magenta text-white'
                    : step.number < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.number < currentStep ? '✓' : step.number}
              </div>
              <p
                className={`text-xs mt-2 ${
                  step.number === currentStep ? 'text-magenta font-semibold' : 'text-text-secondary'
                }`}
              >
                {step.label}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded ${
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

      if (!formData.budget || formData.budget <= 0) {
        newErrors.budget = t('marketplace.createProject.validation.budgetRequired');
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
        <div className="max-w-4xl mx-auto p-6">
          {/* Loading state for edit mode */}
          {isEditMode && isLoadingProject ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magenta" />
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
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  {isEditMode ? t('marketplace.createProject.editTitle') : t('marketplace.createProject.title')}
            </h1>
            <p className="text-text-secondary">
              {t('marketplace.createProject.subtitle')}
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} totalSteps={4} />

          {/* Form */}
          <div className="bg-white rounded-xl shadow-soft p-6 md:p-8 border border-border">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-text-primary mb-4">
                  {t('marketplace.createProject.step1')}
                </h2>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('marketplace.createProject.projectTitle')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    placeholder={t('marketplace.createProject.projectTitlePlaceholder')}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent ${
                      errors.title ? 'border-red-500' : 'border-border'
                    }`}
                    maxLength={100}
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                  <p className="mt-1 text-xs text-text-tertiary text-right">
                    {formData.title?.length || 0} / 100
                  </p>
                </div>

                {/* Project Type */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('marketplace.createProject.projectType')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.projectType || ''}
                    onChange={(e) => updateFormData('projectType', e.target.value as ProjectType)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent ${
                      errors.projectType ? 'border-red-500' : 'border-border'
                    }`}
                  >
                    <option value="">{t('marketplace.filters.projectType')}</option>
                    {projectTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.projectType && <p className="mt-1 text-sm text-red-500">{errors.projectType}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('marketplace.createProject.category')} <span className="text-red-500">*</span>
                  </label>
                  {categories && categories.length > 0 ? (
                    <select
                      value={formData.category || ''}
                      onChange={(e) => updateFormData('category', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent ${
                        errors.category ? 'border-red-500' : 'border-border'
                      }`}
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
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent ${
                        errors.category ? 'border-red-500' : 'border-border'
                      }`}
                    />
                  )}
                  {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-text-primary mb-4">
                  {t('marketplace.createProject.step2')}
                </h2>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('marketplace.createProject.description')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder={t('marketplace.createProject.descriptionPlaceholder')}
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent resize-none ${
                      errors.description ? 'border-red-500' : 'border-border'
                    }`}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                  <p className="mt-1 text-xs text-text-tertiary">
                    {t('marketplace.createProject.descriptionMinLength')}
                  </p>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('marketplace.createProject.budget')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary">
                      ¥
                    </span>
                    <input
                      type="number"
                      value={formData.budget || ''}
                      onChange={(e) => updateFormData('budget', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder={t('marketplace.createProject.budgetPlaceholder')}
                      className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent ${
                        errors.budget ? 'border-red-500' : 'border-border'
                      }`}
                      min="0"
                    />
                  </div>
                  {errors.budget && <p className="mt-1 text-sm text-red-500">{errors.budget}</p>}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('marketplace.createProject.startDate')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => updateFormData('startDate', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent ${
                        errors.startDate ? 'border-red-500' : 'border-border'
                      }`}
                    />
                    {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('marketplace.createProject.endDate')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => updateFormData('endDate', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent ${
                        errors.endDate ? 'border-red-500' : 'border-border'
                      }`}
                    />
                    {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('marketplace.createProject.location')}
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateFormData('location', e.target.value)}
                    placeholder={t('marketplace.createProject.locationPlaceholder')}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Requirements */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-text-primary mb-4">
                  {t('marketplace.createProject.step3')}
                </h2>

                {/* Deliverables */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
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
                          className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent"
                        />
                        {(formData.deliverables || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDeliverable(index)}
                            className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiX size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addDeliverable}
                      className="flex items-center text-sm text-magenta hover:text-magenta-dark font-medium"
                    >
                      <FiPlus className="mr-1" />
                      {t('marketplace.createProject.addDeliverable')}
                    </button>
                  </div>
                  {errors.deliverables && <p className="mt-1 text-sm text-red-500">{errors.deliverables}</p>}
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('marketplace.createProject.requirements')}
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => updateFormData('requirements', e.target.value)}
                    placeholder={t('marketplace.createProject.requirementsPlaceholder')}
                    rows={4}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent resize-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('marketplace.createProject.tags')}
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => updateFormData('tags', e.target.value)}
                    placeholder={t('marketplace.createProject.tagsPlaceholder')}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-text-tertiary">
                    {t('marketplace.createProject.tagsHint')}
                  </p>
                </div>

                {/* Max Applications */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('marketplace.createProject.maxApplications')}
                  </label>
                  <input
                    type="number"
                    value={formData.maxApplications || ''}
                    onChange={(e) => updateFormData('maxApplications', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder={t('marketplace.createProject.maxApplicationsPlaceholder')}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent ${
                      errors.maxApplications ? 'border-red-500' : 'border-border'
                    }`}
                    min="1"
                  />
                  {errors.maxApplications && <p className="mt-1 text-sm text-red-500">{errors.maxApplications}</p>}
                </div>

                {/* Application Deadline */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('marketplace.createProject.applicationDeadline')}
                  </label>
                  <input
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => updateFormData('applicationDeadline', e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-text-tertiary">
                    {t('marketplace.createProject.deadlineHint')}
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-text-primary mb-4">
                  {t('marketplace.createProject.step4')}
                </h2>

                <div className="bg-background-secondary rounded-lg p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      {t('marketplace.createProject.projectTitle')}
                    </h3>
                    <p className="text-text-secondary">{formData.title}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      {t('marketplace.createProject.projectType')}
                    </h3>
                    <p className="text-text-secondary">
                      {projectTypes.find((t) => t.value === formData.projectType)?.label}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      {t('marketplace.createProject.category')}
                    </h3>
                    <p className="text-text-secondary">{formData.category}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      {t('marketplace.createProject.description')}
                    </h3>
                    <p className="text-text-secondary whitespace-pre-wrap">{formData.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary mb-1">
                        {t('marketplace.createProject.budget')}
                      </h3>
                      <p className="text-text-secondary">¥{formData.budget?.toLocaleString()}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-text-primary mb-1">
                        {t('marketplace.createProject.location')}
                      </h3>
                      <p className="text-text-secondary">{formData.location || '-'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      {t('marketplace.createProject.deliverables')}
                    </h3>
                    <ul className="list-disc list-inside text-text-secondary">
                      {(formData.deliverables || []).filter((d) => d.trim()).map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('marketplace.createProject.visibility')}
                  </label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => updateFormData('visibility', e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent"
                  >
                    <option value="PUBLIC">{t('marketplace.createProject.visibilityPublic')}</option>
                    <option value="PRIVATE">{t('marketplace.createProject.visibilityPrivate')}</option>
                  </select>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-6 border-t border-border mt-6">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  className="px-6 py-3 border border-border text-text-primary rounded-lg hover:bg-background-secondary transition-colors flex items-center"
                >
                  <FiArrowLeft className="mr-2" />
                  {t('marketplace.createProject.previous')}
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 bg-magenta text-white rounded-lg hover:bg-magenta-dark transition-colors flex items-center justify-center"
                >
                  {t('marketplace.createProject.next')}
                  <FiArrowRight className="ml-2" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={isEditMode ? updateProjectMutation.isPending : createProjectMutation.isPending}
                    className="flex-1 px-6 py-3 border border-magenta text-magenta rounded-lg hover:bg-magenta hover:text-white transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    <FiSave className="mr-2" />
                    {t('marketplace.createProject.saveAsDraft')}
                  </button>
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={isEditMode ? updateProjectMutation.isPending : createProjectMutation.isPending}
                    className="flex-1 px-6 py-3 bg-magenta text-white rounded-lg hover:bg-magenta-dark transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {(isEditMode ? updateProjectMutation.isPending : createProjectMutation.isPending) ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        {t('common.loading')}
                      </>
                    ) : (
                      <>
                        <FiSend className="mr-2" />
                        {isEditMode ? t('marketplace.createProject.update') : t('marketplace.createProject.publish')}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
          </>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
