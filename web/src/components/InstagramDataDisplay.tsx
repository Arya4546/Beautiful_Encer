import React, { useState } from 'react';
import { FiGrid, FiBarChart2, FiTrendingUp, FiTag, FiHeart, FiMessageCircle } from 'react-icons/fi';
import { getProxiedImageUrl } from '../utils/imageProxy';
import { useTranslation } from 'react-i18next';
import { ImageWithFallback } from './ui/ImageWithFallback.tsx';

interface InstagramPost {
  id: string;
  url: string;
  displayUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string;
  type?: string;
}

interface InstagramDataDisplayProps {
  account: any;
  metadata: any;
}

export const InstagramDataDisplay: React.FC<InstagramDataDisplayProps> = ({ account, metadata }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'posts' | 'analytics' | 'hashtags'>('posts');
  
  const recentPosts = metadata?.recentPosts || [];
  const topHashtags = metadata?.topHashtags || [];

  const tabs = [
    { id: 'posts', label: t('instagram.recentPosts'), icon: FiGrid },
    { id: 'analytics', label: t('common.analytics', 'Analytics'), icon: FiBarChart2 },
    { id: 'hashtags', label: t('instagram.topHashtags', 'Top Hashtags'), icon: FiTag },
  ];

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
                ? 'text-magenta border-b-2 border-magenta'
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
        {activeTab === 'posts' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {recentPosts.length > 0 ? (
              recentPosts.map((post: InstagramPost) => (
                <a
                  key={post.id}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 hover:shadow-large transition-all"
                >
                  <ImageWithFallback
                    src={getProxiedImageUrl(post.displayUrl)}
                    alt={t('instagram.alt.post', 'Instagram post')}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 sm:p-4">
                    <div className="text-white w-full">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-semibold gap-2">
                        <span className="flex items-center gap-1">
                          <FiHeart className="w-3 h-3 sm:w-4 sm:h-4" /> 
                          <span className="hidden xs:inline">{post.likesCount.toLocaleString()}</span>
                          <span className="xs:hidden">{post.likesCount > 999 ? `${(post.likesCount/1000).toFixed(1)}k` : post.likesCount}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <FiMessageCircle className="w-3 h-3 sm:w-4 sm:h-4" /> 
                          <span className="hidden xs:inline">{post.commentsCount.toLocaleString()}</span>
                          <span className="xs:hidden">{post.commentsCount > 999 ? `${(post.commentsCount/1000).toFixed(1)}k` : post.commentsCount}</span>
                        </span>
                      </div>
                      {post.caption && (
                        <p className="text-[10px] sm:text-xs mt-1 sm:mt-2 line-clamp-2 opacity-90">
                          {post.caption}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Type Badge */}
                  {post.type && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] sm:text-xs px-2 py-1 rounded-full font-semibold">
                      {post.type === 'Sidecar' ? t('instagram.gallery', 'Gallery') : post.type}
                    </div>
                  )}
                </a>
              ))
            ) : (
              <div className="col-span-full text-center py-8 sm:py-12 text-gray-500">
                <FiGrid size={32} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-30" />
                <p className="text-sm sm:text-base">{t('instagram.noPosts', 'No posts available')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {/* Average Likes */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('instagram.analytics.averageLikes', 'Average Likes')}</h4>
                <FiTrendingUp className="text-blue-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-blue-700">
                {(metadata?.averageLikes || 0).toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-sm text-blue-600 mt-1 sm:mt-2">{t('instagram.analytics.perPost', 'per post')}</p>
            </div>

            {/* Average Comments */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('instagram.analytics.avgComments', 'Avg Comments')}</h4>
                <FiBarChart2 className="text-purple-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-purple-700">
                {(metadata?.averageComments || 0).toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-sm text-purple-600 mt-1 sm:mt-2">{t('instagram.analytics.perPost', 'per post')}</p>
            </div>

            {/* Engagement Rate */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-pink-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('instagram.stats.engagement')}</h4>
                <FiTrendingUp className="text-pink-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-pink-700">
                {(account?.engagementRate || 0).toFixed(2)}%
              </p>
              <p className="text-[10px] sm:text-sm text-pink-600 mt-1 sm:mt-2">{t('instagram.analytics.overall', 'overall')}</p>
            </div>

            {/* Total Posts */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-green-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('instagram.analytics.totalPosts', 'Total Posts')}</h4>
                <FiGrid className="text-green-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-green-700">
                {(account?.postsCount || 0).toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-sm text-green-600 mt-1 sm:mt-2">{t('instagram.analytics.published', 'published')}</p>
            </div>

            {/* Followers */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-amber-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('instagram.stats.followers')}</h4>
                <FiTrendingUp className="text-amber-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-amber-700">
                {(account?.followersCount || 0).toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-sm text-amber-600 mt-1 sm:mt-2">{t('instagram.analytics.overall', 'overall')}</p>
            </div>

            {/* Following */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-indigo-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('instagram.analytics.following', 'Following')}</h4>
                <FiTrendingUp className="text-indigo-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-indigo-700">
                {(() => {
                  const followingCount = account?.followingCount || metadata?.followingCount || 0;
                  return followingCount > 0 ? followingCount.toLocaleString() : t('instagram.analytics.hidden', 'Hidden');
                })()}
              </p>
              <p className="text-[10px] sm:text-sm text-indigo-600 mt-1 sm:mt-2">
                {(() => {
                  const followingCount = account?.followingCount || metadata?.followingCount || 0;
                  return followingCount > 0 ? t('instagram.analytics.accounts', 'accounts') : t('instagram.analytics.byUser', 'by user');
                })()}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'hashtags' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Description */}
            <div className="bg-gradient-to-r from-magenta/5 to-purple/5 border-2 border-magenta/20 rounded-xl p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <FiTag className="text-magenta w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1">{t('instagram.topHashtags', 'Top Hashtags')}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {t('instagram.hashtags.description', "These are the most frequently used hashtags extracted from this influencer's recent posts. Hashtags help understand content themes and reach specific audiences on Instagram.")}
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
                    className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-magenta/10 to-purple/10 border-2 border-magenta/30 rounded-full text-magenta font-semibold hover:shadow-medium transition-all cursor-pointer hover:scale-105 text-xs sm:text-sm"
                  >
                    #{hashtag}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <FiTag size={32} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-30" />
                <p className="text-sm sm:text-base font-semibold mb-2">{t('instagram.hashtags.none', 'No Hashtags Found')}</p>
                <p className="text-xs sm:text-sm text-gray-400">{t('instagram.hashtags.noneDesc', "This influencer hasn't used hashtags in their recent posts")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
