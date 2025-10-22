import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaInstagram, FaPlus, FaCheck, FaClock } from 'react-icons/fa';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import InstagramConnect from '../components/InstagramConnect';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../lib/axios';
import { API_ENDPOINTS } from '../config/api.config';
import { showToast } from '../utils/toast';

interface SocialMediaAccount {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  profilePicture: string;
  followersCount: number;
  isActive: boolean;
  lastSynced: string;
  metadata?: {
    bio?: string;
    postsCount?: number;
    engagementRate?: number;
    averageLikes?: number;
    isVerified?: boolean;
  };
}

export default function SocialMediaPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [instagramModalOpen, setInstagramModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_ENDPOINTS.SOCIAL_MEDIA.ACCOUNTS);
      setAccounts(response.data.accounts || []);
    } catch (error: any) {
      console.error('Error fetching social media accounts:', error);
      showToast.error(t('messages.error.syncFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSuccess = () => {
    fetchAccounts();
    showToast.success(t('instagram.success'));
  };

  const handleEditAccount = (account: SocialMediaAccount) => {
    setSelectedAccount(account);
    setInstagramModalOpen(true);
  };

  const instagramAccount = accounts.find(acc => acc.platform === 'INSTAGRAM');

  const formatLastSynced = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return t('common.justNow') || 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {t('nav.socialMedia') || 'Social Media'}
              </h1>
              <p className="text-gray-600">
                {t('socialMedia.subtitle') || 'Connect and manage your social media accounts'}
              </p>
            </motion.div>

            {/* Only show for influencers */}
            {user?.role !== 'INFLUENCER' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 text-center"
              >
                <p className="text-yellow-800 font-semibold">
                  {t('socialMedia.influencerOnly') || 'Social media connections are only available for influencer accounts'}
                </p>
              </motion.div>
            )}

            {user?.role === 'INFLUENCER' && (
              <div className="space-y-6">
                {/* Instagram Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl shadow-soft border-2 border-gray-200 overflow-hidden hover:shadow-large transition-shadow"
                >
                  <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 p-6">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                          <FaInstagram className="text-4xl" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">Instagram</h2>
                          <p className="text-white/80 text-sm">
                            {t('socialMedia.instagram.description') || 'Connect your Instagram to showcase your influence'}
                          </p>
                        </div>
                      </div>
                      {instagramAccount && (
                        <div className="bg-green-400 text-green-900 px-4 py-2 rounded-full flex items-center gap-2 font-bold text-sm">
                          <FaCheck />
                          {t('common.connected')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-500 mt-4">{t('common.loading')}</p>
                      </div>
                    ) : instagramAccount ? (
                      /* Connected Account Display */
                      <div className="space-y-6">
                        {/* Profile Header */}
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                          <img
                            src={instagramAccount.profilePicture || '/default-avatar.png'}
                            alt={instagramAccount.displayName}
                            className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-gray-900">
                                {instagramAccount.displayName}
                              </h3>
                              {instagramAccount.metadata?.isVerified && (
                                <FaCheck className="text-blue-500 bg-white rounded-full p-1 text-lg" />
                              )}
                            </div>
                            <p className="text-purple-600 font-semibold">@{instagramAccount.username}</p>
                            {instagramAccount.metadata?.bio && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {instagramAccount.metadata.bio}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-purple-600">
                              {instagramAccount.followersCount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-600 font-semibold mt-1">
                              {t('instagram.stats.followers')}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-pink-600">
                              {instagramAccount.metadata?.postsCount?.toLocaleString() || 0}
                            </p>
                            <p className="text-xs text-gray-600 font-semibold mt-1">
                              {t('instagram.stats.posts')}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-indigo-600">
                              {instagramAccount.metadata?.engagementRate?.toFixed(2)}%
                            </p>
                            <p className="text-xs text-gray-600 font-semibold mt-1">
                              {t('instagram.stats.engagement')}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-purple-600">
                              {instagramAccount.metadata?.averageLikes?.toLocaleString() || 0}
                            </p>
                            <p className="text-xs text-gray-600 font-semibold mt-1">
                              {t('instagram.stats.avgLikes')}
                            </p>
                          </div>
                        </div>

                        {/* Last Synced Info */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                          <div className="flex items-center gap-3 text-gray-600">
                            <FaClock className="text-lg" />
                            <div>
                              <p className="text-sm font-semibold">
                                {t('socialMedia.lastSynced') || 'Last Updated'}
                              </p>
                              <p className="text-xs">
                                {formatLastSynced(instagramAccount.lastSynced)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEditAccount(instagramAccount)}
                            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                          >
                            {t('common.manage') || 'Manage'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Not Connected State */
                      <div className="text-center py-12">
                        <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaInstagram className="text-4xl text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {t('socialMedia.instagram.notConnected') || 'Instagram Not Connected'}
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          {t('socialMedia.instagram.notConnectedDesc') || 'Connect your Instagram account to display your follower count, engagement rate, and recent posts'}
                        </p>
                        <button
                          onClick={() => {
                            setSelectedAccount(null);
                            setInstagramModalOpen(true);
                          }}
                          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-xl font-bold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                        >
                          <FaPlus />
                          {t('socialMedia.instagram.connect') || 'Connect Instagram'}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Coming Soon Card - TikTok */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {/* TikTok - Coming Soon */}
                  <div className="bg-white rounded-3xl shadow-soft border-2 border-gray-200 overflow-hidden opacity-70 max-w-2xl mx-auto">
                    <div className="bg-gradient-to-br from-black to-teal-500 p-6">
                      <div className="flex items-center gap-4 text-white">
                        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">TikTok</h2>
                          <p className="text-white/80 text-sm">{t('common.comingSoon') || 'Coming Soon'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 text-sm text-center">
                      {t('socialMedia.tiktok.comingSoonDesc') || 'TikTok integration will be available soon. Stay tuned!'}
                    </p>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </main>

        <BottomNav />
      </div>

      {/* Instagram Connect Modal */}
      <InstagramConnect
        isOpen={instagramModalOpen}
        onClose={() => {
          setInstagramModalOpen(false);
          setSelectedAccount(null);
        }}
        onSuccess={handleConnectSuccess}
        existingAccount={selectedAccount}
      />
    </div>
  );
}
