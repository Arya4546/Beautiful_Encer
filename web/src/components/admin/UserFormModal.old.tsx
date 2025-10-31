import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: 'INFLUENCER' | 'SALON';
  phoneNo?: string;
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
  const [role, setRole] = useState<'INFLUENCER' | 'SALON'>('INFLUENCER');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UserFormData>({
    defaultValues: user ? {
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNo: user.influencer?.phoneNo || user.salon?.phoneNo || '',
      bio: user.influencer?.bio || '',
      region: user.influencer?.region || '',
      businessName: user.salon?.businessName || '',
      description: user.salon?.description || '',
    } : {
      role: 'INFLUENCER',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (selectedRole) {
      setRole(selectedRole);
    }
  }, [selectedRole]);

  useEffect(() => {
    if (user) {
      setRole(user.role);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              {mode === 'create' ? t('admin.users.createUser') : t('admin.users.editUser')}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.users.role')} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    role === 'INFLUENCER' ? 'border-primary bg-primary bg-opacity-5' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      value="INFLUENCER"
                      {...register('role', { required: true })}
                      className="sr-only"
                      disabled={mode === 'edit'}
                    />
                    <span className="font-medium">{t('common.influencer')}</span>
                  </label>
                  <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    role === 'SALON' ? 'border-primary bg-primary bg-opacity-5' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      value="SALON"
                      {...register('role', { required: true })}
                      className="sr-only"
                      disabled={mode === 'edit'}
                    />
                    <span className="font-medium">{t('common.salon')}</span>
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.users.name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name', { required: t('validation.required') })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder={t('admin.users.namePlaceholder')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.users.email')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email', { 
                    required: t('validation.required'),
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: t('validation.invalidEmail')
                    }
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder={t('admin.users.emailPlaceholder')}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password (only for create mode) */}
              {mode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.users.password')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    {...register('password', { 
                      required: mode === 'create' ? t('validation.required') : false,
                      minLength: {
                        value: 8,
                        message: t('validation.passwordMinLength')
                      }
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder={t('admin.users.passwordPlaceholder')}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              )}

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.users.phoneNo')}
                </label>
                <input
                  type="tel"
                  {...register('phoneNo')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder={t('admin.users.phoneNoPlaceholder')}
                />
              </div>

              {/* Influencer-specific fields */}
              {role === 'INFLUENCER' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.users.bio')}
                    </label>
                    <textarea
                      {...register('bio')}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                      placeholder={t('admin.users.bioPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.users.region')}
                    </label>
                    <select
                      {...register('region')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                    >
                      <option value="">{t('admin.users.selectRegion')}</option>
                      <option value="Tokyo">Tokyo</option>
                      <option value="Osaka">Osaka</option>
                      <option value="Kyoto">Kyoto</option>
                      <option value="Yokohama">Yokohama</option>
                      <option value="Nagoya">Nagoya</option>
                      <option value="Sapporo">Sapporo</option>
                      <option value="Fukuoka">Fukuoka</option>
                      <option value="Kobe">Kobe</option>
                    </select>
                  </div>
                </>
              )}

              {/* Salon-specific fields */}
              {role === 'SALON' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.users.businessName')}
                    </label>
                    <input
                      type="text"
                      {...register('businessName')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder={t('admin.users.businessNamePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.users.description')}
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                      placeholder={t('admin.users.descriptionPlaceholder')}
                    />
                  </div>
                </>
              )}

              {/* Terms Notice (for create mode) */}
              {mode === 'create' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">{t('admin.users.note')}:</span> {t('admin.users.termsAutoAccepted')}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
