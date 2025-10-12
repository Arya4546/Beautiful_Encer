import axios from '../lib/axios';

export interface Notification {
  id: string;
  type: 'CONNECTION_REQUEST' | 'CONNECTION_ACCEPTED' | 'CONNECTION_REJECTED' | 'NEW_MESSAGE' | 'MESSAGE_REPLY' | 'PROFILE_VIEW' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  connectionRequestId?: string;
  messageId?: string;
  conversationId?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCount {
  count: number;
}

class NotificationService {
  /**
   * Get all notifications
   */
  async getNotifications(): Promise<Notification[]> {
    const response = await axios.get('/notifications');
    return response.data.data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<NotificationCount> {
    const response = await axios.get('/notifications/unread-count');
    return response.data.data;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await axios.patch(`/notifications/${notificationId}/read`);
    return response.data.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await axios.patch('/notifications/mark-all-read');
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await axios.delete(`/notifications/${notificationId}`);
  }
}

const notificationService = new NotificationService();
export default notificationService;
