import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { Role, ActivityAction } from '@prisma/client';
import adminService from '../services/admin.service.js';
import bcrypt from 'bcryptjs';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: Role;
  };
}

class AdminController {
  /**
   * Get dashboard statistics and charts data
   */
  async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const [stats, growthData, connectionStats] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getUserGrowthData(),
        adminService.getConnectionStats(),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          stats,
          charts: {
            userGrowth: growthData,
            connectionStats,
          },
        },
      });
    } catch (error: any) {
      console.error('[AdminController.getDashboard] Error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch dashboard data',
        message: error.message 
      });
    }
  }

  /**
   * Get all users with pagination and filters
   */
  async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const { 
        page = '1', 
        limit = '20', 
        search = '', 
        role, 
        verified,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query as Record<string, string>;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {
        role: { not: Role.ADMIN },
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role && (role === 'INFLUENCER' || role === 'SALON')) {
        where.role = role;
      }

      if (verified === 'true') {
        where.OR = [
          { influencer: { emailVerified: true } },
          { salon: { emailVerified: true } },
        ];
      } else if (verified === 'false') {
        where.OR = [
          { influencer: { emailVerified: false } },
          { salon: { emailVerified: false } },
        ];
      }

      // Fetch users
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { [sortBy]: sortOrder },
          include: {
            influencer: {
              select: {
                id: true,
                emailVerified: true,
                profilePic: true,
                bio: true,
                categories: true,
                region: true,
                phoneNo: true,
                socialMediaAccounts: {
                  select: {
                    id: true,
                    platform: true,
                    platformUsername: true,
                    followersCount: true,
                    engagementRate: true,
                  },
                },
              },
            },
            salon: {
              select: {
                id: true,
                emailVerified: true,
                businessName: true,
                profilePic: true,
                description: true,
                phoneNo: true,
                teamSize: true,
                website: true,
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return res.status(200).json({
        success: true,
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      });
    } catch (error: any) {
      console.error('[AdminController.getUsers] Error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch users',
        message: error.message 
      });
    }
  }

  /**
   * Get single user details
   */
  async getUserDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          influencer: {
            include: {
              socialMediaAccounts: {
                include: {
                  posts: {
                    take: 10,
                    orderBy: { postedAt: 'desc' },
                  },
                },
              },
            },
          },
          salon: true,
          sentRequests: {
            include: {
              receiver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          receivedRequests: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          messages: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get connection statistics
      const [sentCount, receivedCount, acceptedCount] = await Promise.all([
        prisma.connectionRequest.count({ where: { senderId: userId } }),
        prisma.connectionRequest.count({ where: { receiverId: userId } }),
        prisma.connectionRequest.count({
          where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
            status: 'ACCEPTED',
          },
        }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          ...user,
          stats: {
            connectionsSent: sentCount,
            connectionsReceived: receivedCount,
            connectionsAccepted: acceptedCount,
          },
        },
      });
    } catch (error: any) {
      console.error('[AdminController.getUserDetails] Error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch user details',
        message: error.message 
      });
    }
  }

  /**
   * Suspend user account
   */
  async suspendUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const adminUser = req.user!;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.role === Role.ADMIN) {
        return res.status(403).json({ error: 'Cannot suspend admin users' });
      }

      // Update user status (you might want to add a 'suspended' field to schema)
      // For now, we'll use emailVerified as a soft suspension
      if (user.role === Role.INFLUENCER) {
        await prisma.influencer.update({
          where: { userId },
          data: { emailVerified: false },
        });
      } else if (user.role === Role.SALON) {
        await prisma.salon.update({
          where: { userId },
          data: { emailVerified: false },
        });
      }

      // Log activity
      await adminService.logActivity({
        action: ActivityAction.USER_SUSPENDED,
        description: `Suspended user ${user.name} (${user.email})`,
        adminId: adminUser.userId,
        adminName: 'Admin',
        adminEmail: 'superadmin@beautifulencer.com',
        targetUserId: userId,
        targetUserName: user.name,
        targetUserEmail: user.email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(200).json({
        success: true,
        message: 'User suspended successfully',
      });
    } catch (error: any) {
      console.error('[AdminController.suspendUser] Error:', error);
      return res.status(500).json({ 
        error: 'Failed to suspend user',
        message: error.message 
      });
    }
  }

  /**
   * Activate user account
   */
  async activateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const adminUser = req.user!;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Activate user
      if (user.role === Role.INFLUENCER) {
        await prisma.influencer.update({
          where: { userId },
          data: { emailVerified: true },
        });
      } else if (user.role === Role.SALON) {
        await prisma.salon.update({
          where: { userId },
          data: { emailVerified: true },
        });
      }

      // Log activity
      await adminService.logActivity({
        action: ActivityAction.USER_ACTIVATED,
        description: `Activated user ${user.name} (${user.email})`,
        adminId: adminUser.userId,
        adminName: 'Admin',
        adminEmail: 'superadmin@beautifulencer.com',
        targetUserId: userId,
        targetUserName: user.name,
        targetUserEmail: user.email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(200).json({
        success: true,
        message: 'User activated successfully',
      });
    } catch (error: any) {
      console.error('[AdminController.activateUser] Error:', error);
      return res.status(500).json({ 
        error: 'Failed to activate user',
        message: error.message 
      });
    }
  }

  /**
   * Delete user account
   */
  async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const adminUser = req.user!;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.role === Role.ADMIN) {
        return res.status(403).json({ error: 'Cannot delete admin users' });
      }

      // Log activity before deletion
      await adminService.logActivity({
        action: ActivityAction.USER_DELETED,
        description: `Deleted user ${user.name} (${user.email})`,
        adminId: adminUser.userId,
        adminName: 'Admin',
        adminEmail: 'superadmin@beautifulencer.com',
        targetUserId: userId,
        targetUserName: user.name,
        targetUserEmail: user.email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Delete user (cascade will handle related records)
      await prisma.user.delete({
        where: { id: userId },
      });

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      console.error('[AdminController.deleteUser] Error:', error);
      return res.status(500).json({ 
        error: 'Failed to delete user',
        message: error.message 
      });
    }
  }

  /**
   * Get all connections with pagination
   */
  async getConnections(req: AuthenticatedRequest, res: Response) {
    try {
      const { 
        page = '1', 
        limit = '20', 
        status,
        search = '',
      } = req.query as Record<string, string>;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (status && ['PENDING', 'ACCEPTED', 'REJECTED'].includes(status)) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { sender: { name: { contains: search, mode: 'insensitive' } } },
          { receiver: { name: { contains: search, mode: 'insensitive' } } },
          { sender: { email: { contains: search, mode: 'insensitive' } } },
          { receiver: { email: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [connections, total] = await Promise.all([
        prisma.connectionRequest.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
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
                    businessName: true,
                    profilePic: true,
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
                    profilePic: true,
                  },
                },
                salon: {
                  select: {
                    businessName: true,
                    profilePic: true,
                  },
                },
              },
            },
          },
        }),
        prisma.connectionRequest.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return res.status(200).json({
        success: true,
        data: connections,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      });
    } catch (error: any) {
      console.error('[AdminController.getConnections] Error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch connections',
        message: error.message 
      });
    }
  }

  /**
   * Delete connection
   */
  async deleteConnection(req: AuthenticatedRequest, res: Response) {
    try {
      const { connectionId } = req.params;
      const adminUser = req.user!;

      const connection = await prisma.connectionRequest.findUnique({
        where: { id: connectionId },
        include: {
          sender: true,
          receiver: true,
        },
      });

      if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
      }

      // Log activity
      await adminService.logActivity({
        action: ActivityAction.CONNECTION_DELETED,
        description: `Deleted connection between ${connection.sender.name} and ${connection.receiver.name}`,
        adminId: adminUser.userId,
        adminName: 'Admin',
        adminEmail: 'superadmin@beautifulencer.com',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: {
          senderId: connection.senderId,
          receiverId: connection.receiverId,
          status: connection.status,
        },
      });

      await prisma.connectionRequest.delete({
        where: { id: connectionId },
      });

      return res.status(200).json({
        success: true,
        message: 'Connection deleted successfully',
      });
    } catch (error: any) {
      console.error('[AdminController.deleteConnection] Error:', error);
      return res.status(500).json({ 
        error: 'Failed to delete connection',
        message: error.message 
      });
    }
  }

  /**
   * Get activity logs with pagination
   */
  async getActivityLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const { 
        page = '1', 
        limit = '50', 
        action,
        search = '',
      } = req.query as Record<string, string>;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (action && Object.values(ActivityAction).includes(action as ActivityAction)) {
        where.action = action;
      }

      if (search) {
        where.OR = [
          { adminName: { contains: search, mode: 'insensitive' } },
          { targetUserName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.activityLog.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      return res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      });
    } catch (error: any) {
      console.error('[AdminController.getActivityLogs] Error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch activity logs',
        message: error.message 
      });
    }
  }

  /**
   * Get admin profile
   */
  async getAdminProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const adminId = req.user!.userId;

      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      return res.status(200).json({
        success: true,
        data: admin,
      });
    } catch (error: any) {
      console.error('[AdminController.getAdminProfile] Error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch admin profile',
        message: error.message 
      });
    }
  }

  /**
   * Update admin profile (name, email)
   */
  async updateAdminProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const adminId = req.user!.userId;
      const { name, email } = req.body;

      if (!name && !email) {
        return res.status(400).json({ error: 'At least one field (name or email) is required' });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) {
        // Check if email is already taken
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser && existingUser.id !== adminId) {
          return res.status(409).json({ error: 'Email already in use' });
        }

        updateData.email = email;
      }

      const updatedAdmin = await prisma.user.update({
        where: { id: adminId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedAdmin,
      });
    } catch (error: any) {
      console.error('[AdminController.updateAdminProfile] Error:', error);
      return res.status(500).json({ 
        error: 'Failed to update profile',
        message: error.message 
      });
    }
  }

  /**
   * Update admin password
   */
  async updateAdminPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const adminId = req.user!.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long' });
      }

      // Get admin user
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
      });

      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: adminId },
        data: { password: hashedPassword },
      });

      // Log activity
      await adminService.logActivity({
        action: ActivityAction.PASSWORD_RESET,
        description: `Admin ${admin.name} changed their password`,
        adminId,
        adminName: admin.name,
        adminEmail: admin.email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(200).json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error: any) {
      console.error('[AdminController.updateAdminPassword] Error:', error);
      return res.status(500).json({ 
        error: 'Failed to update password',
        message: error.message 
      });
    }
  }

  /**
   * Create a new user (admin only)
   */
  async createUser(req: AuthenticatedRequest, res: Response) {
    try {
      const adminId = req.user!.userId;
      const admin = await prisma.user.findUnique({ where: { id: adminId } });

      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      const { 
        name, 
        email, 
        password, 
        phoneNumber, 
        role, 
        bio, 
        region, 
        businessName, 
        description 
      } = req.body;

      // Validation
      if (!name || !email || !password || !role) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Name, email, password, and role are required' 
        });
      }

      if (!['INFLUENCER', 'SALON'].includes(role)) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Role must be either INFLUENCER or SALON' 
        });
      }

      if (password.length < 8) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Password must be at least 8 characters long' 
        });
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ 
          error: 'Email already exists',
          message: 'A user with this email already exists' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user with role-specific profile
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          termsAccepted: true, // Auto-accept for admin-created users
          termsAcceptedAt: new Date(),
          ...(role === 'INFLUENCER' && {
            influencer: {
              create: {
                phoneNo: phoneNumber || null,
                emailVerified: true, // Auto-verify for admin-created users
                bio: bio || null,
                region: region || null,
              },
            },
          }),
          ...(role === 'SALON' && {
            salon: {
              create: {
                phoneNo: phoneNumber || null,
                emailVerified: true, // Auto-verify for admin-created users
                businessName: businessName || null,
                description: description || null,
              },
            },
          }),
        },
        include: {
          influencer: true,
          salon: true,
        },
      });

      // Log activity
      await adminService.logActivity({
        action: ActivityAction.USER_ACTIVATED,
        description: `Admin ${admin.name} created new ${role.toLowerCase()} user: ${name} (${email})`,
        adminId,
        adminName: admin.name,
        adminEmail: admin.email,
        targetUserId: newUser.id,
        targetUserName: newUser.name,
        targetUserEmail: newUser.email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: JSON.stringify({ role, phoneNumber }),
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: userWithoutPassword,
      });
    } catch (error: any) {
      console.error('[AdminController.createUser] Error:', error);
      return res.status(500).json({ 
        error: 'Failed to create user',
        message: error.message 
      });
    }
  }

  /**
   * Update an existing user (admin only)
   */
  async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const adminId = req.user!.userId;
      const admin = await prisma.user.findUnique({ where: { id: adminId } });

      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      const { id } = req.params;
      const { 
        name, 
        email, 
        phoneNumber, 
        bio, 
        region, 
        businessName, 
        description 
      } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ 
        where: { id },
        include: { influencer: true, salon: true },
      });

      if (!existingUser) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'The specified user does not exist' 
        });
      }

      // If email is being changed, check if new email is available
      if (email && email !== existingUser.email) {
        const emailTaken = await prisma.user.findUnique({ where: { email } });
        if (emailTaken) {
          return res.status(409).json({ 
            error: 'Email already exists',
            message: 'Another user with this email already exists' 
          });
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
        },
        include: {
          influencer: true,
          salon: true,
        },
      });

      // Update role-specific profile
      if (existingUser.role === 'INFLUENCER' && existingUser.influencer) {
        await prisma.influencer.update({
          where: { id: existingUser.influencer.id },
          data: {
            ...(phoneNumber !== undefined && { phoneNo: phoneNumber || null }),
            ...(bio !== undefined && { bio: bio || null }),
            ...(region !== undefined && { region: region || null }),
          },
        });
      } else if (existingUser.role === 'SALON' && existingUser.salon) {
        await prisma.salon.update({
          where: { id: existingUser.salon.id },
          data: {
            ...(phoneNumber !== undefined && { phoneNo: phoneNumber || null }),
            ...(businessName !== undefined && { businessName: businessName || null }),
            ...(description !== undefined && { description: description || null }),
          },
        });
      }

      // Fetch updated user with profile
      const finalUser = await prisma.user.findUnique({
        where: { id },
        include: {
          influencer: true,
          salon: true,
        },
      });

      // Log activity
      await adminService.logActivity({
        action: ActivityAction.USER_VIEWED, // Could add USER_UPDATED enum if needed
        description: `Admin ${admin.name} updated user: ${finalUser!.name} (${finalUser!.email})`,
        adminId,
        adminName: admin.name,
        adminEmail: admin.email,
        targetUserId: finalUser!.id,
        targetUserName: finalUser!.name,
        targetUserEmail: finalUser!.email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: JSON.stringify({ updates: req.body }),
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = finalUser!;

      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: userWithoutPassword,
      });
    } catch (error: any) {
      console.error('[AdminController.updateUser] Error:', error);
      return res.status(500).json({ 
        error: 'Failed to update user',
        message: error.message 
      });
    }
  }
}

export default new AdminController();
