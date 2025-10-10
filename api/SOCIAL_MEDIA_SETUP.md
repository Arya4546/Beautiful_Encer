# Social Media Integration Setup Guide

## Overview

This guide explains how to set up Instagram and TikTok OAuth integration for the Beautiful Encer influencer marketing platform.

## Architecture

### Database Schema
- **SocialMediaAccount**: Stores encrypted access tokens and cached metrics
- **SocialMediaPost**: Stores individual posts/videos with engagement data
- **Encryption**: All access tokens are encrypted using AES-256-GCM

### Flow
1. Signup: Influencer creates account
2. Email Verification: OTP verification
3. Onboarding: Profile completion
4. Social Media Linking: Connect Instagram/TikTok
5. Data Sync: Automatic sync of followers, posts, engagement

## Instagram Setup

### 1. Create Facebook App
- Go to https://developers.facebook.com/
- Create new app (Consumer or Business type)

### 2. Add Instagram Product
- Add "Instagram Basic Display" or "Instagram Graph API"

### 3. Configure OAuth
- Add redirect URI: http://localhost:3000/api/v1/social-media/instagram/callback

### 4. Get Credentials
- Copy App ID and App Secret
- Add to .env file

## TikTok Setup

### 1. Register as Developer
- Go to https://developers.tiktok.com/
- Complete registration

### 2. Create App
- Create new app in dashboard

### 3. Configure OAuth
- Add redirect URI: http://localhost:3000/api/v1/social-media/tiktok/callback
- Request scopes: user.info.basic, video.list, user.info.stats

### 4. Get Credentials
- Copy Client Key and Client Secret
- Add to .env file

## Installation Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment template:
   ```bash
   cp .env.example .env
   ```

3. Configure .env with all required credentials

4. Generate Prisma client:
   ```bash
   npm run prisma
   ```

5. Run database migrations:
   ```bash
   npx prisma migrate dev --name add_social_media_accounts
   ```

6. Start server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- POST /api/v1/auth/signup/influencer - Register influencer
- POST /api/v1/auth/verify-otp - Verify email
- POST /api/v1/auth/login - Login

### Onboarding
- POST /api/v1/onboarding/influencer - Complete profile

### Social Media
- GET /api/v1/social-media/instagram/auth - Start Instagram OAuth
- GET /api/v1/social-media/instagram/callback - Instagram callback
- GET /api/v1/social-media/tiktok/auth - Start TikTok OAuth
- GET /api/v1/social-media/tiktok/callback - TikTok callback
- GET /api/v1/social-media/accounts - Get connected accounts
- POST /api/v1/social-media/instagram/sync - Manual sync
- DELETE /api/v1/social-media/:platform - Disconnect account

## Security Features

- AES-256-GCM encryption for access tokens
- PBKDF2 key derivation
- CSRF protection via state parameter
- Secure token storage in PostgreSQL
- Environment-based encryption keys

## Testing Flow

1. Register influencer account
2. Verify email with OTP
3. Login and get access token
4. Complete onboarding
5. Call GET /api/v1/social-media/instagram/auth
6. Redirect user to returned authUrl
7. User authorizes on Instagram
8. System handles callback and stores encrypted tokens
9. Data syncs automatically

## Production Checklist

- [ ] Submit Instagram app for review
- [ ] Submit TikTok app for production access
- [ ] Use HTTPS for all redirect URIs
- [ ] Set strong ENCRYPTION_KEY (32+ characters)
- [ ] Configure proper CORS settings
- [ ] Set up automated token refresh
- [ ] Implement rate limiting
- [ ] Add monitoring and logging
- [ ] Set up periodic data sync jobs
