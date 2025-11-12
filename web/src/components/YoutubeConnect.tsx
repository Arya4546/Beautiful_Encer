import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaYoutube, FaTimes, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import axiosInstance from '../lib/axios';
import { API_ENDPOINTS } from '../config/api.config';
import { useTranslation } from 'react-i18next';
import { showToast } from '../utils/toast';

interface YoutubeConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  existingAccount?: YoutubeAccount | null;
}

interface YoutubeAccount {
  id: string;
  platformUsername: string;
  displayName: string;
  followersCount: number;
  profilePicture: string;
  engagementRate: number;
  isVerified: boolean;
  postsCount: number;
  metadata?: {
    description?: string;
    viewCount?: number;
    subscriberCount?: number;
    videoCount?: number;
    country?: string;
    customUrl?: string;
    averageViews?: number;
    averageLikes?: number;
    averageComments?: number;
    recentVideos?: YoutubeVideo[];
  };
}

interface YoutubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
}

export default function YoutubeConnect({ isOpen, onClose, onSuccess, existingAccount }: YoutubeConnectProps) {
  const { t } = useTranslation();
  const [channelHandle, setChannelHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accountData, setAccountData] = useState<YoutubeAccount | null>(existingAccount || null);

  const handleConnect = async () => {
    // Validation
    const trimmedHandle = channelHandle.trim().replace('@', '');
    if (!trimmedHandle) {
      setError(t('youtube.errors.handleRequired') || 'YouTube channel handle is required');
      return;
    }

    // Validate handle format (alphanumeric, underscores, hyphens only)
    const handleRegex = /^[a-zA-Z0-9._-]+$/;
    if (!handleRegex.test(trimmedHandle)) {
      setError(t('youtube.errors.invalidHandle') || 'Channel handle can only contain letters, numbers, underscores, dots, and hyphens');
      return;
    }

    if (trimmedHandle.length < 3 || trimmedHandle.length > 30) {
      setError(t('youtube.errors.handleLengthInvalid') || 'Channel handle must be between 3 and 30 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.SOCIAL_MEDIA.YOUTUBE_CONNECT, {
        channelHandle: trimmedHandle,
      });

      // Backend returns: { success: true, message: '...', data: { account, posts } }
      // Or could return: { account, posts } directly
      const accountData = response.data?.data?.account || response.data?.account || response.data?.data;
      
      if (!accountData) {
        console.error('Invalid response structure:', response.data);
        throw new Error('Invalid response from server - no account data received');
      }

      setSuccess(true);
      setAccountData(accountData);
      showToast.success(t('youtube.connected') || 'YouTube channel connected successfully!');
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        // Reset state for next use
        setChannelHandle('');
        setError(null);
        setSuccess(false);
      }, 1500);

    } catch (err: any) {
      console.error('Error connecting YouTube:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      let errorMessage = t('youtube.errors.connectionFailed') || 'Failed to connect YouTube channel';
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        // Timeout error - but connection might still succeed
        errorMessage = t('youtube.errors.connectionTimeout') || 'Connection is taking longer than expected. Your channel might still be connecting in the background. Please refresh the page in a moment.';
        showToast.error(errorMessage);
        
        // Still try to refresh after timeout in case it succeeded
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 2000);
        
      } else if (err.response) {
        // Server responded with error
        switch (err.response.status) {
          case 400:
            errorMessage = err.response.data?.message || t('youtube.errors.invalidRequest') || 'Invalid request. Please check the channel handle';
            break;
          case 404:
            errorMessage = t('youtube.errors.channelNotFound') || 'YouTube channel not found. Please verify the handle is correct (e.g., @MrSpike)';
            break;
          case 409:
            errorMessage = t('youtube.errors.alreadyConnected') || 'This YouTube channel is already connected to your account';
            // Channel already connected is not really an error - refresh the list
            showToast.success(errorMessage);
            setTimeout(() => {
              if (onSuccess) onSuccess();
              onClose();
            }, 1500);
            return; // Don't set error state
          case 429:
            errorMessage = t('youtube.errors.rateLimitExceeded') || 'Too many requests. Please try again in a few minutes';
            break;
          case 500:
            errorMessage = t('youtube.errors.serverError') || 'Server error occurred. Please try again later';
            break;
          default:
            errorMessage = err.response.data?.message || errorMessage;
        }
        showToast.error(errorMessage);
      } else if (err.request) {
        // Request made but no response
        errorMessage = t('youtube.errors.networkError') || 'Network error. Please check your internet connection';
        showToast.error(errorMessage);
      } else {
        // Something else went wrong
        showToast.error(errorMessage);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!accountData?.id) {
      setError(t('youtube.errors.noAccountToDisconnect') || 'No account to disconnect');
      return;
    }

    const confirmMessage = t('youtube.confirmDisconnect') || 'Are you sure you want to disconnect your YouTube channel? This will remove all synced data.';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axiosInstance.delete(API_ENDPOINTS.SOCIAL_MEDIA.YOUTUBE_DISCONNECT(accountData.id));
      
      setAccountData(null);
      setChannelHandle('');
      showToast.success(t('youtube.disconnected', 'YouTube channel disconnected successfully'));
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 500);

    } catch (err: any) {
      console.error('Error disconnecting YouTube:', err);
      
      let errorMessage = t('youtube.errors.disconnectFailed') || 'Failed to disconnect YouTube channel';
      
      if (err.response) {
        switch (err.response.status) {
          case 404:
            errorMessage = t('youtube.errors.channelNotFoundDisconnect') || 'Channel not found';
            // Still close modal since channel doesn't exist
            setTimeout(() => {
              if (onSuccess) onSuccess();
              onClose();
            }, 1000);
            break;
          case 500:
            errorMessage = t('youtube.errors.disconnectServerError') || 'Server error during disconnect. Please try again';
            break;
          default:
            errorMessage = err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = t('youtube.errors.disconnectNetworkError') || 'Network error. Please check your connection';
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
          className="bg-white rounded-3xl shadow-large max-w-2xl w-full max-h-[90vh] mb-20 md:mb-0 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <FaYoutube className="text-3xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {accountData ? t('youtube.title.connected') : t('youtube.title.connect')}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {accountData ? t('youtube.subtitle.manage') : t('youtube.subtitle.enterHandle')}
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
                    <p className="font-semibold">{t('youtube.error')}</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-3"
                >
                  <FaCheck className="text-xl mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{t('youtube.success')}</p>
                    <p className="text-sm">{t('youtube.successMessage')}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Account Data Display */}
            {accountData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-6"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={accountData.profilePicture || '/default-avatar.png'}
                    alt={accountData.displayName}
                    className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-gray-900">{accountData.displayName}</h3>
                      {accountData.isVerified && (
                        <FaCheck className="text-red-500 bg-white rounded-full p-1 text-base" />
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3">@{accountData.platformUsername}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-white/80 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">{t('youtube.stats.subscribers')}</p>
                        <p className="text-xl font-bold text-gray-900">
                          {(accountData.followersCount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">{t('youtube.stats.videos')}</p>
                        <p className="text-xl font-bold text-gray-900">
                          {(accountData.postsCount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">{t('youtube.stats.engagement')}</p>
                        <p className="text-xl font-bold text-gray-900">
                          {(accountData.engagementRate || 0).toFixed(2)}%
                        </p>
                      </div>
                      {accountData.metadata?.viewCount && (
                        <div className="bg-white/80 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">{t('youtube.stats.views')}</p>
                          <p className="text-xl font-bold text-gray-900">
                            {(accountData.metadata.viewCount / 1000000).toFixed(1)}M
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6">
                  <button
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      <>
                        <FaTimes />
                        {t('youtube.buttons.disconnect')}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Connect Form */}
            {!accountData && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('youtube.form.handleLabel')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <input
                      type="text"
                      value={channelHandle}
                      onChange={(e) => setChannelHandle(e.target.value.replace('@', ''))}
                      placeholder={t('youtube.form.handlePlaceholder')}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      disabled={loading}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleConnect();
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t('youtube.form.handleHint')}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FaYoutube className="text-red-500 text-xl mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">{t('youtube.info.title')}</p>
                      <ul className="space-y-1 text-xs">
                        <li>• {t('youtube.info.point1')}</li>
                        <li>• {t('youtube.info.point2')}</li>
                        <li>• {t('youtube.info.point3')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {loading && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                    <p className="font-semibold mb-1">⏱️ Please wait...</p>
                    <p className="text-xs">Fetching YouTube data can take 30-90 seconds. Please don't close this window.</p>
                  </div>
                )}

                <button
                  onClick={handleConnect}
                  disabled={loading || !channelHandle.trim()}
                  className="w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin text-xl" />
                      {t('youtube.buttons.connecting')}
                    </>
                  ) : (
                    <>
                      <FaYoutube className="text-xl" />
                      {t('youtube.buttons.connect')}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
