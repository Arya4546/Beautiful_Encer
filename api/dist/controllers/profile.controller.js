import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../config/cloudinary.config.js';
import 'multer';
class ProfileController {
    /**
     * Get user profile by ID
     * Returns complete profile information including social media stats
     */
    async getUserProfile(req, res) {
        try {
            const { userId } = req.params;
            const currentUserId = req.user?.userId;
            if (!currentUserId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Fetch user with role-specific data
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    influencer: {
                        select: {
                            id: true,
                            profilePic: true,
                            bio: true,
                            categories: true,
                            region: true,
                            age: true,
                            gender: true,
                            socialMediaAccounts: {
                                select: {
                                    id: true,
                                    platform: true,
                                    platformUsername: true,
                                    followersCount: true,
                                    followingCount: true,
                                    postsCount: true,
                                    engagementRate: true,
                                    isActive: true,
                                },
                            },
                        },
                    },
                    salon: {
                        select: {
                            id: true,
                            businessName: true,
                            profilePic: true,
                            description: true,
                            preferredCategories: true,
                            website: true,
                        },
                    },
                },
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Check connection status between current user and viewed user
            let connectionStatus = null;
            if (currentUserId !== userId) {
                const connection = await prisma.connectionRequest.findFirst({
                    where: {
                        OR: [
                            { senderId: currentUserId, receiverId: userId },
                            { senderId: userId, receiverId: currentUserId },
                        ],
                    },
                    select: {
                        id: true,
                        status: true,
                        senderId: true,
                        receiverId: true,
                    },
                });
                if (connection) {
                    connectionStatus = {
                        id: connection.id,
                        status: connection.status,
                        isSender: connection.senderId === currentUserId,
                    };
                }
            }
            return res.status(200).json({
                success: true,
                data: {
                    ...user,
                    connectionStatus,
                },
            });
        }
        catch (error) {
            console.error('[ProfileController.getUserProfile] Error:', error);
            return res.status(500).json({ error: 'Failed to fetch user profile' });
        }
    }
    /**
     * Get current user's own profile (for editing)
     */
    async getMyProfile(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    influencer: {
                        select: {
                            id: true,
                            profilePic: true,
                            bio: true,
                            categories: true,
                            region: true,
                            age: true,
                            gender: true,
                            socialMediaAccounts: {
                                select: {
                                    id: true,
                                    platform: true,
                                    platformUsername: true,
                                    followersCount: true,
                                    followingCount: true,
                                    postsCount: true,
                                    engagementRate: true,
                                    isActive: true,
                                },
                            },
                        },
                    },
                    salon: {
                        select: {
                            id: true,
                            businessName: true,
                            profilePic: true,
                            description: true,
                            preferredCategories: true,
                            website: true,
                        },
                    },
                },
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Get connection statistics
            const [sentRequests, receivedRequests, connections] = await Promise.all([
                prisma.connectionRequest.count({
                    where: { senderId: userId, status: 'PENDING' },
                }),
                prisma.connectionRequest.count({
                    where: { receiverId: userId, status: 'PENDING' },
                }),
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
                        sentRequests,
                        receivedRequests,
                        connections,
                    },
                },
            });
        }
        catch (error) {
            console.error('[ProfileController.getUserProfile] Error:', error);
            return res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }
    /**
     * Update user profile details
     * Allows updating name, bio, categories, region, age, gender, etc.
     */
    async updateProfile(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { name, bio, categories, region, age, gender, businessName, description, website, preferredCategories } = req.body;
            // Get user's role
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Update user name if provided
            if (name) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { name },
                });
            }
            // Update role-specific profile
            if (user.role === 'INFLUENCER') {
                const updateData = {};
                if (bio !== undefined)
                    updateData.bio = bio;
                if (categories !== undefined)
                    updateData.categories = categories;
                if (region !== undefined)
                    updateData.region = region;
                if (age !== undefined)
                    updateData.age = age;
                if (gender !== undefined)
                    updateData.gender = gender;
                await prisma.influencer.update({
                    where: { userId },
                    data: updateData,
                });
            }
            else if (user.role === 'SALON') {
                const updateData = {};
                if (businessName !== undefined)
                    updateData.businessName = businessName;
                if (description !== undefined)
                    updateData.description = description;
                if (website !== undefined)
                    updateData.website = website;
                if (preferredCategories !== undefined)
                    updateData.preferredCategories = preferredCategories;
                await prisma.salon.update({
                    where: { userId },
                    data: updateData,
                });
            }
            // Fetch updated profile
            const updatedUser = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    influencer: {
                        select: {
                            bio: true,
                            categories: true,
                            region: true,
                            age: true,
                            gender: true,
                            profilePic: true,
                        },
                    },
                    salon: {
                        select: {
                            businessName: true,
                            description: true,
                            website: true,
                            preferredCategories: true,
                            profilePic: true,
                        },
                    },
                },
            });
            return res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedUser,
            });
        }
        catch (error) {
            console.error('[ProfileController.updateProfile] Error:', error);
            return res.status(500).json({ error: 'Failed to update profile' });
        }
    }
    /**
     * Change user password
     * Requires old password for verification
     */
    async changePassword(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: 'Current password and new password are required' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'New password must be at least 6 characters long' });
            }
            // Get user with password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { password: true },
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Verify current password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            // Update password
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword },
            });
            return res.status(200).json({
                success: true,
                message: 'Password changed successfully',
            });
        }
        catch (error) {
            console.error('[ProfileController.changePassword] Error:', error);
            return res.status(500).json({ error: 'Failed to change password' });
        }
    }
    /**
     * Upload profile picture with file
     * Handles image upload to Cloudinary with multer
     */
    async uploadProfilePictureWithFile(req, res) {
        try {
            const userId = req.user?.userId;
            const file = req.file;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            if (!file) {
                return res.status(400).json({ error: 'Profile picture file is required' });
            }
            // Get user's role
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Upload image to Cloudinary
            const b64 = Buffer.from(file.buffer).toString('base64');
            const dataURI = 'data:' + file.mimetype + ';base64,' + b64;
            const uploadResponse = await cloudinary.uploader.upload(dataURI, {
                folder: user.role === 'INFLUENCER' ? 'influencer-profiles' : 'salon-profiles',
            });
            const profilePicUrl = uploadResponse.secure_url;
            // Update profile picture based on role
            if (user.role === 'INFLUENCER') {
                await prisma.influencer.update({
                    where: { userId },
                    data: { profilePic: profilePicUrl },
                });
            }
            else if (user.role === 'SALON') {
                await prisma.salon.update({
                    where: { userId },
                    data: { profilePic: profilePicUrl },
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Profile picture uploaded successfully',
                data: { profilePic: profilePicUrl },
            });
        }
        catch (error) {
            console.error('[ProfileController.uploadProfilePictureWithFile] Error:', error);
            return res.status(500).json({ error: 'Failed to upload profile picture' });
        }
    }
    /**
     * Update profile picture
     * Handles image upload to Cloudinary
     */
    async updateProfilePicture(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { profilePic } = req.body;
            if (!profilePic) {
                return res.status(400).json({ error: 'Profile picture URL is required' });
            }
            // Get user's role
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Update profile picture based on role
            if (user.role === 'INFLUENCER') {
                await prisma.influencer.update({
                    where: { userId },
                    data: { profilePic },
                });
            }
            else if (user.role === 'SALON') {
                await prisma.salon.update({
                    where: { userId },
                    data: { profilePic },
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Profile picture updated successfully',
                data: { profilePic },
            });
        }
        catch (error) {
            console.error('[ProfileController.updateProfilePicture] Error:', error);
            return res.status(500).json({ error: 'Failed to update profile picture' });
        }
    }
    /**
     * Delete user account
     * Permanently deletes user and all related data
     */
    async deleteAccount(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { password } = req.body;
            if (!password) {
                return res.status(400).json({ error: 'Password is required to delete account' });
            }
            // Get user with password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { password: true },
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Password is incorrect' });
            }
            // Delete user (cascade will handle related data)
            await prisma.user.delete({
                where: { id: userId },
            });
            return res.status(200).json({
                success: true,
                message: 'Account deleted successfully',
            });
        }
        catch (error) {
            console.error('[ProfileController.deleteAccount] Error:', error);
            return res.status(500).json({ error: 'Failed to delete account' });
        }
    }
    /**
     * Get user settings/preferences
     */
    async getSettings(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            console.error('[ProfileController.getSettings] Error:', error);
            return res.status(500).json({ error: 'Failed to fetch settings' });
        }
    }
}
export default new ProfileController();
