import React, { useState } from 'react';
import { FiGrid, FiBarChart2, FiTrendingUp, FiTag, FiClock } from 'react-icons/fi';
import { getProxiedImageUrl } from '../utils/imageProxy';

interface InstagramPost {
  id: string;
  url: string;
  displayUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string;
}

interface InstagramDataDisplayProps {
  account: any;
  metadata: any;
}

export const InstagramDataDisplay: React.FC<InstagramDataDisplayProps> = ({ account, metadata }) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'analytics' | 'hashtags'>('posts');
  
  const recentPosts = metadata?.recentPosts || [];
  const topHashtags = metadata?.topHashtags || [];

  const tabs = [
    { id: 'posts', label: 'Recent Posts', icon: FiGrid },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
    { id: 'hashtags', label: 'Top Hashtags', icon: FiTag },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-magenta border-b-2 border-magenta'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'posts' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recentPosts.length > 0 ? (
              recentPosts.map((post: InstagramPost) => (
                <a
                  key={post.id}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 hover:shadow-large transition-all"
                >
                  <img
                    src={getProxiedImageUrl(post.displayUrl)}
                    alt="Instagram post"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-image.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div className="text-white w-full">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="flex items-center gap-1">
                          <FiTrendingUp /> {post.likesCount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          💬 {post.commentsCount.toLocaleString()}
                        </span>
                      </div>
                      {post.caption && (
                        <p className="text-xs mt-2 line-clamp-2 opacity-90">
                          {post.caption}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                <FiGrid size={48} className="mx-auto mb-4 opacity-30" />
                <p>No posts available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-700">Average Likes</h4>
                <FiTrendingUp className="text-blue-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-blue-700">
                {(metadata?.averageLikes || 0).toLocaleString()}
              </p>
              <p className="text-sm text-blue-600 mt-2">per post</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-700">Average Comments</h4>
                <FiBarChart2 className="text-purple-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-purple-700">
                {(metadata?.averageComments || 0).toLocaleString()}
              </p>
              <p className="text-sm text-purple-600 mt-2">per post</p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 border-2 border-pink-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-700">Engagement Rate</h4>
                <FiTrendingUp className="text-pink-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-pink-700">
                {(account.engagementRate || 0).toFixed(2)}%
              </p>
              <p className="text-sm text-pink-600 mt-2">overall</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-700">Total Posts</h4>
                <FiGrid className="text-green-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-green-700">
                {(account.postsCount || 0).toLocaleString()}
              </p>
              <p className="text-sm text-green-600 mt-2">published</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border-2 border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-700">Followers</h4>
                <FiTrendingUp className="text-amber-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-amber-700">
                {(account.followersCount || 0).toLocaleString()}
              </p>
              <p className="text-sm text-amber-600 mt-2">total</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border-2 border-indigo-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-700">Following</h4>
                <FiTrendingUp className="text-indigo-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-indigo-700">
                {(account.followingCount || 0).toLocaleString()}
              </p>
              <p className="text-sm text-indigo-600 mt-2">accounts</p>
            </div>
          </div>
        )}

        {activeTab === 'hashtags' && (
          <div className="space-y-4">
            {topHashtags.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {topHashtags.map((hashtag: string, index: number) => (
                  <div
                    key={index}
                    className="px-6 py-3 bg-gradient-to-r from-magenta/10 to-purple/10 border-2 border-magenta/30 rounded-full text-magenta font-semibold hover:shadow-medium transition-all cursor-pointer hover:scale-105"
                  >
                    #{hashtag}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FiTag size={48} className="mx-auto mb-4 opacity-30" />
                <p>No hashtags data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
