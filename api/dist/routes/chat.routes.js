import { Router } from 'express';
import chatController from '../controllers/chat.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
const router = Router();
// All routes require authentication
router.use(authenticateToken);
// Get chat contacts (accepted connections)
router.get('/contacts', chatController.getContacts);
// Get all conversations
router.get('/conversations', chatController.getConversations);
// Get or create conversation with a user
router.get('/conversations/:otherUserId', chatController.getOrCreateConversation);
// Get messages for a conversation
router.get('/conversations/:conversationId/messages', chatController.getMessages);
// Send a message
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
// Edit a message
router.patch('/messages/:messageId', chatController.editMessage);
// Delete a message
router.delete('/messages/:messageId', chatController.deleteMessage);
export default router;
