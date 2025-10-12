# 🎯 How to Get Instagram & TikTok OAuth Credentials

## Quick Reference Guide

This is a simplified, step-by-step visual guide. For detailed instructions, see `OAUTH_CREDENTIALS_SETUP_GUIDE.md`.

---

## 📱 Instagram OAuth Setup (5 Steps)

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Create Facebook App                                │
│  🌐 https://developers.facebook.com/                        │
│                                                              │
│  1. Click "Create App"                                       │
│  2. Choose "Consumer" type                                   │
│  3. Enter app name: "Beautiful Encer"                        │
│  4. Click "Create App"                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Add Instagram Product                              │
│                                                              │
│  1. In left sidebar → "Add Product"                          │
│  2. Find "Instagram Basic Display"                           │
│  3. Click "Set Up"                                           │
│                                                              │
│  OR (for advanced features):                                 │
│  2. Find "Instagram Graph API"                               │
│  3. Click "Set Up"                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Configure OAuth Redirect                           │
│                                                              │
│  1. Click "Instagram" in left sidebar                        │
│  2. Scroll to "OAuth Redirect URIs"                          │
│  3. Add this URL:                                            │
│     http://localhost:3000/api/v1/social-media/               │
│     instagram/callback                                       │
│  4. Click "Save Changes"                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Get Credentials                                     │
│                                                              │
│  1. Go to "Settings" → "Basic"                               │
│  2. Copy "App ID": _________________                         │
│  3. Click "Show" on "App Secret"                             │
│  4. Copy "App Secret": _________________                     │
│                                                              │
│  ⚠️  IMPORTANT: Keep App Secret confidential!               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Update .env File                                    │
│                                                              │
│  Open: api/.env                                              │
│  Update these lines:                                         │
│                                                              │
│  INSTAGRAM_APP_ID=paste_your_app_id_here                    │
│  INSTAGRAM_APP_SECRET=paste_your_app_secret_here            │
│                                                              │
│  ✅ DONE! Instagram OAuth configured                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎵 TikTok OAuth Setup (5 Steps)

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Register as Developer                              │
│  🌐 https://developers.tiktok.com/                          │
│                                                              │
│  1. Click "Register" or "Apply Now"                          │
│  2. Sign in with TikTok account                              │
│  3. Complete developer registration                          │
│  4. Verify your email                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Create App                                          │
│                                                              │
│  1. Click "Manage Apps" in dashboard                         │
│  2. Click "+ Create New App"                                 │
│  3. Fill in:                                                 │
│     - App Name: "Beautiful Encer"                            │
│     - Category: "Social" or "Media"                          │
│     - Description: Your app description                      │
│  4. Click "Submit"                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Configure Redirect URI                             │
│                                                              │
│  1. Go to app dashboard                                      │
│  2. Navigate to "Settings"                                   │
│  3. Find "Redirect URI" section                              │
│  4. Add this URL:                                            │
│     http://localhost:3000/api/v1/social-media/               │
│     tiktok/callback                                          │
│  5. Click "Save"                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Request Scopes (Permissions)                       │
│                                                              │
│  1. Go to "Permissions" or "Scopes"                          │
│  2. Select these scopes:                                     │
│     ☑ user.info.basic (required)                            │
│     ☑ user.info.profile                                     │
│     ☑ user.info.stats (followers, likes)                    │
│     ☑ video.list (user's videos)                            │
│  3. Click "Save"                                             │
│                                                              │
│  📝 Some scopes may require review/approval                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Get Credentials & Update .env                      │
│                                                              │
│  1. In app dashboard, find:                                  │
│     - "Client Key": _________________                        │
│     - "Client Secret": _________________                     │
│                                                              │
│  2. Open: api/.env                                           │
│  3. Update these lines:                                      │
│                                                              │
│  TIKTOK_CLIENT_KEY=paste_your_client_key_here               │
│  TIKTOK_CLIENT_SECRET=paste_your_client_secret_here         │
│                                                              │
│  ✅ DONE! TikTok OAuth configured                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Generate Encryption Keys

After setting up OAuth, generate encryption keys:

```bash
┌─────────────────────────────────────────────────────────────┐
│  Run this command in your terminal:                          │
│                                                              │
│  node -e "const crypto = require('crypto');                  │
│  console.log('ENCRYPTION_KEY=' +                             │
│  crypto.randomBytes(32).toString('hex'));                    │
│  console.log('ENCRYPTION_IV=' +                              │
│  crypto.randomBytes(16).toString('hex'));                    │
│  console.log('CRON_JOB_SECRET=' +                            │
│  crypto.randomBytes(32).toString('hex'));"                   │
│                                                              │
│  Output will look like:                                      │
│  ENCRYPTION_KEY=a1b2c3d4e5f6...                              │
│  ENCRYPTION_IV=x1y2z3a4b5...                                 │
│  CRON_JOB_SECRET=m1n2o3p4q5...                               │
│                                                              │
│  Copy these values to your api/.env file                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Final .env Configuration

Your `api/.env` should look like this:

```bash
# Instagram OAuth
INSTAGRAM_APP_ID=123456789012345          # ← From Facebook Developers
INSTAGRAM_APP_SECRET=abc123def456...       # ← From Facebook Developers
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/v1/social-media/instagram/callback

# TikTok OAuth
TIKTOK_CLIENT_KEY=aw12345678...            # ← From TikTok Developers
TIKTOK_CLIENT_SECRET=abc123def456...       # ← From TikTok Developers
TIKTOK_REDIRECT_URI=http://localhost:3000/api/v1/social-media/tiktok/callback

# Encryption (Generated)
ENCRYPTION_KEY=a1b2c3d4e5f6...             # ← Generated with crypto
ENCRYPTION_IV=x1y2z3a4b5...                # ← Generated with crypto
CRON_JOB_SECRET=m1n2o3p4q5...              # ← Generated with crypto
```

---

## ✅ Verification Checklist

After completing setup:

```
Instagram Setup:
□ Created Facebook App
□ Added Instagram product
□ Configured redirect URI
□ Copied App ID and App Secret
□ Updated .env file

TikTok Setup:
□ Registered as TikTok Developer
□ Created TikTok App
□ Configured redirect URI
□ Selected required scopes
□ Copied Client Key and Secret
□ Updated .env file

Encryption Keys:
□ Generated ENCRYPTION_KEY
□ Generated ENCRYPTION_IV
□ Generated CRON_JOB_SECRET
□ Updated .env file

Installation:
□ Ran: npm install
□ Started server: npm run dev
□ Verified cron jobs initialized
```

---

## 🧪 Test Your Setup

### 1. Start the Server
```bash
cd api
npm run dev
```

### 2. Check Console Output
Look for:
```
✅ [server]: Running at http://localhost:3000
✅ [cron]: Automated jobs initialized successfully
✅ [TokenRefreshJob] Initialized - will run daily at 2:00 AM
✅ [DataSyncScheduler] Initialized - will run daily at 3:00 AM
```

### 3. Test OAuth Flow (Manual)
```bash
# Test Instagram Auth URL generation
curl http://localhost:3000/api/v1/social-media/instagram/auth \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should return:
{
  "message": "Redirect user to this URL to connect Instagram",
  "authUrl": "https://api.instagram.com/oauth/authorize?..."
}
```

---

## 🐛 Common Issues

### Issue: "Invalid App ID"
```
✗ Instagram App ID is incorrect or not found

Solution:
1. Go to Facebook Developers → Your App → Settings → Basic
2. Copy the App ID exactly (no spaces)
3. Paste into .env
4. Restart server
```

### Issue: "Redirect URI mismatch"
```
✗ OAuth redirect URI doesn't match

Solution:
1. Check spelling: instagram vs tiktok
2. Ensure exact match: http://localhost:3000/api/v1/social-media/[platform]/callback
3. No trailing slashes
4. Save changes in platform dashboard
5. Wait 5 minutes for changes to propagate
```

### Issue: "Scope not granted"
```
✗ TikTok: Requested scope requires approval

Solution:
1. Some scopes need review by TikTok
2. Submit app for review
3. Use basic scopes for testing
4. Check "Testing" section to add test users
```

---

## 📞 Need More Help?

### Detailed Guides Available:
- 📖 **OAUTH_CREDENTIALS_SETUP_GUIDE.md** - Complete step-by-step with screenshots
- 🔧 **BACKEND_FIXES_IMPLEMENTATION.md** - Technical implementation details
- 📊 **SOCIAL_MEDIA_INTEGRATION_REVIEW.md** - Full code review

### Useful Links:
- Instagram: https://developers.facebook.com/docs/instagram-basic-display-api
- TikTok: https://developers.tiktok.com/doc/login-kit-web
- Rate Limits: Check platform documentation

---

## 🎉 You're All Set!

Once you see these messages, your OAuth setup is complete:

```
✅ Instagram OAuth configured
✅ TikTok OAuth configured
✅ Encryption keys generated
✅ Rate limiting active
✅ Token refresh scheduled (2:00 AM daily)
✅ Data sync scheduled (3:00 AM daily)

🚀 Ready to connect social media accounts!
```

**Next**: Build the frontend UI to connect Instagram/TikTok accounts!
