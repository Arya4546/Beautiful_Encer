import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { User, Lock, Save } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import adminService from '../../services/admin.service';
import { showToast } from '../../utils/toast';

interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const AdminProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: errorsProfile },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: errorsPassword },
    watch,
    reset: resetPassword,
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

  const handleProfileUpdate = async (data: ProfileFormData) => {
    try {
      setLoadingProfile(true);
      const response = await adminService.updateAdminProfile(data);
      
      // Update user in store
      if (user) {
        setUser({
          ...user,
          name: data.name,
          email: data.email,
        });
      }

      showToast.success(t('admin.profile.updateSuccess'));
    } catch (error: any) {
      showToast.error(error.response?.data?.message || t('admin.profile.updateError'));
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordUpdate = async (data: PasswordFormData) => {
    try {
      setLoadingPassword(true);
      await adminService.updateAdminPassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      resetPassword();
      showToast.success(t('admin.profile.passwordUpdateSuccess'));
    } catch (error: any) {
      showToast.error(error.response?.data?.message || t('admin.profile.passwordUpdateError'));
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
            {t('admin.profile.title')}
          </h1>
          <p className="mt-2 text-text-secondary">
            {t('admin.profile.subtitle')}
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-soft border border-border overflow-hidden">
          <div className="border-b border-border">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'text-magenta border-b-2 border-magenta bg-magenta/5'
                    : 'text-text-secondary hover:text-magenta hover:bg-background-tertiary'
                }`}
              >
                <User className="w-5 h-5 inline-block mr-2" />
                {t('admin.profile.profileTab')}
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'password'
                    ? 'text-magenta border-b-2 border-magenta bg-magenta/5'
                    : 'text-text-secondary hover:text-magenta hover:bg-background-tertiary'
                }`}
              >
                <Lock className="w-5 h-5 inline-block mr-2" />
                {t('admin.profile.passwordTab')}
              </button>
            </nav>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmitProfile(handleProfileUpdate)} className="p-6">
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('admin.profile.name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerProfile('name', { required: t('validation.required') })}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent transition-all"
                    placeholder={t('admin.profile.namePlaceholder')}
                  />
                  {errorsProfile.name && (
                    <p className="mt-1 text-sm text-red-600">{errorsProfile.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('admin.profile.email')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...registerProfile('email', {
                      required: t('validation.required'),
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: t('validation.invalidEmail'),
                      },
                    })}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent transition-all"
                    placeholder={t('admin.profile.emailPlaceholder')}
                  />
                  {errorsProfile.email && (
                    <p className="mt-1 text-sm text-red-600">{errorsProfile.email.message}</p>
                  )}
                </div>

                {/* Role (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('admin.profile.role')}
                  </label>
                  <input
                    type="text"
                    value={t('common.admin')}
                    disabled
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background-tertiary text-text-secondary"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 border-t border-border">
                  <button
                    type="submit"
                    disabled={loadingProfile}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-magenta to-pink-500 text-white rounded-lg font-medium hover:shadow-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingProfile ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {t('common.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {t('admin.profile.saveChanges')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handleSubmitPassword(handlePasswordUpdate)} className="p-6">
              <div className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('admin.profile.currentPassword')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    {...registerPassword('currentPassword', { required: t('validation.required') })}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent transition-all"
                    placeholder={t('admin.profile.currentPasswordPlaceholder')}
                  />
                  {errorsPassword.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{errorsPassword.currentPassword.message}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('admin.profile.newPassword')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    {...registerPassword('newPassword', {
                      required: t('validation.required'),
                      minLength: {
                        value: 8,
                        message: t('validation.passwordMinLength'),
                      },
                    })}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent transition-all"
                    placeholder={t('admin.profile.newPasswordPlaceholder')}
                  />
                  {errorsPassword.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errorsPassword.newPassword.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('admin.profile.confirmPassword')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    {...registerPassword('confirmPassword', {
                      required: t('validation.required'),
                      validate: (value) => value === newPassword || t('validation.passwordsDoNotMatch'),
                    })}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent transition-all"
                    placeholder={t('admin.profile.confirmPasswordPlaceholder')}
                  />
                  {errorsPassword.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errorsPassword.confirmPassword.message}</p>
                  )}
                </div>

                {/* Security Notice */}
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <p className="text-sm text-pink-800">
                    <span className="font-medium">{t('admin.profile.securityNote')}:</span> {t('admin.profile.passwordRequirements')}
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 border-t border-border">
                  <button
                    type="submit"
                    disabled={loadingPassword}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-magenta to-pink-500 text-white rounded-lg font-medium hover:shadow-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingPassword ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {t('common.updating')}
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        {t('admin.profile.updatePassword')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
