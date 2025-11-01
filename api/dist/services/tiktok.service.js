import axios from 'axios';
import { encrypt, decrypt } from '../utils/encryption.util.js';
import logger from '../utils/logger.util.js';
class TikTokService {
    constructor() {
        this.baseUrl = 'https://open.tiktokapis.com';
        this.authUrl = 'https://www.tiktok.com/v2/auth/authorize';
        this.clientKey = process.env.TIKTOK_CLIENT_KEY || '';
        this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';
        this.redirectUri = process.env.TIKTOK_REDIRECT_URI || '';
        if (!this.clientKey || !this.clientSecret || !this.redirectUri) {
            logger.warn('[TikTokService] Missing TikTok API credentials in environment variables');
        }
    }
    /**
     * Generate TikTok OAuth authorization URL
     * @param state - Optional state parameter for CSRF protection
     * @returns Authorization URL to redirect user to
     */
    getAuthorizationUrl(state) {
        const csrfState = state || this.generateRandomState();
        const scopes = ['user.info.basic', 'video.list', 'user.info.stats'];
        const params = new URLSearchParams({
            client_key: this.clientKey,
            scope: scopes.join(','),
            response_type: 'code',
            redirect_uri: this.redirectUri,
            state: csrfState,
        });
        return `${this.authUrl}?${params.toString()}`;
    }
    /**
     * Generate random state for CSRF protection
     * @returns Random state string
     */
    generateRandomState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    /**
     * Exchange authorization code for access token
     * @param code - Authorization code from TikTok OAuth callback
     * @returns Access token and refresh token
     */
    async exchangeCodeForToken(code) {
        try {
            const response = await axios.post(`${this.baseUrl}/v2/oauth/token/`, {
                client_key: this.clientKey,
                client_secret: this.clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: this.redirectUri,
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            if (response.data.error) {
                throw new Error(response.data.error_description || 'TikTok authentication failed');
            }
            return response.data.data;
        }
        catch (error) {
            logger.error('[TikTokService] Error exchanging code for token:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with TikTok');
        }
    }
    /**
     * Refresh access token using refresh token
     * @param refreshToken - Current refresh token
     * @returns New access token and refresh token
     */
    async refreshAccessToken(refreshToken) {
        try {
            const response = await axios.post(`${this.baseUrl}/v2/oauth/token/`, {
                client_key: this.clientKey,
                client_secret: this.clientSecret,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            if (response.data.error) {
                throw new Error(response.data.error_description || 'Token refresh failed');
            }
            return response.data.data;
        }
        catch (error) {
            logger.error('[TikTokService] Error refreshing token:', error.response?.data || error.message);
            throw new Error('Failed to refresh TikTok access token');
        }
    }
    /**
     * Revoke access token (disconnect account)
     * @param accessToken - Access token to revoke
     */
    async revokeToken(accessToken) {
        try {
            await axios.post(`${this.baseUrl}/v2/oauth/revoke/`, {
                client_key: this.clientKey,
                client_secret: this.clientSecret,
                token: accessToken,
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
        }
        catch (error) {
            logger.error('[TikTokService] Error revoking token:', error.response?.data || error.message);
            throw new Error('Failed to revoke TikTok access token');
        }
    }
    /**
     * Get user profile information
     * @param accessToken - TikTok access token
     * @returns User profile data
     */
    async getUserProfile(accessToken) {
        try {
            const fields = [
                'open_id',
                'union_id',
                'avatar_url',
                'avatar_url_100',
                'avatar_large_url',
                'display_name',
                'bio_description',
                'profile_deep_link',
                'is_verified',
                'follower_count',
                'following_count',
                'likes_count',
                'video_count',
            ];
            const response = await axios.get(`${this.baseUrl}/v2/user/info/`, {
                params: {
                    fields: fields.join(','),
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.error) {
                throw new Error(response.data.error.message || 'Failed to fetch profile');
            }
            return response.data.data.user;
        }
        catch (error) {
            logger.error('[TikTokService] Error fetching user profile:', error.response?.data || error.message);
            throw new Error('Failed to fetch TikTok profile');
        }
    }
    /**
     * Get user insights (followers, engagement, etc.)
     * @param accessToken - TikTok access token
     * @returns User insights
     */
    async getUserInsights(accessToken) {
        try {
            const profile = await this.getUserProfile(accessToken);
            const insights = {
                followersCount: profile.follower_count || 0,
                followingCount: profile.following_count || 0,
                likesCount: profile.likes_count || 0,
                videoCount: profile.video_count || 0,
            };
            return insights;
        }
        catch (error) {
            logger.error('[TikTokService] Error fetching insights:', error.response?.data || error.message);
            throw new Error('Failed to fetch TikTok insights');
        }
    }
    /**
     * Get user's videos
     * @param accessToken - TikTok access token
     * @param maxCount - Maximum number of videos to fetch (default: 20)
     * @returns Array of videos
     */
    async getUserVideos(accessToken, maxCount = 20) {
        try {
            const fields = [
                'id',
                'create_time',
                'cover_image_url',
                'share_url',
                'video_description',
                'duration',
                'height',
                'width',
                'title',
                'embed_html',
                'embed_link',
                'like_count',
                'comment_count',
                'share_count',
                'view_count',
            ];
            const response = await axios.post(`${this.baseUrl}/v2/video/list/`, {
                max_count: maxCount,
            }, {
                params: {
                    fields: fields.join(','),
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.error) {
                throw new Error(response.data.error.message || 'Failed to fetch videos');
            }
            return response.data.data.videos || [];
        }
        catch (error) {
            logger.error('[TikTokService] Error fetching user videos:', error.response?.data || error.message);
            throw new Error('Failed to fetch TikTok videos');
        }
    }
    /**
     * Calculate engagement rate from videos
     * @param videos - Array of TikTok videos
     * @param followersCount - Number of followers
     * @returns Engagement rate as percentage
     */
    calculateEngagementRate(videos, followersCount) {
        if (!videos.length || !followersCount)
            return 0;
        const totalEngagement = videos.reduce((sum, video) => {
            const likes = video.like_count || 0;
            const comments = video.comment_count || 0;
            const shares = video.share_count || 0;
            return sum + likes + comments + shares;
        }, 0);
        const avgEngagement = totalEngagement / videos.length;
        const engagementRate = (avgEngagement / followersCount) * 100;
        return parseFloat(engagementRate.toFixed(2));
    }
    /**
     * Encrypt access token for secure storage
     * @param token - Plain access token
     * @returns Encrypted token
     */
    encryptToken(token) {
        return encrypt(token);
    }
    /**
     * Decrypt access token for API calls
     * @param encryptedToken - Encrypted access token
     * @returns Plain access token
     */
    decryptToken(encryptedToken) {
        return decrypt(encryptedToken);
    }
}
export default new TikTokService();
