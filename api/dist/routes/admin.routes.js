import express from 'express';
import adminController from '../controllers/admin.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
const router = express.Router();
// All admin routes require authentication and admin role
router.use(protect);
router.use(requireAdmin);
/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get dashboard statistics and charts
 * @access  Admin
 */
router.get('/dashboard', adminController.getDashboard.bind(adminController));
/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with pagination and filters
 * @access  Admin
 */
router.get('/users', adminController.getUsers.bind(adminController));
/**
 * @route   GET /api/v1/admin/users/:userId
 * @desc    Get single user details
 * @access  Admin
 */
router.get('/users/:userId', adminController.getUserDetails.bind(adminController));
/**
 * @route   POST /api/v1/admin/users
 * @desc    Create a new user
 * @access  Admin
 */
router.post('/users', adminController.createUser.bind(adminController));
/**
 * @route   PUT /api/v1/admin/users/:id
 * @desc    Update user details
 * @access  Admin
 */
router.put('/users/:id', adminController.updateUser.bind(adminController));
/**
 * @route   PATCH /api/v1/admin/users/:userId/suspend
 * @desc    Suspend user account
 * @access  Admin
 */
router.patch('/users/:userId/suspend', adminController.suspendUser.bind(adminController));
/**
 * @route   PATCH /api/v1/admin/users/:userId/activate
 * @desc    Activate user account
 * @access  Admin
 */
router.patch('/users/:userId/activate', adminController.activateUser.bind(adminController));
/**
 * @route   DELETE /api/v1/admin/users/:userId
 * @desc    Delete user account
 * @access  Admin
 */
router.delete('/users/:userId', adminController.deleteUser.bind(adminController));
/**
 * @route   GET /api/v1/admin/connections
 * @desc    Get all connections with pagination
 * @access  Admin
 */
router.get('/connections', adminController.getConnections.bind(adminController));
/**
 * @route   DELETE /api/v1/admin/connections/:connectionId
 * @desc    Delete connection
 * @access  Admin
 */
router.delete('/connections/:connectionId', adminController.deleteConnection.bind(adminController));
/**
 * @route   GET /api/v1/admin/activity-logs
 * @desc    Get activity logs with pagination
 * @access  Admin
 */
router.get('/activity-logs', adminController.getActivityLogs.bind(adminController));
/**
 * @route   GET /api/v1/admin/profile
 * @desc    Get admin profile
 * @access  Admin
 */
router.get('/profile', adminController.getAdminProfile.bind(adminController));
/**
 * @route   PUT /api/v1/admin/profile
 * @desc    Update admin profile (name, email)
 * @access  Admin
 */
router.put('/profile', adminController.updateAdminProfile.bind(adminController));
/**
 * @route   PUT /api/v1/admin/password
 * @desc    Update admin password
 * @access  Admin
 */
router.put('/password', adminController.updateAdminPassword.bind(adminController));
export default router;
