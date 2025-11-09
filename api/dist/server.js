import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import onboardingRoutes from './routes/onboarding.routes.js';
import socialMediaRoutes from './routes/socialMedia.routes.js';
import discoveryRoutes from './routes/discovery.routes.js';
import connectionRoutes from './routes/connection.routes.js';
import profileRoutes from './routes/profile.routes.js';
import chatRoutes from './routes/chat.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import proxyRoutes from './routes/proxy.routes.js';
import adminRoutes from './routes/admin.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import projectRoutes from './routes/project.routes.js';
import chatController from './controllers/chat.controller.js';
import notificationController from './controllers/notification.controller.js';
import projectController from './controllers/project.controller.js';
import { generalLimiter } from './middlewares/rateLimiter.middleware.js';
import tokenRefreshJob from './jobs/tokenRefresh.job.js';
import dataSyncSchedulerJob from './jobs/dataSyncScheduler.job.js';
import instagramReminderJob from './jobs/instagramReminder.job.js';
import { seedSuperAdmin } from './utils/seedSuperAdmin.util.js';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import logger from './utils/logger.util.js';
dotenv.config();
// Verify JWT_ACCESS_SECRET is loaded
if (!process.env.JWT_ACCESS_SECRET) {
    logger.error('FATAL ERROR: JWT_ACCESS_SECRET is not defined in environment variables');
    process.exit(1);
}
const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
const PORT = process.env.PORT || 3000;
app.use(cors());
// Stripe webhook requires raw body, so we need to handle it before express.json()
app.use('/api/v1/payment/webhook', express.raw({ type: 'application/json' }));
// Parse JSON for all other routes
app.use(express.json());
// Behind a proxy (Render/NGINX) to trust X-Forwarded-* headers for rate limit & IP detection
app.set('trust proxy', 1);
// Apply general rate limiting to all requests
app.use(generalLimiter);
// Set Socket.IO instance in controllers
chatController.setSocketIO(io);
notificationController.setSocketIO(io);
projectController.setSocketIO(io);
// Socket.IO authentication and connection handling
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        logger.error('[WebSocket Auth] No token provided');
        return next(new Error('Authentication error'));
    }
    try {
        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace('Bearer ', '');
        const decoded = jwt.verify(cleanToken, process.env.JWT_ACCESS_SECRET);
        socket.data.userId = decoded.userId;
        socket.data.role = decoded.role;
        logger.log(`[WebSocket Auth] User authenticated: ${decoded.userId}`);
        next();
    }
    catch (error) {
        logger.error('[WebSocket Auth] Token verification failed:', error);
        next(new Error('Authentication error'));
    }
});
io.on('connection', (socket) => {
    logger.log(`[WebSocket] User connected: ${socket.data.userId}`);
    // Join user's personal room
    socket.join(socket.data.userId);
    // Join conversation rooms
    socket.on('join_conversation', (conversationId) => {
        socket.join(conversationId);
        logger.log(`[WebSocket] User ${socket.data.userId} joined conversation ${conversationId}`);
    });
    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
        socket.leave(conversationId);
        logger.log(`[WebSocket] User ${socket.data.userId} left conversation ${conversationId}`);
    });
    // Typing indicator
    socket.on('typing_start', (data) => {
        socket.to(data.conversationId).emit('user_typing', {
            userId: socket.data.userId,
            conversationId: data.conversationId,
        });
    });
    socket.on('typing_stop', (data) => {
        socket.to(data.conversationId).emit('user_stopped_typing', {
            userId: socket.data.userId,
            conversationId: data.conversationId,
        });
    });
    // Handle disconnection
    socket.on('disconnect', () => {
        logger.log(`[WebSocket] User disconnected: ${socket.data.userId}`);
    });
});
// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/social-media', socialMediaRoutes);
app.use('/api/v1/discovery', discoveryRoutes);
app.use('/api/v1/connections', connectionRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/proxy', proxyRoutes); // Image proxy for CORS issues
app.use('/api/v1/admin', adminRoutes); // Admin panel routes
app.use('/api/v1/projects', projectRoutes); // Project proposal routes
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});
// Initialize cron jobs for automated tasks
try {
    tokenRefreshJob.init();
    dataSyncSchedulerJob.init();
    instagramReminderJob.init();
    logger.log('[cron]: Automated jobs initialized successfully');
}
catch (error) {
    logger.error('[cron]: Failed to initialize automated jobs:', error);
}
// Seed super admin account on server start
seedSuperAdmin().catch((error) => {
    logger.error('[Super Admin Seed] Failed:', error);
});
httpServer.listen(PORT, () => {
    logger.log(`[server]: Running at http://localhost:${PORT}`);
    logger.log(`[websocket]: WebSocket server ready`);
    logger.log(`[cron]: Token refresh job scheduled for 2:00 AM daily`);
    logger.log(`[cron]: Data sync job scheduled for 3:00 AM daily`);
    logger.log(`[cron]: Instagram reminder job scheduled for 10:00 AM every Monday`);
});
