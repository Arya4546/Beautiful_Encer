import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiMapPin,
  FiMail,
  FiCalendar,
  FiInstagram,
  FiActivity,
  FiUsers,
  FiHeart,
  FiMessageCircle,
  FiExternalLink,
  FiGrid,
  FiTrendingUp,
  FiX,
  FiEye,
  FiBarChart2
} from 'react-icons/fi';
import { SiTiktok } from 'react-icons/si';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useAuthStore } from '../store/authStore';
import { showToast } from '../utils/toast';
import profileService, { type UserProfile } from '../services/profile.service';

// Types
interface InstagramPost {
  id?: string;
  url: string;
  displayUrl?: string;
  caption?: string;
  likesCount?: number;
  commentsCount?: number;
  timestamp?: string;
}

interface ParsedMetadata {
  recentPosts?: InstagramPost[];
  averageLikes?: number;
  averageComments?: number;
  topHashtags?: string[];
  [key: string]: any;
}

interface SocialMediaAccount {
  id: string;
  platform: string;
  username?: string;
  displayName?: string;
  profilePicture?: string;
  profileUrl?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  engagementRate: number;
  lastSynced: string;
  metadata?: string;
}

const parseMetadata = (metadataString?: string): ParsedMetadata | null => {
  if (!metadataString) return null;
  try {
    return JSON.parse(metadataString);
  } catch (e) {
    console.error('Failed to parse metadata:', e);
    return null;
  }
};

const formatNumber = (num: number): string => {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostsModal, setShowPostsModal] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<InstagramPost[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SocialMediaAccount | null>(null);
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);

  const {
    connectionStatus,
    loading: connectionLoading,
    sendRequest,
    withdrawRequest,
    acceptRequest
  } = useConnectionStatus(userId || '');

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await profileService.getUserProfile(userId!);
      setUser(response);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile');
      showToast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionAction = async () => {
    try {
      if (connectionStatus.status === 'none') {
        await sendRequest();
        showToast.success('Connection request sent');
      } else if (connectionStatus.status === 'sent') {
        await withdrawRequest();
        showToast.success('Connection request withdrawn');
      } else if (connectionStatus.status === 'received') {
        await acceptRequest();
        showToast.success('Connection request accepted');
      }
    } catch (error) {
      showToast.error('Failed to update connection');
    }
  };

  const handleViewPosts = (account: SocialMediaAccount) => {
    const metadata = parseMetadata(account.metadata);
    const posts = metadata?.recentPosts || [];
    setSelectedPosts(posts);
    setSelectedAccount(account);
    setShowPostsModal(true);
  };

  const getConnectionButton = () => {
    if (connectionLoading) {
      return (
        <motion.button
          disabled
          className="px-6 py-3 bg-gray-100 rounded-xl cursor-not-allowed flex items-center gap-2"
          whileTap={{ scale: 0.95 }}
        >
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-magenta border-t-transparent"></div>
        </motion.button>
      );
    }

    const buttonConfig = {
      none: {
        text: 'Send Connection Request',
        icon: <FiUsers size={20} />,
        className: 'bg-gradient-to-r from-magenta to-magenta-dark text-white hover:shadow-large',
        disabled: false
      },
      sent: {
        text: 'Withdraw Request',
        icon: <FiX size={20} />,
        className: 'bg-amber-500 hover:bg-red-500 text-white',
        disabled: false
      },
      received: {
        text: 'Accept Request',
        icon: <FiUsers size={20} />,
        className: 'bg-blue-500 hover:bg-blue-600 text-white',
        disabled: false
      },
      connected: {
        text: 'Connected',
        icon: <FiUsers size={20} />,
        className: 'bg-green-500 text-white',
        disabled: true
      }
    };

    const config = buttonConfig[connectionStatus.status as keyof typeof buttonConfig] || buttonConfig.none;

    return (
      <motion.button
        onClick={handleConnectionAction}
        disabled={config.disabled}
        className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-medium ${config.className} ${
          config.disabled ? 'cursor-default' : 'cursor-pointer'
        }`}
        whileHover={!config.disabled ? { scale: 1.02 } : {}}
        whileTap={!config.disabled ? { scale: 0.98 } : {}}
      >
        {config.icon}
        {config.text}
      </motion.button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-magenta border-t-transparent"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600 mb-4">{error || 'User not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-magenta text-white rounded-xl hover:bg-magenta-dark"
        >
          Go Back
        </button>
      </div>
    );
  }

  const socialMediaAccounts = (user.influencer?.socialMediaAccounts || []) as any[];
  const categories = (user.influencer?.categories || user.salon?.preferredCategories || []) as string[];
  const profilePicture = user.influencer?.profilePic || user.salon?.profilePic || null;
  const bio = user.influencer?.bio || user.salon?.description || null;
  const location = user.influencer?.region || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />

      <div className="md:ml-64 pt-16">
        <div className="max-w-6xl mx-auto p-6">
          {/* Back Button */}
          <motion.button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-magenta transition-colors"
            whileHover={{ x: -5 }}
          >
            <FiArrowLeft size={20} />
            Back
          </motion.button>

          {/* Profile Header */}
          <motion.div
            className="bg-white rounded-3xl shadow-soft p-8 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <motion.div
                  className="w-32 h-32 rounded-full overflow-hidden border-4 border-gradient-to-r from-magenta to-pink-500"
                  whileHover={{ scale: 1.05 }}
                >
                  <img
                    src={profilePicture || 'https://via.placeholder.com/128'}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/128?text=No+Image';
                    }}
                  />
                </motion.div>
              </div>

              {/* Profile Info */}
              <div className="flex-grow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
                    {location && (
                      <p className="flex items-center gap-2 text-gray-600 mb-2">
                        <FiMapPin size={16} />
                        {location}
                      </p>
                    )}
                    {user.email && (
                      <p className="flex items-center gap-2 text-gray-600 mb-2">
                        <FiMail size={16} />
                        {user.email}
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-gray-500 text-sm">
                      <FiCalendar size={14} />
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {currentUser?.id !== userId && (
                    <div className="flex gap-3">
                      {getConnectionButton()}
                    </div>
                  )}
                </div>

                {bio && (
                  <p className="mt-4 text-gray-700 leading-relaxed">{bio}</p>
                )}

                {/* Role Badge */}
                <div className="mt-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'INFLUENCER'
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
                        : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Social Media Accounts */}
          {socialMediaAccounts && socialMediaAccounts.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Social Media Analytics</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {socialMediaAccounts.map((account) => (
                  <SocialMediaAccountCard
                    key={account.id}
                    account={account}
                    onViewPosts={handleViewPosts}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      {/* Posts Modal */}
      <AnimatePresence>
        {showPostsModal && selectedAccount && (
          <PostsModal
            account={selectedAccount}
            posts={selectedPosts}
            onClose={() => {
              setShowPostsModal(false);
              setSelectedPost(null);
            }}
            selectedPost={selectedPost}
            setSelectedPost={setSelectedPost}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Social Media Account Card Component
interface SocialMediaAccountCardProps {
  account: SocialMediaAccount;
  onViewPosts: (account: SocialMediaAccount) => void;
}

const SocialMediaAccountCard: React.FC<SocialMediaAccountCardProps> = ({ account, onViewPosts }) => {
  const isInstagram = account.platform.toUpperCase() === 'INSTAGRAM';
  const metadata = parseMetadata(account.metadata);
  const postsCount = metadata?.recentPosts?.length || 0;

  const gradientClass = isInstagram
    ? 'from-purple-500 via-pink-500 to-orange-500'
    : 'from-black via-gray-900 to-pink-500';

  const Icon = isInstagram ? FiInstagram : SiTiktok;

  // Generate engagement data for chart
  const engagementData = metadata?.recentPosts?.slice(0, 10).map((post, idx) => ({
    name: `Post ${idx + 1}`,
    likes: post.likesCount || 0,
    comments: post.commentsCount || 0,
  })) || [];

  return (
    <motion.div
      className="bg-white rounded-3xl shadow-soft overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradientClass} p-6 text-white`}>
        <div className="flex items-center gap-3 mb-4">
          <Icon size={32} />
          <div>
            <h3 className="text-xl font-bold capitalize">{account.platform}</h3>
            <p className="text-white/80 text-sm">
              @{account.username || account.displayName || 'user'}
            </p>
          </div>
        </div>

        {/* Profile Picture */}
        {account.profilePicture && (
          <div className="flex justify-center mb-4">
            <motion.div
              className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30"
              whileHover={{ scale: 1.1 }}
            >
              <img
                src={account.profilePicture}
                alt={account.displayName || account.username || 'Profile'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/96?text=No+Image';
                }}
              />
            </motion.div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard
            icon={<FiUsers size={20} />}
            label="Followers"
            value={formatNumber(account.followersCount)}
            bgColor="from-blue-50 to-blue-100"
          />
          <StatCard
            icon={<FiActivity size={20} />}
            label="Following"
            value={formatNumber(account.followingCount)}
            bgColor="from-purple-50 to-purple-100"
          />
          <StatCard
            icon={<FiGrid size={20} />}
            label="Posts"
            value={formatNumber(account.postsCount)}
            bgColor="from-pink-50 to-pink-100"
          />
          <StatCard
            icon={<FiTrendingUp size={20} />}
            label="Engagement"
            value={`${account.engagementRate || 0}%`}
            bgColor="from-green-50 to-green-100"
          />
        </div>

        {/* Engagement Chart */}
        {engagementData.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FiBarChart2 size={16} />
              Post Engagement
            </h4>
            <div className="h-48 bg-gray-50 rounded-xl p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="likes" fill="#E91E63" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="comments" fill="#9C27B0" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {postsCount > 0 && (
            <motion.button
              onClick={() => onViewPosts(account)}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-magenta to-magenta-dark text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiEye size={18} />
              View Posts ({postsCount})
            </motion.button>
          )}
          {account.profileUrl && (
            <motion.a
              href={account.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-3 border-2 border-magenta text-magenta rounded-xl font-medium hover:bg-magenta hover:text-white transition-all flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiExternalLink size={18} />
              Visit Profile
            </motion.a>
          )}
        </div>

        {/* Last Synced */}
        <p className="text-xs text-gray-400 text-center mt-4">
          Last updated: {new Date(account.lastSynced).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, bgColor }) => {
  return (
    <motion.div
      className={`bg-gradient-to-br ${bgColor} rounded-2xl p-4 text-center`}
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex justify-center mb-2 text-gray-700">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </motion.div>
  );
};

// Posts Modal Component
interface PostsModalProps {
  account: SocialMediaAccount;
  posts: InstagramPost[];
  onClose: () => void;
  selectedPost: InstagramPost | null;
  setSelectedPost: (post: InstagramPost | null) => void;
}

const PostsModal: React.FC<PostsModalProps> = ({ account, posts, onClose, selectedPost, setSelectedPost }) => {
  const metadata = parseMetadata(account.metadata);
  const avgLikes = metadata?.averageLikes || 0;
  const avgComments = metadata?.averageComments || 0;
  const totalPosts = posts.length;
  const totalLikes = posts.reduce((sum, post) => sum + (post.likesCount || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.commentsCount || 0), 0);
  const engagementRate = account.engagementRate || 0;

  // Generate trend data
  const engagementTrendData = posts.slice(0, 15).map((post, idx) => ({
    name: `#${idx + 1}`,
    likes: post.likesCount || 0,
    comments: post.commentsCount || 0,
  }));

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-6 text-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Instagram Posts</h2>
              <p className="text-white/90 text-sm">@{account.username || account.displayName}</p>
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              whileHover={{ rotate: 90 }}
            >
              <FiX size={24} />
            </motion.button>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-4 text-center">
              <FiHeart className="mx-auto mb-2 text-pink-600" size={24} />
              <p className="text-2xl font-bold text-gray-900">{formatNumber(avgLikes)}</p>
              <p className="text-xs text-gray-600">Avg Likes</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center">
              <FiMessageCircle className="mx-auto mb-2 text-purple-600" size={24} />
              <p className="text-2xl font-bold text-gray-900">{formatNumber(avgComments)}</p>
              <p className="text-xs text-gray-600">Avg Comments</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center">
              <FiTrendingUp className="mx-auto mb-2 text-blue-600" size={24} />
              <p className="text-2xl font-bold text-gray-900">{engagementRate}%</p>
              <p className="text-xs text-gray-600">Engagement Rate</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center">
              <FiGrid className="mx-auto mb-2 text-green-600" size={24} />
              <p className="text-2xl font-bold text-gray-900">{totalPosts}</p>
              <p className="text-xs text-gray-600">Total Posts</p>
            </div>
          </div>

          {/* Engagement Trend Chart */}
          {engagementTrendData.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Engagement Trend</h4>
              <div className="h-64 bg-gray-50 rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={engagementTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="likes" stroke="#E91E63" strokeWidth={3} dot={{ fill: '#E91E63' }} />
                    <Line type="monotone" dataKey="comments" stroke="#9C27B0" strokeWidth={3} dot={{ fill: '#9C27B0' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Posts Grid */}
        <div className="p-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <FiGrid size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No posts available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post, idx) => (
                <motion.div
                  key={post.id || idx}
                  className="relative group cursor-pointer rounded-2xl overflow-hidden aspect-square"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedPost(post)}
                >
                  <img
                    src={post.displayUrl || post.url}
                    alt={post.caption || 'Instagram post'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Image+Not+Available';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <div className="flex items-center gap-4 text-white">
                      <span className="flex items-center gap-1">
                        <FiHeart size={16} />
                        {formatNumber(post.likesCount || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiMessageCircle size={16} />
                        {formatNumber(post.commentsCount || 0)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Selected Post Detail */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={selectedPost.displayUrl || selectedPost.url}
                  alt={selectedPost.caption || 'Instagram post'}
                  className="w-full max-h-[60vh] object-contain bg-black"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/800x800?text=Image+Not+Available';
                  }}
                />
                <motion.button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full text-white transition-colors"
                  whileHover={{ rotate: 90 }}
                >
                  <FiX size={24} />
                </motion.button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-2 text-pink-600">
                    <FiHeart size={20} />
                    <span className="font-bold text-lg">{formatNumber(selectedPost.likesCount || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600">
                    <FiMessageCircle size={20} />
                    <span className="font-bold text-lg">{formatNumber(selectedPost.commentsCount || 0)}</span>
                  </div>
                </div>
                {selectedPost.caption && (
                  <p className="text-gray-700 leading-relaxed mb-4">{selectedPost.caption}</p>
                )}
                {selectedPost.timestamp && (
                  <p className="text-sm text-gray-400">
                    {new Date(selectedPost.timestamp).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

