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
**Instagram (public):** Uses **Apify scraping** (NOT OAuth) - see `api/src/services/apify.instagram.service.ts`
- No tokens needed — scrapes public profiles by username
- Data cached in DB for 7 days to minimize costs
- Free tier: ~$5/month (~500-1000 profiles)
- Extracts hashtags from post captions and stores top 10 in metadata
- Returns complete profile data: followers, posts, engagement, profile picture, recent posts
- Stores recent posts in `SocialMediaPost` table

**TikTok (public):** Uses **Apify scraping** (NOT OAuth) — see `api/src/services/apify.tiktok.service.ts`
- No tokens needed — scrape by username using `APIFY_API_TOKEN`
- Cache results in DB for 7 days (same policy as Instagram) to control costs
- Extract hashtags from video captions; store top 10 in metadata
- Returns profile summary (followers, likes), recent videos, engagement metrics, avatar, and safe display fields
- Stores recent videos in `SocialMediaPost` table with MediaType.VIDEO
- Mirrors Instagram service architecture for consistency

**TikTok (connected accounts):** Traditional OAuth 2.0 flow with token refresh
- Tokens stored encrypted using AES-256-GCM (see `api/src/utils/encryption.util.ts`)
- Refresh job runs daily at 2 AM (see `api/src/jobs/tokenRefresh.job.ts`)

**When adding social media features:**
- Instagram (public): Always use `apifyInstagramService` for public lookups — do not assume OAuth
- TikTok (public): Always use `apifyTikTokService` for public lookups — do not require OAuth
- TikTok (connected): Use OAuth service with token encryption for user-linked capabilities
- Check `APIFY_API_TOKEN` (shared for Instagram and TikTok public scraping), not `INSTAGRAM_APP_ID`
- API returns formatted data with `displayName`, `profilePicture`, and complete metadata
- Both services follow identical patterns: `scrapeTikTokProfile`/`scrapeInstagramProfile`, `connectTikTokAccount`/`connectInstagramAccount`, `syncTikTokData`/`syncInstagramData`

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
 * @route   GET  /api/v1/social-media/instagram/profile/:username   // Public via Apify
 * @route   GET  /api/v1/social-media/tiktok/profile/:username      // Public via Apify
 * @route   GET  /api/v1/social-media/tiktok/videos/:username       // Public via Apify
 * @route   GET  /api/v1/social-media/tiktok/oauth/callback         // Connected accounts (OAuth)
 */
```

### 8. File Upload Pattern
Uses **Multer + Cloudinary**:
- Multer middleware: `api/src/middlewares/multer.config.ts` (memory storage)
- Upload to Cloudinary: `api/src/config/cloudinary.config.ts`
- Pattern: `multer -> controller -> cloudinary.upload(buffer) -> save URL to DB`

### 9. Automated Jobs (node-cron)
Three cron jobs initialized in `server.ts`:
- **Token Refresh** (2:00 AM daily): Refreshes TikTok OAuth tokens expiring within 7 days
- **Data Sync** (3:00 AM daily): Syncs Instagram and TikTok data for active accounts
  - Instagram (Apify): refresh cached posts within the 7-day cache window
  - TikTok Public (Apify): refresh cached videos within the 7-day cache window
  - TikTok Connected (OAuth): pull updated insights where applicable
  - Automatically detects account type (public vs OAuth) based on `accessToken` field
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
- `APIFY_API_TOKEN` - Apify scraping for Instagram and TikTok public profiles (NOT `INSTAGRAM_APP_ID`)
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

1. **Instagram OAuth assumption:** Instagram does NOT use OAuth in this app — it's Apify scraping
2. **TikTok assumption:** Do not assume TikTok OAuth for public profile lookups — use Apify scraping. Use OAuth only for user-linked features requiring permissions.
3. **Forgetting Prisma generate:** After schema changes, always run `npx prisma generate`
4. **Import extensions:** Must include `.js` in TypeScript imports (ESM modules)
5. **Socket.IO auth:** Don't forget to set token in `socket.handshake.auth.token` on client
6. **Rate limiting:** General limiter already applied globally in `server.ts` (1000 req/15min)
7. **Frontend routing:** Protected routes use `<ProtectedRoute>` wrapper, see `web/src/components/RouteProtection.tsx`
8. **Onboarding flow:** Users can't access main app until `emailVerified = true` and onboarding complete

## Key Files Reference

- **API entry:** `api/src/server.ts` - Express setup, Socket.IO, routes, cron jobs
- **Prisma schema:** `api/prisma/schema.prisma` - Single source of truth for DB
- **Auth middleware:** `api/src/middlewares/auth.middleware.ts` - JWT verification
- **Social media services:** `api/src/services/apify.instagram.service.ts` (public) • `api/src/services/apify.tiktok.service.ts` (public, create) • TikTok OAuth helpers under `api/src/services/`
- **Frontend entry:** `web/src/App.tsx` - React Router, auth initialization
- **Axios config:** `web/src/lib/axios.ts` - Auto-attach tokens, handle 401
- **API endpoints:** `web/src/config/api.config.ts` - Centralized endpoint definitions

## Session Addendum — Oct 2025 Enhancements & Runbook

This section captures recent changes and operational runbooks so a fresh assistant has full context without prior chat history.

### A. Authentication & OTP verification
- Enforced email verification at login.
  - Backend: `POST /api/v1/auth/login` denies access when `emailVerified = false` (code: `EMAIL_NOT_VERIFIED`).
  - Auto-issues a fresh OTP on login if none exists or the last one expired (best-effort; failures don’t crash).
- Resend-OTP endpoint added: `POST /api/v1/auth/resend-otp`.
  - Accepts `{ email }`, recreates OTP for unverified users, sends email again.
- Frontend behavior:
  - On login error `EMAIL_NOT_VERIFIED`, redirect to `/verify-otp` and prefill email; show toast.
  - Verify page includes “Resend OTP” which calls the new endpoint.
- Email delivery strategy:
  - Production (Render): Uses Resend API (env `RESEND_API_KEY`).
  - Local dev: Uses Nodemailer with `EMAIL_HOST/PORT/USER/PASS`.
  - File: `api/src/services/email.service.ts`.

Required env (API):
- `RESEND_API_KEY` (prod), or `EMAIL_HOST`, `EMAIL_PORT` (587 or 465), `EMAIL_USER`, `EMAIL_PASS` (local dev)
- Plus existing: `DATABASE_URL` (with `sslmode=require` on hosted PG), `JWT_ACCESS_SECRET`, `ENCRYPTION_KEY`, `APIFY_API_TOKEN`, `CLOUDINARY_*`, `TIKTOK_*`.

Build note:
- `@types/nodemailer` is in runtime `dependencies` (not only devDependencies) so Render installs types during production builds.

### B. Express behind proxy (Render)
- Set trust proxy in `api/src/server.ts`:
  - `app.set('trust proxy', 1)` before rate limiter.
- Fixes express-rate-limit error about unexpected `X-Forwarded-For` and enables correct client IP detection.

### C. Chat UX: show ALL connections; start chat directly
- New endpoint: `GET /api/v1/chat/contacts` (auth required).
  - Returns accepted connections (“contacts”) with optional existing conversation summary and `unreadCount`.
  - Query params: `search` (name/businessName), `role=INFLUENCER|SALON`, `cursor`, `limit` (cursor pagination, default 20).
- Existing conversation endpoints remain (`/chat/conversations`, messages CRUD).
- Frontend:
  - `web/src/pages/ChatPage.tsx` left pane shows contacts with server-side search, role filter, and infinite scroll.
  - Clicking a contact opens existing conversation or creates one via `GET /chat/conversations/:otherUserId`.
  - Service: `web/src/services/chat.service.ts` has `getContacts()` and `ContactItem` type.

### D. Instagram media reliability & UI polish
- Image proxy hardened (streaming, keep-alive, stricter whitelisting, better headers, env-driven timeout, improved logging).
- Reusable `ImageWithFallback` and a cute professional SVG placeholder for broken images.
- Instagram components now use proxy URLs and fallbacks; many static texts localized (EN/JA).

### E. i18n & onboarding improvements
- Legal pages (Terms/Privacy) and signup checkbox enforced; i18n added (EN/JA).
- Influencer and Salon onboarding forms localized; improved validation messages.
- OTP inputs responsive on mobile.
- BottomNav shows Chat on small screens.

### F. Deployment guide notes
- Render (current backend host):
  - Use Resend for emails in production to avoid SMTP timeouts.
  - Ensure `app.set('trust proxy', 1)` is present.
  - Typical deploy steps:
    1) Set env vars
    2) `prisma migrate deploy`
    3) Build TypeScript
  - For a custom domain from Xserver DNS: add a CNAME for `api.yourdomain.com` → Render service domain; HTTPS auto-provisioned by Render.
- Xserver “Rental server” (shared hosting): cannot run Node/Express persistently. Keep API on Render or migrate to Xserver VPS (then use PM2 + Nginx as reverse proxy; see prior guidance if needed).

### G. Contracts quick reference
- Auth
  - `POST /auth/signup/influencer|/auth/signup/salon` → creates user + OTP.
  - `POST /auth/verify-otp` → verify email with `{ email, otp }`.
  - `POST /auth/resend-otp` → `{ email }` new OTP for unverified users.
  - `POST /auth/login` → 403 with `code=EMAIL_NOT_VERIFIED` until verified; 403 with `code=TERMS_NOT_ACCEPTED` until legal terms accepted.
- Chat
  - `GET /chat/contacts?search=&role=&cursor=&limit=` → contact list (accepted connections) with optional conversation summary and `unreadCount`.
  - `GET /chat/conversations` → existing conversations (still supported).
  - `GET /chat/conversations/:otherUserId` → get or create conversation with user.
  - `GET /chat/conversations/:conversationId/messages?page=&limit=` → paginated messages.
  - `POST /chat/conversations/:conversationId/messages` → send message.
  - `PATCH /chat/messages/:messageId`, `DELETE /chat/messages/:messageId`.
- Social Media
  - Public (Apify):
    - `GET /social-media/instagram/profile/:username`
    - `POST /social-media/instagram/connect` - Connect by username
    - `POST /social-media/instagram/sync` - Manual sync with rate limit
    - `GET /social-media/instagram/:accountId` - Get account data
    - `DELETE /social-media/instagram/:accountId` - Disconnect
    - `GET /social-media/tiktok/profile/:username`
    - `GET /social-media/tiktok/videos/:username`
    - `POST /social-media/tiktok/connect-public` - Connect by username
    - `POST /social-media/tiktok/public/sync` - Manual sync with rate limit
    - `GET /social-media/tiktok/public/:accountId` - Get account data
    - `DELETE /social-media/tiktok/public/:accountId` - Disconnect
  - Connected (OAuth):
    - `GET /social-media/tiktok/oauth/callback` (and related auth endpoints)

### H. Gotchas & reminders
- Always import with `.js` extensions in TS ESM.
- Prisma: `npx prisma generate` after schema edits; `migrate dev` locally, `migrate deploy` in prod.
- Socket.IO: client must pass JWT via `handshake.auth.token`.
- Don’t create extra PrismaClient instances—use the singleton.
- Keep i18n keys in sync across `web/src/i18n/locales/en.json` and `ja.json`.

### I. TikTok public scraping via Apify
- Purpose: Enable public TikTok profile and recent video discovery without OAuth, mirroring Instagram's Apify approach.
- Backend:
  - Service: `api/src/services/apify.tiktok.service.ts` (production-ready, mirrors Instagram)
  - Uses `APIFY_API_TOKEN`; cache results for 7 days; extract top hashtags from captions
  - Methods: `scrapeTikTokProfile()`, `connectTikTokAccount()`, `syncTikTokData()`, `getTikTokData()`, `disconnectTikTokAccount()`
  - Stores videos in `SocialMediaPost` table with proper metrics
  - Endpoints (public): 
    - `POST /api/v1/social-media/tiktok/connect-public` - Connect account
    - `GET /api/v1/social-media/tiktok/profile/:username` - Public profile lookup
    - `GET /api/v1/social-media/tiktok/videos/:username` - Public videos
    - `POST /api/v1/social-media/tiktok/public/sync` - Manual sync
    - `GET /api/v1/social-media/tiktok/public/:accountId` - Get account data
    - `DELETE /api/v1/social-media/tiktok/public/:accountId` - Disconnect
- Frontend:
  - Access via `web/src/services/socialMedia.service.ts` and display with `ImageWithFallback`; localize user-facing text (EN/JA)
- Jobs:
  - Data Sync (3:00 AM) auto-detects public vs OAuth accounts and syncs appropriately
- Notes:
  - Use TikTok OAuth only when a user links their account for private capabilities; prefer Apify for public lookups
  - Service mirrors Instagram implementation 1:1 for consistency and maintainability
  - All TypeScript types are properly defined with camelCase naming (e.g., `followersCount` not `follower_count`)

### J. Email System with EJS Templates (Japanese)
- Purpose: Professional transactional emails in Japanese using Brevo API with EJS templates
- Backend:
  - Service: `api/src/services/email.service.ts` - Rewritten to use EJS templating
  - Templates: `api/src/templates/emails/` directory with:
    - `base-layout.ejs` - Base HTML template with REAL MEDIA branding, table-based layout for cross-client compatibility
    - `otp-verification.ejs` - Email verification OTP
    - `password-reset.ejs` - Forgot password OTP
    - `influencer-registration.ejs` - Registration complete for influencers
    - `salon-registration.ejs` - Registration complete for salons/clients
    - `new-message-to-influencer.ejs` - New message notification (salon → influencer)
    - `new-message-to-salon.ejs` - New message notification (influencer → salon)
    - `new-request-to-influencer.ejs` - Collaboration request notification
    - `new-request-to-salon.ejs` - Project application notification
    - `subscription-payment.ejs` - Payment complete notification
  - Uses Brevo (Sendinblue) API via `sib-api-v3-sdk`
  - All emails in professional Japanese with proper honorifics (様)
- Configuration (env vars):
  - `BREVO_API_KEY` - Required for email sending
  - `EMAIL_FROM` - Sender email (default: noreply@sutekibank.com)
  - `EMAIL_FROM_NAME` - Sender name (default: REAL MEDIA)
  - `SUPPORT_EMAIL` - Support contact (default: support_realmedia@sutekibank.com)
  - `FRONTEND_URL` - Base URL for email links
- Template features:
  - Table-based HTML layout for Gmail/Outlook/Yahoo compatibility
  - MSO conditionals for Outlook VML buttons
  - Japanese typography support (Hiragino Sans, Yu Gothic, Meiryo)
  - Responsive design with media queries
  - Preheader text support
- Email functions available:
  - `sendOtpEmail(to, otp, userName?)` - Email verification
  - `sendPasswordResetOtpEmail(to, otp, userName?)` - Password reset
  - `sendInfluencerRegistrationEmail(to, userName)` - Registration complete
  - `sendSalonRegistrationEmail(to, businessName, contactName)` - Registration complete
  - `sendMessageNotificationToInfluencer(to, influencerName, salonName, messagePreview, conversationId)`
  - `sendMessageNotificationToSalon(to, businessName, influencerName, messagePreview, conversationId)`
  - `sendRequestNotificationToInfluencer(to, influencerName, salonName, projectName?, requestMessage?)`
  - `sendApplicationNotificationToSalon(to, businessName, influencerName, projectName, applicationMessage?)`
  - `sendSubscriptionPaymentEmail(to, businessName, planName, amount, paymentDate, nextBillingDate)`
  - `formatDateJapanese(date)` - Utility for Japanese date formatting
- Notes:
  - Domain sutekibank.com must have DNS records (DKIM, DMARC, SPF) configured for Brevo
  - All content localized in Japanese; no bilingual templates needed
  - OTP codes expire after 10 minutes

This addendum is maintained to help future sessions pick up seamlessly. If you add new endpoints or behavior, append similar notes here.
