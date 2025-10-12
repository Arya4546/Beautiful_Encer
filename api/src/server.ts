import express, { type Express, type Request, type Response } from 'express';
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
import chatController from './controllers/chat.controller.js';
import notificationController from './controllers/notification.controller.js';
import { generalLimiter } from './middlewares/rateLimiter.middleware.js';
import tokenRefreshJob from './jobs/tokenRefresh.job.js';
import dataSyncSchedulerJob from './jobs/dataSyncScheduler.job.js';
import cors from 'cors';
import jwt from 'jsonwebtoken';

dotenv.config();

// Verify JWT_ACCESS_SECRET is loaded
if (!process.env.JWT_ACCESS_SECRET) {
  console.error('FATAL ERROR: JWT_ACCESS_SECRET is not defined in environment variables');
  process.exit(1);
}

const app: Express = express();
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
app.use(express.json());

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Set Socket.IO instance in controllers
chatController.setSocketIO(io);
notificationController.setSocketIO(io);

// Socket.IO authentication and connection handling
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    console.error('[WebSocket Auth] No token provided');
    return next(new Error('Authentication error'));
  }

  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace('Bearer ', '');
    const decoded = jwt.verify(cleanToken, process.env.JWT_ACCESS_SECRET as string) as {
      userId: string;
      role: string;
    };
    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role;
    console.log(`[WebSocket Auth] User authenticated: ${decoded.userId}`);
    next();
  } catch (error) {
    console.error('[WebSocket Auth] Token verification failed:', error);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`[WebSocket] User connected: ${socket.data.userId}`);

  // Join user's personal room
  socket.join(socket.data.userId);

  // Join conversation rooms
  socket.on('join_conversation', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`[WebSocket] User ${socket.data.userId} joined conversation ${conversationId}`);
  });

  // Leave conversation room
  socket.on('leave_conversation', (conversationId: string) => {
    socket.leave(conversationId);
    console.log(`[WebSocket] User ${socket.data.userId} left conversation ${conversationId}`);
  });

  // Typing indicator
  socket.on('typing_start', (data: { conversationId: string }) => {
    socket.to(data.conversationId).emit('user_typing', {
      userId: socket.data.userId,
      conversationId: data.conversationId,
    });
  });

  socket.on('typing_stop', (data: { conversationId: string }) => {
    socket.to(data.conversationId).emit('user_stopped_typing', {
      userId: socket.data.userId,
      conversationId: data.conversationId,
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[WebSocket] User disconnected: ${socket.data.userId}`);
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/social-media', socialMediaRoutes);
app.use('/api/v1/discovery', discoveryRoutes);
app.use('/api/v1/connections', connectionRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Initialize cron jobs for automated tasks
try {
  tokenRefreshJob.init();
  dataSyncSchedulerJob.init();
  console.log('[cron]: Automated jobs initialized successfully');
} catch (error) {
  console.error('[cron]: Failed to initialize automated jobs:', error);
}

httpServer.listen(PORT, () => {
  console.log(`[server]: Running at http://localhost:${PORT}`);
  console.log(`[websocket]: WebSocket server ready`);
  console.log(`[cron]: Token refresh job scheduled for 2:00 AM daily`);
  console.log(`[cron]: Data sync job scheduled for 3:00 AM daily`);
});
