# Beautiful_Encer API (Backend)

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.1-000000.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.17-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791.svg)](https://www.postgresql.org/)

> **RESTful API backend for Beautiful_Encer - A dual-sided influencer marketing platform with real-time communication capabilities.**

This is the backend API service built with **Express 5**, **TypeScript**, and **PostgreSQL** with **Prisma ORM**. It handles authentication, user management, social media integration, real-time chat via Socket.IO, and automated data synchronization jobs.

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Database & Prisma](#-database--prisma)
- [API Endpoints](#-api-endpoints)
- [Authentication & Authorization](#-authentication--authorization)
- [Real-Time Communication](#-real-time-communication)
- [Services](#-services)
- [Automated Jobs](#-automated-jobs)
- [Middleware](#-middleware)
- [Error Handling](#-error-handling)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Best Practices](#-best-practices)

---

## 🏗 Architecture Overview

Beautiful_Encer API follows a **layered architecture** pattern:

```
┌─────────────────────────────────────┐
│   Client (Web Frontend / Mobile)   │
└──────────────┬──────────────────────┘
               │ HTTP/HTTPS + WebSocket
┌──────────────▼──────────────────────┐
│      Express Server + Socket.IO     │
├─────────────────────────────────────┤
│          Routes Layer               │ ← URL routing & validation
├─────────────────────────────────────┤
│        Middleware Layer             │ ← Auth, rate limiting, etc.
├─────────────────────────────────────┤
│       Controllers Layer             │ ← Request/response handling
├─────────────────────────────────────┤
│        Services Layer               │ ← Business logic
├─────────────────────────────────────┤
│      Database Layer (Prisma)        │ ← ORM & data access
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         PostgreSQL Database         │
└─────────────────────────────────────┘

External Services:
├─ Apify (Instagram/TikTok scraping)
├─ Cloudinary (Image storage)
├─ Resend/Nodemailer (Email)
└─ TikTok OAuth (Connected accounts)
```

### Key Design Patterns

1. **Singleton Pattern**: Single Prisma instance for database connections
2. **Dependency Injection**: Socket.IO instance injected into controllers
3. **Role-Based Access Control (RBAC)**: Dual-user system (Influencer/Salon)
4. **Repository Pattern**: Prisma ORM abstracts database operations
5. **Middleware Chain**: Modular request processing pipeline

---

## 🛠 Tech Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20+ | JavaScript runtime |
| **TypeScript** | 5.9 | Type-safe JavaScript |
| **Express** | 5.1 | Web framework |
| **Prisma ORM** | 6.17 | Database ORM |
| **PostgreSQL** | 14+ | Relational database |
| **Socket.IO** | 4.8 | Real-time bidirectional communication |

### Key Dependencies

```json
{
  "dependencies": {
    "express": "^5.1.0",           // Web framework
    "prisma": "^6.17.0",           // ORM
    "@prisma/client": "^6.17.0",   // Prisma client
    "socket.io": "^4.8.1",         // WebSocket
    "jsonwebtoken": "^9.0.2",      // JWT auth
    "bcryptjs": "^3.0.2",          // Password hashing
    "multer": "^2.0.2",            // File uploads
    "cloudinary": "^2.7.0",        // Image storage
    "apify-client": "^2.19.0",     // Social media scraping
    "nodemailer": "^7.0.10",       // Email (dev)
    "resend": "^6.3.0",            // Email (prod)
    "node-cron": "^3.0.3",         // Scheduled jobs
    "express-rate-limit": "^7.4.0", // Rate limiting
    "cors": "^2.8.5",              // CORS handling
    "dotenv": "^17.2.3"            // Environment variables
  }
}
```

---

## 📁 Project Structure

```
api/
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   ├── seed.ts                    # Database seeding script
│   └── migrations/                # Migration history
│       ├── migration_lock.toml
│       └── [timestamp]_[name]/    # Individual migrations
│
├── src/
│   ├── server.ts                  # Application entry point
│   │
│   ├── config/
│   │   └── cloudinary.config.ts   # Cloudinary setup
│   │
│   ├── controllers/               # Request handlers
│   │   ├── auth.controller.ts     # Authentication
│   │   ├── onboarding.controller.ts
│   │   ├── socialMedia.controller.ts
│   │   ├── discovery.controller.ts
│   │   ├── connection.controller.ts
│   │   ├── profile.controller.ts
│   │   ├── chat.controller.ts     # Real-time chat
│   │   ├── notification.controller.ts
│   │   ├── proxy.controller.ts    # Image proxy
│   │   └── admin.controller.ts
│   │
│   ├── routes/                    # API route definitions
│   │   ├── auth.routes.ts
│   │   ├── onboarding.routes.ts
│   │   ├── socialMedia.routes.ts
│   │   ├── discovery.routes.ts
│   │   ├── connection.routes.ts
│   │   ├── profile.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── proxy.routes.ts
│   │   └── admin.routes.ts
│   │
│   ├── services/                  # Business logic
│   │   ├── jwt.service.ts         # JWT token management
│   │   ├── email.service.ts       # Email sending (Resend/Nodemailer)
│   │   ├── apify.instagram.service.ts  # Instagram scraping (Apify)
│   │   ├── apify.tiktok.service.ts     # TikTok scraping (Apify)
│   │   ├── tiktok.service.ts      # TikTok OAuth
│   │   └── admin.service.ts
│   │
│   ├── middlewares/               # Request processing
│   │   ├── auth.middleware.ts     # JWT verification
│   │   ├── admin.middleware.ts    # Admin role check
│   │   ├── rateLimiter.middleware.ts  # Rate limiting
│   │   └── multer.config.ts       # File upload config
│   │
│   ├── jobs/                      # Cron jobs
│   │   ├── tokenRefresh.job.ts    # Refresh TikTok OAuth tokens
│   │   ├── dataSyncScheduler.job.ts   # Sync social media data
│   │   └── instagramReminder.job.ts   # Verification reminders
│   │
│   ├── lib/
│   │   └── prisma.ts              # Prisma client singleton
│   │
│   ├── utils/
│   │   ├── encryption.util.ts     # AES-256-GCM encryption
│   │   ├── logger.util.ts         # Logging utility
│   │   └── seedSuperAdmin.util.ts # Admin seeding
│   │
│   └── types/                     # TypeScript type definitions
│       └── express.d.ts           # Extended Express types
│
├── .env.example                   # Environment template
├── package.json
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14.0.0
- **Git**

### Installation

1. **Navigate to API directory**
   ```powershell
   cd api
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Set up environment variables**
   ```powershell
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and fill in all required values
   # See "Environment Configuration" section below
   ```

4. **Generate Prisma client**
   ```powershell
   npx prisma generate
   ```

5. **Run database migrations**
   ```powershell
   npx prisma migrate dev --name initial_setup
   ```

6. **Seed the database (optional)**
   ```powershell
   npm run seed
   ```

7. **Start development server**
   ```powershell
   npm run dev
   ```

The API will start on `http://localhost:3000` (or the port specified in `.env`).

### Quick Setup Script

Run all setup steps at once:
```powershell
cd api
npm run setup
```

This runs: `npm install` → `prisma generate` → `prisma migrate dev`

---

## ⚙️ Environment Configuration

Create a `.env` file in the `api/` directory. See `.env.example` for the complete template.

### Required Environment Variables

#### Server Configuration
```bash
PORT=3000
NODE_ENV=development  # production | development | test
FRONTEND_URL=http://localhost:5173
```

#### Database
```bash
# Local development
DATABASE_URL="postgresql://username:password@localhost:5432/beautifulencer?schema=public"

# Production (with SSL)
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&sslmode=require"
```

#### JWT Authentication
```bash
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_ACCESS_SECRET=your_32_character_secret_here
JWT_REFRESH_SECRET=your_32_character_secret_here
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
```

#### Encryption (for OAuth tokens)
```bash
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_32_character_encryption_key_here
ENCRYPTION_IV=your_16_byte_hex_iv_here
```

#### Email Service

**Option 1: Resend (Recommended for Production)**
```bash
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@beautifulencer.com
```

**Option 2: SMTP/Nodemailer (Development)**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=noreply@beautifulencer.com
```

#### Cloudinary (Image Storage)
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Apify (Social Media Scraping)
```bash
# Get from: https://console.apify.com/account/integrations
# Used for Instagram, TikTok (public), and YouTube scraping
APIFY_API_TOKEN=your_apify_token

# YouTube Channel Scraper Actor ID (recommended: streamers/youtube-channel-scraper)
APIFY_YOUTUBE_ACTOR_ID=streamers/youtube-channel-scraper
```

**Note on Apify Actors:**
- Instagram: `apify/instagram-profile-scraper` (configured in code)
- TikTok Public: `clockworks/tiktok-scraper` (configured in code)
- YouTube: `streamers/youtube-channel-scraper` (env variable)
  - Cost: ~$0.50 per 1,000 videos
  - Rating: 4.6/5 (286 users, 7.3K runs)
  - Provides channel info and recent videos (view counts accurate, likes/comments estimated)

#### TikTok OAuth (Connected Accounts)
```bash
# Get from: https://developers.tiktok.com/
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=http://localhost:3000/api/v1/social-media/tiktok/oauth/callback
```

### Generating Secrets

Use the provided script to generate secure random keys:
```powershell
node generate-secrets.js
```

This outputs properly formatted secrets for JWT, encryption, and other secure values.

---

## 🗄️ Database & Prisma

### Database Schema

The application uses **PostgreSQL** with **Prisma ORM**. The schema is defined in `prisma/schema.prisma`.

#### Key Models

**Users & Roles**
- `User` - Base user model with email, password, role
- `Influencer` - Extended profile for influencers
- `Salon` - Extended profile for salons
- `Role` enum: `INFLUENCER | SALON | ADMIN`

**Social Media**
- `SocialMediaAccount` - Connected accounts (Instagram/TikTok/YouTube)
- `SocialMediaPost` - Cached posts/videos with thumbnails and metadata
- `SocialMediaPlatform` enum: `INSTAGRAM | TIKTOK | YOUTUBE`
- Fields: `thumbnailUrl` (for video thumbnails), `metadata` (JSONB for extra data like duration, description)

**Connections & Chat**
- `ConnectionRequest` - Connection requests between users
- `Conversation` - Chat conversations
- `ConversationParticipant` - Many-to-many relationship
- `Message` - Chat messages

**Notifications**
- `Notification` - User notifications
- `NotificationType` enum: Various notification types

**Authentication**
- `Otp` - One-time passwords for email verification

**Admin**
- `ActivityLog` - Admin action logging

### Prisma Commands

```powershell
# Generate Prisma client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name descriptive_migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (visual database browser)
npx prisma studio

# Seed database
npm run seed
```

### Database Access Pattern

**Always use the singleton Prisma instance:**

```typescript
import { prisma } from '../lib/prisma.js';

// ✅ Correct
const users = await prisma.user.findMany();

// ❌ Never do this
const prisma = new PrismaClient();
```

### Migrations

Migrations are automatically generated when you modify `schema.prisma`:

```powershell
# 1. Edit prisma/schema.prisma
# 2. Generate migration
npx prisma migrate dev --name add_new_field

# 3. Prisma generates:
#    - SQL migration files in prisma/migrations/
#    - Updated TypeScript types

# 4. Migration is automatically applied to dev database
```

**Migration Workflow:**
1. **Development**: `prisma migrate dev` - Creates migration + applies it
2. **Production**: `prisma migrate deploy` - Only applies existing migrations

---

## 🔌 API Endpoints

All endpoints are prefixed with `/api/v1/`.

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/signup/influencer` | Create influencer account | No |
| `POST` | `/signup/salon` | Create salon account | No |
| `POST` | `/verify-otp` | Verify email with OTP | No |
| `POST` | `/resend-otp` | Resend OTP for verification | No |
| `POST` | `/login` | Login user | No |
| `POST` | `/forgot-password` | Request password reset | No |
| `POST` | `/verify-forgot-otp` | Verify password reset OTP | No |
| `POST` | `/reset-password` | Reset password | No |
| `POST` | `/resend-forgot-otp` | Resend password reset OTP | No |

**Example: Influencer Signup**
```typescript
POST /api/v1/auth/signup/influencer
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "termsAccepted": true
}

Response: 201 Created
{
  "success": true,
  "message": "Influencer account created successfully",
  "data": {
    "userId": "uuid-here",
    "email": "john@example.com"
  }
}
```

### Onboarding (`/api/v1/onboarding`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/influencer` | Complete influencer profile | Yes (Influencer) |
| `POST` | `/salon` | Complete salon profile | Yes (Salon) |

### Social Media (`/api/v1/social-media`)

**Instagram (Public Scraping via Apify)**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/instagram/connect` | Connect Instagram by username | Yes |
| `POST` | `/instagram/sync` | Manual sync (rate limited) | Yes |
| `GET` | `/instagram/:accountId` | Get account data | Yes |
| `DELETE` | `/instagram/:accountId` | Disconnect account | Yes |
| `GET` | `/instagram/profile/:username` | Public profile lookup | Yes |

**TikTok (Public Scraping via Apify)**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/tiktok/connect-public` | Connect TikTok by username | Yes |
| `POST` | `/tiktok/public/sync` | Manual sync (rate limited) | Yes |
| `GET` | `/tiktok/public/:accountId` | Get account data | Yes |
| `DELETE` | `/tiktok/public/:accountId` | Disconnect account | Yes |
| `GET` | `/tiktok/profile/:username` | Public profile lookup | Yes |
| `GET` | `/tiktok/videos/:username` | Public videos | Yes |

**TikTok OAuth (Connected Accounts)**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/tiktok/oauth/callback` | OAuth callback | No |
| `GET` | `/tiktok/auth` | Initiate OAuth flow | Yes |

**YouTube (Public Scraping via Apify)**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/youtube/connect` | Connect YouTube by channel handle | Yes |
| `POST` | `/youtube/sync` | Manual sync (rate limited) | Yes |
| `GET` | `/youtube/:accountId` | Get account data with videos | Yes |
| `DELETE` | `/youtube/:accountId` | Disconnect account | Yes |
| `GET` | `/youtube/profile/:username` | Public channel lookup | Yes |

**General**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/accounts` | List all connected accounts | Yes |

### Discovery (`/api/v1/discovery`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/influencers` | Search influencers (for salons) | Yes (Salon) |
| `GET` | `/salons` | Search salons (for influencers) | Yes (Influencer) |

**Query Parameters:**
- `search` - Name/business name
- `categories[]` - Filter by categories
- `region` - Filter by region
- `minFollowers` / `maxFollowers` - Follower range
- `cursor` - Pagination cursor
- `limit` - Results per page (default: 20)

### Connections (`/api/v1/connections`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/request` | Send connection request | Yes |
| `GET` | `/requests/sent` | Get sent requests | Yes |
| `GET` | `/requests/received` | Get received requests | Yes |
| `PATCH` | `/requests/:requestId/accept` | Accept request | Yes |
| `PATCH` | `/requests/:requestId/reject` | Reject request | Yes |
| `GET` | `/accepted` | Get accepted connections | Yes |

### Chat (`/api/v1/chat`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/contacts` | List contacts with search/filter | Yes |
| `GET` | `/conversations` | List conversations | Yes |
| `GET` | `/conversations/:otherUserId` | Get or create conversation | Yes |
| `GET` | `/conversations/:conversationId/messages` | Get messages | Yes |
| `POST` | `/conversations/:conversationId/messages` | Send message | Yes |
| `PATCH` | `/messages/:messageId` | Edit message | Yes |
| `DELETE` | `/messages/:messageId` | Delete message | Yes |
| `PATCH` | `/messages/:messageId/read` | Mark as read | Yes |

### Notifications (`/api/v1/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/` | Get all notifications | Yes |
| `GET` | `/unread` | Get unread count | Yes |
| `PATCH` | `/:notificationId/read` | Mark as read | Yes |
| `PATCH` | `/read-all` | Mark all as read | Yes |
| `DELETE` | `/:notificationId` | Delete notification | Yes |

### Profile (`/api/v1/profile`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/me` | Get own profile | Yes |
| `PUT` | `/update` | Update profile | Yes |
| `POST` | `/upload-picture` | Upload profile picture | Yes |
| `GET` | `/:userId` | Get user profile | Yes |

### Admin (`/api/v1/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/dashboard/stats` | Dashboard statistics | Yes (Admin) |
| `GET` | `/users` | List all users | Yes (Admin) |
| `GET` | `/users/:userId` | Get user details | Yes (Admin) |
| `PATCH` | `/users/:userId/suspend` | Suspend user | Yes (Admin) |
| `PATCH` | `/users/:userId/unsuspend` | Unsuspend user | Yes (Admin) |
| `DELETE` | `/users/:userId` | Delete user | Yes (Admin) |
| `GET` | `/connections` | List all connections | Yes (Admin) |
| `GET` | `/activity-logs` | Get activity logs | Yes (Admin) |

### Image Proxy (`/api/v1/proxy`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/image` | Proxy external images | No |

**Usage:** `/api/v1/proxy/image?url=https://external-image-url.com/image.jpg`

---

## 🔐 Authentication & Authorization

### JWT-Based Authentication

The API uses **JWT (JSON Web Tokens)** for stateless authentication.

#### Authentication Flow

```
1. User signs up → OTP sent to email
2. User verifies OTP → Email verified
3. User logs in → JWT access token issued
4. Client stores token in localStorage
5. Client sends token in Authorization header
6. Server validates token on protected routes
```

#### Token Structure

**Access Token:**
```typescript
{
  userId: "uuid",
  role: "INFLUENCER" | "SALON" | "ADMIN",
  iat: 1234567890,  // Issued at
  exp: 1234568790   // Expires (15 minutes default)
}
```

#### Using Protected Routes

**Backend (Express):**
```typescript
import { protect } from '../middlewares/auth.middleware.js';

// Protect all routes in file
router.use(protect);

// Or protect specific routes
router.get('/endpoint', protect, controller.method);
```

**Client Request:**
```typescript
// Axios automatically adds token via interceptor
axios.get('/api/v1/profile/me');

// Or manually:
fetch('/api/v1/profile/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Role-Based Access Control (RBAC)

**Roles:**
- `INFLUENCER` - Can search salons, connect, chat
- `SALON` - Can search influencers, connect, chat
- `ADMIN` - Full access to admin panel

**Example: Role-specific endpoint**
```typescript
// controllers/discovery.controller.ts
async getInfluencers(req: Request, res: Response) {
  // Only accessible by SALON role
  if (req.user.role !== 'SALON') {
    return res.status(403).json({ error: 'Access denied' });
  }
  // ... fetch influencers
}
```

### Middleware Chain

```typescript
// Auth middleware extracts user from JWT
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { influencer: true, salon: true }
    });
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Admin Middleware

```typescript
import { requireAdmin } from '../middlewares/admin.middleware.js';

// Require admin role
router.use(requireAdmin);
```

---

## 🔄 Real-Time Communication

Beautiful_Encer uses **Socket.IO** for real-time bidirectional communication.

### Socket.IO Setup

**Server (`server.ts`):**
```typescript
import { Server as SocketServer } from 'socket.io';

const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Authenticate socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  socket.data.userId = decoded.userId;
  socket.data.role = decoded.role;
  next();
});

// Inject Socket.IO into controllers
chatController.setSocketIO(io);
notificationController.setSocketIO(io);
```

**Controller:**
```typescript
class ChatController {
  private io: Server | null = null;

  setSocketIO(io: Server) {
    this.io = io;
  }

  async sendMessage(req: Request, res: Response) {
    // ... save message to database
    
    // Emit real-time event
    this.io?.to(conversationId).emit('message_sent', messageData);
  }
}
```

### Socket Events

#### Chat Events

**Client → Server:**
- `join_conversation` - Join a conversation room
- `leave_conversation` - Leave a conversation room
- `typing_start` - User started typing
- `typing_stop` - User stopped typing

**Server → Client:**
- `message_sent` - New message received
- `message_edited` - Message was edited
- `message_deleted` - Message was deleted
- `user_typing` - Other user is typing
- `user_stopped_typing` - Other user stopped typing

#### Notification Events

**Server → Client:**
- `notification_received` - New notification
- `notification_read` - Notification was read
- `notification_deleted` - Notification was deleted

### Socket Room Pattern

Users join rooms for targeted messaging:

```typescript
// User joins their personal room
socket.join(userId);

// User joins conversation room
socket.join(conversationId);

// Emit to specific room
io.to(conversationId).emit('message_sent', data);

// Emit to specific user
io.to(otherUserId).emit('notification_received', data);
```

### Client Connection

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('accessToken')
  }
});

// Listen for events
socket.on('message_sent', (message) => {
  console.log('New message:', message);
});

// Emit events
socket.emit('join_conversation', { conversationId: 'uuid' });
```

---

## 🛠 Services

Services contain the core business logic separated from request handling.

### JWT Service (`jwt.service.ts`)

```typescript
import jwt from 'jsonwebtoken';

class JWTService {
  generateAccessToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
    );
  }

  verifyToken(token: string): { userId: string; role: string } {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  }
}
```

### Email Service (`email.service.ts`)

Supports multiple email providers:

**Resend (Production):**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async sendOTP(email: string, otp: string) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify your email',
    html: `Your OTP is: <strong>${otp}</strong>`
  });
}
```

**Nodemailer (Development):**
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

### Apify Instagram Service (`apify.instagram.service.ts`)

Scrapes Instagram public profiles without OAuth:

```typescript
class ApifyInstagramService {
  async scrapeInstagramProfile(username: string) {
    const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
    
    const run = await client.actor('apify/instagram-profile-scraper').call({
      usernames: [username],
      resultsLimit: 1
    });
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    return items[0]; // Profile data
  }

  async connectInstagramAccount(userId: string, username: string) {
    const profileData = await this.scrapeInstagramProfile(username);
    
    // Save to database with 7-day cache
    const account = await prisma.socialMediaAccount.create({
      data: {
        userId,
        platform: 'INSTAGRAM',
        username,
        displayName: profileData.fullName,
        profilePicture: profileData.profilePicUrl,
        followersCount: profileData.followersCount,
        // ... more fields
        lastScrapedAt: new Date(),
        metadata: { /* top hashtags, etc. */ }
      }
    });
    
    return account;
  }
}
```

**Features:**
- No OAuth required
- 7-day data caching
- Automatic hashtag extraction
- Cost-effective (~$5/month for 500-1000 profiles)

### Apify TikTok Service (`apify.tiktok.service.ts`)

Similar to Instagram service, scrapes TikTok public profiles:

```typescript
class ApifyTikTokService {
  async scrapeTikTokProfile(username: string) {
    // Similar pattern to Instagram
    // Scrapes profile + recent videos
  }

  async connectTikTokAccount(userId: string, username: string) {
    // Save public TikTok data
  }
}
```

### TikTok OAuth Service (`tiktok.service.ts`)

For connected TikTok accounts with OAuth:

```typescript
class TikTokService {
  async refreshAccessToken(accountId: string) {
    const account = await prisma.socialMediaAccount.findUnique({
      where: { id: accountId }
    });
    
    // Decrypt stored refresh token
    const refreshToken = decrypt(account.encryptedRefreshToken);
    
    // Exchange for new access token
    const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });
    
    // Encrypt and store new tokens
    const encryptedAccessToken = encrypt(response.data.access_token);
    await prisma.socialMediaAccount.update({
      where: { id: accountId },
      data: { 
        accessToken: encryptedAccessToken,
        tokenExpiresAt: new Date(Date.now() + response.data.expires_in * 1000)
      }
    });
  }
}
```

### Apify YouTube Service (`apify.youtube.service.ts`)

Scrapes YouTube public channels without OAuth:

```typescript
class ApifyYouTubeService {
  async scrapeYouTubeChannel(channelHandle: string) {
    const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
    
    // Uses streamers/youtube-channel-scraper actor
    const run = await client.actor(this.actorId).call({
      channelUrls: [`https://www.youtube.com/@${channelHandle}`],
      maxResults: 20
    });
    
    // Extract channel info and recent videos
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const profile = items[0].channelInfo;
    const videos = items.filter(item => item.type === 'video');
    
    // Calculate engagement metrics
    // Note: Individual video likes/comments estimated using industry rates
    const averageViews = Math.round(totalViews / videos.length);
    const averageLikes = Math.round(averageViews * 0.04); // 4% like rate
    const averageComments = Math.round(averageViews * 0.005); // 0.5% comment rate
    
    return { profile, videos, averageLikes, averageComments };
  }

  async connectYouTubeAccount(userId: string, channelHandle: string) {
    const scrapedData = await this.scrapeYouTubeChannel(channelHandle);
    
    // Check if account exists (update) or create new
    // Store videos with estimated engagement
    await this.storeVideos(accountId, scrapedData.recentVideos);
  }
  
  async syncYouTubeData(accountId: string) {
    // Refresh data if cache expired (7 days)
    // Rate limited: max 3 syncs per hour
  }
}
```

**Important Notes**:
- YouTube channel scraper API **does not provide** individual video likes/comments
- Engagement metrics (likes/comments) are **estimated** using industry-standard rates:
  - **Like rate**: 4% of average views (typical for YouTube)
  - **Comment rate**: 0.5% of average views
- View counts are **accurate** from the scraper
- 7-day data caching reduces API costs (same as Instagram/TikTok)
- Manual sync available with rate limiting (3 per hour)

### Admin Service (`admin.service.ts`)

```typescript
class AdminService {
  async getDashboardStats() {
    const [totalUsers, totalConnections, activeToday] = await Promise.all([
      prisma.user.count(),
      prisma.connectionRequest.count({ where: { status: 'ACCEPTED' } }),
      prisma.user.count({ where: { updatedAt: { gte: startOfToday() } } })
    ]);
    
    return { totalUsers, totalConnections, activeToday };
  }
}
```

---

## ⏰ Automated Jobs

Beautiful_Encer runs **three cron jobs** for automated maintenance tasks.

### 1. Token Refresh Job (`tokenRefresh.job.ts`)

**Schedule:** Daily at 2:00 AM
**Purpose:** Refresh TikTok OAuth tokens before expiry

```typescript
import cron from 'node-cron';

export default {
  init() {
    cron.schedule('0 2 * * *', async () => {
      console.log('[Token Refresh] Starting job...');
      
      // Find tokens expiring in next 7 days
      const expiringAccounts = await prisma.socialMediaAccount.findMany({
        where: {
          platform: 'TIKTOK',
          accessToken: { not: null },
          tokenExpiresAt: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      });
      
      // Refresh each token
      for (const account of expiringAccounts) {
        await tiktokService.refreshAccessToken(account.id);
      }
      
      console.log(`[Token Refresh] Refreshed ${expiringAccounts.length} tokens`);
    });
  }
};
```

### 2. Data Sync Scheduler (`dataSyncScheduler.job.ts`)

**Schedule:** Daily at 3:00 AM
**Purpose:** Sync Instagram/TikTok/YouTube data for active accounts

```typescript
export default {
  init() {
    cron.schedule('0 3 * * *', async () => {
      console.log('[Data Sync] Starting job...');
      
      // Find accounts not synced in last 7 days
      const accountsToSync = await prisma.socialMediaAccount.findMany({
        where: {
          lastScrapedAt: {
            lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });
      
      // Sync each account based on platform
      for (const account of accountsToSync) {
        if (account.platform === 'INSTAGRAM') {
          await apifyInstagramService.syncInstagramData(account.id);
        } else if (account.platform === 'TIKTOK') {
          if (account.accessToken) {
            // OAuth account
            await tiktokService.syncTikTokData(account.id);
          } else {
            // Public scraping
            await apifyTikTokService.syncTikTokData(account.id);
          }
        } else if (account.platform === 'YOUTUBE') {
          // Public scraping (YouTube doesn't use OAuth)
          await apifyYouTubeService.syncYouTubeData(account.id);
        }
      }
      
      console.log(`[Data Sync] Synced ${accountsToSync.length} accounts`);
    });
  }
};
```

### 3. Instagram Reminder Job (`instagramReminder.job.ts`)

**Schedule:** Daily at 10:00 AM
**Purpose:** Remind users to verify Instagram accounts

```typescript
export default {
  init() {
    cron.schedule('0 10 * * *', async () => {
      console.log('[Instagram Reminder] Starting job...');
      
      // Find unverified Instagram accounts older than 3 days
      const unverifiedAccounts = await prisma.socialMediaAccount.findMany({
        where: {
          platform: 'INSTAGRAM',
          verified: false,
          createdAt: {
            lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          }
        },
        include: { user: true }
      });
      
      // Send reminder emails
      for (const account of unverifiedAccounts) {
        await emailService.sendInstagramVerificationReminder(
          account.user.email,
          account.username
        );
      }
      
      console.log(`[Instagram Reminder] Sent ${unverifiedAccounts.length} reminders`);
    });
  }
};
```

### Job Initialization

Jobs are initialized in `server.ts`:

```typescript
import tokenRefreshJob from './jobs/tokenRefresh.job.js';
import dataSyncSchedulerJob from './jobs/dataSyncScheduler.job.js';
import instagramReminderJob from './jobs/instagramReminder.job.js';

// Initialize cron jobs
tokenRefreshJob.init();
dataSyncSchedulerJob.init();
instagramReminderJob.init();

console.log('[Cron Jobs] All jobs initialized');
```

---

## 🛡️ Middleware

### Auth Middleware (`auth.middleware.ts`)

Protects routes by verifying JWT tokens:

```typescript
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET) as {
      userId: string;
      role: string;
    };

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        influencer: true,
        salon: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

### Admin Middleware (`admin.middleware.ts`)

Restricts routes to admin users only:

```typescript
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

### Rate Limiter (`rateLimiter.middleware.ts`)

Prevents abuse by limiting request frequency:

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Max 1000 requests per window
  message: 'Too many requests, please try again later'
});

// Strict limiter for sensitive endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Max 5 requests per window
  message: 'Too many authentication attempts'
});

// Manual sync limiter
export const syncLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 syncs per hour
  message: 'Sync limit reached. Automatic sync runs daily at 3 AM.'
});
```

**Usage:**
```typescript
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';

router.post('/login', authLimiter, authController.login);
```

### Multer Config (`multer.config.ts`)

Handles file uploads with validation:

```typescript
import multer from 'multer';

// Memory storage (files stored in RAM, not disk)
const storage = multer.memoryStorage();

// File filter (only images)
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});
```

**Usage:**
```typescript
router.post('/upload-picture', 
  protect, 
  upload.single('profilePic'), 
  profileController.uploadPicture
);
```

---

## ❗ Error Handling

### Error Response Format

All errors follow a consistent JSON structure:

```typescript
// Success response
{
  "success": true,
  "data": { /* response data */ }
}

// Error response
{
  "error": "Brief error name",
  "message": "Detailed user-facing message",
  "code": "ERROR_CODE" // Optional
}
```

### Controller Error Handling Pattern

```typescript
async methodName(req: Request, res: Response) {
  try {
    // Business logic
    const result = await someService.doSomething();
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[ControllerName.methodName] Error:', error);
    
    // Return user-friendly error
    return res.status(500).json({
      error: 'Operation failed',
      message: error.message || 'An unexpected error occurred'
    });
  }
}
```

### Common HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid input/validation error |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Validation Errors

```typescript
// Missing required field
if (!email || !password) {
  return res.status(400).json({
    error: 'Validation error',
    message: 'Email and password are required'
  });
}

// Invalid format
if (!isValidEmail(email)) {
  return res.status(400).json({
    error: 'Invalid email',
    message: 'Please provide a valid email address'
  });
}
```

### Database Errors

```typescript
try {
  const user = await prisma.user.create({ data });
} catch (error: any) {
  // Duplicate email (unique constraint)
  if (error.code === 'P2002') {
    return res.status(409).json({
      error: 'Email already exists',
      message: 'An account with this email already exists'
    });
  }
  
  // Foreign key constraint
  if (error.code === 'P2003') {
    return res.status(400).json({
      error: 'Invalid reference',
      message: 'Referenced resource does not exist'
    });
  }
  
  // Generic database error
  return res.status(500).json({
    error: 'Database error',
    message: 'Failed to perform database operation'
  });
}
```

---

## 🧪 Testing

### Manual Testing

Use the included Postman collection for testing endpoints:

1. Import collection from `api/POSTMAN_TESTING_GUIDE.md` (if available)
2. Set environment variables:
   - `BASE_URL`: `http://localhost:3000/api/v1`
   - `AUTH_TOKEN`: Token from login response

### Testing Workflow

```powershell
# 1. Start the server
cd api
npm run dev

# 2. Test health endpoint
curl http://localhost:3000/health

# 3. Test authentication flow
# Signup → Verify OTP → Login → Use token for protected routes
```

### Common Test Scenarios

**1. User Registration & Authentication**
```bash
# Signup
POST http://localhost:3000/api/v1/auth/signup/influencer
Body: { "name": "Test User", "email": "test@example.com", "password": "Test123!", "termsAccepted": true }

# Check email for OTP, then verify
POST http://localhost:3000/api/v1/auth/verify-otp
Body: { "email": "test@example.com", "otp": "123456" }

# Login
POST http://localhost:3000/api/v1/auth/login
Body: { "email": "test@example.com", "password": "Test123!" }

# Copy token from response
```

**2. Social Media Integration**
```bash
# Connect Instagram (replace {token} with your JWT)
POST http://localhost:3000/api/v1/social-media/instagram/connect
Headers: Authorization: Bearer {token}
Body: { "username": "instagram_username" }

# Get Instagram data
GET http://localhost:3000/api/v1/social-media/accounts
Headers: Authorization: Bearer {token}
```

**3. Real-Time Chat**
```javascript
// Frontend: Connect to Socket.IO
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('join_conversation', { conversationId: 'uuid' });
});

socket.on('message_sent', (message) => {
  console.log('New message:', message);
});
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production database with SSL (`sslmode=require`)
- [ ] Set strong random secrets (32+ characters)
- [ ] Use Resend for email (not SMTP)
- [ ] Enable `trust proxy` for rate limiting
- [ ] Set appropriate CORS origin
- [ ] Run `prisma migrate deploy` (not `migrate dev`)
- [ ] Configure monitoring/logging
- [ ] Set up automated backups for database

### Deployment on Render

**1. Create Web Service**
- Build Command: `cd api && npm install && npx prisma generate && npm run build`
- Start Command: `cd api && npx prisma migrate deploy && npm start`
- Environment: Node 20+

**2. Environment Variables**
Add all required variables from `.env.example` to Render dashboard.

**3. Database**
- Use Render PostgreSQL or external provider
- Ensure connection string includes `?sslmode=require`

**4. Custom Domain**
- Add custom domain in Render dashboard
- Update `FRONTEND_URL` to match your frontend domain

### Deployment on Other Platforms

**Heroku:**
```bash
# Install Heroku CLI
heroku login
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set JWT_ACCESS_SECRET=xxx
heroku config:set ENCRYPTION_KEY=xxx
# ... set all other env vars

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

**VPS (Ubuntu + PM2 + Nginx):**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone your-repo.git
cd your-repo/api

# Install dependencies
npm install
npx prisma generate

# Set environment variables
nano .env  # Add all variables

# Run migrations
npx prisma migrate deploy

# Start with PM2
pm2 start npm --name "beautiful-encer-api" -- start
pm2 save
pm2 startup

# Install Nginx
sudo apt install nginx

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/api.yourdomain.com

# Nginx config:
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### Database Migrations in Production

**Never use `prisma migrate dev` in production!**

```powershell
# Production migration workflow:

# 1. Local: Create migration
npx prisma migrate dev --name add_new_feature

# 2. Commit migration files
git add prisma/migrations
git commit -m "Add new feature migration"
git push

# 3. Production: Apply migration
npx prisma migrate deploy
```

### Health Monitoring

The API exposes a health endpoint:

```bash
GET http://localhost:3000/health

Response: 200 OK
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

Use this endpoint for:
- Uptime monitoring (Uptime Robot, Pingdom)
- Load balancer health checks
- Container orchestration health probes

---

## 📚 Best Practices

### Code Style

1. **TypeScript Strict Mode**: Always enabled
2. **ESM Imports**: Use `.js` extension in imports
   ```typescript
   import { prisma } from '../lib/prisma.js'; // ✅
   import { prisma } from '../lib/prisma';    // ❌
   ```

3. **Controllers**: Class-based with singleton export
   ```typescript
   class AuthController {
     async login(req: Request, res: Response) { /* ... */ }
   }
   export default new AuthController();
   ```

4. **Services**: Reusable business logic
   ```typescript
   class EmailService {
     async sendOTP(email: string, otp: string) { /* ... */ }
   }
   export default new EmailService();
   ```

5. **Error Handling**: Try-catch in all async functions
   ```typescript
   try {
     // logic
   } catch (error: any) {
     console.error('[ControllerName.method] Error:', error);
     return res.status(500).json({ error: 'Message' });
   }
   ```

### Security

1. **Never commit `.env`** - Use `.env.example` instead
2. **Use strong secrets** - Min 32 characters, cryptographically random
3. **Encrypt sensitive data** - OAuth tokens use AES-256-GCM
4. **Rate limiting** - Applied globally and per-endpoint
5. **Input validation** - Validate all user inputs
6. **SQL injection prevention** - Prisma automatically escapes queries
7. **Password hashing** - bcrypt with salt rounds = 10

### Database

1. **Single Prisma instance** - Use the singleton from `lib/prisma.ts`
2. **Always run `prisma generate`** after schema changes
3. **Migrations workflow**:
   - Local: `prisma migrate dev`
   - Production: `prisma migrate deploy`
4. **Use transactions** for multiple related operations
   ```typescript
   await prisma.$transaction([
     prisma.user.create({ data: userData }),
     prisma.influencer.create({ data: influencerData })
   ]);
   ```

### Performance

1. **Database indexes** - Index frequently queried fields
2. **Eager loading** - Use `include` to reduce N+1 queries
   ```typescript
   const user = await prisma.user.findUnique({
     where: { id },
     include: { influencer: true, salon: true } // ✅
   });
   ```
3. **Pagination** - Use cursor pagination for large datasets
4. **Caching** - 7-day cache for social media data
5. **Connection pooling** - Prisma manages connections automatically

### Socket.IO

1. **Authenticate connections** - Always verify JWT in middleware
2. **Use rooms** - Target messages to specific users/conversations
3. **Event naming convention**:
   - Client → Server: Imperative (`join_conversation`)
   - Server → Client: Past tense (`message_sent`)
4. **Error handling** - Wrap socket handlers in try-catch

### API Design

1. **RESTful conventions** - Use proper HTTP methods
2. **Consistent responses** - Always return JSON
3. **Versioning** - All routes prefixed with `/api/v1/`
4. **Documentation** - JSDoc comments for public APIs
5. **Status codes** - Use appropriate HTTP status codes

---

## 📖 Additional Resources

### Documentation

- **Express**: https://expressjs.com/
- **Prisma**: https://www.prisma.io/docs
- **Socket.IO**: https://socket.io/docs/
- **TypeScript**: https://www.typescriptlang.org/docs/

### Environment Setup

- **Node.js**: https://nodejs.org/
- **PostgreSQL**: https://www.postgresql.org/download/
- **Apify**: https://docs.apify.com/
- **Cloudinary**: https://cloudinary.com/documentation

### Deployment

- **Render**: https://render.com/docs
- **Heroku**: https://devcenter.heroku.com/
- **Digital Ocean**: https://www.digitalocean.com/docs/

---

## 🆘 Troubleshooting

### Common Issues

**1. `JWT_ACCESS_SECRET is not defined`**
- Ensure `.env` file exists and contains all required variables
- Check that `dotenv.config()` is called before accessing env vars

**2. Prisma client errors**
```powershell
# Regenerate Prisma client
npx prisma generate
```

**3. Migration errors**
```powershell
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or fix manually
npx prisma db push
```

**4. Socket.IO connection fails**
- Verify JWT token is passed in `handshake.auth.token`
- Check CORS configuration matches frontend URL
- Ensure server is running on correct port

**5. Rate limit errors**
- Wait for the rate limit window to expire
- Adjust rate limits in `rateLimiter.middleware.ts` for development

**6. Email not sending**
- Check email service credentials (Resend API key or SMTP)
- Verify firewall allows outbound connections on port 587/465
- Check spam folder

**7. Image upload fails**
- Verify Cloudinary credentials
- Check file size (max 5MB)
- Ensure file is an image format

---

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Code Standards:**
- Follow existing code style
- Add JSDoc comments for public APIs
- Include tests for new features
- Update documentation as needed

---

## 📧 Support

For questions or issues:
- Open an issue on GitHub
- Contact: support@beautifulencer.com

---

**Built with ❤️ for the Beautiful_Encer platform**
