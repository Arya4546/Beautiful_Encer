# Beautiful_Encer - AI Coding Agent Instructions

## Project Overview
Beautiful_Encer is a **dual-sided influencer marketing platform** connecting nano/micro-influencers with salons. The architecture is a **monorepo** with separate API and web frontend.

**Tech Stack:**
- **API**: Node.js + Express 5 + TypeScript + PostgreSQL + Prisma ORM + Socket.IO
- **Web**: React 19 + TypeScript + Vite + TailwindCSS + Zustand + React Query + Socket.IO client
- **Database**: PostgreSQL with Prisma (migrations in `api/prisma/migrations/`)
- **Real-time**: Socket.IO for chat and notifications

## Critical Architecture Patterns

### 1. Monorepo Structure
Two independent workspaces sharing no code:
- `api/` - Backend API (port 3000)
- `web/` - Frontend SPA (port 5173)

**Work in correct directory:**
```powershell
# Backend work
cd api; npm run dev

# Frontend work  
cd web; npm run dev
```

### 2. Dual User System (Role-Based)
Two user types with **separate onboarding flows**:
- `INFLUENCER` - Profile includes bio, categories, age, gender, Instagram/TikTok connections
- `SALON` - Profile includes businessName, description, teamSize, operatingHours

**Database Pattern:** Single `User` table with `role` field, extended by `Influencer` or `Salon` tables (one-to-one). Access via:
```typescript
// Backend - Always check role and load extended profile
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { influencer: true, salon: true }
});

// Frontend - Check user.role before rendering UI
if (user.role === 'INFLUENCER') { /* influencer features */ }
```

### 3. Social Media Integration - CRITICAL
**Instagram:** Uses **Apify scraping** (NOT OAuth) - see `api/src/services/apify.instagram.service.ts`
- No tokens needed - scrapes public profiles by username
- Data cached in DB for 7 days to minimize costs
- Free tier: $5/month (~500-1000 profiles)
- **Extracts hashtags** from post captions and stores top 10 in metadata
- Returns complete profile data: followers, posts, engagement, profile picture, recent posts

**TikTok:** Traditional OAuth 2.0 flow with token refresh
- Tokens stored **encrypted** using AES-256-GCM (see `api/src/utils/encryption.util.ts`)
- Refresh job runs daily at 2 AM (see `api/src/jobs/tokenRefresh.job.ts`)

**When adding social media features:**
- Instagram: Always use `apifyInstagramService`, never assume OAuth
- TikTok: Use OAuth service with token encryption
- Check `APIFY_API_TOKEN` for Instagram, not `INSTAGRAM_APP_ID`
- API returns formatted data with displayName, profilePicture, and complete metadata

### 4. Authentication & Authorization
**JWT-based with two tokens:**
- Access token: Short-lived, in `Authorization: Bearer <token>` header
- Refresh token: Not currently implemented (TODO)

**Middleware usage:**
```typescript
// Routes: api/src/routes/*.routes.ts
import { protect } from '../middlewares/auth.middleware.js';
router.use(protect); // Apply to all routes in file
// OR
router.get('/endpoint', protect, controller.method); // Per-route
```

**Frontend:** Token stored in `localStorage.accessToken`, auto-attached via axios interceptor (`web/src/lib/axios.ts`)

### 5. Real-time Communication (Socket.IO)
**Connection pattern:**
- Client authenticates via `socket.handshake.auth.token`
- Server verifies JWT, stores `socket.data.userId` and `socket.data.role`
- User joins personal room: `socket.join(userId)`

**Event naming convention:**
```typescript
// Client -> Server: imperative (action)
socket.emit('join_conversation', { conversationId });

// Server -> Client: past tense (notification)
socket.to(conversationId).emit('message_sent', messageData);
```

**Controllers set Socket.IO:**
```typescript
// server.ts
chatController.setSocketIO(io);
notificationController.setSocketIO(io);
```

### 6. Database Access Pattern
**Single Prisma instance** (singleton pattern in `api/src/lib/prisma.ts`):
```typescript
import { prisma } from '../lib/prisma.js';
// Never instantiate new PrismaClient() in code
```

**Migration workflow:**
```powershell
# After schema changes
cd api
npx prisma migrate dev --name descriptive_change_name
npx prisma generate  # Regenerates TypeScript client
```

### 7. API Versioning & Routes
All routes prefixed with `/api/v1/`:
```typescript
// server.ts
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/social-media', socialMediaRoutes);

// Route files should document endpoints:
/**
 * @route   POST /api/v1/auth/signup/influencer
 */
```

### 8. File Upload Pattern
Uses **Multer + Cloudinary**:
- Multer middleware: `api/src/middlewares/multer.config.ts` (memory storage)
- Upload to Cloudinary: `api/src/config/cloudinary.config.ts`
- Pattern: `multer -> controller -> cloudinary.upload(buffer) -> save URL to DB`

### 9. Automated Jobs (node-cron)
Three cron jobs initialized in `server.ts`:
- **Token Refresh** (2:00 AM daily): Refreshes TikTok tokens expiring in 7 days
- **Data Sync** (3:00 AM daily): Syncs Instagram/TikTok data for active accounts
- **Instagram Reminder** (10:00 AM daily): Reminds users to verify Instagram accounts

**When adding jobs:** Create in `api/src/jobs/`, export `.init()` method, call in `server.ts`

### 10. Frontend State Management
**Zustand stores** (NOT Redux):
- `authStore.ts` - User authentication state
- `notificationStore.ts` - Real-time notifications

**Data fetching:** React Query (`@tanstack/react-query`) for server state, NOT in Zustand

**Pattern:**
```typescript
// Store: Local/UI state only
const { user, setUser } = useAuthStore();

// React Query: Server data
const { data, isLoading } = useQuery({
  queryKey: ['influencers'],
  queryFn: discoveryService.getInfluencers
});
```

### 11. Environment Variables
**Required for API** (see `api/.env.example`):
- `DATABASE_URL` - PostgreSQL connection
- `JWT_ACCESS_SECRET` (min 32 chars)
- `ENCRYPTION_KEY` (min 32 chars) - For social media tokens
- `APIFY_API_TOKEN` - Instagram scraping (NOT `INSTAGRAM_APP_ID`)
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` - OAuth
- `CLOUDINARY_*` - Image uploads
- `EMAIL_*` - Nodemailer for OTPs

**Frontend:** Only `VITE_API_BASE_URL` (defaults to `http://localhost:3000/api/v1`)

### 12. Error Handling Convention
**Backend:**
```typescript
try {
  // logic
  return res.status(200).json({ success: true, data });
} catch (error: any) {
  console.error('[ControllerName.methodName] Error:', error);
  return res.status(500).json({ 
    error: 'Brief error name',
    message: error.message || 'Detailed user-facing message'
  });
}
```

**Frontend:** Axios interceptor handles 401 globally (auto-logout). Service methods throw errors for React Query to catch.

## Development Workflows

### Backend Setup
```powershell
cd api
npm install
cp .env.example .env  # Fill in all required values
npx prisma generate
npx prisma migrate dev --name initial_setup
npm run dev  # Starts on port 3000
```

### Frontend Setup
```powershell
cd web
npm install
# Create .env with VITE_API_BASE_URL=http://localhost:3000/api/v1
npm run dev  # Starts on port 5173
```

### Adding New Features
1. **Database changes:** Update `api/prisma/schema.prisma` → migrate → generate
2. **API endpoint:** Create route in `api/src/routes/` → controller in `controllers/` → service in `services/`
3. **Frontend:** Create service in `web/src/services/` → hook/query → component
4. **Real-time:** Add Socket.IO events to controller → emit in `server.ts` or controller

### Testing Endpoints
Use Postman collection documented in `api/POSTMAN_TESTING_GUIDE.md`. Key endpoints:
- Health check: `GET http://localhost:3000/health`
- Auth flow: signup → verify-otp → login → get token → use in Authorization header

## Code Style & Conventions

- **TypeScript:** Strict mode enabled. Use `type` for props, `interface` for extendable objects
- **Imports:** Always use `.js` extension in imports (ESM requirement): `import x from './file.js'`
- **Controllers:** Class-based with singleton export: `export default new ControllerName()`
- **Services:** Class-based singletons or plain object exports
- **Routes:** Express Router, export as default
- **Comments:** JSDoc for public APIs, inline for complex logic
- **File naming:** `camelCase.type.ts` (e.g., `auth.controller.ts`, `jwt.service.ts`)

## Common Pitfalls

1. **Instagram OAuth assumption:** Instagram does NOT use OAuth in this app - it's Apify scraping
2. **Forgetting Prisma generate:** After schema changes, always run `npx prisma generate`
3. **Import extensions:** Must include `.js` in TypeScript imports (ESM modules)
4. **Socket.IO auth:** Don't forget to set token in `socket.handshake.auth.token` on client
5. **Rate limiting:** General limiter already applied globally in `server.ts` (1000 req/15min)
6. **Frontend routing:** Protected routes use `<ProtectedRoute>` wrapper, see `web/src/components/RouteProtection.tsx`
7. **Onboarding flow:** Users can't access main app until `emailVerified = true` and onboarding complete

## Key Files Reference

- **API entry:** `api/src/server.ts` - Express setup, Socket.IO, routes, cron jobs
- **Prisma schema:** `api/prisma/schema.prisma` - Single source of truth for DB
- **Auth middleware:** `api/src/middlewares/auth.middleware.ts` - JWT verification
- **Frontend entry:** `web/src/App.tsx` - React Router, auth initialization
- **Axios config:** `web/src/lib/axios.ts` - Auto-attach tokens, handle 401
- **API endpoints:** `web/src/config/api.config.ts` - Centralized endpoint definitions
