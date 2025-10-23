import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX, FiMapPin, FiMail, FiCalendar, FiUsers, FiActivity, FiMessageCircle, FiInstagram, FiTrendingUp } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import profileService, { type UserProfile } from '../services/profile.service';
import chatService from '../services/chat.service';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { showToast } from '../utils/toast';
import { getProxiedImageUrl } from '../utils/imageProxy';
import { InstagramDataDisplay } from './InstagramDataDisplay';

interface ProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ userId, isOpen, onClose }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'instagram'>('overview');
  const navigate = useNavigate();

  const { connectionStatus, loading: connectionLoading, sendRequest, withdrawRequest, acceptRequest } = useConnectionStatus(userId);

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId]);

  const fetchProfile = async () => {
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

  const handleConnectionAction = async () => {
    if (connectionStatus.status === 'none') {
      await sendRequest();
    } else if (connectionStatus.status === 'sent') {
      await withdrawRequest();
    } else if (connectionStatus.status === 'received') {
      await acceptRequest();
    }
  };

  const handleStartChat = async () => {
    try {
      await chatService.getOrCreateConversation(userId);
      onClose();
      navigate('/chat');
      showToast.success('Opening chat...');
    } catch (err: any) {
      console.error('Failed to start chat:', err);
      if (err.response?.status === 403) {
        showToast.error(t('toast.error.onlyConnectedUsers'));
      } else {
        showToast.error(t('toast.error.failedToStartChat'));
      }
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
          <div className="flex gap-3 flex-wrap">
            <button disabled className="px-6 py-3 bg-green-500 text-white rounded-xl cursor-default flex items-center gap-2">
              <FiUsers size={20} />
              {t('common.connected')}
            </button>
            <button 
              onClick={handleStartChat}
              className="px-6 py-3 bg-gradient-to-r from-magenta to-magenta-dark text-white rounded-xl hover:shadow-large transition-all flex items-center gap-2"
            >
              <FiMessageCircle size={20} />
              {t('common.message')}
            </button>
          </div>
        );
      case 'sent':
        return (
          <button 
            onClick={handleConnectionAction} 
            className="px-6 py-3 bg-amber-500 hover:bg-red-500 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <FiActivity size={20} />
            {t('common.cancelRequest')}
          </button>
        );
      case 'received':
        return (
          <button 
            onClick={handleConnectionAction} 
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <FiUsers size={20} />
            {t('common.acceptRequest')}
          </button>
        );
      default:
        return (
          <button 
            onClick={handleConnectionAction} 
            className="px-6 py-3 bg-gradient-to-r from-magenta to-magenta-dark text-white rounded-xl hover:shadow-large transition-all flex items-center gap-2"
          >
            <FiUsers size={20} />
            {t('common.sendConnectionRequest')}
          </button>
        );
    }
  };

  const parseMetadata = (metadataString?: string | any) => {
    if (!metadataString) return null;
    // If it's already an object, return it
    if (typeof metadataString === 'object') return metadataString;
    // If it's a string, try to parse it
    try {
      return JSON.parse(metadataString);
    } catch (e) {
      console.error('Failed to parse metadata:', e);
      return null;
    }
  };

  const getInstagramAccount = () => {
    const accounts = user?.influencer?.socialMediaAccounts || [];
    return accounts.find(acc => acc.platform.toUpperCase() === 'INSTAGRAM');
  };

  const getChartData = () => {
    const instagramAccount = getInstagramAccount();
    const metadata = instagramAccount ? parseMetadata(instagramAccount.metadata as any) : null;
    const recentPosts = metadata?.recentPosts || [];

    // Post engagement over time
    const postEngagementData = recentPosts.slice(0, 10).reverse().map((post: any, index: number) => ({
      name: `P${index + 1}`,
      likes: post.likesCount || 0,
      comments: post.commentsCount || 0,
      engagement: ((post.likesCount + post.commentsCount) / (instagramAccount?.followersCount || 1) * 100).toFixed(2)
    }));

    // Content type distribution
    const contentTypes = recentPosts.reduce((acc: any, post: any) => {
      const type = post.type || 'Image';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const contentTypeData = Object.entries(contentTypes).map(([name, value]) => ({
      name,
      value,
    }));

    // Engagement metrics
    const engagementMetrics = [
      {
        name: 'Avg Likes',
        value: metadata?.averageLikes || 0,
        color: '#FF6384',
      },
      {
        name: 'Avg Comments',
        value: metadata?.averageComments || 0,
        color: '#36A2EB',
      },
    ];

    return {
      postEngagementData,
      contentTypeData,
      engagementMetrics,
    };
  };

  const { postEngagementData, contentTypeData, engagementMetrics } = getChartData();
  const instagramAccount = getInstagramAccount();
  const metadata = instagramAccount ? parseMetadata(instagramAccount.metadata as any) : null;

  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="min-h-screen px-2 sm:px-4 py-4 sm:py-8 flex items-center justify-center">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="sticky top-4 right-4 float-right z-10 p-2 bg-white rounded-full shadow-large hover:bg-gray-100 transition-colors"
          >
            <FiX size={24} className="text-text-primary" />
          </button>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-magenta border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center py-20 px-4">
              <p className="text-red-500 text-lg mb-4">{error}</p>
              <button onClick={fetchProfile} className="px-6 py-3 bg-magenta text-white rounded-xl hover:bg-magenta-dark transition-colors">
                Retry
              </button>
            </div>
          ) : user && user.influencer ? (
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                <img
                  src={getProxiedImageUrl(user.influencer.profilePic)}
                  alt={user.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-magenta/20 shadow-large"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default-avatar.png';
                  }}
                />
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{user.name}</h2>
                  <p className="text-gray-600 text-sm sm:text-base mb-4">{user.influencer.bio || 'No bio available'}</p>
                  
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-4">
                    {user.influencer.region && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                        <FiMapPin size={14} /> {user.influencer.region}
                      </span>
                    )}
                    {user.email && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                        <FiMail size={14} /> {user.email}
                      </span>
                    )}
                    {user.influencer.age && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                        <FiCalendar size={14} /> {user.influencer.age} years
                      </span>
                    )}
                  </div>

                  {user.influencer.categories && user.influencer.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {user.influencer.categories.map((category, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-magenta/10 to-purple/10 text-magenta font-semibold rounded-full text-xs sm:text-sm border border-magenta/30"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}

                  {getConnectionButton()}
                </div>
              </div>

              {/* View Toggle */}
              {instagramAccount && (
                <div className="flex gap-4 mb-6 border-b border-gray-200">
                  <button
                    onClick={() => setActiveView('overview')}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
                      activeView === 'overview'
                        ? 'text-magenta border-b-2 border-magenta'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FiTrendingUp size={20} />
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveView('instagram')}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
                      activeView === 'instagram'
                        ? 'text-magenta border-b-2 border-magenta'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FiInstagram size={20} />
                    Instagram Details
                  </button>
                </div>
              )}

              {/* Content */}
              {activeView === 'overview' ? (
                <div className="space-y-8">
                  {/* Stats Cards */}
                  {instagramAccount && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-pink-200">
                        <p className="text-[10px] sm:text-sm text-pink-700 font-semibold mb-1">Followers</p>
                        <p className="text-xl sm:text-3xl font-bold text-pink-800">
                          {(instagramAccount.followersCount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-purple-200">
                        <p className="text-[10px] sm:text-sm text-purple-700 font-semibold mb-1">Posts</p>
                        <p className="text-xl sm:text-3xl font-bold text-purple-800">
                          {(instagramAccount.postsCount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-blue-200">
                        <p className="text-[10px] sm:text-sm text-blue-700 font-semibold mb-1">Engagement</p>
                        <p className="text-xl sm:text-3xl font-bold text-blue-800">
                          {(instagramAccount.engagementRate || metadata?.engagementRate || 0).toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-green-200">
                        <p className="text-[10px] sm:text-sm text-green-700 font-semibold mb-1">Avg Likes</p>
                        <p className="text-xl sm:text-3xl font-bold text-green-800">
                          {(metadata?.averageLikes || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Charts */}
                  {postEngagementData.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Post Engagement Chart */}
                      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-soft border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Post Engagement Trend</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={postEngagementData}>
                            <defs>
                              <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF6384" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#FF6384" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#36A2EB" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#36A2EB" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="likes" stroke="#FF6384" fillOpacity={1} fill="url(#colorLikes)" />
                            <Area type="monotone" dataKey="comments" stroke="#36A2EB" fillOpacity={1} fill="url(#colorComments)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Engagement Comparison */}
                      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-soft border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Engagement Metrics</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={engagementMetrics}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                              {engagementMetrics.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Content Type Distribution */}
                      {contentTypeData.length > 0 && (
                        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-soft border border-gray-200">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Content Type Distribution</h3>
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={contentTypeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${entry.name}: ${entry.value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {contentTypeData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <InstagramDataDisplay account={instagramAccount} metadata={metadata} />
              )}
            </div>
          ) : (
            <div className="flex justify-center items-center py-20">
              <p className="text-gray-500">No profile data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
