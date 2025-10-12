import { Router } from 'express';
import profileController from '../controllers/profile.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.config.js';

const router = Router();

// Get current user's own profile
router.get('/me', authenticateToken, profileController.getMyProfile);

// Update profile details
router.patch('/update', authenticateToken, profileController.updateProfile);

// Change password
router.post('/change-password', authenticateToken, profileController.changePassword);

// Upload profile picture with file
router.post('/upload-profile-picture', authenticateToken, upload.single('profilePic'), profileController.uploadProfilePictureWithFile);

// Update profile picture (URL only)
router.patch('/profile-picture', authenticateToken, profileController.updateProfilePicture);

// Get settings
router.get('/settings/me', authenticateToken, profileController.getSettings);

// Delete account
router.delete('/delete-account', authenticateToken, profileController.deleteAccount);

// Get any user's profile by ID
router.get('/:userId', authenticateToken, profileController.getUserProfile);

export default router;
