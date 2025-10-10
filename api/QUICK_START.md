# Quick Start Guide

## Run These Commands in Order

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**Copy the output!**

### 3. Create .env File
Copy `.env.example` to `.env` and fill in:
- DATABASE_URL (your PostgreSQL connection)
- JWT_ACCESS_SECRET (any 32+ char string)
- JWT_REFRESH_SECRET (any 32+ char string)
- ENCRYPTION_KEY (paste the key from step 2)
- Email settings (Gmail with App Password)
- Cloudinary credentials

### 4. Generate Prisma Client
```bash
npm run prisma
```

### 5. Run Database Migration
```bash
npx prisma migrate dev --name initial_setup
```

### 6. Start Server
```bash
npm run dev
```

### 7. Test It Works
```bash
curl http://localhost:3000/health
```

## What Changed from Old System

### ❌ Removed
- `socialMediaLink` field from signup
- Manual social media link entry

### ✅ Added
- Professional OAuth integration for Instagram
- Professional OAuth integration for TikTok
- Automatic data sync (followers, posts, engagement)
- Encrypted token storage (AES-256-GCM)
- Separate onboarding and social media linking flows

## New User Flow

1. **Signup** → Name, Email, Password (NO social media)
2. **Verify Email** → OTP sent to email
3. **Login** → Get JWT token
4. **Onboarding** → Bio, categories, region, photo
5. **Connect Instagram** → OAuth flow, automatic data sync
6. **Connect TikTok** → OAuth flow, automatic data sync

## Key Files Created/Modified

### Modified
- ✏️ `prisma/schema.prisma` - Removed socialMediaLink, added SocialMediaAccount & SocialMediaPost models
- ✏️ `src/controllers/auth.controller.ts` - Removed socialMediaLink from signup
- ✏️ `src/server.ts` - Added social media routes
- ✏️ `package.json` - Added axios dependency

### Created
- ✨ `src/controllers/socialMedia.controller.ts` - Instagram/TikTok OAuth & data sync
- ✨ `src/routes/socialMedia.routes.ts` - Social media API routes
- ✨ `src/services/instagram.service.ts` - Instagram API integration
- ✨ `src/services/tiktok.service.ts` - TikTok API integration
- ✨ `src/utils/encryption.util.ts` - AES-256-GCM encryption for tokens
- ✨ `.env.example` - Environment template
- ✨ `README.md` - Complete project documentation
- ✨ `API_DOCUMENTATION.md` - Full API reference
- ✨ `SOCIAL_MEDIA_SETUP.md` - Instagram/TikTok setup guide
- ✨ `MIGRATION_GUIDE.md` - Migration from old system
- ✨ `SETUP_INSTRUCTIONS.md` - Detailed setup steps

## API Endpoints

### Authentication (No Changes)
- POST `/api/v1/auth/signup/influencer` - Now WITHOUT socialMediaLink
- POST `/api/v1/auth/verify-otp`
- POST `/api/v1/auth/login`

### Onboarding (No Changes)
- POST `/api/v1/onboarding/influencer`

### Social Media (NEW)
- GET `/api/v1/social-media/instagram/auth` - Get Instagram OAuth URL
- GET `/api/v1/social-media/instagram/callback` - Instagram callback
- GET `/api/v1/social-media/tiktok/auth` - Get TikTok OAuth URL
- GET `/api/v1/social-media/tiktok/callback` - TikTok callback
- GET `/api/v1/social-media/accounts` - Get connected accounts
- POST `/api/v1/social-media/:platform/sync` - Manual data sync
- DELETE `/api/v1/social-media/:platform` - Disconnect account

## Database Schema Changes

### New Tables
```sql
SocialMediaAccount
  - Stores encrypted access tokens
  - Caches follower counts, engagement metrics
  - Links to Influencer

SocialMediaPost
  - Stores individual posts/videos
  - Engagement data (likes, comments, shares, views)
  - Links to SocialMediaAccount
```

### Removed Fields
```sql
Influencer.socialMediaLink - REMOVED
```

## Security Features

✅ **AES-256-GCM Encryption** for all access tokens  
✅ **PBKDF2 Key Derivation** with 100,000 iterations  
✅ **Unique Salt & IV** for each encryption  
✅ **CSRF Protection** via OAuth state parameter  
✅ **JWT Authentication** for API access  
✅ **bcrypt Password Hashing** with 12 rounds  

## Instagram/TikTok Setup (Optional for Now)

You can set up Instagram and TikTok OAuth later. The system works without them, but influencers won't be able to connect accounts until you configure:

1. **Instagram**: Create Facebook Developer app
2. **TikTok**: Register at TikTok for Developers

See `SOCIAL_MEDIA_SETUP.md` for detailed instructions.

## Testing Without Social Media APIs

You can test the entire flow except social media linking:

1. ✅ Signup influencer
2. ✅ Verify email with OTP
3. ✅ Login
4. ✅ Complete onboarding
5. ⏸️ Connect social media (requires API setup)

## Next Steps

1. ✅ Run the commands above to set up the project
2. ✅ Test signup, OTP, login, onboarding flows
3. 📖 Read `SOCIAL_MEDIA_SETUP.md` to configure Instagram/TikTok
4. 🚀 Build your frontend to consume the API
5. 🌐 Deploy to production when ready

## Need Help?

- **Setup Issues**: See `SETUP_INSTRUCTIONS.md`
- **API Reference**: See `API_DOCUMENTATION.md`
- **Social Media Setup**: See `SOCIAL_MEDIA_SETUP.md`
- **Migration Questions**: See `MIGRATION_GUIDE.md`

## TypeScript Errors?

The TypeScript errors you see now are normal! They will disappear after you run:

```bash
npm install
npm run prisma
```

This will:
- Install axios (currently missing)
- Regenerate Prisma client with new schema
- Fix all type errors

---

**You're ready to build a professional influencer marketing platform! 🚀**
