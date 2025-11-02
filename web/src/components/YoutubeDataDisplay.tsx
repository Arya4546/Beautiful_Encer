import React, { useState } from 'react';
import { FiGrid, FiBarChart2, FiTrendingUp, FiTag, FiHeart, FiMessageCircle, FiEye, FiPlay } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { ImageWithFallback } from './ui/ImageWithFallback.tsx';

interface YoutubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
}

interface YoutubeDataDisplayProps {
  account: any;
  metadata: any;
}

export const YoutubeDataDisplay: React.FC<YoutubeDataDisplayProps> = ({ account, metadata }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'videos' | 'analytics' | 'hashtags'>('videos');
  
  const recentVideos = metadata?.recentVideos || [];
  const topHashtags = metadata?.topHashtags || [];

  const tabs = [
    { id: 'videos', label: t('youtube.recentVideos'), icon: FiGrid },
    { id: 'analytics', label: t('common.analytics', 'Analytics'), icon: FiBarChart2 },
    { id: 'hashtags', label: t('youtube.topHashtags', 'Top Hashtags'), icon: FiTag },
  ];

  const formatDuration = (duration: string | number) => {
    // Handle if duration is a number (seconds)
    if (typeof duration === 'number') {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = duration % 60;
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Handle if duration is empty/null
    if (!duration) return '0:00';
    
    // Duration comes in ISO 8601 format (e.g., PT4M13S)
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return String(duration);
    
    const hours = match[1] ? parseInt(match[1].slice(0, -1)) : 0;
    const minutes = match[2] ? parseInt(match[2].slice(0, -1)) : 0;
    const seconds = match[3] ? parseInt(match[3].slice(0, -1)) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

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
                ? 'text-red-600 border-b-2 border-red-600'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {recentVideos.length > 0 ? (
              recentVideos.map((video: YoutubeVideo) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 hover:shadow-large transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video">
                    <ImageWithFallback
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Duration Badge */}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded font-semibold">
                        {formatDuration(video.duration)}
                      </div>
                    )}
                    {/* Play Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all">
                        <FiPlay className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="p-3 sm:p-4">
                    <h4 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                      {video.title}
                    </h4>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FiEye className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="font-semibold">{formatNumber(video.viewCount)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <FiHeart className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="font-semibold">{formatNumber(video.likeCount)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <FiMessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="font-semibold">{formatNumber(video.commentCount)}</span>
                      </span>
                    </div>

                    {/* Date */}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(video.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </a>
              ))
            ) : (
              <div className="col-span-full text-center py-8 sm:py-12 text-gray-500">
                <FiGrid size={32} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-30" />
                <p className="text-sm sm:text-base">{t('youtube.noVideos', 'No videos available')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {/* Average Views */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('youtube.analytics.averageViews', 'Average Views')}</h4>
                <FiEye className="text-blue-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-blue-700">
                {formatNumber(metadata?.averageViews || 0)}
              </p>
              <p className="text-[10px] sm:text-sm text-blue-600 mt-1 sm:mt-2">{t('youtube.analytics.perVideo', 'per video')}</p>
            </div>

            {/* Average Likes */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-red-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('youtube.analytics.averageLikes', 'Average Likes')}</h4>
                <FiHeart className="text-red-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-red-700">
                {formatNumber(metadata?.averageLikes || 0)}
              </p>
              <p className="text-[10px] sm:text-sm text-red-600 mt-1 sm:mt-2">{t('youtube.analytics.perVideo', 'per video')}</p>
            </div>

            {/* Average Comments */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('youtube.analytics.avgComments', 'Avg Comments')}</h4>
                <FiMessageCircle className="text-purple-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-purple-700">
                {formatNumber(metadata?.averageComments || 0)}
              </p>
              <p className="text-[10px] sm:text-sm text-purple-600 mt-1 sm:mt-2">{t('youtube.analytics.perVideo', 'per video')}</p>
            </div>

            {/* Engagement Rate */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-pink-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('youtube.stats.engagement')}</h4>
                <FiTrendingUp className="text-pink-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-pink-700">
                {(account?.engagementRate || 0).toFixed(2)}%
              </p>
              <p className="text-[10px] sm:text-sm text-pink-600 mt-1 sm:mt-2">{t('youtube.analytics.overall', 'overall')}</p>
            </div>

            {/* Total Videos */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-green-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('youtube.analytics.totalVideos', 'Total Videos')}</h4>
                <FiGrid className="text-green-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-green-700">
                {(account?.postsCount || metadata?.videoCount || 0).toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-sm text-green-600 mt-1 sm:mt-2">{t('youtube.analytics.published', 'published')}</p>
            </div>

            {/* Subscribers */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-amber-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('youtube.stats.subscribers')}</h4>
                <FiTrendingUp className="text-amber-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-amber-700">
                {formatNumber(account?.followersCount || metadata?.subscriberCount || 0)}
              </p>
              <p className="text-[10px] sm:text-sm text-amber-600 mt-1 sm:mt-2">{t('youtube.analytics.overall', 'overall')}</p>
            </div>

            {/* Total Views */}
            {metadata?.viewCount && (
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-indigo-200">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('youtube.analytics.totalViews', 'Total Views')}</h4>
                  <FiEye className="text-indigo-600 w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <p className="text-xl sm:text-3xl font-bold text-indigo-700">
                  {formatNumber(metadata.viewCount)}
                </p>
                <p className="text-[10px] sm:text-sm text-indigo-600 mt-1 sm:mt-2">{t('youtube.analytics.allTime', 'all time')}</p>
              </div>
            )}

            {/* Channel Info */}
            {metadata?.customUrl && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('youtube.analytics.customUrl', 'Custom URL')}</h4>
                  <FiTrendingUp className="text-gray-600 w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-gray-700 truncate">
                  {metadata.customUrl}
                </p>
                {metadata?.country && (
                  <p className="text-[10px] sm:text-sm text-gray-600 mt-1 sm:mt-2">
                    {t('youtube.analytics.country', 'Country')}: {metadata.country}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'hashtags' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Description */}
            <div className="bg-gradient-to-r from-red-500/5 to-orange-500/5 border-2 border-red-500/20 rounded-xl p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <FiTag className="text-red-600 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1">{t('youtube.topHashtags', 'Top Hashtags')}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {t('youtube.hashtags.description', "These are the most frequently used hashtags extracted from this creator's recent video descriptions. Hashtags help understand content themes and reach specific audiences on YouTube.")}
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
                    className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-2 border-red-500/30 rounded-full text-red-600 font-semibold hover:shadow-medium transition-all cursor-pointer hover:scale-105 text-xs sm:text-sm"
                  >
                    #{hashtag}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <FiTag size={32} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-30" />
                <p className="text-sm sm:text-base font-semibold mb-2">{t('youtube.hashtags.none', 'No Hashtags Found')}</p>
                <p className="text-xs sm:text-sm text-gray-400">{t('youtube.hashtags.noneDesc', "This creator hasn't used hashtags in their recent videos")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
