import type { Request, Response } from 'express';
import type { Server as SocketServer } from 'socket.io';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: Role;
  };
}

// Module-level Socket.IO instance
let socketIOInstance: SocketServer | null = null;

class NotificationController {
  setSocketIO(io: SocketServer) {
    socketIOInstance = io;
    console.log('[NotificationController] Socket.IO instance set successfully');
  }

  /**
   * Get all notifications for current user
   */
  async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit to last 50 notifications
      });

      return res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error: any) {
      console.error('[NotificationController.getNotifications] Error:', error);
      return res.status(500).json({
        error: 'Failed to fetch notifications',
        details: error.message,
      });
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      console.error('[NotificationController.getUnreadCount] Error:', error);
      return res.status(500).json({
        error: 'Failed to fetch unread count',
        details: error.message,
      });
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify notification belongs to user
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      // Get updated unread count
      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      // Emit updated count via socket
      if (socketIOInstance) {
        socketIOInstance.to(userId).emit('notification_count_updated', {
          count: unreadCount,
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedNotification,
      });
    } catch (error: any) {
      console.error('[NotificationController.markAsRead] Error:', error);
      return res.status(500).json({
        error: 'Failed to mark notification as read',
        details: error.message,
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      // Emit updated count via socket
      if (socketIOInstance) {
        socketIOInstance.to(userId).emit('notification_count_updated', {
          count: 0,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error: any) {
      console.error('[NotificationController.markAllAsRead] Error:', error);
      return res.status(500).json({
        error: 'Failed to mark all notifications as read',
        details: error.message,
      });
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify notification belongs to user
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      // Get updated unread count
      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      // Emit updated count via socket
      if (socketIOInstance) {
        socketIOInstance.to(userId).emit('notification_count_updated', {
          count: unreadCount,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error: any) {
      console.error('[NotificationController.deleteNotification] Error:', error);
      return res.status(500).json({
        error: 'Failed to delete notification',
        details: error.message,
      });
    }
  }

  /**
   * Create a notification (internal use)
   */
  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    connectionRequestId?: string;
    messageId?: string;
    conversationId?: string;
    metadata?: any;
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type as any,
          title: data.title,
          message: data.message,
          connectionRequestId: data.connectionRequestId,
          messageId: data.messageId,
          conversationId: data.conversationId,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });

      // Get updated unread count
      const unreadCount = await prisma.notification.count({
        where: {
          userId: data.userId,
          isRead: false,
        },
      });

      // Emit notification via socket
      if (socketIOInstance) {
        socketIOInstance.to(data.userId).emit('new_notification', {
          notification,
          unreadCount,
        });
      }

      return notification;
    } catch (error: any) {
      console.error('[NotificationController.createNotification] Error:', error);
      throw error;
    }
  }
}

const notificationController = new NotificationController();
export default notificationController;
