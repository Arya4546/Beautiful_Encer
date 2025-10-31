import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Phone, FileText, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { RegionSelector } from '../common/RegionSelector';

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: 'INFLUENCER' | 'SALON';
  phoneNumber?: string;
  // Influencer fields
  bio?: string;
  region?: string;
  // Salon fields
  businessName?: string;
  description?: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  user?: any; // For edit mode
  mode: 'create' | 'edit';
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  mode,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'INFLUENCER' | 'SALON'>(
    user?.role || 'INFLUENCER'
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
  } = useForm<UserFormData>({
    defaultValues: user ? {
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.influencer?.phoneNo || user.salon?.phoneNo || '',
      bio: user.influencer?.bio || '',
      region: user.influencer?.region || '',
      businessName: user.salon?.businessName || '',
      description: user.salon?.description || '',
    } : {
      role: 'INFLUENCER',
    },
  });

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.influencer?.phoneNo || user.salon?.phoneNo || '',
        bio: user.influencer?.bio || '',
        region: user.influencer?.region || '',
        businessName: user.salon?.businessName || '',
        description: user.salon?.description || '',
      });
    } else {
      setSelectedRole('INFLUENCER');
      reset({ role: 'INFLUENCER' });
    }
  }, [user, reset, isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);
      await onSubmit({ ...data, role: selectedRole });
      reset();
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: 'INFLUENCER' | 'SALON') => {
    setSelectedRole(role);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-large max-w-2xl w-full transform transition-all animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                {mode === 'create' ? t('admin.users.createUser') : t('admin.users.editUser')}
              </h2>
              <p className="text-sm text-text-tertiary mt-1">
                {mode === 'create' 
                  ? t('admin.users.createUserDescription')
                  : t('admin.users.editUserDescription')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-background-tertiary transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
            <div className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-3">
                  {t('admin.users.selectRole')} <span className="text-magenta">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('INFLUENCER')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedRole === 'INFLUENCER'
                        ? 'border-magenta bg-magenta/5 shadow-soft'
                        : 'border-border hover:border-pink-300 hover:bg-background-tertiary'
                    }`}
                  >
                    <User className={`w-6 h-6 mx-auto mb-2 ${
                      selectedRole === 'INFLUENCER' ? 'text-magenta' : 'text-text-tertiary'
                    }`} />
                    <div className={`font-semibold ${
                      selectedRole === 'INFLUENCER' ? 'text-magenta' : 'text-text-secondary'
                    }`}>
                      {t('common.influencer')}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('SALON')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedRole === 'SALON'
                        ? 'border-magenta bg-magenta/5 shadow-soft'
                        : 'border-border hover:border-pink-300 hover:bg-background-tertiary'
                    }`}
                  >
                    <Building2 className={`w-6 h-6 mx-auto mb-2 ${
                      selectedRole === 'SALON' ? 'text-magenta' : 'text-text-tertiary'
                    }`} />
                    <div className={`font-semibold ${
                      selectedRole === 'SALON' ? 'text-magenta' : 'text-text-secondary'
                    }`}>
                      {t('common.salon')}
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('admin.users.name')} <span className="text-magenta">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                    <input
                      type="text"
                      {...register('name', { required: t('validation.required') })}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent transition-all"
                      placeholder={t('admin.users.namePlaceholder')}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('admin.users.email')} <span className="text-magenta">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                    <input
                      type="email"
                      {...register('email', {
                        required: t('validation.required'),
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: t('validation.invalidEmail'),
                        },
                      })}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent transition-all"
                      placeholder={t('admin.users.emailPlaceholder')}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password (only for create mode) */}
                {mode === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('admin.users.password')} <span className="text-magenta">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                      <input
                        type="password"
                        {...register('password', mode === 'create' ? {
                          required: t('validation.required'),
                          minLength: {
                            value: 8,
                            message: t('validation.passwordMinLength'),
                          },
                        } : {})}
                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent transition-all"
                        placeholder={t('admin.users.passwordPlaceholder')}
                      />
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>
                )}

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('admin.users.phoneNumber')}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                    <input
                      type="tel"
                      {...register('phoneNumber')}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent transition-all"
                      placeholder={t('admin.users.phonePlaceholder')}
                    />
                  </div>
                </div>
              </div>

              {/* Conditional fields based on role */}
              {selectedRole === 'INFLUENCER' ? (
                <>
                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('admin.users.bio')}
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 text-text-tertiary w-5 h-5" />
                      <textarea
                        {...register('bio')}
                        rows={3}
                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent transition-all resize-none"
                        placeholder={t('admin.users.bioPlaceholder')}
                      />
                    </div>
                  </div>

                  {/* Region */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('admin.users.region')}
                    </label>
                    <Controller
                      name="region"
                      control={control}
                      render={({ field }) => (
                        <RegionSelector
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder={t('admin.users.regionPlaceholder')}
                          error={errors.region?.message}
                        />
                      )}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('admin.users.businessName')}
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                      <input
                        type="text"
                        {...register('businessName')}
                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent transition-all"
                        placeholder={t('admin.users.businessNamePlaceholder')}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('admin.users.description')}
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 text-text-tertiary w-5 h-5" />
                      <textarea
                        {...register('description')}
                        rows={3}
                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent transition-all resize-none"
                        placeholder={t('admin.users.descriptionPlaceholder')}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Notice for create mode */}
              {mode === 'create' && (
                <div className="bg-magenta/5 border border-magenta/20 rounded-lg p-4">
                  <p className="text-sm text-text-secondary">
                    <span className="font-semibold text-magenta">{t('admin.users.note')}:</span>{' '}
                    {t('admin.users.createUserNote')}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 border-2 border-border rounded-lg text-text-secondary font-semibold hover:bg-background-tertiary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-magenta to-pink-500 text-white rounded-lg font-semibold hover:shadow-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('common.saving')}
                  </span>
                ) : (
                  mode === 'create' ? t('admin.users.createUser') : t('admin.users.saveChanges')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
