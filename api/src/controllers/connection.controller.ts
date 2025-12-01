import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';
import notificationController from './notification.controller.js';
import { sendRequestNotificationToInfluencer, sendRequestNotificationToSalon } from '../services/email.service.js';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: Role;
  };
}

class ConnectionController {
  /**
   * Send a connection request
   */
  async sendRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const senderId = req.user?.userId;
      const { receiverId, message } = req.body;

      if (!senderId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!receiverId) {
        return res.status(400).json({ error: 'Receiver ID is required' });
      }

      // Prevent self-connection
      if (senderId === receiverId) {
        return res.status(400).json({ error: 'Cannot send request to yourself' });
      }

      // Check if receiver exists
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
      });

      if (!receiver) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if request already exists
      const existingRequest = await prisma.connectionRequest.findUnique({
        where: {
          senderId_receiverId: {
            senderId,
            receiverId,
          },
        },
      });

      if (existingRequest) {
        if (existingRequest.status === 'REJECTED') {
          // Allow resending if previous was rejected
          const updatedRequest = await prisma.connectionRequest.update({
            where: { id: existingRequest.id },
            data: { 
              status: 'PENDING',
              message: message || null,
              updatedAt: new Date(),
            },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
              receiver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          });
          return res.status(200).json({
            success: true,
            message: 'Connection request resent successfully',
            data: updatedRequest,
          });
        }
        return res.status(409).json({ error: 'Connection request already sent' });
      }

      // Check if reverse request exists (they sent you a request)
      const reverseRequest = await prisma.connectionRequest.findUnique({
        where: {
          senderId_receiverId: {
            senderId: receiverId,
            receiverId: senderId,
          },
        },
      });

      if (reverseRequest && reverseRequest.status === 'PENDING') {
        return res.status(409).json({ 
          error: 'This user has already sent you a request. Please check your pending requests.' 
        });
      }

      // Create connection request
      const connectionRequest = await prisma.connectionRequest.create({
        data: {
          senderId,
          receiverId,
          message: message || null,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              salon: {
                select: {
                  businessName: true,
                },
              },
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              influencer: {
                select: {
                  id: true,
                },
              },
              salon: {
                select: {
                  businessName: true,
                },
              },
            },
          },
        },
      });

      // Create notification for receiver
      await notificationController.createNotification({
        userId: receiverId,
        type: 'CONNECTION_REQUEST',
        title: 'New Connection Request',
        message: `${connectionRequest.sender.name} sent you a connection request`,
        connectionRequestId: connectionRequest.id,
        metadata: {
          senderName: connectionRequest.sender.name,
          senderRole: connectionRequest.sender.role,
        },
      });

      // Send email notification (fire-and-forget)
      if (connectionRequest.receiver.role === 'INFLUENCER') {
        // Salon sending request to influencer
        const salonName = connectionRequest.sender.salon?.businessName || connectionRequest.sender.name;
        sendRequestNotificationToInfluencer(
          connectionRequest.receiver.email,
          connectionRequest.receiver.name,
          salonName,
          undefined, // no project name for direct connection
          message || undefined
        );
      } else if (connectionRequest.receiver.role === 'SALON') {
        // Influencer sending request to salon
        sendRequestNotificationToSalon(
          connectionRequest.receiver.email,
          connectionRequest.receiver.salon?.businessName || connectionRequest.receiver.name,
          connectionRequest.sender.name,
          undefined, // no project name for direct connection
          message || undefined
        );
      }

      return res.status(201).json({
        success: true,
        message: 'Connection request sent successfully',
        data: connectionRequest,
      });
    } catch (error: any) {
      console.error('[ConnectionController.sendRequest] Error:', error);
      return res.status(500).json({ error: 'Failed to send connection request' });
    }
  }

  /**
   * Accept a connection request
   */
  async acceptRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { requestId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Find the request
      const request = await prisma.connectionRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        return res.status(404).json({ error: 'Connection request not found' });
      }

      // Verify user is the receiver
      if (request.receiverId !== userId) {
        return res.status(403).json({ error: 'You can only accept requests sent to you' });
      }

      // Check if already accepted
      if (request.status === 'ACCEPTED') {
        return res.status(400).json({ error: 'Request already accepted' });
      }

      // Update request status
      const updatedRequest = await prisma.connectionRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Create a conversation between sender and receiver automatically
      try {
        // Check if conversation already exists
        const existingConversation = await prisma.conversation.findFirst({
          where: {
            participants: {
              every: {
                userId: {
                  in: [request.senderId, request.receiverId],
                },
              },
            },
          },
        });

        // Only create if doesn't exist
        if (!existingConversation) {
          await prisma.conversation.create({
            data: {
              participants: {
                create: [
                  { userId: request.senderId },
                  { userId: request.receiverId },
                ],
              },
            },
          });
        }
      } catch (convError) {
        console.error('[ConnectionController] Failed to create conversation:', convError);
        // Don't fail the request if conversation creation fails
      }

      // Create notification for sender
      await notificationController.createNotification({
        userId: request.senderId,
        type: 'CONNECTION_ACCEPTED',
        title: 'Connection Accepted',
        message: `${updatedRequest.receiver.name} accepted your connection request`,
        connectionRequestId: updatedRequest.id,
        metadata: {
          receiverName: updatedRequest.receiver.name,
          receiverRole: updatedRequest.receiver.role,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Connection request accepted',
        data: updatedRequest,
      });
    } catch (error: any) {
      console.error('[ConnectionController.acceptRequest] Error:', error);
      return res.status(500).json({ error: 'Failed to accept connection request' });
    }
  }

  /**
   * Reject a connection request
   */
  async rejectRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { requestId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Find the request
      const request = await prisma.connectionRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        return res.status(404).json({ error: 'Connection request not found' });
      }

      // Verify user is the receiver
      if (request.receiverId !== userId) {
        return res.status(403).json({ error: 'You can only reject requests sent to you' });
      }

      // Update request status
      const updatedRequest = await prisma.connectionRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Connection request rejected',
        data: updatedRequest,
      });
    } catch (error: any) {
      console.error('[ConnectionController.rejectRequest] Error:', error);
      return res.status(500).json({ error: 'Failed to reject connection request' });
    }
  }

  /**
   * Withdraw a connection request (cancel sent request)
   */
  async withdrawRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { requestId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Find the request
      const request = await prisma.connectionRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        return res.status(404).json({ error: 'Connection request not found' });
      }

      // Verify user is the sender
      if (request.senderId !== userId) {
        return res.status(403).json({ error: 'You can only withdraw requests you sent' });
      }

      // Delete the request
      await prisma.connectionRequest.delete({
        where: { id: requestId },
      });

      return res.status(200).json({
        success: true,
        message: 'Connection request withdrawn',
      });
    } catch (error: any) {
      console.error('[ConnectionController.withdrawRequest] Error:', error);
      return res.status(500).json({ error: 'Failed to withdraw connection request' });
    }
  }

  /**
   * Get all connection requests (incoming, outgoing, accepted)
   */
  async getRequests(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { type = 'all', page = '1', limit = '20' } = req.query;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      let where: any = {};

      if (type === 'incoming') {
        where = { receiverId: userId, status: 'PENDING' };
      } else if (type === 'outgoing') {
        where = { senderId: userId, status: 'PENDING' };
      } else if (type === 'accepted') {
        where = {
          OR: [
            { senderId: userId, status: 'ACCEPTED' },
            { receiverId: userId, status: 'ACCEPTED' },
          ],
        };
      } else {
        // All requests
        where = {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        };
      }

      const [requests, total] = await Promise.all([
        prisma.connectionRequest.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                influencer: {
                  select: {
                    id: true,
                    profilePic: true,
                    bio: true,
                    categories: true,
                  },
                },
                salon: {
                  select: {
                    id: true,
                    businessName: true,
                    profilePic: true,
                    description: true,
                  },
                },
              },
            },
            receiver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                influencer: {
                  select: {
                    id: true,
                    profilePic: true,
                    bio: true,
                    categories: true,
                  },
                },
                salon: {
                  select: {
                    id: true,
                    businessName: true,
                    profilePic: true,
                    description: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limitNum,
        }),
        prisma.connectionRequest.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        data: requests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasMore: skip + requests.length < total,
        },
      });
    } catch (error: any) {
      console.error('[ConnectionController.getRequests] Error:', error);
      return res.status(500).json({ error: 'Failed to fetch connection requests' });
    }
  }

  /**
   * Check connection status with a specific user
   */
  async checkConnectionStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { targetUserId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if there's a request from current user to target
      const sentRequest = await prisma.connectionRequest.findUnique({
        where: {
          senderId_receiverId: {
            senderId: userId,
            receiverId: targetUserId,
          },
        },
      });

      // Check if there's a request from target to current user
      const receivedRequest = await prisma.connectionRequest.findUnique({
        where: {
          senderId_receiverId: {
            senderId: targetUserId,
            receiverId: userId,
          },
        },
      });

      let status = 'none';
      let requestId = null;

      if (sentRequest) {
        status = sentRequest.status === 'ACCEPTED' ? 'connected' : 'sent';
        requestId = sentRequest.id;
      } else if (receivedRequest) {
        status = receivedRequest.status === 'ACCEPTED' ? 'connected' : 'received';
        requestId = receivedRequest.id;
      }

      return res.status(200).json({
        success: true,
        data: {
          status,
          requestId,
        },
      });
    } catch (error: any) {
      console.error('[ConnectionController.checkConnectionStatus] Error:', error);
      return res.status(500).json({ error: 'Failed to check connection status' });
    }
  }

  /**
   * Check connection status for multiple users (bulk operation)
   */
  async checkBulkConnectionStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { userIds } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: 'userIds array is required' });
      }

      // Limit to 100 IDs per request
      if (userIds.length > 100) {
        return res.status(400).json({ error: 'Maximum 100 user IDs per request' });
      }

      // Fetch all sent requests
      const sentRequests = await prisma.connectionRequest.findMany({
        where: {
          senderId: userId,
          receiverId: { in: userIds },
        },
        select: {
          id: true,
          receiverId: true,
          status: true,
        },
      });

      // Fetch all received requests
      const receivedRequests = await prisma.connectionRequest.findMany({
        where: {
          senderId: { in: userIds },
          receiverId: userId,
        },
        select: {
          id: true,
          senderId: true,
          status: true,
        },
      });

      // Build status map
      const statusMap: Record<string, { status: string; requestId: string | null }> = {};

      userIds.forEach((targetId) => {
        statusMap[targetId] = { status: 'none', requestId: null };
      });

      sentRequests.forEach((req) => {
        statusMap[req.receiverId] = {
          status: req.status === 'ACCEPTED' ? 'connected' : 'sent',
          requestId: req.id,
        };
      });

      receivedRequests.forEach((req) => {
        // Only override if not already set (sent takes precedence)
        if (statusMap[req.senderId].status === 'none') {
          statusMap[req.senderId] = {
            status: req.status === 'ACCEPTED' ? 'connected' : 'received',
            requestId: req.id,
          };
        }
      });

      return res.status(200).json({
        success: true,
        data: statusMap,
      });
    } catch (error: any) {
      console.error('[ConnectionController.checkBulkConnectionStatus] Error:', error);
      return res.status(500).json({ error: 'Failed to check bulk connection status' });
    }
  }
}

export default new ConnectionController();
