import type { Response } from 'express';
import type { Server as SocketServer } from 'socket.io';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';
import notificationController from './notification.controller.js';

interface AuthenticatedRequest {
  user?: {
    userId: string;
    role: Role;
  };
}

// Module-level Socket.IO instance to avoid 'this' context issues
let socketIOInstance: SocketServer | null = null;

class ChatController {
  setSocketIO(io: SocketServer) {
    socketIOInstance = io;
    console.log('[ChatController] Socket.IO instance set successfully');
  }

  /**
   * Get all conversations for the current user
   */
  async getConversations(req: any, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const conversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: { userId },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  influencer: {
                    select: {
                      profilePic: true,
                    },
                  },
                  salon: {
                    select: {
                      profilePic: true,
                      businessName: true,
                    },
                  },
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              messageType: true,
              createdAt: true,
              senderId: true,
              isDeleted: true,
            },
          },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
      });

      // Calculate unread count for each conversation
      const conversationsWithUnread = await Promise.all(
        conversations.map(async (conv) => {
          const participant = conv.participants.find((p) => p.userId === userId);
          const otherParticipant = conv.participants.find((p) => p.userId !== userId);
          
          // Check if users are connected
          const connection = await prisma.connectionRequest.findFirst({
            where: {
              OR: [
                { senderId: userId, receiverId: otherParticipant?.userId, status: 'ACCEPTED' },
                { senderId: otherParticipant?.userId, receiverId: userId, status: 'ACCEPTED' },
              ],
            },
          });

          // Only include conversation if users are connected
          if (!connection) {
            return null;
          }

          const unreadCount = await prisma.message.count({
            where: {
              conversationId: conv.id,
              senderId: { not: userId },
              createdAt: {
                gt: participant?.lastReadAt || new Date(0),
              },
              isDeleted: false,
            },
          });

          return {
            ...conv,
            unreadCount,
            otherUser: otherParticipant?.user,
            isConnected: true,
          };
        })
      );

      // Filter out null values (non-connected users)
      const connectedConversations = conversationsWithUnread.filter(conv => conv !== null);

      return res.status(200).json({
        success: true,
        data: connectedConversations,
      });
    } catch (error: any) {
      console.error('[ChatController.getConversations] Error:', error);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  }

  /**
   * Get or create a conversation with a specific user
   */
  async getOrCreateConversation(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      const { otherUserId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (userId === otherUserId) {
        return res.status(400).json({ error: 'Cannot create conversation with yourself' });
      }

      // Check if users are connected
      const connection = await prisma.connectionRequest.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId, status: 'ACCEPTED' },
            { senderId: otherUserId, receiverId: userId, status: 'ACCEPTED' },
          ],
        },
      });

      if (!connection) {
        return res.status(403).json({ error: 'You can only chat with connected users' });
      }

      // Check if conversation already exists
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          participants: {
            every: {
              userId: {
                in: [userId, otherUserId],
              },
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  influencer: {
                    select: {
                      profilePic: true,
                    },
                  },
                  salon: {
                    select: {
                      profilePic: true,
                      businessName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (existingConversation) {
        return res.status(200).json({
          success: true,
          data: existingConversation,
        });
      }

      // Create new conversation
      const conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId },
              { userId: otherUserId },
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  influencer: {
                    select: {
                      profilePic: true,
                    },
                  },
                  salon: {
                    select: {
                      profilePic: true,
                      businessName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        data: conversation,
      });
    } catch (error: any) {
      console.error('[ChatController.getOrCreateConversation] Error:', error);
      return res.status(500).json({ error: 'Failed to create conversation' });
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      const { conversationId } = req.params;
      const { page = '1', limit = '50' } = req.query;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Verify user is a participant
      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      });

      if (!participant) {
        return res.status(403).json({ error: 'Not a participant of this conversation' });
      }

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { conversationId },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                influencer: {
                  select: {
                    profilePic: true,
                  },
                },
                salon: {
                  select: {
                    profilePic: true,
                  },
                },
              },
            },
          },
        }),
        prisma.message.count({ where: { conversationId } }),
      ]);

      // Update last read timestamp
      await prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      const totalPages = Math.ceil(total / limitNum);
      const hasMore = pageNum < totalPages;

      return res.status(200).json({
        success: true,
        data: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasMore,
        },
      });
    } catch (error: any) {
      console.error('[ChatController.getMessages] Error:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  /**
   * Send a message (REST endpoint, also emit via socket)
   */
  async sendMessage(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      const { conversationId } = req.params;
      const { content, messageType = 'TEXT', fileUrl, fileName, fileSize } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!content && !fileUrl) {
        return res.status(400).json({ error: 'Content or file is required' });
      }

      // Verify user is a participant
      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      });

      if (!participant) {
        return res.status(403).json({ error: 'Not a participant of this conversation' });
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: content || '',
          messageType,
          fileUrl,
          fileName,
          fileSize,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              influencer: {
                select: {
                  profilePic: true,
                },
              },
              salon: {
                select: {
                  profilePic: true,
                },
              },
            },
          },
        },
      });

      // Update conversation last message
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessage: messageType === 'TEXT' ? content : `Sent a ${messageType.toLowerCase()}`,
        },
      });

      // Emit via socket
      console.log('[ChatController.sendMessage] Socket.IO state:', socketIOInstance !== null ? 'SET' : 'NULL');
      if (socketIOInstance) {
        socketIOInstance.to(conversationId).emit('new_message', message);
      } else {
        console.warn('[ChatController.sendMessage] Socket.IO not available');
      }

      // Create notification for other participants
      const participants = await prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: userId },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Get sender info
      const sender = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      // Send notification to each participant
      for (const participant of participants) {
        await notificationController.createNotification({
          userId: participant.userId,
          type: 'NEW_MESSAGE',
          title: 'New Message',
          message: `${sender?.name || 'Someone'} sent you a message`,
          messageId: message.id,
          conversationId: conversationId,
          metadata: {
            senderName: sender?.name,
            preview: content.length > 50 ? content.substring(0, 50) + '...' : content,
          },
        });
      }

      return res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error: any) {
      console.error('[ChatController.sendMessage] Error:', error);
      return res.status(500).json({ error: 'Failed to send message', details: error.message });
    }
  }

  /**
   * Edit a message
   */
  async editMessage(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      const { messageId } = req.params;
      const { content } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      // Find message and verify ownership
      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      if (message.senderId !== userId) {
        return res.status(403).json({ error: 'Cannot edit messages from other users' });
      }

      if (message.isDeleted) {
        return res.status(400).json({ error: 'Cannot edit deleted message' });
      }

      // Update message
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content,
          isEdited: true,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              influencer: {
                select: {
                  profilePic: true,
                },
              },
              salon: {
                select: {
                  profilePic: true,
                },
              },
            },
          },
        },
      });

      // Emit via socket
      if (socketIOInstance) {
        socketIOInstance.to(message.conversationId).emit('message_edited', updatedMessage);
      } else {
        console.warn('[ChatController.editMessage] Socket.IO not available');
      }

      return res.status(200).json({
        success: true,
        data: updatedMessage,
      });
    } catch (error: any) {
      console.error('[ChatController.editMessage] Error:', error);
      return res.status(500).json({ error: 'Failed to edit message', details: error.message });
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      const { messageId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Find message and verify ownership
      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      if (message.senderId !== userId) {
        return res.status(403).json({ error: 'Cannot delete messages from other users' });
      }

      // Soft delete
      const deletedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          content: 'This message has been deleted',
        },
      });

      // Emit via socket
      if (socketIOInstance) {
        socketIOInstance.to(message.conversationId).emit('message_deleted', { messageId });
      } else {
        console.warn('[ChatController.deleteMessage] Socket.IO not available');
      }

      return res.status(200).json({
        success: true,
        data: deletedMessage,
      });
    } catch (error: any) {
      console.error('[ChatController.deleteMessage] Error:', error);
      return res.status(500).json({ error: 'Failed to delete message', details: error.message });
    }
  }
}

export default new ChatController();
