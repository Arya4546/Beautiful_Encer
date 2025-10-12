import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { 
  User, 
  Mail, 
  Lock, 
  Image as ImageIcon, 
  Save, 
  Camera,
  AlertCircle,
  CheckCircle,
  Trash2,
  X,
  Eye,
  EyeOff,
  LogOut,
  Calendar,
  MapPin,
  Briefcase,
  Globe,
  Edit3
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import profileService from '../services/profile.service';
import type { UpdateProfileData, ChangePasswordData } from '../services/profile.service';
import { toast } from 'react-toastify';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'account'>('profile');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const profile = await profileService.getMyProfile();
      
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
      });
    } catch (error: any) {
      toast.error('Failed to load profile data');
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
      toast.success('Profile updated successfully!');
      await loadProfileData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const data: ChangePasswordData = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      };

      await profileService.changePassword(data);
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      await profileService.deleteAccount(deletePassword);
      toast.success('Account deleted successfully');
      logout();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete account');
      console.error(error);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile Details', icon: User },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'account' as const, label: 'Account', icon: Briefcase },
  ];

  return (
    <>
      <Header />
      <div className="fixed inset-0 pt-16 md:pt-20 pb-16 md:pb-0 flex bg-background">
        <Sidebar />
        
        <div className="flex-1 overflow-hidden md:ml-64">
          <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-6 border-b border-border flex-shrink-0">
              <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
              <p className="text-sm text-text-secondary mt-1">
                Manage your account settings and preferences
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-border flex-shrink-0 overflow-x-auto">
              <div className="flex space-x-1 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-magenta text-magenta'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <tab.icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto chat-scroll">
              <div className="max-w-3xl mx-auto p-6">
                {activeTab === 'profile' && (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Name */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-text-primary mb-2">
                        <User size={16} />
                        <span>Full Name</span>
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    {user?.role === 'INFLUENCER' && (
                      <>
                        {/* Bio */}
                        <div>
                          <label className="flex items-center space-x-2 text-sm font-medium text-text-primary mb-2">
                            <Edit3 size={16} />
                            <span>Bio</span>
                          </label>
                          <textarea
                            value={profileData.bio}
                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 min-h-[100px]"
                            placeholder="Tell us about yourself"
                          />
                        </div>

                        {/* Region */}
                        <div>
                          <label className="flex items-center space-x-2 text-sm font-medium text-text-primary mb-2">
                            <MapPin size={16} />
                            <span>Region</span>
                          </label>
                          <input
                            type="text"
                            value={profileData.region}
                            onChange={(e) => setProfileData({ ...profileData, region: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50"
                            placeholder="e.g., New York, USA"
                          />
                        </div>

                        {/* Age & Gender */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-text-primary mb-2">
                              <Calendar size={16} />
                              <span>Age</span>
                            </label>
                            <input
                              type="number"
                              value={profileData.age || ''}
                              onChange={(e) => setProfileData({ ...profileData, age: parseInt(e.target.value) || 0 })}
                              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50"
                              placeholder="Enter your age"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="flex items-center space-x-2 text-sm font-medium text-text-primary mb-2">
                              <User size={16} />
                              <span>Gender</span>
                            </label>
                            <select
                              value={profileData.gender}
                              onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50"
                            >
                              <option value="">Select gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                              <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    {user?.role === 'SALON' && (
                      <>
                        {/* Business Name */}
                        <div>
                          <label className="flex items-center space-x-2 text-sm font-medium text-text-primary mb-2">
                            <Briefcase size={16} />
                            <span>Business Name</span>
                          </label>
                          <input
                            type="text"
                            value={profileData.businessName}
                            onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50"
                            placeholder="Your salon/business name"
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="flex items-center space-x-2 text-sm font-medium text-text-primary mb-2">
                            <Edit3 size={16} />
                            <span>Description</span>
                          </label>
                          <textarea
                            value={profileData.description}
                            onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 min-h-[100px]"
                            placeholder="Describe your business"
                          />
                        </div>

                        {/* Website */}
                        <div>
                          <label className="flex items-center space-x-2 text-sm font-medium text-text-primary mb-2">
                            <Globe size={16} />
                            <span>Website</span>
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

                    {/* Save Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-magenta to-magenta-dark text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      <Save size={18} />
                      <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </form>
                )}

                {activeTab === 'security' && (
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                      <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Password Security</p>
                        <p>Use a strong password with at least 6 characters. Include uppercase, lowercase, numbers, and special characters for better security.</p>
                      </div>
                    </div>

                    {/* Current Password */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-text-primary mb-2">
                        <Lock size={16} />
                        <span>Current Password</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 pr-12"
                          placeholder="Enter current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-text-primary mb-2">
                        <Lock size={16} />
                        <span>New Password</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 pr-12"
                          placeholder="Enter new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-text-primary mb-2">
                        <Lock size={16} />
                        <span>Confirm New Password</span>
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>

                    {/* Change Password Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-magenta to-magenta-dark text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      <CheckCircle size={18} />
                      <span>{loading ? 'Changing...' : 'Change Password'}</span>
                    </button>
                  </form>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-6">
                    {/* Account Info */}
                    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                      <h3 className="font-semibold text-text-primary flex items-center space-x-2">
                        <User size={18} />
                        <span>Account Information</span>
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-secondary">Email</span>
                          <span className="text-sm font-medium text-text-primary">{user?.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-secondary">Role</span>
                          <span className="text-sm font-medium text-text-primary">{user?.role}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-secondary">Account ID</span>
                          <span className="text-sm font-mono text-text-primary">{user?.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>

                    {/* Logout */}
                    <button
                      onClick={logout}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>

                    {/* Danger Zone */}
                    <div className="border-2 border-red-200 rounded-lg p-6 space-y-4">
                      <h3 className="font-semibold text-red-600 flex items-center space-x-2">
                        <AlertCircle size={18} />
                        <span>Danger Zone</span>
                      </h3>
                      <p className="text-sm text-text-secondary">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 size={18} />
                        <span>Delete Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary">Delete Account</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">This action cannot be undone!</p>
                <p>All your data, connections, messages, and settings will be permanently deleted.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || !deletePassword}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
};
