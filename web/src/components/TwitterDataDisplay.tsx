import React, { useState } from 'react';
import { FiGrid, FiBarChart2, FiTag, FiHeart, FiMessageCircle, FiEye, FiRepeat } from 'react-icons/fi';
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
          <div className="space-y-3 sm:space-y-4">
            {recentTweets.length > 0 ? (
              recentTweets.map((tweet: TwitterTweet) => (
                <a
                  key={tweet.id}
                  href={tweet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 sm:p-5 bg-white border border-gray-200 rounded-xl sm:rounded-2xl hover:shadow-large hover:border-blue-300 transition-all group"
                >
                  {/* Tweet Content */}
                  <div className="space-y-3">
                    <p className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap">
                      {truncateText(tweet.text, 280)}
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
                          <span className="font-semibold">{formatNumber(tweet.likeCount)}</span>
                        </span>
                        <span className="flex items-center gap-1 group-hover:text-green-500 transition-colors">
                          <FiRepeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="font-semibold">{formatNumber(tweet.retweetCount)}</span>
                        </span>
                        <span className="flex items-center gap-1 group-hover:text-blue-500 transition-colors">
                          <FiMessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="font-semibold">{formatNumber(tweet.replyCount)}</span>
                        </span>
                        {tweet.viewCount > 0 && (
                          <span className="flex items-center gap-1">
                            <FiEye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="font-semibold">{formatNumber(tweet.viewCount)}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {formatDate(tweet.publishedAt)}
                      </span>
                    </div>
                  </div>
                </a>
              ))
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
          <div className="space-y-4 sm:space-y-6">
            {/* Engagement Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <FiBarChart2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  <span className="text-xs sm:text-sm font-semibold text-blue-600">
                    {metadata?.engagementRate || account.engagementRate}%
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm text-blue-600 font-medium mb-1">
                  {t('twitter.engagementRate', 'Engagement Rate')}
                </h4>
                <p className="text-xs text-blue-600/70">
                  {t('twitter.overallEngagement', 'Overall engagement')}
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <FiHeart className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  <span className="text-xs sm:text-sm font-semibold text-red-600">
                    {formatNumber(metadata?.averageLikes || 0)}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm text-red-600 font-medium mb-1">
                  {t('twitter.averageLikes', 'Average Likes')}
                </h4>
                <p className="text-xs text-red-600/70">
                  {t('twitter.perTweet', 'Per tweet')}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <FiRepeat className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  <span className="text-xs sm:text-sm font-semibold text-green-600">
                    {formatNumber(metadata?.averageRetweets || 0)}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm text-green-600 font-medium mb-1">
                  {t('twitter.averageRetweets', 'Average Retweets')}
                </h4>
                <p className="text-xs text-green-600/70">
                  {t('twitter.perTweet', 'Per tweet')}
                </p>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  {t('twitter.followers', 'Followers')}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {formatNumber(account.followersCount)}
                </p>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  {t('twitter.tweets', 'Tweets')}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {formatNumber(account.postsCount)}
                </p>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  {t('twitter.avgReplies', 'Avg Replies')}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {formatNumber(metadata?.averageReplies || 0)}
                </p>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-xl text-center">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  {t('twitter.avgEngagement', 'Avg Total')}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {formatNumber(
                    (metadata?.averageLikes || 0) + 
                    (metadata?.averageRetweets || 0) + 
                    (metadata?.averageReplies || 0)
                  )}
                </p>
              </div>
            </div>

            {/* Info Note */}
            <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs sm:text-sm text-blue-700">
                {t('twitter.analyticsNote', 'Analytics are calculated from your recent tweets and updated daily.')}
              </p>
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
