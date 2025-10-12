import { create } from 'zustand';
import notificationService, { type Notification } from '../services/notification.service';
import { showToast } from '../utils/toast';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    try {
      set({ loading: true });
      const notifications = await notificationService.getNotifications();
      set({ notifications, loading: false });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { count } = await notificationService.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      const { notifications, unreadCount } = get();
      const updatedNotifications = notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      
      set({
        notifications: updatedNotifications,
        unreadCount: Math.max(0, unreadCount - 1),
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      showToast.error('Failed to mark notification as read');
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      
      const { notifications } = get();
      const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
      
      set({
        notifications: updatedNotifications,
        unreadCount: 0,
      });
      
      showToast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      showToast.error('Failed to mark all notifications as read');
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      const { notifications } = get();
      const notification = notifications.find(n => n.id === notificationId);
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      
      set({
        notifications: updatedNotifications,
        unreadCount: notification && !notification.isRead 
          ? Math.max(0, get().unreadCount - 1) 
          : get().unreadCount,
      });
      
      showToast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      showToast.error('Failed to delete notification');
    }
  },

  addNotification: (notification: Notification) => {
    const { notifications, unreadCount } = get();
    set({
      notifications: [notification, ...notifications],
      unreadCount: unreadCount + 1,
    });
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },
}));
