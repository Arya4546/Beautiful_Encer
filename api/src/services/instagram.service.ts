import axios from 'axios';
import { encrypt, decrypt } from '../utils/encryption.util.js';

/**
 * Instagram Graph API Service
 * 
 * IMPORTANT: This implementation uses Instagram Basic Display API / Graph API
 * 
 * Setup Requirements:
 * 1. Create a Facebook App at https://developers.facebook.com/
 * 2. Add Instagram Basic Display or Instagram Graph API product
 * 3. Configure OAuth redirect URIs
 * 4. Set environment variables: INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_REDIRECT_URI
 * 
 * Flow:
 * 1. User clicks "Connect Instagram" -> Redirect to Instagram OAuth
 * 2. Instagram redirects back with authorization code
 * 3. Exchange code for access token
 * 4. Store encrypted token and fetch user data
 */

interface InstagramAuthResponse {
  access_token: string;
  user_id: number;
  expires_in?: number;
}

interface InstagramUserProfile {
  id: string;
  username: string;
  account_type?: string;
  media_count?: number;
}

interface InstagramInsights {
  followersCount: number;
  followingCount: number;
  mediaCount: number;
  engagementRate?: number;
}

interface InstagramPost {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

class InstagramService {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;
  private readonly baseUrl = 'https://graph.instagram.com';
  private readonly apiVersion = 'v21.0';

  constructor() {
    this.appId = process.env.INSTAGRAM_APP_ID || '';
    this.appSecret = process.env.INSTAGRAM_APP_SECRET || '';
    this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI || '';

    if (!this.appId || !this.appSecret || !this.redirectUri) {
      console.warn('[InstagramService] Missing Instagram API credentials in environment variables');
    }
  }

  /**
   * Generate Instagram OAuth authorization URL
   * @returns Authorization URL to redirect user to
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: 'user_profile,user_media',
      response_type: 'code',
      ...(state && { state }),
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param code - Authorization code from Instagram OAuth callback
   * @returns Access token and user ID
   */
  async exchangeCodeForToken(code: string): Promise<InstagramAuthResponse> {
    try {
      const response = await axios.post<InstagramAuthResponse>(
        'https://api.instagram.com/oauth/access_token',
        new URLSearchParams({
          client_id: this.appId,
          client_secret: this.appSecret,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
          code,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('[InstagramService] Error exchanging code for token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Instagram');
    }
  }

  /**
   * Get long-lived access token (valid for 60 days)
   * @param shortLivedToken - Short-lived access token
   * @returns Long-lived access token
   */
  async getLongLivedToken(shortLivedToken: string): Promise<{ access_token: string; expires_in: number }> {
    try {
      const params = new URLSearchParams({
        grant_type: 'ig_exchange_token',
        client_secret: this.appSecret,
        access_token: shortLivedToken,
      });

      const response = await axios.get(`${this.baseUrl}/access_token?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('[InstagramService] Error getting long-lived token:', error.response?.data || error.message);
      throw new Error('Failed to get long-lived token');
    }
  }

  /**
   * Refresh a long-lived token (before it expires)
   * @param accessToken - Current long-lived token
   * @returns New long-lived access token
   */
  async refreshAccessToken(accessToken: string): Promise<{ access_token: string; expires_in: number }> {
    try {
      const params = new URLSearchParams({
        grant_type: 'ig_refresh_token',
        access_token: accessToken,
      });

      const response = await axios.get(`${this.baseUrl}/refresh_access_token?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('[InstagramService] Error refreshing token:', error.response?.data || error.message);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get user profile information
   * @param accessToken - Instagram access token
   * @returns User profile data
   */
  async getUserProfile(accessToken: string): Promise<InstagramUserProfile> {
    try {
      const fields = 'id,username,account_type,media_count';
      const response = await axios.get(`${this.baseUrl}/me?fields=${fields}&access_token=${accessToken}`);
      return response.data;
    } catch (error: any) {
      console.error('[InstagramService] Error fetching user profile:', error.response?.data || error.message);
      throw new Error('Failed to fetch Instagram profile');
    }
  }

  /**
   * Get user insights (followers, engagement, etc.)
   * Note: Requires Instagram Business or Creator account
   * @param userId - Instagram user ID
   * @param accessToken - Instagram access token
   * @returns User insights
   */
  async getUserInsights(userId: string, accessToken: string): Promise<InstagramInsights> {
    try {
      // For Basic Display API, we can only get media_count from profile
      const profile = await this.getUserProfile(accessToken);
      
      // For Business accounts, you can fetch additional insights
      // This requires Instagram Graph API with business account
      const insights: InstagramInsights = {
        followersCount: 0, // Requires Business API
        followingCount: 0, // Requires Business API
        mediaCount: profile.media_count || 0,
      };

      return insights;
    } catch (error: any) {
      console.error('[InstagramService] Error fetching insights:', error.response?.data || error.message);
      throw new Error('Failed to fetch Instagram insights');
    }
  }

  /**
   * Get user's recent media posts
   * @param accessToken - Instagram access token
   * @param limit - Number of posts to fetch (default: 25)
   * @returns Array of media posts
   */
  async getUserMedia(accessToken: string, limit: number = 25): Promise<InstagramPost[]> {
    try {
      const fields = 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count';
      const response = await axios.get(
        `${this.baseUrl}/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`
      );

      return response.data.data || [];
    } catch (error: any) {
      console.error('[InstagramService] Error fetching user media:', error.response?.data || error.message);
      throw new Error('Failed to fetch Instagram media');
    }
  }

  /**
   * Calculate engagement rate from posts
   * @param posts - Array of Instagram posts
   * @param followersCount - Number of followers
   * @returns Engagement rate as percentage
   */
  calculateEngagementRate(posts: InstagramPost[], followersCount: number): number {
    if (!posts.length || !followersCount) return 0;

    const totalEngagement = posts.reduce((sum, post) => {
      const likes = post.like_count || 0;
      const comments = post.comments_count || 0;
      return sum + likes + comments;
    }, 0);

    const avgEngagement = totalEngagement / posts.length;
    const engagementRate = (avgEngagement / followersCount) * 100;

    return parseFloat(engagementRate.toFixed(2));
  }

  /**
   * Encrypt access token for secure storage
   * @param token - Plain access token
   * @returns Encrypted token
   */
  encryptToken(token: string): string {
    return encrypt(token);
  }

  /**
   * Decrypt access token for API calls
   * @param encryptedToken - Encrypted access token
   * @returns Plain access token
   */
  decryptToken(encryptedToken: string): string {
    return decrypt(encryptedToken);
  }
}

export default new InstagramService();
