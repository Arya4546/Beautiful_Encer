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
import { TikTokDataDisplay } from './TikTokDataDisplay';
import { YoutubeDataDisplay } from './YoutubeDataDisplay';
import { FaTiktok, FaYoutube } from 'react-icons/fa';

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
  const [activeView, setActiveView] = useState<'overview' | 'instagram' | 'tiktok' | 'youtube'>('overview');
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
      
      // Process social media accounts to add videos/posts to metadata
      if (profile.influencer?.socialMediaAccounts) {
        profile.influencer.socialMediaAccounts = profile.influencer.socialMediaAccounts.map((account: any) => {
          if (account.posts && account.posts.length > 0) {
            // Format posts for frontend consumption
            const recentVideos = account.posts.map((post: any) => ({
              id: post.platformPostId,
              title: post.caption || '',
              description: post.metadata?.description || '',
              thumbnail: post.thumbnailUrl || '',
              thumbnailUrl: post.thumbnailUrl || '',
              url: post.mediaUrl || '',
              publishedAt: post.postedAt,
              viewCount: post.viewsCount || 0,
              likeCount: post.likesCount || 0,
              commentCount: post.commentsCount || 0,
              duration: post.metadata?.duration || 0,
            }));
            
            // Calculate totals and averages
            const totalViews = recentVideos.reduce((sum: number, video: any) => sum + (video.viewCount || 0), 0);
            const totalLikes = recentVideos.reduce((sum: number, video: any) => sum + (video.likeCount || 0), 0);
            const totalComments = recentVideos.reduce((sum: number, video: any) => sum + (video.commentCount || 0), 0);
            const videosCount = recentVideos.length;
            
            // If likes/comments are 0 (YouTube channel scraper limitation), estimate based on typical engagement rates
            let estimatedAverageLikes = videosCount > 0 ? Math.round(totalLikes / videosCount) : 0;
            let estimatedAverageComments = videosCount > 0 ? Math.round(totalComments / videosCount) : 0;
            
            // Only for YouTube: If likes/comments are 0, use industry-standard estimates
            if (account.platform === 'YOUTUBE' && totalLikes === 0 && totalViews > 0) {
              // Typical YouTube engagement rates: 4% like rate, 0.5% comment rate
              const avgViews = videosCount > 0 ? totalViews / videosCount : 0;
              estimatedAverageLikes = Math.round(avgViews * 0.04); // 4% of views
              estimatedAverageComments = Math.round(avgViews * 0.005); // 0.5% of views
            }
            
            // Add recentVideos and calculated metrics to metadata
            return {
              ...account,
              metadata: {
                ...account.metadata,
                recentVideos,
                recentPosts: recentVideos, // For Instagram/TikTok compatibility
                totalViews: account.metadata?.viewCount || totalViews,
                averageViews: account.metadata?.averageViews || (videosCount > 0 ? Math.round(totalViews / videosCount) : 0),
                averageLikes: account.metadata?.averageLikes !== 0 ? account.metadata?.averageLikes : estimatedAverageLikes,
                averageComments: account.metadata?.averageComments !== 0 ? account.metadata?.averageComments : estimatedAverageComments,
              },
            };
          }
          return account;
        });
      }
      
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

  const getTikTokAccount = () => {
    const accounts = user?.influencer?.socialMediaAccounts || [];
    return accounts.find(acc => acc.platform.toUpperCase() === 'TIKTOK');
  };

  const getYouTubeAccount = () => {
    const accounts = user?.influencer?.socialMediaAccounts || [];
    return accounts.find(acc => acc.platform.toUpperCase() === 'YOUTUBE');
  };

  const formatNumber = (num: number | undefined | null): string => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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

  const getTikTokChartData = () => {
    const tiktokAccount = getTikTokAccount();
    const tiktokMetadata = tiktokAccount ? parseMetadata(tiktokAccount.metadata as any) : null;
    const recentVideos = tiktokMetadata?.recentVideos || [];

    // Video Engagement Trend Data (for line chart)
    const videoEngagementData = recentVideos.slice(0, 10).map((video: any, index: number) => ({
      name: `V${index + 1}`,
      likes: video.likeCount || video.likesCount || 0,
      comments: video.commentCount || video.commentsCount || 0,
      shares: video.shareCount || video.sharesCount || 0,
      views: video.viewCount || video.viewsCount || 0,
    }));

    // Engagement Metrics (for bar chart comparison)
    const tiktokEngagementMetrics = [
      {
        name: 'Avg Likes',
        value: tiktokMetadata?.averageLikes || 0,
        color: '#E91E63',
      },
      {
        name: 'Avg Comments',
        value: tiktokMetadata?.averageComments || 0,
        color: '#9C27B0',
      },
      {
        name: 'Avg Views',
        value: (tiktokMetadata?.averageViews || 0) / 10, // Scale down for visibility
        color: '#00BCD4',
      },
      {
        name: 'Avg Shares',
        value: tiktokMetadata?.averageShares || 0,
        color: '#FF9800',
      },
    ];

    // Content Type Distribution (simplified for TikTok - show engagement distribution)
    const tiktokContentTypeData = [
      { name: 'Likes', value: tiktokMetadata?.averageLikes || 0, color: '#E91E63' },
      { name: 'Comments', value: tiktokMetadata?.averageComments || 0, color: '#9C27B0' },
      { name: 'Shares', value: tiktokMetadata?.averageShares || 0, color: '#FF9800' },
    ];

    return {
      videoEngagementData,
      tiktokEngagementMetrics,
      tiktokContentTypeData,
    };
  };

  const getYouTubeChartData = () => {
    const youtubeAccount = getYouTubeAccount();
    const youtubeMetadata = youtubeAccount ? parseMetadata(youtubeAccount.metadata as any) : null;
    const recentVideos = youtubeMetadata?.recentVideos || [];

    // Video Engagement Trend Data (for line chart)
    const youtubeEngagementData = recentVideos.slice(0, 10).map((video: any, index: number) => ({
      name: `V${index + 1}`,
      views: video.viewCount || video.viewsCount || 0,
      likes: video.likeCount || video.likesCount || 0,
      comments: video.commentCount || video.commentsCount || 0,
    }));

    // Engagement Metrics (for bar chart comparison)
    const youtubeEngagementMetrics = [
      {
        name: 'Avg Views',
        value: (youtubeMetadata?.averageViews || 0) / 100, // Scale down for visibility
        color: '#FF0000',
      },
      {
        name: 'Avg Likes',
        value: youtubeMetadata?.averageLikes || 0,
        color: '#FF4444',
      },
      {
        name: 'Avg Comments',
        value: youtubeMetadata?.averageComments || 0,
        color: '#CC0000',
      },
    ];

    // Content Type Distribution (show engagement distribution)
    const youtubeContentTypeData = [
      { name: 'Likes', value: youtubeMetadata?.averageLikes || 0, color: '#FF0000' },
      { name: 'Comments', value: youtubeMetadata?.averageComments || 0, color: '#CC0000' },
    ].filter(item => item.value > 0);

    return {
      youtubeEngagementData,
      youtubeEngagementMetrics,
      youtubeContentTypeData,
    };
  };

  const { postEngagementData, contentTypeData, engagementMetrics } = getChartData();
  const { videoEngagementData, tiktokEngagementMetrics, tiktokContentTypeData } = getTikTokChartData();
  const { youtubeEngagementData, youtubeEngagementMetrics, youtubeContentTypeData } = getYouTubeChartData();
  const instagramAccount = getInstagramAccount();
  const metadata = instagramAccount ? parseMetadata(instagramAccount.metadata as any) : null;

  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-6xl w-full my-4 sm:my-8 mb-20 md:mb-8 flex flex-col max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-large hover:bg-gray-100 transition-colors"
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
        ) : user && (user.influencer || user.salon) ? (
          <div className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto flex-1">{/* Scrollable content area with extra bottom padding for mobile */}
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                <img
                  src={getProxiedImageUrl(user.influencer?.profilePic || user.salon?.profilePic || '')}
                  alt={user.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-magenta/20 shadow-large"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default-avatar.svg';
                  }}
                />
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    {user.role === 'SALON' ? (user.salon?.businessName || user.name) : user.name}
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base mb-4">
                    {user.influencer?.bio || user.salon?.description || 'No bio available'}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-4">
                    {(user.influencer?.region || user.salon?.region) && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                        <FiMapPin size={14} /> {user.influencer?.region || user.salon?.region}
                      </span>
                    )}
                    {user.email && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                        <FiMail size={14} /> {user.email}
                      </span>
                    )}
                    {user.influencer?.age && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                        <FiCalendar size={14} /> {user.influencer.age} years
                      </span>
                    )}
                    {instagramAccount && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full border border-pink-300">
                        <FiInstagram size={14} className="text-pink-600" /> @{instagramAccount.platformUsername}
                      </span>
                    )}
                    {getTikTokAccount() && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-gray-900 to-teal-500 text-white rounded-full">
                        <FaTiktok size={14} /> @{getTikTokAccount()!.platformUsername}
                      </span>
                    )}
                    {getYouTubeAccount() && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full">
                        <FaYoutube size={14} /> @{getYouTubeAccount()!.platformUsername}
                      </span>
                    )}
                  </div>

                  {(user.influencer?.categories && user.influencer.categories.length > 0) && (
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

                  {(user.salon?.preferredCategories && user.salon.preferredCategories.length > 0) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {user.salon.preferredCategories.map((category, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-blue/10 to-cyan/10 text-blue-600 font-semibold rounded-full text-xs sm:text-sm border border-blue/30"
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
              {(instagramAccount || getTikTokAccount() || getYouTubeAccount()) && (
                <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 border-b border-gray-200">
                  <button
                    onClick={() => setActiveView('overview')}
                    className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold transition-all text-sm sm:text-base ${
                      activeView === 'overview'
                        ? 'text-magenta border-b-2 border-magenta'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FiTrendingUp size={20} />
                    <span className="hidden sm:inline">Overview</span>
                    <span className="sm:hidden">Stats</span>
                  </button>
                  {instagramAccount && (
                    <button
                      onClick={() => setActiveView('instagram')}
                      className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold transition-all text-sm sm:text-base ${
                        activeView === 'instagram'
                          ? 'text-magenta border-b-2 border-magenta'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <FiInstagram size={20} />
                      <span className="hidden sm:inline">{t('instagram.details', 'Instagram Details')}</span>
                      <span className="sm:hidden">IG</span>
                    </button>
                  )}
                  {getTikTokAccount() && (
                    <button
                      onClick={() => setActiveView('tiktok')}
                      className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold transition-all text-sm sm:text-base ${
                        activeView === 'tiktok'
                          ? 'text-magenta border-b-2 border-magenta'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <FaTiktok size={18} />
                      <span className="hidden sm:inline">{t('tiktok.details', 'TikTok Details')}</span>
                      <span className="sm:hidden">TT</span>
                    </button>
                  )}
                  {getYouTubeAccount() && (
                    <button
                      onClick={() => setActiveView('youtube')}
                      className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold transition-all text-sm sm:text-base ${
                        activeView === 'youtube'
                          ? 'text-magenta border-b-2 border-magenta'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <FaYoutube size={20} />
                      <span className="hidden sm:inline">{t('youtube.details', 'YouTube Details')}</span>
                      <span className="sm:hidden">YT</span>
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              {activeView === 'overview' ? (
                <div className="space-y-8">
                  {/* Instagram Stats Cards */}
                  {instagramAccount && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FiInstagram className="text-pink-600" size={24} />
                        Instagram Stats
                      </h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-pink-200">
                          <p className="text-[10px] sm:text-sm text-pink-700 font-semibold mb-1">Followers</p>
                          <p className="text-xl sm:text-3xl font-bold text-pink-800">
                            {formatNumber(instagramAccount.followersCount || 0)}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-purple-200">
                          <p className="text-[10px] sm:text-sm text-purple-700 font-semibold mb-1">Posts</p>
                          <p className="text-xl sm:text-3xl font-bold text-purple-800">
                            {formatNumber(instagramAccount.postsCount || 0)}
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
                            {formatNumber(metadata?.averageLikes || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TikTok Stats Cards */}
                  {getTikTokAccount() && (() => {
                    const tiktokAccount = getTikTokAccount()!;
                    const tiktokMetadata = parseMetadata(tiktokAccount.metadata as any);
                    return (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FaTiktok className="text-gray-900" size={22} />
                          TikTok Stats
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-gray-700">
                            <p className="text-[10px] sm:text-sm text-gray-300 font-semibold mb-1">Followers</p>
                            <p className="text-xl sm:text-3xl font-bold text-white">
                              {formatNumber(tiktokAccount.followersCount || 0)}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-teal-400">
                            <p className="text-[10px] sm:text-sm text-teal-100 font-semibold mb-1">Videos</p>
                            <p className="text-xl sm:text-3xl font-bold text-white">
                              {formatNumber(tiktokAccount.postsCount || 0)}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-pink-400">
                            <p className="text-[10px] sm:text-sm text-pink-100 font-semibold mb-1">Total Likes</p>
                            <p className="text-xl sm:text-3xl font-bold text-white">
                              {formatNumber(tiktokMetadata?.likesCount || 0)}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-purple-400">
                            <p className="text-[10px] sm:text-sm text-purple-100 font-semibold mb-1">Avg Views</p>
                            <p className="text-xl sm:text-3xl font-bold text-white">
                              {formatNumber(tiktokMetadata?.averageViews || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* YouTube Stats Cards */}
                  {getYouTubeAccount() && (() => {
                    const youtubeAccount = getYouTubeAccount()!;
                    const youtubeMetadata = parseMetadata(youtubeAccount.metadata as any);
                    return (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FaYoutube className="text-red-600" size={24} />
                          YouTube Stats
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-red-400">
                            <p className="text-[10px] sm:text-sm text-red-100 font-semibold mb-1">Subscribers</p>
                            <p className="text-xl sm:text-3xl font-bold text-white">
                              {formatNumber(youtubeAccount.followersCount || 0)}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-orange-400">
                            <p className="text-[10px] sm:text-sm text-orange-100 font-semibold mb-1">Videos</p>
                            <p className="text-xl sm:text-3xl font-bold text-white">
                              {formatNumber(youtubeAccount.postsCount || 0)}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-red-700 to-red-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-red-600">
                            <p className="text-[10px] sm:text-sm text-red-100 font-semibold mb-1">Total Views</p>
                            <p className="text-xl sm:text-3xl font-bold text-white">
                              {formatNumber(youtubeMetadata?.totalViews || 0)}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-pink-400">
                            <p className="text-[10px] sm:text-sm text-pink-100 font-semibold mb-1">Avg Views</p>
                            <p className="text-xl sm:text-3xl font-bold text-white">
                              {formatNumber(youtubeMetadata?.averageViews || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Charts */}
                  {postEngagementData.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Post Engagement Chart */}
                      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-soft border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FiInstagram className="text-pink-600" size={20} />
                          Instagram Post Engagement Trend
                        </h3>
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
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FiInstagram className="text-pink-600" size={20} />
                          Instagram Engagement Metrics
                        </h3>
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
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FiInstagram className="text-pink-600" size={20} />
                            Instagram Content Type Distribution
                          </h3>
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

                  {/* TikTok Charts */}
                  {videoEngagementData.length > 0 && getTikTokAccount() && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Video Engagement Chart */}
                      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-soft border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FaTiktok className="text-gray-900" size={20} />
                          TikTok Video Engagement Trend
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={videoEngagementData}>
                            <defs>
                              <linearGradient id="colorTikTokLikes" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#E91E63" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#E91E63" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="colorTikTokComments" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#9C27B0" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#9C27B0" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="likes" stroke="#E91E63" fillOpacity={1} fill="url(#colorTikTokLikes)" />
                            <Area type="monotone" dataKey="comments" stroke="#9C27B0" fillOpacity={1} fill="url(#colorTikTokComments)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* TikTok Engagement Metrics */}
                      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-soft border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FaTiktok className="text-gray-900" size={20} />
                          TikTok Engagement Metrics
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={tiktokEngagementMetrics}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                              {tiktokEngagementMetrics.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* TikTok Content Distribution */}
                      {tiktokContentTypeData.length > 0 && tiktokContentTypeData.some(d => d.value > 0) && (
                        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-soft border border-gray-200">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FaTiktok className="text-gray-900" size={20} />
                            TikTok Content Type Distribution
                          </h3>
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={tiktokContentTypeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry: any) => {
                                  const percent = entry.percent as number;
                                  return `${entry.name}: ${(percent * 100).toFixed(0)}%`;
                                }}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {tiktokContentTypeData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}

                  {/* YouTube Charts */}
                  {youtubeEngagementData.length > 0 && getYouTubeAccount() && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* YouTube Engagement Chart */}
                      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-soft border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FaYoutube className="text-red-600" size={20} />
                          YouTube Video Engagement Trend
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={youtubeEngagementData}>
                            <defs>
                              <linearGradient id="colorYouTubeViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF0000" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#FF0000" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="colorYouTubeLikes" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF4444" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#FF4444" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="views" stroke="#FF0000" fillOpacity={1} fill="url(#colorYouTubeViews)" />
                            <Area type="monotone" dataKey="likes" stroke="#FF4444" fillOpacity={1} fill="url(#colorYouTubeLikes)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* YouTube Engagement Metrics */}
                      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-soft border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FaYoutube className="text-red-600" size={20} />
                          YouTube Engagement Metrics
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={youtubeEngagementMetrics}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                              {youtubeEngagementMetrics.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* YouTube Content Distribution */}
                      {youtubeContentTypeData.length > 0 && (
                        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-soft border border-gray-200">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FaYoutube className="text-red-600" size={20} />
                            YouTube Engagement Distribution
                          </h3>
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={youtubeContentTypeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry: any) => {
                                  const percent = entry.percent as number;
                                  return `${entry.name}: ${(percent * 100).toFixed(0)}%`;
                                }}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {youtubeContentTypeData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : activeView === 'instagram' ? (
                <InstagramDataDisplay account={instagramAccount} metadata={metadata} />
              ) : activeView === 'tiktok' ? (
                <TikTokDataDisplay account={getTikTokAccount()} metadata={getTikTokAccount() ? parseMetadata(getTikTokAccount()!.metadata as any) : null} />
              ) : activeView === 'youtube' ? (
                <YoutubeDataDisplay account={getYouTubeAccount()} metadata={getYouTubeAccount() ? parseMetadata(getYouTubeAccount()!.metadata as any) : null} />
              ) : null}
            </div>
          ) : (
            <div className="flex justify-center items-center py-20">
              <p className="text-gray-500">No profile data available</p>
            </div>
          )}
        </div>
      </div>
  );
};
