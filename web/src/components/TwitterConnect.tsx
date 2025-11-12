import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSpinner, FaCheck, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6'; 
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
    const loadingToast = showToast.loading(t('twitter.scraping') || 'Fetching X/Twitter data... This may take 1-2 minutes.');

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.SOCIAL_MEDIA.TWITTER_CONNECT, {
        username: trimmedUsername,
      });

      // Dismiss loading toast
      showToast.dismiss(loadingToast);

      // Flexible response parsing (handle different response structures)
      const accountData = response.data?.data?.account || response.data?.account || response.data?.data;
      
      if (!accountData) {
        throw new Error('Invalid response from server');
      }

      setSuccess(true);
      setAccountData(accountData);
      showToast.success(t('twitter.connected', 'X/Twitter account connected successfully!'));
      
      // Reset state after short delay
      setTimeout(() => {
        setSuccess(false);
        setUsername('');
      }, 1500);
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      // Dismiss loading toast on error
      showToast.dismiss(loadingToast);
      
      console.error('X/Twitter connection error:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to connect X/Twitter account';
      const statusCode = err.response?.status;
      
      // Handle specific status codes
      if (statusCode === 409) {
        // Already connected - treat as success
        setSuccess(true);
        showToast.success(t('twitter.alreadyConnected') || 'X/Twitter account is already connected!');
        if (err.response?.data?.account) {
          setAccountData(err.response.data.account);
        }
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
        return;
      }
      
      if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        setError(t('twitter.errors.accountNotFound') || 'X/Twitter account not found. Please check the username.');
      } else if (errorMessage.includes('private')) {
        setError(t('twitter.errors.accountPrivate') || 'This X/Twitter account is private and cannot be connected.');
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
    const loadingToast = showToast.loading(t('twitter.syncing') || 'Syncing X/Twitter data... This may take 1-2 minutes.');

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.SOCIAL_MEDIA.TWITTER_SYNC(accountData.id));

      // Dismiss loading toast
      showToast.dismiss(loadingToast);

      if (response.data && response.data.account) {
        setAccountData(response.data.account);
      }

      showToast.success(t('twitter.synced', 'X/Twitter data synchronized successfully!'));
      
      if (onSuccess) onSuccess();

    } catch (err: any) {
      // Dismiss loading toast on error
      showToast.dismiss(loadingToast);
      
      console.error('Twitter sync error:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to sync Twitter data';
      
      if (errorMessage.includes('up to date')) {
        showToast.success(t('twitter.alreadySynced') || 'X/Twitter data is already up to date');
      } else if (errorMessage.includes('storage') || errorMessage.includes('space')) {
        setError(t('twitter.errors.storageFull') || 'Data synced but posts could not be stored. Please contact support.');
      } else {
        setError(errorMessage);
        showToast.error(t('twitter.syncFailed') || 'Failed to sync X/Twitter data');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!accountData) return;
    
    if (!confirm(t('twitter.confirmDisconnect') || 'Are you sure you want to disconnect this X/Twitter account?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axiosInstance.delete(API_ENDPOINTS.SOCIAL_MEDIA.TWITTER_DISCONNECT(accountData.id));

      showToast.success(t('twitter.disconnected', 'X/Twitter account disconnected successfully!'));
      
      setAccountData(null);
      setUsername('');
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);

    } catch (err: any) {
      console.error('X/Twitter disconnect error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to disconnect X/Twitter account');
      showToast.error(t('twitter.disconnectFailed') || 'Failed to disconnect X/Twitter account');
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
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                <FaXTwitter className="text-white text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {accountData 
                  ? t('twitter.manageAccount', 'Manage X Account')
                  : t('twitter.connectAccount', 'Connect X Account')
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
                        <FaCheck className="text-black text-sm flex-shrink-0" />
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
                    <p className="text-xs text-gray-600 mb-1">{t('twitter.tweets', 'Posts')}</p>
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
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">{t('twitter.avgLikes', 'Avg Likes')}</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatNumber(accountData.metadata.averageLikes)}
                        </p>
                      </div>
                    )}
                    {accountData.metadata.averageRetweets !== undefined && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">{t('twitter.avgReposts', 'Avg Reposts')}</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatNumber(accountData.metadata.averageRetweets)}
                        </p>
                      </div>
                    )}
                    {accountData.metadata.averageReplies !== undefined && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">{t('twitter.avgReplies', 'Avg Replies')}</p>
                        <p className="text-sm font-semibold text-gray-900">
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    {t('twitter.usernameLabel', 'X/Twitter Username')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <input
                      id="twitter-username"
                      type="text"
                      value={username}
                      onChange={handleInputChange}
                      placeholder={t('twitter.usernamePlaceholder', 'username')}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('twitter.usernameHint', 'Enter your X/Twitter username (without @)')}
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
                      {t('twitter.connectSuccess', 'X/Twitter account connected successfully!')}
                    </p>
                  </div>
                )}

                {/* Connect Button */}
                <button
                  onClick={handleConnect}
                  disabled={loading || success}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <FaXTwitter />
                      <span>{t('twitter.connect', 'Connect X')}</span>
                    </>
                  )}
                </button>

                {/* Info Note */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-600">
                    {t('twitter.publicDataNote', 'We only access publicly available information from your X/Twitter profile. No login required.')}
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
