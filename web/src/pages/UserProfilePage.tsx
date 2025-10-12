import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiMail, FiCalendar, FiInstagram, FiActivity, FiUsers, FiHeart, FiMessageCircle } from 'react-icons/fi';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { showToast } from '../utils/toast';
import profileService, { type UserProfile } from '../services/profile.service';

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { connectionStatus, loading: connectionLoading, sendRequest, withdrawRequest, acceptRequest } = useConnectionStatus(userId || '');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        setError(null);
        const profile = await profileService.getUserProfile(userId);
        setUser(profile);
      } catch (err: any) {
        console.error('Failed to fetch profile:', err);
        setError(err.response?.data?.error || 'Failed to load profile');
        showToast.error('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleConnectionAction = async () => {
    if (connectionStatus.status === 'none') {
      await sendRequest();
    } else if (connectionStatus.status === 'sent') {
      await withdrawRequest();
    } else if (connectionStatus.status === 'received') {
      await acceptRequest();
    }
  };

  const getConnectionButton = () => {
    if (connectionLoading) {
      return (
        <button disabled className="px-6 py-3 bg-gray-100 rounded-xl cursor-not-allowed flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-magenta border-t-transparent"></div>
          <span>Loading...</span>
        </button>
      );
    }

    switch (connectionStatus.status) {
      case 'connected':
        return (
          <button disabled className="px-6 py-3 bg-green-500 text-white rounded-xl cursor-default flex items-center gap-2">
            <FiUsers size={20} />
            Connected
          </button>
        );
      case 'sent':
        return (
          <button 
            onClick={handleConnectionAction} 
            className="px-6 py-3 bg-amber-500 hover:bg-red-500 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <FiActivity size={20} />
            Cancel Request
          </button>
        );
      case 'received':
        return (
          <button 
            onClick={handleConnectionAction} 
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <FiUsers size={20} />
            Accept Request
          </button>
        );
      default:
        return (
          <button 
            onClick={handleConnectionAction} 
            className="px-6 py-3 bg-gradient-to-r from-magenta to-magenta-dark text-white rounded-xl hover:shadow-large transition-all flex items-center gap-2"
          >
            <FiUsers size={20} />
            Send Connection Request
          </button>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Sidebar />
        <div className="md:ml-64 pt-16 flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-magenta border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Sidebar />
        <div className="md:ml-64 pt-16">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-text-primary">
              {error || 'User not found'}
            </h2>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-6 py-3 bg-magenta text-white rounded-xl hover:shadow-large transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const profilePic = user.influencer?.profilePic || user.salon?.profilePic;
  const displayName = user.role === 'SALON' ? (user.salon?.businessName || user.name) : user.name;
  const bio = user.influencer?.bio || user.salon?.description;
  const categories = user.influencer?.categories || user.salon?.preferredCategories || [];
  const socialAccounts = user.influencer?.socialMediaAccounts || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <div className="md:ml-64 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
          >
            <FiArrowLeft size={20} />
            <span className="font-medium">Back to Discovery</span>
          </button>

          {/* Profile Header */}
          <div className="bg-white rounded-3xl shadow-soft border border-border p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt={displayName}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-magenta"
                  />
                ) : (
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-magenta to-magenta-dark flex items-center justify-center text-white text-5xl font-bold border-4 border-magenta">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
                        {displayName}
                      </h1>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'INFLUENCER' 
                          ? 'bg-purple-100 text-purple-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {user.role === 'INFLUENCER' ? '✨ Influencer' : '💼 Salon'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-text-secondary text-sm mb-4">
                      <div className="flex items-center gap-1">
                        <FiMail size={16} />
                        <span>{user.email}</span>
                      </div>
                      {user.influencer?.region && (
                        <div className="flex items-center gap-1">
                          <FiMapPin size={16} />
                          <span>{user.influencer.region}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <FiCalendar size={16} />
                        <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {bio && (
                      <p className="text-text-secondary mb-4 leading-relaxed">
                        {bio}
                      </p>
                    )}

                    {/* Categories */}
                    {categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {categories.map((category: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-background-tertiary text-magenta text-sm font-medium rounded-lg"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Connection Button */}
                  <div className="flex-shrink-0">
                    {getConnectionButton()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Stats */}
          {socialAccounts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {socialAccounts.map((account: any, index: number) => (
                <React.Fragment key={index}>
                  <StatCard
                    icon={<FiUsers />}
                    label="Followers"
                    value={formatNumber(account.followersCount)}
                    color="from-purple-500 to-pink-500"
                  />
                  <StatCard
                    icon={<FiActivity />}
                    label="Engagement Rate"
                    value={`${account.engagementRate}%`}
                    color="from-green-500 to-teal-500"
                  />
                  <StatCard
                    icon={<FiMessageCircle />}
                    label="Posts"
                    value={formatNumber(account.postsCount)}
                    color="from-blue-500 to-cyan-500"
                  />
                  <StatCard
                    icon={<FiHeart />}
                    label="Following"
                    value={formatNumber(account.followingCount)}
                    color="from-red-500 to-pink-500"
                  />
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Engagement Chart Placeholder */}
          <div className="bg-white rounded-3xl shadow-soft border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              Performance Overview
            </h2>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-magenta-light/10 to-magenta/10 rounded-2xl">
              <div className="text-center">
                <FiActivity size={48} className="text-magenta mx-auto mb-4" />
                <p className="text-text-secondary">
                  Detailed analytics and charts coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-border p-6 hover:shadow-large transition-all">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-4 text-2xl`}>
        {icon}
      </div>
      <p className="text-text-tertiary text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-text-primary">{value}</p>
    </div>
  );
};

// Helper function
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};
