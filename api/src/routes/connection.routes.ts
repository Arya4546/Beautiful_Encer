import { Router } from 'express';
import connectionController from '../controllers/connection.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(protect);

// Send connection request
router.post('/send', connectionController.sendRequest.bind(connectionController));

// Accept connection request
router.put('/:requestId/accept', connectionController.acceptRequest.bind(connectionController));

// Reject connection request
router.put('/:requestId/reject', connectionController.rejectRequest.bind(connectionController));

// Withdraw connection request
router.delete('/:requestId/withdraw', connectionController.withdrawRequest.bind(connectionController));

// Get all requests (with optional type filter)
router.get('/', connectionController.getRequests.bind(connectionController));

// Check connection status with a specific user
router.get('/status/:targetUserId', connectionController.checkConnectionStatus.bind(connectionController));

export default router;
