import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSpinner, FaCheck, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import axiosInstance from '../lib/axios';
import { API_ENDPOINTS } from '../config/api.config';
import { useTranslation } from 'react-i18next';
import { getProxiedImageUrl } from '../utils/imageProxy';
import { showToast } from '../utils/toast';
import { ImageWithFallback } from './ui/ImageWithFallback';
import { TikTokDataDisplay } from './TikTokDataDisplay.tsx';

interface TikTokConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  existingAccount?: TikTokAccount | null;
}

interface TikTokAccount {
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
    videosCount?: number;
    likesCount?: number;
    averageLikes?: number;
    averageComments?: number;
    averageShares?: number;
    averageViews?: number;
    recentVideos?: TikTokVideo[];
    topHashtags?: string[];
  };
}

interface TikTokVideo {
  id: string;
  videoUrl: string;
  coverUrl: string;
  description: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  timestamp: string;
}

export default function TikTokConnect({ isOpen, onClose, onSuccess, existingAccount }: TikTokConnectProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accountData, setAccountData] = useState<TikTokAccount | null>(existingAccount || null);
  const [syncing, setSyncing] = useState(false);

  const handleConnect = async () => {
    // Validation
    const trimmedUsername = username.trim().replace('@', '');
    if (!trimmedUsername) {
      setError(t('tiktok.errors.usernameRequired') || 'TikTok username is required');
      return;
    }

    // Validate username format (alphanumeric, underscores, dots only)
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      setError(t('tiktok.errors.invalidUsername') || 'Username can only contain letters, numbers, underscores, and dots');
      return;
    }

    if (trimmedUsername.length < 2 || trimmedUsername.length > 24) {
      setError(t('tiktok.errors.usernameLengthInvalid') || 'Username must be between 2 and 24 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.SOCIAL_MEDIA.TIKTOK_CONNECT, {
        username: trimmedUsername,
      });

      if (!response.data || !response.data.account) {
        throw new Error('Invalid response from server');
      }

      setSuccess(true);
      setAccountData(response.data.account);
      showToast.success(t('tiktok.connected', 'TikTok account connected successfully!'));
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Error connecting TikTok:', err);
      
      let errorMessage = t('tiktok.errors.connectionFailed') || 'Failed to connect TikTok account';
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        // Timeout error
        errorMessage = 'Connection timeout. TikTok scraping takes time. Please try again or the account may be processing in the background.';
      } else if (err.response) {
        // Server responded with error
        switch (err.response.status) {
          case 400:
            errorMessage = err.response.data?.message || t('tiktok.errors.invalidRequest') || 'Invalid request. Please check the username';
            break;
          case 404:
            errorMessage = t('tiktok.errors.accountNotFound') || 'TikTok account not found. Please verify the username';
            break;
          case 429:
            errorMessage = t('tiktok.errors.rateLimitExceeded') || 'Too many requests. Please try again later';
            break;
          case 500:
            errorMessage = t('tiktok.errors.serverError') || 'Server error. Please try again later';
            break;
          default:
            errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        // Request made but no response
        errorMessage = t('tiktok.errors.networkError') || 'Network error. Please check your connection';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!accountData?.id) {
      setError(t('tiktok.errors.noAccountToSync') || 'No account to sync');
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.SOCIAL_MEDIA.TIKTOK_SYNC, {
        accountId: accountData.id,
      });

      if (!response.data || !response.data.account) {
        throw new Error('Invalid response from server');
      }

      setAccountData(response.data.account);
      setSuccess(true);
      showToast.success(t('tiktok.synced', 'TikTok data synced successfully!'));
      
      if (onSuccess) onSuccess();
      
      setTimeout(() => {
        setSuccess(false);
      }, 2000);

    } catch (err: any) {
      console.error('Error syncing TikTok:', err);
      
      let errorMessage = t('tiktok.errors.syncFailed') || 'Failed to sync TikTok data';
      
      if (err.response) {
        switch (err.response.status) {
          case 404:
            errorMessage = t('tiktok.errors.accountNotFoundSync') || 'Account not found. Please reconnect';
            break;
          case 429:
            errorMessage = t('tiktok.errors.syncRateLimitExceeded') || 'Sync limit exceeded. Please try again in a few minutes';
            break;
          case 500:
            errorMessage = t('tiktok.errors.syncServerError') || 'Server error during sync. Please try again later';
            break;
          default:
            errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = t('tiktok.errors.syncNetworkError') || 'Network error during sync. Please check your connection';
      }
      
      setError(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!accountData?.id) {
      setError(t('tiktok.errors.noAccountToDisconnect') || 'No account to disconnect');
      return;
    }

    const confirmMessage = t('tiktok.confirmDisconnect') || 'Are you sure you want to disconnect your TikTok account? This will remove all synced data.';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axiosInstance.delete(API_ENDPOINTS.SOCIAL_MEDIA.TIKTOK_DISCONNECT(accountData.id));
      
      setAccountData(null);
      setUsername('');
      showToast.success(t('tiktok.disconnected', 'TikTok account disconnected successfully'));
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 500);

    } catch (err: any) {
      console.error('Error disconnecting TikTok:', err);
      
      let errorMessage = t('tiktok.errors.disconnectFailed') || 'Failed to disconnect TikTok account';
      
      if (err.response) {
        switch (err.response.status) {
          case 404:
            errorMessage = t('tiktok.errors.accountNotFoundDisconnect') || 'Account not found';
            // Still close modal since account doesn't exist
            setTimeout(() => {
              if (onSuccess) onSuccess();
              onClose();
            }, 1000);
            break;
          case 500:
            errorMessage = t('tiktok.errors.disconnectServerError') || 'Server error during disconnect. Please try again';
            break;
          default:
            errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = t('tiktok.errors.disconnectNetworkError') || 'Network error. Please check your connection';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // TikTok icon SVG
  const TikTokIcon = () => (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  );

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
          <div className="sticky top-0 z-10 bg-gradient-to-br from-black via-gray-900 to-teal-500 text-white p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <TikTokIcon />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {accountData ? t('tiktok.title.connected') : t('tiktok.title.connect')}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {accountData ? t('tiktok.subtitle.manage') : t('tiktok.subtitle.enterUsername')}
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
                    <p className="font-semibold">{t('tiktok.error')}</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Connect Form */}
            <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('tiktok.form.usernameLabel')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                      placeholder={t('tiktok.form.usernamePlaceholder')}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      disabled={loading}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleConnect();
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t('tiktok.form.usernameHint')}
                  </p>
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <TikTokIcon />
                    <div className="text-sm text-teal-800">
                      <p className="font-semibold mb-1">{t('tiktok.info.title')}</p>
                      <ul className="space-y-1 text-xs">
                        <li>• {t('tiktok.info.point1')}</li>
                        <li>• {t('tiktok.info.point2')}</li>
                        <li>• {t('tiktok.info.point3')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {loading && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                    <p className="font-semibold mb-1">⏱️ Please wait...</p>
                    <p className="text-xs">Fetching TikTok data can take 30-90 seconds. Please don't close this window.</p>
                  </div>
                )}

                <button
                  onClick={handleConnect}
                  disabled={loading || !username.trim()}
                  className="w-full bg-gradient-to-r from-black via-gray-900 to-teal-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin text-xl" />
                      {t('tiktok.buttons.connecting')}
                    </>
                  ) : (
                    <>
                      <TikTokIcon />
                      {t('tiktok.buttons.connect')}
                    </>
                  )}
                </button>
              </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
