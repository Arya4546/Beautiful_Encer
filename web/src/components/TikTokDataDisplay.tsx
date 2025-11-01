import React, { useState } from 'react';
import { FiGrid, FiBarChart2, FiTrendingUp, FiTag, FiHeart, FiMessageCircle, FiShare2, FiEye, FiPlay } from 'react-icons/fi';
import { FaTiktok } from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getProxiedImageUrl } from '../utils/imageProxy';
import { useTranslation } from 'react-i18next';
import { ImageWithFallback } from './ui/ImageWithFallback';

interface TikTokVideo {
  id: string;
  videoUrl?: string;
  shareUrl?: string;
  coverUrl?: string;
  coverImageUrl?: string;
  description?: string;
  videoDescription?: string;
  viewCount?: number;
  viewsCount?: number;
  likeCount?: number;
  likesCount?: number;
  commentCount?: number;
  commentsCount?: number;
  shareCount?: number;
  sharesCount?: number;
  timestamp?: string;
  createTime?: number;
}

interface TikTokDataDisplayProps {
  account: any;
  metadata: any;
}

export const TikTokDataDisplay: React.FC<TikTokDataDisplayProps> = ({ account, metadata }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'videos' | 'analytics' | 'hashtags'>('videos');
  
  const recentVideos = metadata?.recentVideos || [];
  const topHashtags = metadata?.topHashtags || [];

  const tabs = [
    { id: 'videos', label: t('tiktok.recentVideos'), icon: FiGrid },
    { id: 'analytics', label: t('common.analytics', 'Analytics'), icon: FiBarChart2 },
    { id: 'hashtags', label: t('tiktok.topHashtags', 'Top Hashtags'), icon: FiTag },
  ];

  const formatNumber = (num: number | undefined | null): string => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Generate chart data for TikTok
  const getChartData = () => {
    // Video Engagement Trend Data (for line chart)
    const videoEngagementData = recentVideos.slice(0, 10).map((video: TikTokVideo, index: number) => ({
      name: `V${index + 1}`,
      likes: video.likeCount || video.likesCount || 0,
      comments: video.commentCount || video.commentsCount || 0,
      shares: video.shareCount || video.sharesCount || 0,
      views: video.viewCount || video.viewsCount || 0,
    }));

    // Engagement Metrics (for bar chart comparison)
    const engagementMetrics = [
      {
        name: 'Avg Likes',
        value: metadata?.averageLikes || 0,
        color: '#E91E63',
      },
      {
        name: 'Avg Comments',
        value: metadata?.averageComments || 0,
        color: '#9C27B0',
      },
      {
        name: 'Avg Views',
        value: (metadata?.averageViews || 0) / 10, // Scale down for visibility
        color: '#00BCD4',
      },
      {
        name: 'Avg Shares',
        value: metadata?.averageShares || 0,
        color: '#FF9800',
      },
    ];

    // Content Type Distribution (simplified for TikTok - show engagement distribution)
    const contentTypeData = [
      { name: 'Likes', value: metadata?.averageLikes || 0, color: '#E91E63' },
      { name: 'Comments', value: metadata?.averageComments || 0, color: '#9C27B0' },
      { name: 'Shares', value: metadata?.averageShares || 0, color: '#FF9800' },
    ];

    return {
      videoEngagementData,
      engagementMetrics,
      contentTypeData,
    };
  };

  const { videoEngagementData, engagementMetrics, contentTypeData } = getChartData();
  const COLORS = ['#E91E63', '#9C27B0', '#FF9800', '#00BCD4'];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tab Navigation - Mobile Optimized */}
      <div className="flex gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-sm transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon && <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />}
            <span className="hidden xs:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px] sm:min-h-[400px]">
        {activeTab === 'videos' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {recentVideos.length > 0 ? (
              recentVideos.map((video: TikTokVideo) => {
                const videoLink = video.videoUrl || video.shareUrl || `https://www.tiktok.com/@user/video/${video.id}`;
                const coverImage = video.coverUrl || video.coverImageUrl || '';
                const description = video.description || video.videoDescription || '';
                const views = video.viewCount || video.viewsCount || 0;
                const likes = video.likeCount || video.likesCount || 0;
                const comments = video.commentCount || video.commentsCount || 0;
                const shares = video.shareCount || video.sharesCount || 0;
                
                return (
                <a
                  key={video.id}
                  href={videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-[9/16] rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 hover:shadow-large transition-all cursor-pointer"
                >
                  <ImageWithFallback
                    src={getProxiedImageUrl(coverImage)}
                    alt={t('tiktok.alt.video', 'TikTok video')}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Play Icon Overlay */}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 sm:p-4">
                      <FiPlay className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
                    </div>
                  </div>

                  {/* Stats Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 sm:p-4">
                    <div className="text-white w-full">
                      {/* View Count Badge - Always Visible */}
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] sm:text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                        <FiEye className="w-3 h-3" />
                        {formatNumber(views)}
                      </div>

                      {/* Engagement Stats */}
                      <div className="grid grid-cols-3 gap-1 sm:gap-2 text-[10px] sm:text-xs font-semibold">
                        <span className="flex items-center gap-0.5 sm:gap-1 justify-center bg-black/40 backdrop-blur-sm rounded-lg py-1">
                          <FiHeart className="w-3 h-3" /> 
                          <span className="hidden xs:inline">{formatNumber(likes)}</span>
                        </span>
                        <span className="flex items-center gap-0.5 sm:gap-1 justify-center bg-black/40 backdrop-blur-sm rounded-lg py-1">
                          <FiMessageCircle className="w-3 h-3" /> 
                          <span className="hidden xs:inline">{formatNumber(comments)}</span>
                        </span>
                        <span className="flex items-center gap-0.5 sm:gap-1 justify-center bg-black/40 backdrop-blur-sm rounded-lg py-1">
                          <FiShare2 className="w-3 h-3" /> 
                          <span className="hidden xs:inline">{formatNumber(shares)}</span>
                        </span>
                      </div>

                      {/* Description */}
                      {description && (
                        <p className="text-[10px] sm:text-xs mt-1 sm:mt-2 line-clamp-2 opacity-90">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              );
            })
            ) : (
              <div className="col-span-full text-center py-8 sm:py-12 text-gray-500">
                <FiGrid size={32} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-30" />
                <p className="text-sm sm:text-base">{t('tiktok.noVideos', 'No videos available')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Followers */}
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-cyan-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.stats.followers')}</h4>
                  <FiTrendingUp className="text-cyan-600 w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-cyan-700">
                  {formatNumber(account?.followersCount || 0)}
                </p>
              </div>

              {/* Videos */}
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-teal-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.analytics.totalVideos', 'Videos')}</h4>
                  <FiGrid className="text-teal-600 w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-teal-700">
                  {account?.postsCount || recentVideos.length}
                </p>
              </div>

              {/* Total Likes */}
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-pink-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.analytics.totalLikes', 'Total Likes')}</h4>
                  <FiHeart className="text-pink-600 w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-pink-700">
                  {formatNumber(metadata?.likesCount || recentVideos.reduce((sum: number, v: TikTokVideo) => sum + (v.likeCount || v.likesCount || 0), 0))}
                </p>
              </div>

              {/* Avg Views */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.analytics.averageViews', 'Avg Views')}</h4>
                  <FiEye className="text-purple-600 w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-purple-700">
                  {formatNumber(metadata?.averageViews || 0)}
                </p>
              </div>
            </div>

            {/* Additional Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Average Likes */}
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-pink-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.analytics.averageLikes', 'Avg Likes')}</h4>
                  <FiHeart className="text-pink-600 w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-pink-700">
                  {formatNumber(metadata?.averageLikes || 0)}
                </p>
              </div>

              {/* Average Comments */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.analytics.avgComments', 'Avg Comments')}</h4>
                  <FiMessageCircle className="text-purple-600 w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-purple-700">
                  {formatNumber(metadata?.averageComments || 0)}
                </p>
              </div>

              {/* Average Shares */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.analytics.avgShares', 'Avg Shares')}</h4>
                  <FiShare2 className="text-orange-600 w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-orange-700">
                  {formatNumber(metadata?.averageShares || 0)}
                </p>
              </div>

              {/* Engagement Rate */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.stats.engagement')}</h4>
                  <FiTrendingUp className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">
                  {(account?.engagementRate || 0).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hashtags' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Description */}
            <div className="bg-gradient-to-r from-teal-500/5 to-black/5 border-2 border-teal-500/20 rounded-xl p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <FiTag className="text-teal-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1">{t('tiktok.topHashtags', 'Top Hashtags')}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {t('tiktok.hashtags.description', "These are the most frequently used hashtags extracted from this influencer's recent videos. Hashtags help understand content themes and reach specific audiences on TikTok.")}
                  </p>
                </div>
              </div>
            </div>

            {/* Hashtags Display */}
            {topHashtags.length > 0 ? (
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {topHashtags.map((hashtag: string, index: number) => (
                  <div
                    key={index}
                    className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-teal-500/10 to-black/10 border-2 border-teal-500/30 rounded-full text-teal-700 font-semibold hover:shadow-medium transition-all cursor-pointer hover:scale-105 text-xs sm:text-sm"
                  >
                    #{hashtag}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <FiTag size={32} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-30" />
                <p className="text-sm sm:text-base font-semibold mb-2">{t('tiktok.hashtags.none', 'No Hashtags Found')}</p>
                <p className="text-xs sm:text-sm text-gray-400">{t('tiktok.hashtags.noneDesc', "This influencer hasn't used hashtags in their recent videos")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
