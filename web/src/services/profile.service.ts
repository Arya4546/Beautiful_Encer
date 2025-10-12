import axios from '../lib/axios';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'INFLUENCER' | 'SALON';
  createdAt: string;
  influencer?: {
    profilePic: string | null;
    bio: string | null;
    categories: string[];
    region: string | null;
    age: number | null;
    gender: string | null;
    socialMediaAccounts: {
      platform: string;
      platformUsername: string;
      followersCount: number;
      followingCount: number;
      postsCount: number;
      engagementRate: number;
    }[];
  };
  salon?: {
    profilePic: string | null;
    businessName: string | null;
    description: string | null;
    preferredCategories: string[];
    budget: number | null;
  };
}

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  categories?: string[];
  region?: string;
  age?: number;
  gender?: string;
  businessName?: string;
  description?: string;
  website?: string;
  preferredCategories?: string[];
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

class ProfileService {
  async getUserProfile(userId: string): Promise<UserProfile> {
    const response = await axios.get(`/profile/${userId}`);
    return response.data.data;
  }

  async getMyProfile(): Promise<UserProfile> {
    const response = await axios.get('/profile/me');
    return response.data.data;
  }

  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const response = await axios.patch('/profile/update', data);
    return response.data.data;
  }

  async uploadProfilePicture(formData: FormData): Promise<{ profilePic: string }> {
    const response = await axios.post('/profile/upload-profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async changePassword(data: ChangePasswordData): Promise<void> {
    await axios.post('/profile/change-password', data);
  }

  async updateProfilePicture(profilePic: string): Promise<{ profilePic: string }> {
    const response = await axios.patch('/profile/profile-picture', { profilePic });
    return response.data.data;
  }

  async deleteAccount(password: string): Promise<void> {
    await axios.delete('/profile/delete-account', { data: { password } });
  }

  async getSettings(): Promise<UserProfile> {
    const response = await axios.get('/profile/settings/me');
    return response.data.data;
  }
}

export default new ProfileService();
