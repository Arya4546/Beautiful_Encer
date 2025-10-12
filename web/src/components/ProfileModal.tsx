import React, { useState, useEffect } from 'react';
import { FiX, FiMapPin, FiMail, FiCalendar, FiUsers, FiActivity, FiHeart, FiMessageCircle, FiInstagram } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import profileService, { type UserProfile } from '../services/profile.service';
import chatService from '../services/chat.service';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { showToast } from '../utils/toast';

interface ProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ userId, isOpen, onClose }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      // Create or get conversation
      await chatService.getOrCreateConversation(userId);
      // Navigate to chat page
      onClose();
      navigate('/chat');
      showToast.success('Opening chat...');
    } catch (err: any) {
      console.error('Failed to start chat:', err);
      if (err.response?.status === 403) {
        showToast.error('You can only chat with connected users');
      } else {
        showToast.error('Failed to start chat');
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
          <div className="flex gap-3">
            <button disabled className="px-6 py-3 bg-green-500 text-white rounded-xl cursor-default flex items-center gap-2">
              <FiUsers size={20} />
              Connected
            </button>
            <button 
              onClick={handleStartChat}
              className="px-6 py-3 bg-gradient-to-r from-magenta to-magenta-dark text-white rounded-xl hover:shadow-large transition-all flex items-center gap-2"
            >
              <FiMessageCircle size={20} />
              Message
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

  // Sample chart data (in real app, this would come from API)
  const followerGrowthData = [
    { month: 'Jan', followers: 25000 },
    { month: 'Feb', followers: 28000 },
    { month: 'Mar', followers: 32000 },
    { month: 'Apr', followers: 38000 },
    { month: 'May', followers: 42000 },
    { month: 'Jun', followers: 45000 },
  ];

  const engagementData = [
    { platform: 'Instagram', rate: 4.5 },
    { platform: 'TikTok', rate: 6.2 },
  ];

  const postPerformanceData = [
    { date: 'Week 1', likes: 1200, comments: 250 },
    { date: 'Week 2', likes: 1500, comments: 320 },
    { date: 'Week 3', likes: 1800, comments: 410 },
    { date: 'Week 4', likes: 2100, comments: 480 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-medium hover:bg-gray-100 transition-colors"
          >
            <FiX size={24} className="text-text-primary" />
          </button>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-magenta border-t-transparent"></div>
            </div>
          ) : error || !user ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                {error || 'User not found'}
              </h2>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-magenta text-white rounded-xl hover:shadow-large transition-all"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="p-6 md:p-8">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  {user.influencer?.profilePic || user.salon?.profilePic ? (
                    <img
                      src={user.influencer?.profilePic || user.salon?.profilePic || ''}
                      alt={user.name}
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-magenta"
                    />
                  ) : (
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-magenta to-magenta-dark flex items-center justify-center text-white text-5xl font-bold border-4 border-magenta">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
                          {user.role === 'SALON' ? (user.salon?.businessName || user.name) : user.name}
                        </h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'INFLUENCER' 
                            ? 'bg-purple-100 text-purple-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {user.role === 'INFLUENCER' ? '✨ Influencer' : '💼 Salon'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-text-secondary text-sm">
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
                    </div>

                    {/* Connection Button */}
                    <div className="flex-shrink-0">
                      {getConnectionButton()}
                    </div>
                  </div>

                  {/* Bio */}
                  {(user.influencer?.bio || user.salon?.description) && (
                    <p className="text-text-secondary mb-4 leading-relaxed">
                      {user.influencer?.bio || user.salon?.description}
                    </p>
                  )}

                  {/* Categories */}
                  {((user.influencer?.categories || user.salon?.preferredCategories || []).length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {(user.influencer?.categories || user.salon?.preferredCategories || []).map((category: string, index: number) => (
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
              </div>

              {/* Social Media Stats */}
              {user.influencer?.socialMediaAccounts && user.influencer.socialMediaAccounts.length > 0 && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {user.influencer.socialMediaAccounts.map((account, index) => (
                      <React.Fragment key={index}>
                        <StatCard
                          icon={<FiUsers />}
                          label="Followers"
                          value={formatNumber(account.followersCount)}
                          color="from-purple-500 to-pink-500"
                        />
                        <StatCard
                          icon={<FiActivity />}
                          label="Engagement"
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

                  {/* Charts Section */}
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary">Performance Analytics</h2>

                    {/* Follower Growth Chart */}
                    <div className="bg-background rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-text-primary mb-4">Follower Growth</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={followerGrowthData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3e5f5" />
                          <XAxis dataKey="month" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #f3e5f5',
                              borderRadius: '12px',
                              padding: '12px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="followers" 
                            stroke="#e91e63" 
                            strokeWidth={3}
                            dot={{ fill: '#e91e63', r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Engagement Rate Chart */}
                    <div className="bg-background rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-text-primary mb-4">Engagement Rate by Platform</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={engagementData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3e5f5" />
                          <XAxis dataKey="platform" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #f3e5f5',
                              borderRadius: '12px',
                              padding: '12px'
                            }}
                          />
                          <Bar dataKey="rate" fill="#e91e63" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Post Performance Chart */}
                    <div className="bg-background rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-text-primary mb-4">Post Performance</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={postPerformanceData}>
                          <defs>
                            <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#e91e63" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#e91e63" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#c2185b" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#c2185b" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3e5f5" />
                          <XAxis dataKey="date" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #f3e5f5',
                              borderRadius: '12px',
                              padding: '12px'
                            }}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="likes" 
                            stroke="#e91e63" 
                            fillOpacity={1} 
                            fill="url(#colorLikes)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="comments" 
                            stroke="#c2185b" 
                            fillOpacity={1} 
                            fill="url(#colorComments)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
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
    <div className="bg-white rounded-2xl shadow-soft border border-border p-4 hover:shadow-large transition-all">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-3 text-xl`}>
        {icon}
      </div>
      <p className="text-text-tertiary text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  );
};

// Helper function
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};
