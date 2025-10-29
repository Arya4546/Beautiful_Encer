import React, { useState } from 'react';
import { FiGrid, FiBarChart2, FiTrendingUp, FiTag, FiHeart, FiMessageCircle, FiShare2, FiEye, FiPlay } from 'react-icons/fi';
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
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {/* Average Views */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.analytics.averageViews', 'Average Views')}</h4>
                <FiEye className="text-blue-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-blue-700">
                {formatNumber(metadata?.averageViews || 0)}
              </p>
              <p className="text-[10px] sm:text-sm text-blue-600 mt-1 sm:mt-2">{t('tiktok.analytics.perVideo', 'per video')}</p>
            </div>

            {/* Average Likes */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-pink-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.analytics.averageLikes', 'Average Likes')}</h4>
                <FiHeart className="text-pink-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-pink-700">
                {formatNumber(metadata?.averageLikes || 0)}
              </p>
              <p className="text-[10px] sm:text-sm text-pink-600 mt-1 sm:mt-2">{t('tiktok.analytics.perVideo', 'per video')}</p>
            </div>

            {/* Average Comments */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.analytics.avgComments', 'Avg Comments')}</h4>
                <FiMessageCircle className="text-purple-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-purple-700">
                {formatNumber(metadata?.averageComments || 0)}
              </p>
              <p className="text-[10px] sm:text-sm text-purple-600 mt-1 sm:mt-2">{t('tiktok.analytics.perVideo', 'per video')}</p>
            </div>

            {/* Average Shares */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-green-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.analytics.avgShares', 'Avg Shares')}</h4>
                <FiShare2 className="text-green-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-green-700">
                {formatNumber(metadata?.averageShares || 0)}
              </p>
              <p className="text-[10px] sm:text-sm text-green-600 mt-1 sm:mt-2">{t('tiktok.analytics.perVideo', 'per video')}</p>
            </div>

            {/* Engagement Rate */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-teal-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.stats.engagement')}</h4>
                <FiTrendingUp className="text-teal-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-teal-700">
                {(account?.engagementRate || 0).toFixed(2)}%
              </p>
              <p className="text-[10px] sm:text-sm text-teal-600 mt-1 sm:mt-2">{t('tiktok.analytics.overall', 'overall')}</p>
            </div>

            {/* Total Videos */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-indigo-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.analytics.totalVideos', 'Total Videos')}</h4>
                <FiGrid className="text-indigo-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-indigo-700">
                {(account?.postsCount || 0).toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-sm text-indigo-600 mt-1 sm:mt-2">{t('tiktok.analytics.published', 'published')}</p>
            </div>

            {/* Followers */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-amber-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.stats.followers')}</h4>
                <FiTrendingUp className="text-amber-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-amber-700">
                {formatNumber(account?.followersCount || 0)}
              </p>
              <p className="text-[10px] sm:text-sm text-amber-600 mt-1 sm:mt-2">{t('tiktok.analytics.overall', 'overall')}</p>
            </div>

            {/* Following */}
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-rose-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.analytics.following', 'Following')}</h4>
                <FiTrendingUp className="text-rose-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-rose-700">
                {(() => {
                  const followingCount = account?.followingCount || metadata?.followingCount || 0;
                  return followingCount > 0 ? formatNumber(followingCount) : t('tiktok.analytics.hidden', 'Hidden');
                })()}
              </p>
              <p className="text-[10px] sm:text-sm text-rose-600 mt-1 sm:mt-2">
                {(() => {
                  const followingCount = account?.followingCount || metadata?.followingCount || 0;
                  return followingCount > 0 ? t('tiktok.analytics.accounts', 'accounts') : t('tiktok.analytics.byUser', 'by user');
                })()}
              </p>
            </div>

            {/* Total Likes */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-red-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('tiktok.analytics.totalLikes', 'Total Likes')}</h4>
                <FiHeart className="text-red-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-red-700">
                {formatNumber(metadata?.likesCount || 0)}
              </p>
              <p className="text-[10px] sm:text-sm text-red-600 mt-1 sm:mt-2">{t('tiktok.analytics.overall', 'overall')}</p>
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
