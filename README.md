# Beautiful_Encer 🌸

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **A sophisticated dual-sided influencer marketing platform connecting nano/micro-influencers with salons through intelligent matchmaking and real-time collaboration.**

Beautiful_Encer bridges the gap between emerging social media influencers and beauty salons, creating mutually beneficial partnerships through data-driven discovery, seamless communication, and verified social media analytics.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Beautiful_Encer is designed to democratize influencer marketing by making it accessible to small and medium-sized salons while providing nano and micro-influencers with genuine partnership opportunities. The platform leverages public social media data through intelligent scraping and offers OAuth integration for connected account features.

### Target Users

**Influencers (Nano/Micro)**
- 1K - 100K followers on Instagram or TikTok
- Looking for brand collaboration opportunities
- Want to showcase their work with verified metrics
- Seeking authentic partnerships with local businesses

**Salons**
- Small to medium-sized beauty salons
- Looking for cost-effective marketing channels
- Want to connect with local influencers
- Seeking to increase brand awareness and customer base

### Business Model

The platform facilitates:
- **Discovery**: Smart search and filtering based on categories, location, engagement rates
- **Connection**: Structured connection request system with personalized messages
- **Communication**: Real-time chat with typing indicators and message status
- **Verification**: Social media account verification and 7-day change lock for trust
- **Analytics**: Cached metrics refreshed daily to track influencer growth

---

## ✨ Key Features

### 🔐 **Authentication & Security**
- Dual-role authentication system (Influencer/Salon)
- JWT-based access control with refresh token support
- Email verification via OTP (One-Time Password)
- Password reset with secure OTP verification
- Rate limiting on all authentication endpoints
- AES-256-GCM encryption for OAuth tokens

### 👥 **User Management**
- Separate onboarding flows for Influencers and Salons
- Rich profile customization with image uploads
- Multi-category selection for better matching
- Regional/location-based filtering (Japanese prefectures)
- Terms acceptance tracking with timestamps
- Profile completion indicators

### 📱 **Social Media Integration**

#### Instagram (Public Data via Apify)
- Profile scraping without OAuth requirement
- Follower/following counts, engagement rates
- Recent posts with captions and hashtags
- Automatic hashtag extraction (top 10)
- 7-day data caching to minimize costs
- Profile picture and bio extraction

#### TikTok (Dual Mode)
- **Public Scraping**: Profile and video data via Apify (like Instagram)
- **OAuth Flow**: Connected accounts with token refresh for advanced features
- Video metrics (likes, comments, shares, views)
- Daily automated data synchronization
- Token refresh job (2 AM daily) for OAuth accounts

#### YouTube (Public Data via Apify)
- Channel profile scraping without OAuth requirement
- Subscriber count, video count, total channel views
- Recent videos with titles, thumbnails, durations
- View counts per video (likes/comments estimated)
- Engagement rate calculation based on views
- Automatic hashtag extraction from descriptions
- 7-day data caching to minimize costs
- Manual sync available with rate limiting
- **Note**: Individual video likes/comments estimated using industry-standard rates (4% like rate, 0.5% comment rate) as YouTube channel scraper API doesn't provide this data

### 🔍 **Discovery & Matchmaking**
- Advanced search with multiple filters:
  - Categories (Beauty, Fashion, Lifestyle, Food, etc.)
  - Region (Japanese prefectures)
  - Follower count ranges
  - Engagement rate thresholds
  - Minimum posts count
- Cursor-based pagination for smooth scrolling
- Role-based discovery (Influencers see Salons, vice versa)
- Real-time availability status

### 🤝 **Connection System**
- Structured connection request workflow
- Personalized messages with requests
- Accept/Reject functionality
- Connection history and status tracking
- Automatic notification on status changes
- Activity logging for admin oversight

### 💬 **Real-Time Chat**
- WebSocket-based instant messaging via Socket.IO
- Conversation creation between connected users
- Message editing and deletion with soft delete
- Typing indicators for active users
- File and image sharing with Cloudinary storage
- Message read status tracking
- Unread message counters
- Conversation search and filtering
- Server-side search across contacts
- Infinite scroll with cursor pagination

### 🔔 **Notification System**
- Real-time push notifications via WebSocket
- Multi-type notifications:
  - Connection requests (sent/received)
  - Connection acceptance/rejection
  - New messages and replies
  - Profile views
  - System announcements
- Read/unread status tracking
- Notification history with filtering
- Badge counters for unread items

### 🛠️ **Admin Dashboard**
- Super admin seeding on server start
- User management (view, suspend, activate, delete)
- Connection oversight and moderation
- Activity logs for all admin actions
- System health monitoring
- Analytics and reporting capabilities
- Notification broadcasting

### 🌐 **Internationalization (i18n)**
- Multi-language support (English/Japanese)
- Dynamic language switching
- Localized UI components
- Date/time formatting per locale
- Legal document translations (Terms, Privacy Policy)

### 🎨 **User Experience**
- Responsive design (mobile-first approach)
- Dark mode support (future)
- Loading states and skeleton screens
- Toast notifications for user feedback
- Error boundaries for graceful degradation
- Image proxy for CORS handling
- Fallback placeholders for broken images
- Smooth animations with Framer Motion

---

## 🛠️ Technology Stack

### **Backend (API)**

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20+ | Runtime environment |
| **Express.js** | 5.x | Web framework |
| **TypeScript** | 5.9 | Type-safe JavaScript |
| **PostgreSQL** | 14+ | Primary database |
| **Prisma ORM** | 6.17 | Database ORM and migrations |
| **Socket.IO** | 4.8 | Real-time bidirectional communication |
| **JWT** | 9.0 | Authentication tokens |
| **bcryptjs** | 3.x | Password hashing |
| **Nodemailer** | 7.x | Email delivery (dev) |
| **Resend** | 6.x | Email delivery (production) |
| **Cloudinary** | 2.x | Image upload and storage |
| **Multer** | 2.x | File upload middleware |
| **Apify Client** | 2.19 | Social media scraping |
| **node-cron** | 3.x | Scheduled jobs |
| **express-rate-limit** | 7.x | Rate limiting |
| **Axios** | 1.7 | HTTP client |

### **Frontend (Web)**

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | UI library |
| **TypeScript** | 5.9 | Type-safe JavaScript |
| **Vite** | 7.x | Build tool and dev server |
| **React Router** | 7.x | Client-side routing |
| **Zustand** | 5.x | State management |
| **React Query** | 5.x | Server state management |
| **Socket.IO Client** | 4.8 | Real-time communication |
| **Axios** | 1.12 | HTTP client |
| **React Hook Form** | 7.x | Form management |
| **Yup** | 1.7 | Schema validation |
| **TailwindCSS** | 3.x | Utility-first CSS |
| **Framer Motion** | 12.x | Animation library |
| **i18next** | 25.x | Internationalization |
| **React Hot Toast** | 2.x | Toast notifications |
| **Lucide React** | 0.545 | Icon library |
| **Recharts** | 3.x | Charts and data visualization |
| **date-fns** | 4.x | Date manipulation |

### **DevOps & Tools**

- **Git** - Version control
- **npm** - Package management
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **tsx/ts-node** - TypeScript execution
- **Render** - Backend hosting (production)
- **Vercel** - Frontend hosting (production)

---

## 🏗️ Architecture

Beautiful_Encer follows a **monorepo architecture** with two completely independent workspaces:

### Monorepo Structure

```
Beautiful_Encer/
├── api/                    # Backend API (Node.js + Express + PostgreSQL)
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middlewares/   # Express middlewares
│   │   ├── jobs/          # Cron jobs
│   │   ├── utils/         # Utility functions
│   │   ├── types/         # TypeScript types
│   │   └── server.ts      # Express server setup
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── migrations/    # Database migrations
│   └── package.json
│
├── web/                    # Frontend SPA (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Route pages
│   │   ├── services/      # API service layer
│   │   ├── store/         # Zustand stores
│   │   ├── hooks/         # Custom React hooks
│   │   ├── i18n/          # Internationalization
│   │   ├── utils/         # Utility functions
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Root component
│   └── package.json
│
├── .github/
│   └── copilot-instructions.md  # Development guidelines
└── README.md              # This file
```

### System Design Principles

1. **Separation of Concerns**: Backend and frontend are completely decoupled
2. **RESTful API**: All communication via HTTP/HTTPS with versioned endpoints (`/api/v1/`)
3. **Real-Time Layer**: WebSocket connections for chat and notifications
4. **Stateless Authentication**: JWT tokens with no server-side sessions
5. **Database-First**: Prisma schema is the single source of truth
6. **Type Safety**: Full TypeScript coverage on both sides
7. **API Versioning**: Future-proof with `/api/v1/` prefix
8. **Rate Limiting**: Global and endpoint-specific rate limits
9. **Error Handling**: Consistent error responses across all endpoints
10. **Security First**: Encryption, input validation, SQL injection protection

### Data Flow

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser   │ <──────>│   API Server │ <──────>│  PostgreSQL  │
│   (React)   │  HTTP/  │  (Express +  │         │   Database   │
│             │  WS     │   Socket.IO) │         │              │
└─────────────┘         └──────────────┘         └──────────────┘
      │                        │
      │                        │
      │                        ▼
      │                 ┌──────────────┐
      │                 │   External   │
      │                 │   Services   │
      │                 ├──────────────┤
      │                 │  Cloudinary  │ (Image storage)
      │                 │  Apify API   │ (Social scraping)
      └────────────────>│  Resend/SMTP │ (Email delivery)
                        └──────────────┘
```

---

## 📁 Project Structure

### Backend (`api/`)

```
api/
├── src/
│   ├── controllers/           # HTTP request handlers
│   │   ├── auth.controller.ts
│   │   ├── chat.controller.ts
│   │   ├── connection.controller.ts
│   │   ├── discovery.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── onboarding.controller.ts
│   │   ├── profile.controller.ts
│   │   ├── socialMedia.controller.ts
│   │   ├── proxy.controller.ts
│   │   └── admin.controller.ts
│   │
│   ├── routes/                # Express route definitions
│   │   ├── auth.routes.ts     # /api/v1/auth/*
│   │   ├── chat.routes.ts     # /api/v1/chat/*
│   │   ├── connection.routes.ts
│   │   ├── discovery.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── onboarding.routes.ts
│   │   ├── profile.routes.ts
│   │   ├── socialMedia.routes.ts
│   │   ├── proxy.routes.ts
│   │   └── admin.routes.ts
│   │
│   ├── services/              # Business logic layer
│   │   ├── jwt.service.ts
│   │   ├── email.service.ts
│   │   ├── apify.instagram.service.ts
│   │   ├── apify.tiktok.service.ts
│   │   ├── tiktok.service.ts  # OAuth helper
│   │   └── admin.service.ts
│   │
│   ├── middlewares/           # Express middlewares
│   │   ├── auth.middleware.ts # JWT verification
│   │   ├── admin.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   └── multer.config.ts   # File upload config
│   │
│   ├── jobs/                  # Cron job definitions
│   │   ├── tokenRefresh.job.ts
│   │   ├── dataSyncScheduler.job.ts
│   │   └── instagramReminder.job.ts
│   │
│   ├── utils/                 # Utility functions
│   │   ├── encryption.util.ts
│   │   ├── logger.util.ts
│   │   └── seedSuperAdmin.util.ts
│   │
│   ├── types/                 # TypeScript type definitions
│   │   └── express.d.ts
│   │
│   ├── config/                # Configuration files
│   │   └── cloudinary.config.ts
│   │
│   ├── lib/                   # Library instances
│   │   └── prisma.ts          # Prisma client singleton
│   │
│   └── server.ts              # Main entry point
│
├── prisma/
│   ├── schema.prisma          # Database schema (single source of truth)
│   ├── seed.ts                # Database seeding script
│   └── migrations/            # Database migration history
│
├── .env.example               # Environment variables template
├── package.json
└── tsconfig.json
```

### Frontend (`web/`)

```
web/
├── src/
│   ├── components/            # Reusable React components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── BottomNav.tsx
│   │   ├── RouteProtection.tsx
│   │   ├── ImageWithFallback.tsx
│   │   └── ...
│   │
│   ├── pages/                 # Route pages
│   │   ├── auth/
│   │   │   ├── SignupPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── VerifyOtpPage.tsx
│   │   │   └── ...
│   │   ├── onboarding/
│   │   │   ├── InfluencerOnboarding.tsx
│   │   │   └── SalonOnboarding.tsx
│   │   ├── admin/
│   │   ├── legal/
│   │   ├── DiscoveryPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── ...
│   │
│   ├── services/              # API service layer
│   │   ├── auth.service.ts
│   │   ├── chat.service.ts
│   │   ├── discovery.service.ts
│   │   ├── socialMedia.service.ts
│   │   └── ...
│   │
│   ├── store/                 # Zustand state management
│   │   ├── authStore.ts       # Authentication state
│   │   └── notificationStore.ts
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useSocket.ts
│   │   └── ...
│   │
│   ├── i18n/                  # Internationalization
│   │   ├── config.ts
│   │   └── locales/
│   │       ├── en.json
│   │       └── ja.json
│   │
│   ├── utils/                 # Utility functions
│   │   ├── validation.ts
│   │   └── ...
│   │
│   ├── types/                 # TypeScript interfaces
│   │
│   ├── config/                # Configuration
│   │   └── api.config.ts      # API endpoints
│   │
│   ├── lib/                   # Library configurations
│   │   └── axios.ts           # Axios instance with interceptors
│   │
│   ├── assets/                # Static assets
│   │
│   ├── App.tsx                # Root component with routes
│   ├── main.tsx               # Application entry point
│   └── index.css              # Global styles (Tailwind)
│
├── public/                    # Static public files
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL**: v14 or higher ([Download](https://www.postgresql.org/download/))
- **npm**: v10.x or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Arya4546/Beautiful_Encer.git
cd Beautiful_Encer
```

#### 2. Set Up Backend (API)

```bash
# Navigate to API directory
cd api

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and fill in your values
# Required: DATABASE_URL, JWT_ACCESS_SECRET, APIFY_API_TOKEN, CLOUDINARY_*, EMAIL_*
# Use a text editor: nano .env  or  code .env
```

**Generate Required Secrets:**

```bash
# Generate JWT_ACCESS_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_IV
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate CRON_JOB_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Set Up Database:**

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name initial_setup

# (Optional) Seed database with sample data
npm run seed

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

**Start Development Server:**

```bash
npm run dev
# Server will start at http://localhost:3000
```

#### 3. Set Up Frontend (Web)

Open a new terminal:

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env (default is fine for local development)
# VITE_API_BASE_URL=http://localhost:3000/api/v1
```

**Start Development Server:**

```bash
npm run dev
# Frontend will start at http://localhost:5173
```

#### 4. Verify Setup

1. **API Health Check**: Visit [http://localhost:3000/health](http://localhost:3000/health)
   - Should return: `{"status": "ok", "message": "Server is running"}`

2. **Frontend**: Visit [http://localhost:5173](http://localhost:5173)
   - Should show the landing page

3. **WebSocket**: Check browser console for Socket.IO connection logs

4. **Database**: Run `npx prisma studio` in the `api/` directory to inspect data

---

## 💻 Development

### Running the Application

**Backend (API):**
```bash
cd api
npm run dev         # Development with hot reload
npm run build       # Build TypeScript
npm start           # Run production build
```

**Frontend (Web):**
```bash
cd web
npm run dev         # Development with hot reload (Vite)
npm run build       # Build for production
npm run preview     # Preview production build
```

### Database Management

```bash
cd api

# Create a new migration after schema changes
npx prisma migrate dev --name descriptive_migration_name

# Apply migrations to production database
npx prisma migrate deploy

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Generate Prisma client (after schema changes)
npx prisma generate

# Open Prisma Studio (visual database editor)
npx prisma studio
```

### Code Quality

**Linting:**
```bash
cd web
npm run lint        # Run ESLint
```

**Type Checking:**
```bash
cd api
npm run build       # TypeScript compilation check

cd web
npm run build       # TypeScript compilation check
```

### Environment Configuration

**Development vs Production:**

- **Development**: Uses `NODE_ENV=development`, SMTP email, local PostgreSQL
- **Production**: Uses `NODE_ENV=production`, Resend/Brevo email, hosted PostgreSQL with SSL

**Key Environment Variables:**

| Variable | Backend | Frontend | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | ✅ | ❌ | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | ✅ | ❌ | JWT signing secret (32+ chars) |
| `ENCRYPTION_KEY` | ✅ | ❌ | AES-256 encryption key (32+ chars) |
| `APIFY_API_TOKEN` | ✅ | ❌ | Apify API key for scraping |
| `CLOUDINARY_*` | ✅ | ❌ | Image upload credentials |
| `EMAIL_*` or `RESEND_API_KEY` | ✅ | ❌ | Email delivery configuration |
| `TIKTOK_CLIENT_KEY` | ✅ | ❌ | TikTok OAuth (optional) |
| `VITE_API_BASE_URL` | ❌ | ✅ | API endpoint URL |

### Adding New Features

**Backend (API) Feature:**

1. Define database schema in `api/prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name feature_name`
3. Create service in `api/src/services/feature.service.ts`
4. Create controller in `api/src/controllers/feature.controller.ts`
5. Define routes in `api/src/routes/feature.routes.ts`
6. Register routes in `api/src/server.ts`
7. Add middleware if needed (auth, rate limiting)

**Frontend (Web) Feature:**

1. Create service in `web/src/services/feature.service.ts`
2. Define TypeScript types in `web/src/types/`
3. Create React Query hooks or Zustand store
4. Create page component in `web/src/pages/`
5. Create reusable components in `web/src/components/`
6. Add route in `web/src/App.tsx`
7. Add i18n translations in `web/src/i18n/locales/`

**Real-Time Feature:**

1. Add Socket.IO event handlers in backend controller
2. Emit events to connected clients via `io.to(userId).emit(...)`
3. Subscribe to events in frontend using `socket.on(...)`
4. Update UI state on event reception

---

## 🌐 Deployment

### Backend Deployment (Render)

**Prerequisites:**
- Render account
- PostgreSQL database (Render Postgres or external)
- Environment variables configured

**Steps:**

1. **Create Web Service**:
   - Connect GitHub repository
   - Root directory: `api`
   - Build command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - Start command: `npm start`

2. **Set Environment Variables**:
   - Add all variables from `.env.example`
   - Set `NODE_ENV=production`
   - Set `DATABASE_URL` with `?sslmode=require`
   - Set `FRONTEND_URL` to your frontend domain

3. **Configure Database**:
   - Create Render PostgreSQL database or use external
   - Copy connection string and add `?sslmode=require`

4. **Deploy**:
   - Push to `main` or `development` branch
   - Render auto-deploys on push
   - Monitor build logs

**Post-Deployment:**
- Verify health endpoint: `https://your-api.onrender.com/health`
- Check logs for errors
- Test API endpoints with Postman

### Frontend Deployment (Vercel)

**Prerequisites:**
- Vercel account
- Backend API deployed and accessible

**Steps:**

1. **Import Project**:
   - Connect GitHub repository
   - Framework preset: Vite
   - Root directory: `web`

2. **Configure Build**:
   - Build command: `npm run build` (auto-detected)
   - Output directory: `dist` (auto-detected)
   - Install command: `npm install` (auto-detected)

3. **Set Environment Variable**:
   - `VITE_API_BASE_URL`: Your backend URL (e.g., `https://your-api.onrender.com/api/v1`)

4. **Deploy**:
   - Click "Deploy"
   - Vercel builds and deploys automatically
   - Custom domain setup available

**Post-Deployment:**
- Verify app loads correctly
- Test authentication flow
- Check WebSocket connection in browser console
- Verify API calls in Network tab

### Production Checklist

- [ ] All environment variables set correctly
- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] SSL enabled for database connection (`sslmode=require`)
- [ ] CORS configured for frontend domain
- [ ] Rate limiting enabled
- [ ] Email service configured (Resend/Brevo)
- [ ] Cloudinary configured for image uploads
- [ ] Apify API token valid and funded
- [ ] TikTok OAuth credentials set (if using OAuth)
- [ ] Trust proxy enabled in Express (`app.set('trust proxy', 1)`)
- [ ] WebSocket CORS configured
- [ ] Health endpoint accessible
- [ ] Error logging configured
- [ ] Super admin account seeded
- [ ] Frontend environment variable set
- [ ] API base URL correct in frontend
- [ ] Domain DNS configured (if using custom domain)

---

## 📚 API Documentation

### Base URL

- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://your-api-domain.com/api/v1`

### Authentication

All protected endpoints require JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Endpoints Overview

| Category | Endpoint | Method | Auth | Description |
|----------|----------|--------|------|-------------|
| **Health** | `/health` | GET | ❌ | Server health check |
| **Auth** | `/auth/signup/influencer` | POST | ❌ | Influencer registration |
| **Auth** | `/auth/signup/salon` | POST | ❌ | Salon registration |
| **Auth** | `/auth/verify-otp` | POST | ❌ | Email verification |
| **Auth** | `/auth/resend-otp` | POST | ❌ | Resend OTP |
| **Auth** | `/auth/login` | POST | ❌ | User login |
| **Auth** | `/auth/forgot-password` | POST | ❌ | Request password reset |
| **Auth** | `/auth/verify-forgot-otp` | POST | ❌ | Verify reset OTP |
| **Auth** | `/auth/reset-password` | POST | ❌ | Reset password |
| **Onboarding** | `/onboarding/influencer` | PUT | ✅ | Complete influencer profile |
| **Onboarding** | `/onboarding/salon` | PUT | ✅ | Complete salon profile |
| **Social Media** | `/social-media/instagram/profile/:username` | GET | ✅ | Get Instagram public profile |
| **Social Media** | `/social-media/instagram/connect` | POST | ✅ | Connect Instagram account |
| **Social Media** | `/social-media/instagram/sync` | POST | ✅ | Manually sync Instagram data |
| **Social Media** | `/social-media/instagram/:accountId` | GET | ✅ | Get Instagram account data |
| **Social Media** | `/social-media/instagram/:accountId` | DELETE | ✅ | Disconnect Instagram |
| **Social Media** | `/social-media/tiktok/profile/:username` | GET | ✅ | Get TikTok public profile |
| **Social Media** | `/social-media/tiktok/videos/:username` | GET | ✅ | Get TikTok videos |
| **Social Media** | `/social-media/tiktok/connect-public` | POST | ✅ | Connect TikTok (public) |
| **Social Media** | `/social-media/tiktok/public/sync` | POST | ✅ | Sync TikTok public data |
| **Social Media** | `/social-media/tiktok/public/:accountId` | GET | ✅ | Get TikTok account data |
| **Social Media** | `/social-media/tiktok/public/:accountId` | DELETE | ✅ | Disconnect TikTok |
| **Discovery** | `/discovery/influencers` | GET | ✅ | Search influencers (salons) |
| **Discovery** | `/discovery/salons` | GET | ✅ | Search salons (influencers) |
| **Connections** | `/connections/send` | POST | ✅ | Send connection request |
| **Connections** | `/connections/received` | GET | ✅ | Get received requests |
| **Connections** | `/connections/sent` | GET | ✅ | Get sent requests |
| **Connections** | `/connections/:requestId/accept` | PUT | ✅ | Accept connection |
| **Connections** | `/connections/:requestId/reject` | PUT | ✅ | Reject connection |
| **Connections** | `/connections` | GET | ✅ | Get all connections |
| **Chat** | `/chat/contacts` | GET | ✅ | Get contact list |
| **Chat** | `/chat/conversations` | GET | ✅ | Get all conversations |
| **Chat** | `/chat/conversations/:otherUserId` | GET | ✅ | Get/create conversation |
| **Chat** | `/chat/conversations/:id/messages` | GET | ✅ | Get conversation messages |
| **Chat** | `/chat/conversations/:id/messages` | POST | ✅ | Send message |
| **Chat** | `/chat/messages/:id` | PATCH | ✅ | Edit message |
| **Chat** | `/chat/messages/:id` | DELETE | ✅ | Delete message |
| **Notifications** | `/notifications` | GET | ✅ | Get all notifications |
| **Notifications** | `/notifications/:id/read` | PATCH | ✅ | Mark as read |
| **Notifications** | `/notifications/read-all` | PATCH | ✅ | Mark all as read |
| **Profile** | `/profile/me` | GET | ✅ | Get own profile |
| **Profile** | `/profile/me` | PUT | ✅ | Update own profile |
| **Profile** | `/profile/:userId` | GET | ✅ | Get user profile |
| **Proxy** | `/proxy/image` | GET | ✅ | Proxy images (CORS) |
| **Admin** | `/admin/users` | GET | ✅ | Get all users |
| **Admin** | `/admin/users/:userId` | GET | ✅ | Get user details |
| **Admin** | `/admin/users/:userId/suspend` | PATCH | ✅ | Suspend user |
| **Admin** | `/admin/users/:userId/activate` | PATCH | ✅ | Activate user |
| **Admin** | `/admin/users/:userId` | DELETE | ✅ | Delete user |
| **Admin** | `/admin/connections` | GET | ✅ | Get all connections |
| **Admin** | `/admin/activity-logs` | GET | ✅ | Get activity logs |

### WebSocket Events

**Client → Server:**
- `join_conversation` - Join a conversation room
- `leave_conversation` - Leave a conversation room
- `typing_start` - User started typing
- `typing_stop` - User stopped typing

**Server → Client:**
- `message_sent` - New message received
- `message_updated` - Message edited
- `message_deleted` - Message deleted
- `user_typing` - Another user is typing
- `user_stopped_typing` - Another user stopped typing
- `notification` - New notification received

For detailed API documentation with request/response examples, see [`api/README.md`](api/README.md).

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes**
4. **Test thoroughly** (backend and frontend)
5. **Commit with descriptive messages**: `git commit -m "feat: add user profile editing"`
6. **Push to your fork**: `git push origin feature/your-feature-name`
7. **Open a Pull Request** to the `development` branch

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, no logic change)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Code Style

- **TypeScript**: Use strict mode, prefer `type` over `interface` for props
- **Imports**: Always use `.js` extension in imports (ESM requirement)
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **Comments**: JSDoc for public APIs, inline comments for complex logic
- **Formatting**: Follow existing patterns, use ESLint rules

### Pull Request Checklist

- [ ] Code follows project conventions
- [ ] All TypeScript errors resolved
- [ ] New features have proper error handling
- [ ] Database migrations included (if schema changed)
- [ ] Environment variables documented (if added)
- [ ] API endpoints documented (if added)
- [ ] Frontend components responsive
- [ ] i18n translations added (EN/JA)
- [ ] No console errors
- [ ] Tested locally (both backend and frontend)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Arya Singh**
- GitHub: [@Arya4546](https://github.com/Arya4546)
- Email: singharyadeep79@gmail.com

---

## 🙏 Acknowledgments

- **Prisma** for the excellent ORM
- **Socket.IO** for real-time capabilities
- **Apify** for social media scraping infrastructure
- **Cloudinary** for reliable image hosting
- **Render** and **Vercel** for hosting platforms
- **React** and **Express** communities for amazing ecosystems

---

## 📞 Support

For issues, questions, or feature requests:

1. **GitHub Issues**: [Create an issue](https://github.com/Arya4546/Beautiful_Encer/issues)
2. **Email**: singharyadeep79@gmail.com
3. **Documentation**: See [`api/README.md`](api/README.md) and [`web/README.md`](web/README.md)

---

## 🗺️ Roadmap


### Future Considerations
- [ ] Multi-language support (beyond EN/JA)
- [ ] Marketplace for pre-packaged campaigns
- [ ] Influencer verification badges
- [ ] Automated content approval workflow
- [ ] Advanced reporting and exports
- [ ] API for third-party integrations
- [ ] Gamification and rewards

---

<div align="center">

**Built with ❤️ by the Beautiful_Encer team**

[⬆ Back to Top](#beautifulencer-)

</div>
