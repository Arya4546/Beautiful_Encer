import axios from '../lib/axios';
import { API_ENDPOINTS } from '../config/api.config';

export interface SocialMediaAccount {
  id: string;
  userId: string;
  platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'TWITTER';
  platformUserId: string;
  platformUsername: string;
  displayName: string;
  profilePicture: string | null;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  engagementRate: number;
  isVerified: boolean;
  bio: string | null;
  externalUrl: string | null;
  metadata: any;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface YouTubeVideo {
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

export interface YouTubeAnalytics {
  totalViews: number;
  averageViews: number;
  totalLikes: number;
  averageLikes: number;
  totalComments: number;
  averageComments: number;
  engagementRate: number;
}

export interface ConnectYouTubeRequest {
  channelHandle: string;
}

export interface ConnectYouTubeResponse {
  success: boolean;
  message: string;
  account: SocialMediaAccount;
}

export interface SyncYouTubeResponse {
  success: boolean;
  message: string;
  account: SocialMediaAccount;
}

export interface YouTubeDataResponse {
  account: SocialMediaAccount;
  videos: YouTubeVideo[];
  analytics: YouTubeAnalytics;
}

class SocialMediaService {
  // YouTube methods
  async connectYouTube(data: ConnectYouTubeRequest): Promise<ConnectYouTubeResponse> {
    const response = await axios.post(API_ENDPOINTS.SOCIAL_MEDIA.YOUTUBE_CONNECT, data);
    return response.data;
  }

  async syncYouTube(accountId: string): Promise<SyncYouTubeResponse> {
    const response = await axios.post(API_ENDPOINTS.SOCIAL_MEDIA.YOUTUBE_SYNC, { accountId });
    return response.data;
  }

  async getYouTubeData(accountId: string): Promise<YouTubeDataResponse> {
    const response = await axios.get(API_ENDPOINTS.SOCIAL_MEDIA.YOUTUBE_DATA(accountId));
    return response.data.data;
  }

  async disconnectYouTube(accountId: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(API_ENDPOINTS.SOCIAL_MEDIA.YOUTUBE_DISCONNECT(accountId));
    return response.data;
  }

  // Instagram methods (keeping for reference/future use)
  async connectInstagram(data: { username: string }): Promise<any> {
    const response = await axios.post(API_ENDPOINTS.SOCIAL_MEDIA.INSTAGRAM_CONNECT, data);
    return response.data;
  }

  async syncInstagram(accountId: string): Promise<any> {
    const response = await axios.post(API_ENDPOINTS.SOCIAL_MEDIA.INSTAGRAM_SYNC, { accountId });
    return response.data;
  }

  async getInstagramData(accountId: string): Promise<any> {
    const response = await axios.get(API_ENDPOINTS.SOCIAL_MEDIA.INSTAGRAM_DATA(accountId));
    return response.data.data;
  }

  async disconnectInstagram(accountId: string): Promise<any> {
    const response = await axios.delete(API_ENDPOINTS.SOCIAL_MEDIA.INSTAGRAM_DISCONNECT(accountId));
    return response.data;
  }

  // TikTok methods (keeping for reference/future use)
  async connectTikTok(data: { username: string }): Promise<any> {
    const response = await axios.post(API_ENDPOINTS.SOCIAL_MEDIA.TIKTOK_CONNECT, data);
    return response.data;
  }

  async syncTikTok(accountId: string): Promise<any> {
    const response = await axios.post(API_ENDPOINTS.SOCIAL_MEDIA.TIKTOK_SYNC, { accountId });
    return response.data;
  }

  async getTikTokData(accountId: string): Promise<any> {
    const response = await axios.get(API_ENDPOINTS.SOCIAL_MEDIA.TIKTOK_DATA(accountId));
    return response.data.data;
  }

  async disconnectTikTok(accountId: string): Promise<any> {
    const response = await axios.delete(API_ENDPOINTS.SOCIAL_MEDIA.TIKTOK_DISCONNECT(accountId));
    return response.data;
  }

  // Twitter/X methods
  async connectTwitter(data: { username: string }): Promise<any> {
    const response = await axios.post(API_ENDPOINTS.SOCIAL_MEDIA.TWITTER_CONNECT, data);
    return response.data;
  }

  async syncTwitter(accountId: string): Promise<any> {
    const response = await axios.post(API_ENDPOINTS.SOCIAL_MEDIA.TWITTER_SYNC(accountId));
    return response.data;
  }

  async getTwitterData(accountId: string): Promise<any> {
    const response = await axios.get(API_ENDPOINTS.SOCIAL_MEDIA.TWITTER_DATA(accountId));
    return response.data;
  }

  async disconnectTwitter(accountId: string): Promise<any> {
    const response = await axios.delete(API_ENDPOINTS.SOCIAL_MEDIA.TWITTER_DISCONNECT(accountId));
    return response.data;
  }

  // General methods
  async getAllAccounts(): Promise<SocialMediaAccount[]> {
    const response = await axios.get(API_ENDPOINTS.SOCIAL_MEDIA.ACCOUNTS);
    return response.data.data;
  }
}

export default new SocialMediaService();
