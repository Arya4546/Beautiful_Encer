import React, { useState } from 'react';
import { FiGrid, FiBarChart2, FiTag, FiHeart, FiMessageCircle, FiEye, FiRepeat, FiTrendingUp } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { ImageWithFallback } from './ui/ImageWithFallback.tsx';

interface TwitterTweet {
  id: string;
  text: string;
  url: string;
  thumbnailUrl: string;
  mediaUrls?: string[];
  publishedAt: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  viewCount: number;
  quoteCount?: number;
}

interface TwitterDataDisplayProps {
  account: any;
  metadata: any;
}

export const TwitterDataDisplay: React.FC<TwitterDataDisplayProps> = ({ account, metadata }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'tweets' | 'analytics' | 'hashtags'>('tweets');
  
  const recentTweets = metadata?.recentTweets || metadata?.recentPosts || [];
  const topHashtags = metadata?.topHashtags || [];

  const tabs = [
    { id: 'tweets', label: t('twitter.recentTweets', 'Recent Tweets'), icon: FiGrid },
    { id: 'analytics', label: t('common.analytics', 'Analytics'), icon: FiBarChart2 },
    { id: 'hashtags', label: t('twitter.topHashtags', 'Top Hashtags'), icon: FiTag },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
                ? 'text-blue-600 border-b-2 border-blue-600'
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
        {activeTab === 'tweets' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {recentTweets.length > 0 ? (
              recentTweets.map((tweet: TwitterTweet) => {
                // Safety check for tweet data
                if (!tweet || !tweet.id) return null;
                
                return (
                <a
                  key={tweet.id}
                  href={tweet.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 sm:p-5 bg-white border border-gray-200 rounded-xl sm:rounded-2xl hover:shadow-large hover:border-blue-300 transition-all group"
                >
                  {/* Tweet Content */}
                  <div className="space-y-3">
                    <p className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">
                      {truncateText(tweet.text || '', 280)}
                    </p>

                    {/* Tweet Image (if exists) */}
                    {tweet.thumbnailUrl && (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200">
                        <ImageWithFallback
                          src={tweet.thumbnailUrl}
                          alt="Tweet media"
                          className="w-full max-h-[400px] object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Tweet Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600">
                        <span className="flex items-center gap-1 group-hover:text-red-500 transition-colors">
                          <FiHeart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="font-semibold">{formatNumber(tweet.likeCount || 0)}</span>
                        </span>
                        <span className="flex items-center gap-1 group-hover:text-green-500 transition-colors">
                          <FiRepeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="font-semibold">{formatNumber(tweet.retweetCount || 0)}</span>
                        </span>
                        <span className="flex items-center gap-1 group-hover:text-blue-500 transition-colors">
                          <FiMessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="font-semibold">{formatNumber(tweet.replyCount || 0)}</span>
                        </span>
                        {(tweet.viewCount || 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <FiEye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="font-semibold">{formatNumber(tweet.viewCount)}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {tweet.publishedAt ? formatDate(tweet.publishedAt) : ''}
                      </span>
                    </div>
                  </div>
                </a>
              )})
            ) : (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                <FiGrid className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-4" />
                <p className="text-sm sm:text-base text-gray-500">
                  {t('twitter.noTweets', 'No tweets found')}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {/* Average Likes */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-red-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('twitter.averageLikes', 'Average Likes')}</h4>
                <FiHeart className="text-red-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-red-700">
                {(metadata?.averageLikes || 0).toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-sm text-red-600 mt-1 sm:mt-2">{t('twitter.perTweet', 'per tweet')}</p>
            </div>

            {/* Average Retweets */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-green-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('twitter.averageRetweets', 'Average Retweets')}</h4>
                <FiRepeat className="text-green-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-green-700">
                {(metadata?.averageRetweets || 0).toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-sm text-green-600 mt-1 sm:mt-2">{t('twitter.perTweet', 'per tweet')}</p>
            </div>

            {/* Engagement Rate */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('twitter.engagementRate', 'Engagement Rate')}</h4>
                <FiBarChart2 className="text-blue-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-blue-700">
                {(metadata?.engagementRate || account.engagementRate || 0).toFixed(2)}%
              </p>
              <p className="text-[10px] sm:text-sm text-blue-600 mt-1 sm:mt-2">{t('twitter.overall', 'overall')}</p>
            </div>

            {/* Total Tweets */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('twitter.totalTweets', 'Total Tweets')}</h4>
                <FiGrid className="text-purple-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-purple-700">
                {(account.postsCount || 0).toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-sm text-purple-600 mt-1 sm:mt-2">{t('twitter.published', 'published')}</p>
            </div>

            {/* Followers */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-amber-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('twitter.followers', 'Followers')}</h4>
                <FiTrendingUp className="text-amber-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-amber-700">
                {(account.followersCount || 0).toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-sm text-amber-600 mt-1 sm:mt-2">{t('twitter.overall', 'overall')}</p>
            </div>

            {/* Following */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 border-2 border-pink-200">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h4 className="font-semibold text-gray-700 text-xs sm:text-sm">{t('twitter.following', 'Following')}</h4>
                <FiTrendingUp className="text-pink-600 w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xl sm:text-3xl font-bold text-pink-700">
                {(account.followingCount || metadata?.followingCount || 0).toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-sm text-pink-600 mt-1 sm:mt-2">{t('twitter.accounts', 'accounts')}</p>
            </div>
          </div>
        )}

        {activeTab === 'hashtags' && (
          <div className="space-y-4">
            {topHashtags.length > 0 ? (
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {topHashtags.map((hashtag: string, index: number) => (
                  <a
                    key={index}
                    href={`https://twitter.com/hashtag/${hashtag.replace('#', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-full text-blue-700 font-medium text-sm sm:text-base transition-all hover:shadow-md hover:scale-105"
                  >
                    <FiTag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{hashtag}</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                <FiTag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-4" />
                <p className="text-sm sm:text-base text-gray-500">
                  {t('twitter.noHashtags', 'No hashtags found in recent tweets')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
