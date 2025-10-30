import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { 
  User, 
  Lock, 
  Image as ImageIcon, 
  Save, 
  X,
  Eye,
  EyeOff,
  LogOut,
  ChevronRight,
  Edit2,
  Trash2,
  Shield,
  Bell,
  Globe,
  Mail,
  Calendar,
  Briefcase,
  MapPin,
  Camera,
  Check,
  Upload,
  Share2,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import profileService from '../services/profile.service';
import type { UpdateProfileData, ChangePasswordData } from '../services/profile.service';
import { showToast } from '../utils/toast';
import { RegionSelector } from '../components/common/RegionSelector';
import { getRegionName } from '../constants/regions';
import { ButtonLoader } from '../components/ui/Loader';

interface SettingItem {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  onClick: () => void;
}

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const [showModal, setShowModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileDataLoaded, setProfileDataLoaded] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await new Promise(resolve => setTimeout(resolve, 300)); // Brief delay for UI feedback
    logout();
    showToast.success('Logged out successfully');
    navigate('/login');
    setIsLoggingOut(false);
  };

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    categories: [] as string[],
    region: '',
    age: 0,
    gender: '',
    businessName: '',
    description: '',
    website: '',
    preferredCategories: [] as string[],
    profilePic: '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    // Only load if not already loaded in this session
    if (!profileDataLoaded) {
      loadProfileData();
    }
  }, [profileDataLoaded]);

  const loadProfileData = async () => {
    // Check if already fetched in this session
    const hasFetched = sessionStorage.getItem('profile_data_fetched');
    if (hasFetched && !profileDataLoaded) {
      setProfileDataLoaded(true);
      return;
    }
    
    try {
      setLoading(true);
      const profile = await profileService.getMyProfile();
      
      // Update global user state with fresh profile data
      if (user) {
        const updatedUser = {
          ...user,
          name: profile.name,
          influencer: profile.influencer ? {
            profilePic: profile.influencer.profilePic || undefined,
            bio: profile.influencer.bio || undefined,
            categories: profile.influencer.categories || undefined,
          } : undefined,
          salon: profile.salon ? {
            businessName: profile.salon.businessName || undefined,
            profilePic: profile.salon.profilePic || undefined,
            description: profile.salon.description || undefined,
          } : undefined,
        };
        setUser(updatedUser);
      }
      
      setProfileData({
        name: profile.name || '',
        bio: profile.influencer?.bio || '',
        categories: profile.influencer?.categories || [],
        region: profile.influencer?.region || '',
        age: profile.influencer?.age || 0,
        gender: profile.influencer?.gender || '',
        businessName: profile.salon?.businessName || '',
        description: profile.salon?.description || '',
        website: '',
        preferredCategories: profile.salon?.preferredCategories || [],
        profilePic: profile.influencer?.profilePic || profile.salon?.profilePic || '',
      });
      
      sessionStorage.setItem('profile_data_fetched', 'true');
      setProfileDataLoaded(true);
    } catch (error: any) {
      showToast.error('Failed to load profile data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const updateData: UpdateProfileData = {
        name: profileData.name,
      };

      if (user?.role === 'INFLUENCER') {
        updateData.bio = profileData.bio;
        updateData.categories = profileData.categories;
        updateData.region = profileData.region;
        updateData.age = profileData.age || undefined;
        updateData.gender = profileData.gender;
      } else if (user?.role === 'SALON') {
        updateData.businessName = profileData.businessName;
        updateData.description = profileData.description;
        updateData.website = profileData.website;
        updateData.preferredCategories = profileData.preferredCategories;
      }

      await profileService.updateProfile(updateData);
      showToast.success('Profile updated successfully!');
      setShowModal(null);
      await loadProfileData();
    } catch (error: any) {
      showToast.error(error.response?.data?.error || 'Failed to update profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const data: ChangePasswordData = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      };

      await profileService.changePassword(data);
      showToast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowModal(null);
    } catch (error: any) {
      showToast.error(error.response?.data?.error || 'Failed to change password');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showToast.error('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      await profileService.deleteAccount(deletePassword);
      showToast.success('Account deleted successfully');
      logout();
    } catch (error: any) {
      showToast.error(error.response?.data?.error || 'Failed to delete account');
      console.error(error);
    } finally {
      setLoading(false);
      setShowModal(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast.error('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureUpdate = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      showToast.error('Please select an image');
      return;
    }

    try {
      setUploadingImage(true);
      const file = fileInputRef.current.files[0];
      const formData = new FormData();
      formData.append('profilePic', file);

      const response = await profileService.uploadProfilePicture(formData);
      
      showToast.success('Profile picture updated successfully!');
      setImagePreview(null);
      setShowModal(null);
      
      // Update user state with new profile picture
      if (user) {
        const updatedUser = {
          ...user,
          influencer: user.role === 'INFLUENCER' ? { ...user.influencer, profilePic: response.profilePic } : user.influencer,
          salon: user.role === 'SALON' ? { ...user.salon, profilePic: response.profilePic } : user.salon,
        };
        setUser(updatedUser);
      }
      
      await loadProfileData();
    } catch (error: any) {
      showToast.error(error.response?.data?.error || 'Failed to upload image');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const getCurrentProfilePic = () => {
    if (user?.role === 'INFLUENCER' && user?.influencer?.profilePic) {
      return user.influencer.profilePic;
    }
    if (user?.role === 'SALON' && user?.salon?.profilePic) {
      return user.salon.profilePic;
    }
    return null;
  };

  const settingSections: Array<{ title: string; items: SettingItem[] }> = [
    {
      title: t('profile.sections.profile'),
      items: [
        {
          id: 'profile-info',
          title: t('profile.information.title'),
          subtitle: t('profile.information.subtitle'),
          icon: User,
          onClick: () => setShowModal('profile'),
        },
        {
          id: 'profile-picture',
          title: t('profile.picture.title'),
          subtitle: t('profile.picture.subtitle'),
          icon: Camera,
          onClick: () => setShowModal('profile-picture'),
        },
        // Only show Social Media connection for influencers
        ...(user?.role === 'INFLUENCER' ? [{
          id: 'social-media-connect',
          title: 'Connect Social Media',
          subtitle: 'Link your social media accounts to showcase your influence',
          icon: Share2,
          onClick: () => navigate('/social-media'),
        }] : []),
      ],
    },
    {
      title: t('profile.sections.security'),
      items: [
        {
          id: 'change-password',
          title: t('profile.password.title'),
          subtitle: t('profile.password.subtitle'),
          icon: Lock,
          onClick: () => setShowModal('password'),
        },
      ],
    },
    {
      title: t('profile.sections.account'),
      items: [
        {
          id: 'logout',
          title: t('profile.logout.title'),
          subtitle: t('profile.logout.subtitle'),
          icon: LogOut,
          onClick: handleLogout,
        },
        {
          id: 'delete-account',
          title: t('profile.deleteAccount.title'),
          subtitle: t('profile.deleteAccount.subtitle'),
          icon: Trash2,
          onClick: () => setShowModal('delete'),
        },
      ],
    },
  ];

  return (
    <>
      <Header />
      <div className="fixed inset-0 pt-16 md:pt-20 pb-16 md:pb-0 flex bg-background">
        <Sidebar />
        
        <div className="flex-1 overflow-hidden md:ml-64">
          <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-border flex-shrink-0">
              <h1 className="text-xl md:text-2xl font-bold text-text-primary">{t('profile.title')}</h1>
              <p className="text-xs md:text-sm text-text-secondary mt-1">
                {t('profile.subtitle')}
              </p>
            </div>

            {/* Settings List */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-6">
                {/* User Info Card */}
                <div className="bg-gradient-to-br from-magenta/10 to-magenta-dark/10 rounded-xl p-4 md:p-6">
                  <div className="flex items-center space-x-4">
                    {getCurrentProfilePic() ? (
                      <img
                        src={getCurrentProfilePic()!}
                        alt={user?.name}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-magenta/30 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-magenta to-magenta-dark flex items-center justify-center text-white text-xl md:text-2xl font-bold flex-shrink-0">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg md:text-xl font-bold text-text-primary truncate">{user?.name}</h2>
                      <p className="text-sm text-text-secondary truncate">{user?.email}</p>
                      <div className="mt-2 inline-flex items-center px-2 md:px-3 py-1 bg-magenta/20 text-magenta text-xs md:text-sm rounded-full font-medium">
                        {user?.role === 'INFLUENCER' ? t('common.influencer') : t('common.salon')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings Sections */}
                {settingSections.map((section) => (
                  <div key={section.title} className="space-y-3">
                    <h3 className="text-xs md:text-sm font-semibold text-gray-500 uppercase px-2">
                      {section.title}
                    </h3>
                    <div className="bg-white border border-border rounded-xl overflow-hidden divide-y divide-border">
                      {section.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={item.onClick}
                          disabled={item.id === 'logout' && isLoggingOut}
                          className={`w-full px-4 md:px-6 py-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                            item.id === 'delete-account' ? 'hover:bg-red-50' : ''
                          }`}
                        >
                          {item.id === 'logout' && isLoggingOut ? (
                            <>
                              <div className="flex-shrink-0 p-2 md:p-3 rounded-lg bg-magenta/10">
                                <ButtonLoader />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm md:text-base font-medium text-text-primary">
                                  Logging out...
                                </h4>
                                <p className="text-xs md:text-sm text-text-secondary mt-0.5 truncate">
                                  Please wait...
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className={`flex-shrink-0 p-2 md:p-3 rounded-lg ${
                                item.id === 'delete-account' 
                                  ? 'bg-red-100 text-red-600' 
                                  : 'bg-magenta/10 text-magenta'
                              }`}>
                                <item.icon size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-sm md:text-base font-medium ${
                                  item.id === 'delete-account' ? 'text-red-600' : 'text-text-primary'
                                }`}>
                                  {item.title}
                                </h4>
                                <p className="text-xs md:text-sm text-text-secondary mt-0.5 truncate">
                                  {item.subtitle}
                                </p>
                              </div>
                              <ChevronRight size={20} className="flex-shrink-0 text-gray-400" />
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[85vh] md:max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-border flex-shrink-0">
              <h2 className="text-lg md:text-xl font-bold text-text-primary">
                {showModal === 'profile' && t('profile.editProfile')}
                {showModal === 'profile-picture' && t('profile.picture.title')}
                {showModal === 'password' && t('profile.password.title')}
                {showModal === 'delete' && t('profile.deleteAccount.title')}
              </h2>
              <button
                onClick={() => {
                  setShowModal(null);
                  setImagePreview(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
              {showModal === 'profile' && (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('profile.fullName')}
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50"
                      placeholder={t('profile.enterFullName')}
                      required
                    />
                  </div>

                  {user?.role === 'INFLUENCER' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          {t('profile.bio')}
                        </label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 min-h-[80px] resize-none"
                          placeholder={t('profile.tellAboutYourself')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          {t('profile.region')}
                        </label>
                        <RegionSelector
                          value={profileData.region}
                          onChange={(value) => setProfileData({ ...profileData, region: value })}
                          placeholder={t('profile.selectRegion')}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            {t('profile.age')}
                          </label>
                          <input
                            type="number"
                            value={profileData.age || ''}
                            onChange={(e) => setProfileData({ ...profileData, age: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50"
                            placeholder={t('profile.age')}
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            {t('profile.gender')}
                          </label>
                          <select
                            value={profileData.gender}
                            onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50"
                          >
                            <option value="">{t('profile.select')}</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {user?.role === 'SALON' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={profileData.businessName}
                          onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50"
                          placeholder="Your salon/business name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Description
                        </label>
                        <textarea
                          value={profileData.description}
                          onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 min-h-[80px] resize-none"
                          placeholder="Describe your business"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Website
                        </label>
                        <input
                          type="url"
                          value={profileData.website}
                          onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-magenta to-magenta-dark text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Save size={18} />
                    <span>{loading ? t('common.loading') : t('profile.saveChanges')}</span>
                  </button>
                </form>
              )}

              {showModal === 'profile-picture' && (
                <div className="space-y-6">
                  {/* Current Profile Picture */}
                  <div className="text-center">
                    <label className="block text-sm font-medium text-text-primary mb-4">
                      Current Profile Picture
                    </label>
                    {getCurrentProfilePic() ? (
                      <img
                        src={getCurrentProfilePic()!}
                        alt={user?.name}
                        className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full object-cover border-4 border-magenta/30"
                      />
                    ) : (
                      <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full bg-gradient-to-br from-magenta to-magenta-dark flex items-center justify-center text-white text-4xl md:text-5xl font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="text-center">
                      <label className="block text-sm font-medium text-text-primary mb-4">
                        New Profile Picture Preview
                      </label>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full object-cover border-4 border-green-500/30"
                      />
                    </div>
                  )}

                  {/* Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      {imagePreview ? t('profile.picture.changeImage') : t('profile.picture.uploadNew')}
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="profile-pic-upload"
                    />
                    <label
                      htmlFor="profile-pic-upload"
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-magenta hover:bg-magenta/5 transition-all cursor-pointer"
                    >
                      <Upload size={20} className="text-magenta" />
                      <span className="text-sm font-medium text-text-secondary">
                        {t('profile.picture.chooseDevice')}
                      </span>
                    </label>
                    <p className="text-xs text-text-tertiary mt-2 text-center">
                      {t('profile.picture.maxSize')}
                    </p>
                  </div>

                  {/* Upload Button */}
                  <button
                    onClick={handleProfilePictureUpdate}
                    disabled={uploadingImage || !imagePreview}
                    className="w-full py-3 md:py-3.5 bg-gradient-to-r from-magenta to-magenta-dark text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Save size={18} />
                    <span>{uploadingImage ? t('profile.picture.uploading') : t('profile.picture.updateButton')}</span>
                  </button>
                </div>
              )}

              {showModal === 'password' && (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('profile.password.currentPassword')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 pr-12"
                        placeholder={t('profile.password.currentPasswordPlaceholder')}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('profile.password.newPassword')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 pr-12"
                        placeholder={t('profile.password.newPasswordPlaceholder')}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('profile.password.confirmPassword')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 pr-12"
                        placeholder={t('profile.password.confirmPasswordPlaceholder')}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-magenta to-magenta-dark text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Check size={18} />
                    <span>{loading ? t('profile.password.changing') : t('profile.password.changeButton')}</span>
                  </button>
                </form>
              )}

              {showModal === 'delete' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 font-medium">
                      {t('profile.deleteAccount.warning')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('profile.deleteAccount.confirmLabel')}
                    </label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full px-4 py-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      placeholder={t('profile.deleteAccount.confirmPlaceholder')}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowModal(null)}
                      className="flex-1 py-3 border border-border rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading || !deletePassword}
                      className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? t('profile.deleteAccount.deleting') : t('profile.deleteAccount.deleteButton')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
};
