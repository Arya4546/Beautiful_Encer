import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInstagram, FaTimes, FaSpinner, FaCheck, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import axiosInstance from '../lib/axios';
import { API_ENDPOINTS } from '../config/api.config';
import { useTranslation } from 'react-i18next';
import { getProxiedImageUrl } from '../utils/imageProxy';

interface InstagramConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  existingAccount?: InstagramAccount | null;
}

interface InstagramAccount {
  id: string;
  username: string;
  displayName: string;
  followersCount: number;
  profilePicture: string;
  engagementRate: number;
  isVerified: boolean;
  metadata?: {
    bio?: string;
    followingCount?: number;
    postsCount?: number;
    averageLikes?: number;
    averageComments?: number;
    recentPosts?: InstagramPost[];
  };
}

interface InstagramPost {
  id: string;
  type: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string;
  url: string;
  displayUrl: string;
}

export default function InstagramConnect({ isOpen, onClose, onSuccess, existingAccount }: InstagramConnectProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accountData, setAccountData] = useState<InstagramAccount | null>(existingAccount || null);
  const [syncing, setSyncing] = useState(false);

  const handleConnect = async () => {
    // Validation
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError(t('instagram.errors.usernameRequired') || 'Instagram username is required');
      return;
    }

    // Validate username format (alphanumeric, underscores, dots only)
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      setError(t('instagram.errors.invalidUsername') || 'Username can only contain letters, numbers, underscores, and dots');
      return;
    }

    if (trimmedUsername.length < 1 || trimmedUsername.length > 30) {
      setError(t('instagram.errors.usernameLengthInvalid') || 'Username must be between 1 and 30 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.SOCIAL_MEDIA.INSTAGRAM_CONNECT, {
        username: trimmedUsername,
      });

      if (!response.data || !response.data.account) {
        throw new Error('Invalid response from server');
      }

      setSuccess(true);
      setAccountData(response.data.account);
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Error connecting Instagram:', err);
      
      let errorMessage = t('instagram.errors.connectionFailed') || 'Failed to connect Instagram account';
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        // Timeout error
        errorMessage = 'Connection timeout. Instagram scraping takes time. Please try again or the account may be processing in the background.';
      } else if (err.response) {
        // Server responded with error
        switch (err.response.status) {
          case 400:
            errorMessage = err.response.data?.message || t('instagram.errors.invalidRequest') || 'Invalid request. Please check the username';
            break;
          case 404:
            errorMessage = t('instagram.errors.accountNotFound') || 'Instagram account not found. Please verify the username';
            break;
          case 429:
            errorMessage = t('instagram.errors.rateLimitExceeded') || 'Too many requests. Please try again later';
            break;
          case 500:
            errorMessage = t('instagram.errors.serverError') || 'Server error. Please try again later';
            break;
          default:
            errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        // Request made but no response
        errorMessage = t('instagram.errors.networkError') || 'Network error. Please check your connection';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!accountData?.id) {
      setError(t('instagram.errors.noAccountToSync') || 'No account to sync');
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.SOCIAL_MEDIA.INSTAGRAM_SYNC, {
        accountId: accountData.id,
      });

      if (!response.data || !response.data.account) {
        throw new Error('Invalid response from server');
      }

      setAccountData(response.data.account);
      setSuccess(true);
      
      if (onSuccess) onSuccess();
      
      setTimeout(() => {
        setSuccess(false);
      }, 2000);

    } catch (err: any) {
      console.error('Error syncing Instagram:', err);
      
      let errorMessage = t('instagram.errors.syncFailed') || 'Failed to sync Instagram data';
      
      if (err.response) {
        switch (err.response.status) {
          case 404:
            errorMessage = t('instagram.errors.accountNotFoundSync') || 'Account not found. Please reconnect';
            break;
          case 429:
            errorMessage = t('instagram.errors.syncRateLimitExceeded') || 'Sync limit exceeded. Please try again in a few minutes';
            break;
          case 500:
            errorMessage = t('instagram.errors.syncServerError') || 'Server error during sync. Please try again later';
            break;
          default:
            errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = t('instagram.errors.syncNetworkError') || 'Network error during sync. Please check your connection';
      }
      
      setError(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!accountData?.id) {
      setError(t('instagram.errors.noAccountToDisconnect') || 'No account to disconnect');
      return;
    }

    const confirmMessage = t('instagram.confirmDisconnect') || 'Are you sure you want to disconnect your Instagram account? This will remove all synced data.';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axiosInstance.delete(API_ENDPOINTS.SOCIAL_MEDIA.INSTAGRAM_DISCONNECT(accountData.id));
      
      setAccountData(null);
      setUsername('');
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 500);

    } catch (err: any) {
      console.error('Error disconnecting Instagram:', err);
      
      let errorMessage = t('instagram.errors.disconnectFailed') || 'Failed to disconnect Instagram account';
      
      if (err.response) {
        switch (err.response.status) {
          case 404:
            errorMessage = t('instagram.errors.accountNotFoundDisconnect') || 'Account not found';
            // Still close modal since account doesn't exist
            setTimeout(() => {
              if (onSuccess) onSuccess();
              onClose();
            }, 1000);
            break;
          case 500:
            errorMessage = t('instagram.errors.disconnectServerError') || 'Server error during disconnect. Please try again';
            break;
          default:
            errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = t('instagram.errors.disconnectNetworkError') || 'Network error. Please check your connection';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl shadow-large max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-white p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <FaInstagram className="text-3xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {accountData ? t('instagram.title.connected') : t('instagram.title.connect')}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {accountData ? t('instagram.subtitle.manage') : t('instagram.subtitle.enterUsername')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3"
                >
                  <FaExclamationTriangle className="text-xl mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{t('instagram.error')}</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3"
                >
                  <FaCheck className="text-xl" />
                  <p className="font-semibold">{t('instagram.success')}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {!accountData ? (
              /* Connect Form */
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('instagram.form.usernameLabel')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                      placeholder={t('instagram.form.usernamePlaceholder')}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                      disabled={loading}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleConnect();
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t('instagram.form.usernameHint')}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FaInstagram className="text-blue-500 text-xl mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">{t('instagram.info.title')}</p>
                      <ul className="space-y-1 text-xs">
                        <li>• {t('instagram.info.point1')}</li>
                        <li>• {t('instagram.info.point2')}</li>
                        <li>• {t('instagram.info.point3')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {loading && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                    <p className="font-semibold mb-1">⏱️ Please wait...</p>
                    <p className="text-xs">Fetching Instagram data can take 30-90 seconds. Please don't close this window.</p>
                  </div>
                )}

                <button
                  onClick={handleConnect}
                  disabled={loading || !username.trim()}
                  className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin text-xl" />
                      {t('instagram.buttons.connecting')}
                    </>
                  ) : (
                    <>
                      <FaInstagram className="text-xl" />
                      {t('instagram.buttons.connect')}
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Connected Account Display */
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                  <img
                    src={getProxiedImageUrl(accountData.profilePicture)}
                    alt={accountData.displayName}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-avatar.png';
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900">{accountData.displayName}</h3>
                      {accountData.isVerified && (
                        <FaCheck className="text-blue-500 bg-white rounded-full p-1 text-lg" />
                      )}
                    </div>
                    <p className="text-purple-600 font-semibold">@{accountData.username}</p>
                    <p className="text-sm text-gray-600 mt-1">{accountData.metadata?.bio}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {accountData.followersCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 font-semibold mt-1">{t('instagram.stats.followers')}</p>
                  </div>
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-pink-600">
                      {accountData.metadata?.postsCount?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-gray-600 font-semibold mt-1">{t('instagram.stats.posts')}</p>
                  </div>
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-600">
                      {accountData.engagementRate.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-600 font-semibold mt-1">{t('instagram.stats.engagement')}</p>
                  </div>
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {accountData.metadata?.averageLikes?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-gray-600 font-semibold mt-1">{t('instagram.stats.avgLikes')}</p>
                  </div>
                </div>

                {/* Recent Posts */}
                {accountData.metadata?.recentPosts && accountData.metadata.recentPosts.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3">{t('instagram.recentPosts')}</h4>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {accountData.metadata.recentPosts.slice(0, 8).map((post) => (
                        <a
                          key={post.id}
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity group relative"
                        >
                          {/* Use proxy + fallback to ensure thumbnails render reliably */}
                          <img
                            src={getProxiedImageUrl(post.displayUrl)}
                            alt={t('instagram.alt.post', 'Instagram post')}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/cute-placeholder.svg';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                            <span>❤️ {post.likesCount.toLocaleString()}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {syncing ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        {t('instagram.buttons.syncing')}
                      </>
                    ) : (
                      <>
                        <FaSync />
                        {t('instagram.buttons.sync')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="px-6 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('instagram.buttons.disconnect')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
