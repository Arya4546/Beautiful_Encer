import axiosInstance from '../lib/axios';

export interface SendRequestData {
  receiverId: string;
  message?: string;
}

export interface ConnectionRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message: string | null;
  createdAt: string;
  updatedAt: string;
  senderId: string;
  receiverId: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role: 'INFLUENCER' | 'SALON';
    influencer?: {
      profilePic: string | null;
      bio: string | null;
      categories: string[];
    };
    salon?: {
      businessName: string | null;
      profilePic: string | null;
      description: string | null;
    };
  };
  receiver: {
    id: string;
    name: string;
    email: string;
    role: 'INFLUENCER' | 'SALON';
    influencer?: {
      profilePic: string | null;
      bio: string | null;
      categories: string[];
    };
    salon?: {
      businessName: string | null;
      profilePic: string | null;
      description: string | null;
    };
  };
}

export interface ConnectionStatus {
  status: 'none' | 'connected' | 'sent' | 'received';
  requestId?: string;
}

export interface PaginationResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

class ConnectionService {
  /**
   * Send a connection request
   */
  async sendRequest(data: SendRequestData): Promise<{ success: boolean; message: string; data: ConnectionRequest }> {
    const response = await axiosInstance.post('/connections/send', data);
    return response.data;
  }

  /**
   * Accept a connection request
   */
  async acceptRequest(requestId: string): Promise<{ success: boolean; message: string; data: ConnectionRequest }> {
    const response = await axiosInstance.put(`/connections/${requestId}/accept`);
    return response.data;
  }

  /**
   * Reject a connection request
   */
  async rejectRequest(requestId: string): Promise<{ success: boolean; message: string; data: ConnectionRequest }> {
    const response = await axiosInstance.put(`/connections/${requestId}/reject`);
    return response.data;
  }

  /**
   * Withdraw a connection request (cancel sent request)
   */
  async withdrawRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.delete(`/connections/${requestId}/withdraw`);
    return response.data;
  }

  /**
   * Get all connection requests
   * @param type - 'incoming', 'outgoing', 'accepted', or 'all'
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 20)
   */
  async getRequests(
    type: 'incoming' | 'outgoing' | 'accepted' | 'all' = 'all',
    page: number = 1,
    limit: number = 20
  ): Promise<PaginationResponse<ConnectionRequest>> {
    try {
      const response = await axiosInstance.get(`/connections?type=${type}&page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Check connection status with a specific user
   */
  async checkConnectionStatus(targetUserId: string): Promise<{ success: boolean; data: ConnectionStatus }> {
    const response = await axiosInstance.get(`/connections/status/${targetUserId}`);
    return response.data;
  }

  /**
   * Check connection status for multiple users at once (bulk)
   */
  async checkBulkConnectionStatus(userIds: string[]): Promise<{ success: boolean; data: Record<string, ConnectionStatus> }> {
    const response = await axiosInstance.post(`/connections/status/bulk`, { userIds });
    return response.data;
  }
}

export default new ConnectionService();
