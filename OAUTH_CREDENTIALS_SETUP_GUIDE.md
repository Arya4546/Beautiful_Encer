# Complete OAuth Credentials Setup Guide

## 📋 Overview

This guide will walk you through getting OAuth credentials for Instagram and TikTok social media integration. Follow these steps carefully to enable influencers to connect their social media accounts.

---

## 🟦 Instagram OAuth Setup (Meta/Facebook)

Instagram uses Facebook's developer platform for OAuth. You'll need to create a Facebook App and enable Instagram API access.

### Prerequisites
- A Facebook account
- A Meta Developer account (automatically created when you access Facebook Developers)
- **IMPORTANT**: Instagram Business or Creator account for full API access

### Step 1: Create a Meta App

1. **Go to Meta for Developers**
   - Visit: https://developers.facebook.com/
   - Click "Get Started" or "My Apps" in the top right

2. **Create a New App**
   - Click "Create App" button
   - Choose app type: **"Consumer"** or **"Business"**
   - For most cases, choose **"Consumer"**
   - Click "Next"

3. **App Details**
   - **Display Name**: `Beautiful Encer` (or your app name)
   - **App Contact Email**: Your email address
   - Click "Create App"

4. **App Dashboard**
   - You'll be taken to the app dashboard
   - Copy your **App ID** (you'll need this)
   - Find **App Secret** by clicking "Show" (keep this secret!)

### Step 2: Add Instagram Product

1. **Add Product**
   - In the left sidebar, scroll to "Add a Product"
   - Find **"Instagram Basic Display"** or **"Instagram Graph API"**
   - Click "Set Up"

2. **Choose API Type**

   **Option A: Instagram Basic Display API** (Easier, Limited Features)
   - ✅ Good for: Basic profile data and media
   - ❌ Cannot get: Follower counts, insights
   - **Best for**: Quick setup and testing

   **Option B: Instagram Graph API** (Advanced, Full Features)
   - ✅ Good for: Full insights, follower counts, engagement metrics
   - ❌ Requires: Instagram Business/Creator account
   - **Best for**: Production with full analytics

### Step 3: Configure OAuth Settings

1. **Basic Display API Configuration** (if using Basic Display)
   
   a. Click on "Basic Display" in left sidebar
   
   b. Scroll to "User Token Generator"
   
   c. Click "Create New App"
   
   d. Fill in details:
   - **Display Name**: `Beautiful Encer`
   - **OAuth Redirect URIs**: Add both:
     ```
     http://localhost:3000/api/v1/social-media/instagram/callback
     https://yourdomain.com/api/v1/social-media/instagram/callback
     ```
   - **Deauthorize Callback URL**: `https://yourdomain.com/instagram/deauth`
   - **Data Deletion Request URL**: `https://yourdomain.com/instagram/delete`
   
   e. Save Changes

2. **Graph API Configuration** (if using Graph API)
   
   a. Go to "Instagram" > "Basic Display" or "Graph API"
   
   b. Add OAuth redirect URIs in App Settings:
   - Settings > Basic > App Domains
   - Add your domain: `localhost:3000` (for development)
   
   c. Client OAuth Settings:
   - Valid OAuth Redirect URIs:
     ```
     http://localhost:3000/api/v1/social-media/instagram/callback
     https://yourdomain.com/api/v1/social-media/instagram/callback
     ```

### Step 4: Set Permissions

1. **Request Permissions** (Scopes)
   - Go to "App Review" > "Permissions and Features"
   - Request these permissions:
     - `user_profile` - Basic profile information
     - `user_media` - Access to user's media
     - `instagram_basic` - Basic Instagram data
     - `instagram_manage_insights` - Insights (Graph API only)

2. **For Graph API** (Advanced Permissions)
   - `instagram_graph_user_profile`
   - `instagram_graph_user_media`
   - `pages_read_engagement`
   - `pages_show_list`

### Step 5: Get Your Credentials

1. **Copy Credentials**
   - Go to Settings > Basic
   - Copy **App ID**
   - Click "Show" and copy **App Secret**

2. **Update .env File**
   ```bash
   # Instagram OAuth Configuration
   INSTAGRAM_APP_ID=your_actual_app_id_here
   INSTAGRAM_APP_SECRET=your_actual_app_secret_here
   INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/v1/social-media/instagram/callback
   ```

### Step 6: Testing

1. **Test in Development Mode**
   - Your app starts in "Development Mode"
   - Only you and added testers can use it
   - Go to "Roles" > "Test Users" to add testers

2. **Add Test Instagram Account**
   - Connect a test Instagram account
   - Make sure it's a Business or Creator account for full features

### Step 7: Go Live (Production)

1. **Submit for Review** (if using advanced features)
   - Go to "App Review" > "Permissions and Features"
   - Submit required permissions for review
   - Provide video demo and use case explanation

2. **Switch to Live Mode**
   - Once approved, toggle app to "Live" mode
   - Update redirect URI to production URL

---

## 🎵 TikTok OAuth Setup

TikTok uses their own developer platform. The process is more streamlined than Instagram.

### Prerequisites
- A TikTok account
- Business email address (personal emails may be rejected)

### Step 1: Register as TikTok Developer

1. **Visit TikTok for Developers**
   - Go to: https://developers.tiktok.com/
   - Click "Register" or "Login" in top right

2. **Sign Up**
   - Click "Register" or "Apply Now"
   - Choose **"Register as a developer"**
   - Accept Terms of Service

3. **Verify Email**
   - Check your email for verification link
   - Click the link to verify
   - Complete your profile

### Step 2: Create an App

1. **Access Developer Portal**
   - Login to https://developers.tiktok.com/
   - Click "Manage Apps" in the dashboard

2. **Create New App**
   - Click "+ Create New App" button
   - Fill in app details:
     - **App Name**: `Beautiful Encer`
     - **Category**: Select relevant category (e.g., "Social", "Media")
     - **Description**: Brief description of your influencer platform
     - **Icon**: Upload app logo (optional but recommended)

3. **Submit Basic Info**
   - Click "Submit" or "Save"

### Step 3: Configure App Settings

1. **App Details**
   - Go to your app dashboard
   - Navigate to "Settings" or "Basic Info"

2. **Add Redirect URIs**
   - Find "Redirect URI" or "Callback URL" section
   - Add both development and production URLs:
     ```
     http://localhost:3000/api/v1/social-media/tiktok/callback
     https://yourdomain.com/api/v1/social-media/tiktok/callback
     ```
   - Click "Save"

### Step 4: Request Scopes (Permissions)

1. **Add Scopes**
   - Navigate to "Permissions" or "Scopes"
   - Select the following scopes:
     - ✅ `user.info.basic` - Basic user information (required)
     - ✅ `user.info.profile` - Profile information
     - ✅ `user.info.stats` - User statistics (followers, likes)
     - ✅ `video.list` - Access to user's videos
     - ✅ `video.insights` - Video engagement metrics (if available)

2. **Submit for Review** (if required)
   - Some scopes require approval
   - Provide clear use case and documentation
   - Wait for approval (usually 3-7 business days)

### Step 5: Get Your Credentials

1. **Copy Client Key and Secret**
   - Go to your app dashboard
   - Find "Client Key" (also called App ID)
   - Copy **Client Key**
   - Click "Show" or "Generate" to reveal **Client Secret**
   - **IMPORTANT**: Copy the secret immediately - you may not be able to view it again

2. **Update .env File**
   ```bash
   # TikTok OAuth Configuration
   TIKTOK_CLIENT_KEY=your_actual_client_key_here
   TIKTOK_CLIENT_SECRET=your_actual_client_secret_here
   TIKTOK_REDIRECT_URI=http://localhost:3000/api/v1/social-media/tiktok/callback
   ```

### Step 6: Testing

1. **Development Mode**
   - New apps start in "Development" or "Sandbox" mode
   - Only registered test accounts can authorize

2. **Add Test Users**
   - Go to "Testing" or "Test Users"
   - Add TikTok accounts for testing
   - Each tester receives an invitation

3. **Test Authorization Flow**
   - Use your test account to authorize
   - Verify data retrieval works correctly

### Step 7: Submit for Production

1. **Complete App Review Requirements**
   - Privacy Policy URL (required)
   - Terms of Service URL (required)
   - App demo video
   - Detailed use case explanation

2. **Submit for Review**
   - Navigate to "Review" or "Submit for Review"
   - Fill in all required information
   - Submit application

3. **Wait for Approval**
   - Review typically takes 5-10 business days
   - TikTok may request additional information
   - Once approved, you can switch to "Live" mode

4. **Go Live**
   - Toggle app status to "Live" or "Production"
   - Update redirect URIs to production URLs
   - Update .env with production credentials

---

## 🔧 Environment Configuration

### Development .env
```bash
# Development Configuration
NODE_ENV=development

# Instagram OAuth (Development)
INSTAGRAM_APP_ID=1234567890123456
INSTAGRAM_APP_SECRET=abcdef1234567890abcdef1234567890
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/v1/social-media/instagram/callback

# TikTok OAuth (Development)
TIKTOK_CLIENT_KEY=aw1234567890abcdef
TIKTOK_CLIENT_SECRET=1234567890abcdef1234567890abcdef
TIKTOK_REDIRECT_URI=http://localhost:3000/api/v1/social-media/tiktok/callback

# Encryption Key (for token storage)
ENCRYPTION_KEY=generate_a_32_character_string_here1234567890
ENCRYPTION_IV=generate_16_chars12
```

### Production .env
```bash
# Production Configuration
NODE_ENV=production

# Instagram OAuth (Production)
INSTAGRAM_APP_ID=1234567890123456
INSTAGRAM_APP_SECRET=abcdef1234567890abcdef1234567890
INSTAGRAM_REDIRECT_URI=https://api.beautifulencer.com/api/v1/social-media/instagram/callback

# TikTok OAuth (Production)
TIKTOK_CLIENT_KEY=aw1234567890abcdef
TIKTOK_CLIENT_SECRET=1234567890abcdef1234567890abcdef
TIKTOK_REDIRECT_URI=https://api.beautifulencer.com/api/v1/social-media/tiktok/callback

# Encryption Key (use different key in production!)
ENCRYPTION_KEY=use_a_completely_different_secure_random_key
ENCRYPTION_IV=different_iv_key
```

---

## 🔐 Security Best Practices

### 1. Protect Your Secrets
```bash
# NEVER commit these to git
# Add to .gitignore:
.env
.env.local
.env.production
```

### 2. Generate Strong Encryption Keys
```javascript
// Use Node.js crypto to generate keys
const crypto = require('crypto');

// Generate 32-byte encryption key
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('ENCRYPTION_KEY:', encryptionKey);

// Generate 16-byte IV
const iv = crypto.randomBytes(16).toString('hex');
console.log('ENCRYPTION_IV:', iv);
```

### 3. Use Different Keys per Environment
- Development keys should be different from production
- Rotate keys periodically
- Never reuse keys across projects

### 4. Limit Redirect URIs
- Only add necessary redirect URIs
- Use HTTPS in production
- Validate state parameter to prevent CSRF

---

## 📝 Checklist

### Instagram Setup ✓
- [ ] Created Meta Developer account
- [ ] Created Facebook App
- [ ] Added Instagram Basic Display or Graph API
- [ ] Configured OAuth redirect URIs
- [ ] Requested necessary permissions
- [ ] Copied App ID and App Secret
- [ ] Updated .env file
- [ ] Tested with development account
- [ ] Submitted for review (if needed)

### TikTok Setup ✓
- [ ] Registered as TikTok Developer
- [ ] Created TikTok App
- [ ] Configured redirect URIs
- [ ] Requested scopes (user.info.basic, video.list, etc.)
- [ ] Copied Client Key and Client Secret
- [ ] Updated .env file
- [ ] Added test users
- [ ] Tested authorization flow
- [ ] Submitted for production review (if needed)

### Backend Configuration ✓
- [ ] Updated .env with Instagram credentials
- [ ] Updated .env with TikTok credentials
- [ ] Generated encryption keys
- [ ] Installed dependencies (`npm install`)
- [ ] Tested OAuth flow locally
- [ ] Verified token encryption
- [ ] Confirmed data sync works

---

## 🐛 Common Issues & Solutions

### Instagram Issues

**Issue**: "Redirect URI mismatch"
```
Solution: Ensure the redirect URI in your .env exactly matches 
the one configured in Facebook App settings.
```

**Issue**: "Invalid App ID"
```
Solution: Double-check you copied the App ID correctly from 
Facebook Developer Dashboard > Settings > Basic
```

**Issue**: "Cannot get follower count"
```
Solution: Instagram Basic Display API doesn't provide follower counts.
You need to upgrade to Instagram Graph API and use a Business account.
```

### TikTok Issues

**Issue**: "Invalid client_key"
```
Solution: Verify you copied the Client Key (not Client Secret) 
from TikTok Developer Portal > App Dashboard
```

**Issue**: "Scope not granted"
```
Solution: The requested scopes need to be approved by TikTok.
Submit your app for review to get advanced scopes.
```

**Issue**: "User not authorized"
```
Solution: In development mode, only test users can authorize.
Add the user as a test user in TikTok Developer Portal.
```

---

## 📚 Additional Resources

### Instagram/Facebook
- Meta for Developers: https://developers.facebook.com/
- Instagram Basic Display API Docs: https://developers.facebook.com/docs/instagram-basic-display-api
- Instagram Graph API Docs: https://developers.facebook.com/docs/instagram-api

### TikTok
- TikTok for Developers: https://developers.tiktok.com/
- TikTok Login Kit Docs: https://developers.tiktok.com/doc/login-kit-web
- TikTok API Reference: https://developers.tiktok.com/doc/overview

---

## 🚀 Next Steps

After completing OAuth setup:

1. **Install Dependencies**
   ```bash
   cd api
   npm install
   ```

2. **Start Backend**
   ```bash
   npm run dev
   ```

3. **Test OAuth Flow**
   - Navigate to frontend
   - Click "Connect Instagram" button
   - Verify authorization works
   - Check database for stored tokens

4. **Monitor Logs**
   ```bash
   # Watch for these messages:
   [TokenRefreshJob] Initialized
   [DataSyncScheduler] Initialized
   [SocialMedia] Token stored successfully
   ```

5. **Check Automated Jobs**
   - Token refresh runs daily at 2:00 AM
   - Data sync runs daily at 3:00 AM
   - Monitor logs for any failures

---

**Need Help?** 
- Check the logs in `api/logs/` directory
- Review error messages carefully
- Ensure all environment variables are set correctly
- Test with a fresh OAuth flow if issues persist
