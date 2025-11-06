import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTwitter, FaTimes, FaSpinner, FaCheck, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import axiosInstance from '../lib/axios';
import { API_ENDPOINTS } from '../config/api.config';
import { useTranslation } from 'react-i18next';
import { showToast } from '../utils/toast';

interface TwitterConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  existingAccount?: TwitterAccount | null;
}

interface TwitterAccount {
  id: string;
  platformUsername: string;
  displayName: string;
  followersCount: number;
  profilePicture: string;
  engagementRate: number;
  isVerified: boolean;
  postsCount: number;
  metadata?: {
    bio?: string;
    isVerified?: boolean;
    bannerUrl?: string;
    location?: string;
    website?: string;
    joinedDate?: string;
    averageLikes?: number;
    averageRetweets?: number;
    averageReplies?: number;
    topHashtags?: string[];
    recentTweets?: TwitterTweet[];
  };
}

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

export default function TwitterConnect({ isOpen, onClose, onSuccess, existingAccount }: TwitterConnectProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accountData, setAccountData] = useState<TwitterAccount | null>(existingAccount || null);
  const [syncing, setSyncing] = useState(false);

  const handleConnect = async () => {
    // Validation
    const trimmedUsername = username.trim().replace('@', '');
    if (!trimmedUsername) {
      setError(t('twitter.errors.usernameRequired') || 'Twitter username is required');
      return;
    }

    // Validate username format (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      setError(t('twitter.errors.invalidUsername') || 'Username can only contain letters, numbers, and underscores');
      return;
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 15) {
      setError(t('twitter.errors.usernameLengthInvalid') || 'Username must be between 3 and 15 characters');
      return;
    }

    setLoading(true);
    setError(null);

    // Show loading toast
    const loadingToast = showToast.loading(t('twitter.scraping') || 'Scraping Twitter data... This may take 1-2 minutes.');

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.SOCIAL_MEDIA.TWITTER_CONNECT, {
        username: trimmedUsername,
      });

      // Dismiss loading toast
      showToast.dismiss(loadingToast);

      if (!response.data || !response.data.account) {
        throw new Error('Invalid response from server');
      }

      setSuccess(true);
      setAccountData(response.data.account);
      showToast.success(t('twitter.connected', 'Twitter account connected successfully!'));
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      // Dismiss loading toast on error
      showToast.dismiss(loadingToast);
      
      console.error('Twitter connection error:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to connect Twitter account';
      
      if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        setError(t('twitter.errors.accountNotFound') || 'Twitter account not found. Please check the username.');
      } else if (errorMessage.includes('private')) {
        setError(t('twitter.errors.accountPrivate') || 'This Twitter account is private and cannot be connected.');
      } else if (errorMessage.includes('storage') || errorMessage.includes('space')) {
        setError(t('twitter.errors.storageFull') || 'Account connected but tweets could not be stored. Please contact support.');
        // Still consider it a partial success - show account data if available
        if (err.response?.data?.account) {
          setAccountData(err.response.data.account);
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!accountData) return;

    setSyncing(true);
    setError(null);

    // Show loading toast
    const loadingToast = showToast.loading(t('twitter.syncing') || 'Syncing Twitter data... This may take 1-2 minutes.');

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.SOCIAL_MEDIA.TWITTER_SYNC(accountData.id));

      // Dismiss loading toast
      showToast.dismiss(loadingToast);

      if (response.data && response.data.account) {
        setAccountData(response.data.account);
      }

      showToast.success(t('twitter.synced', 'Twitter data synchronized successfully!'));
      
      if (onSuccess) onSuccess();

    } catch (err: any) {
      // Dismiss loading toast on error
      showToast.dismiss(loadingToast);
      
      console.error('Twitter sync error:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to sync Twitter data';
      
      if (errorMessage.includes('up to date')) {
        showToast.success(t('twitter.alreadySynced') || 'Twitter data is already up to date');
      } else if (errorMessage.includes('storage') || errorMessage.includes('space')) {
        setError(t('twitter.errors.storageFull') || 'Data synced but tweets could not be stored. Please contact support.');
      } else {
        setError(errorMessage);
        showToast.error(t('twitter.syncFailed') || 'Failed to sync Twitter data');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!accountData) return;
    
    if (!confirm(t('twitter.confirmDisconnect') || 'Are you sure you want to disconnect this Twitter account?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axiosInstance.delete(API_ENDPOINTS.SOCIAL_MEDIA.TWITTER_DISCONNECT(accountData.id));

      showToast.success(t('twitter.disconnected', 'Twitter account disconnected successfully!'));
      
      setAccountData(null);
      setUsername('');
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);

    } catch (err: any) {
      console.error('Twitter disconnect error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to disconnect Twitter account');
      showToast.error(t('twitter.disconnectFailed') || 'Failed to disconnect Twitter account');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (error) setError(null);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center">
                <FaTwitter className="text-white text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {accountData 
                  ? t('twitter.manageAccount', 'Manage Twitter Account')
                  : t('twitter.connectAccount', 'Connect Twitter Account')
                }
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading || syncing}
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {accountData ? (
              // Connected Account View
              <div className="space-y-4">
                {/* Profile Card */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <img
                    src={accountData.profilePicture || '/default-avatar.png'}
                    alt={accountData.displayName}
                    className="w-16 h-16 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/default-avatar.png';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {accountData.displayName}
                      </h3>
                      {accountData.isVerified && (
                        <FaCheck className="text-blue-400 text-sm flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">@{accountData.platformUsername}</p>
                    {accountData.metadata?.bio && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {accountData.metadata.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">{t('twitter.followers', 'Followers')}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatNumber(accountData.followersCount)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">{t('twitter.tweets', 'Tweets')}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatNumber(accountData.postsCount)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">{t('twitter.engagement', 'Engagement')}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {accountData.engagementRate.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Engagement Metrics */}
                {accountData.metadata && (
                  <div className="grid grid-cols-3 gap-3">
                    {accountData.metadata.averageLikes !== undefined && (
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 mb-1">{t('twitter.avgLikes', 'Avg Likes')}</p>
                        <p className="text-sm font-semibold text-blue-900">
                          {formatNumber(accountData.metadata.averageLikes)}
                        </p>
                      </div>
                    )}
                    {accountData.metadata.averageRetweets !== undefined && (
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600 mb-1">{t('twitter.avgRetweets', 'Avg Retweets')}</p>
                        <p className="text-sm font-semibold text-green-900">
                          {formatNumber(accountData.metadata.averageRetweets)}
                        </p>
                      </div>
                    )}
                    {accountData.metadata.averageReplies !== undefined && (
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs text-purple-600 mb-1">{t('twitter.avgReplies', 'Avg Replies')}</p>
                        <p className="text-sm font-semibold text-purple-900">
                          {formatNumber(accountData.metadata.averageReplies)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSync}
                    disabled={syncing || loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-400 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {syncing ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>{t('twitter.syncing', 'Syncing...')}</span>
                      </>
                    ) : (
                      <>
                        <FaSync />
                        <span>{t('twitter.syncData', 'Sync Data')}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={loading || syncing}
                    className="px-4 py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('twitter.disconnect', 'Disconnect')}
                  </button>
                </div>
              </div>
            ) : (
              // Connect New Account View
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {t('twitter.connectDescription', 'Enter your Twitter/X username to connect your account and display your tweets, analytics, and engagement metrics.')}
                </p>

                {/* Username Input */}
                <div>
                  <label htmlFor="twitter-username" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('twitter.usernameLabel', 'Twitter Username')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <input
                      id="twitter-username"
                      type="text"
                      value={username}
                      onChange={handleInputChange}
                      placeholder={t('twitter.usernamePlaceholder', 'username')}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('twitter.usernameHint', 'Enter your Twitter/X username (without @)')}
                  </p>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Success Display */}
                {success && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <FaCheck className="text-green-500" />
                    <p className="text-sm text-green-700">
                      {t('twitter.connectSuccess', 'Twitter account connected successfully!')}
                    </p>
                  </div>
                )}

                {/* Connect Button */}
                <button
                  onClick={handleConnect}
                  disabled={loading || success}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-400 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>{t('twitter.connecting', 'Connecting...')}</span>
                    </>
                  ) : success ? (
                    <>
                      <FaCheck />
                      <span>{t('twitter.connected', 'Connected!')}</span>
                    </>
                  ) : (
                    <>
                      <FaTwitter />
                      <span>{t('twitter.connect', 'Connect Twitter')}</span>
                    </>
                  )}
                </button>

                {/* Info Note */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    {t('twitter.publicDataNote', 'We only access publicly available information from your Twitter/X profile. No login required.')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
