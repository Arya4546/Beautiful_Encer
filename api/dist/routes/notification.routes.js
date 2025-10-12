import { Router } from 'express';
import notificationController from '../controllers/notification.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
const router = Router();
// All routes require authentication
router.use(authenticateToken);
// Get all notifications
router.get('/', (req, res) => notificationController.getNotifications(req, res));
// Get unread count
router.get('/unread-count', (req, res) => notificationController.getUnreadCount(req, res));
// Mark notification as read
router.patch('/:notificationId/read', (req, res) => notificationController.markAsRead(req, res));
// Mark all as read
router.patch('/mark-all-read', (req, res) => notificationController.markAllAsRead(req, res));
// Delete notification
router.delete('/:notificationId', (req, res) => notificationController.deleteNotification(req, res));
export default router;
