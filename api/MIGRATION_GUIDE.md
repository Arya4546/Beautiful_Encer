# Migration Guide: From socialMediaLink to OAuth Integration

## Overview

This guide helps you migrate from the old system (where influencers entered a simple social media link during signup) to the new OAuth-based integration system.

## What Changed



### After (New System)
- Influencers sign up WITHOUT social media information
- After onboarding, they connect Instagram/TikTok via OAuth
- Automatic data collection: followers, posts, engagement
- Encrypted token storage for security
- Periodic data synchronization

## Database Changes

### Removed Fields
- `Influencer.socialMediaLink` (String) - Removed from signup

### Added Models
- `SocialMediaAccount` - Stores connected accounts with encrypted tokens
- `SocialMediaPost` - Stores posts/videos with engagement metrics

### Added Enums
- `SocialMediaPlatform` - INSTAGRAM, TIKTOK
- `MediaType` - IMAGE, VIDEO, CAROUSEL, REEL, STORY

## Migration Steps

### Step 1: Backup Database
```bash
pg_dump -U postgres beautiful_encer > backup_before_migration.sql
```

### Step 2: Install New Dependencies
```bash
npm install axios
```

### Step 3: Update Environment Variables
Add to your `.env` file:
```env
# Encryption Key (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_32_char_encryption_key_here

# Instagram API
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/v1/social-media/instagram/callback

# TikTok API
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_REDIRECT_URI=http://localhost:3000/api/v1/social-media/tiktok/callback
```

### Step 4: Generate Prisma Client
```bash
npm run prisma
```

### Step 5: Create and Run Migration
```bash
npx prisma migrate dev --name remove_social_media_link_add_oauth
```

This will:
- Remove `socialMediaLink` column from `Influencer` table
- Create `SocialMediaAccount` table
- Create `SocialMediaPost` table
- Add new enums

### Step 6: Handle Existing Data (Optional)

If you have existing influencers with `socialMediaLink` data, you can preserve it before migration:

```sql
-- Create temporary table to store old links
CREATE TABLE temp_social_links AS
SELECT id, "userId", "socialMediaLink"
FROM "Influencer"
WHERE "socialMediaLink" IS NOT NULL;

-- After migration, you can manually review and ask users to reconnect
```

### Step 7: Test the New Flow
1. Create a new influencer account
2. Verify email with OTP
3. Complete onboarding
4. Connect Instagram account
5. Connect TikTok account
6. Verify data sync works

### Step 8: Update Frontend

#### Old Signup Form
```typescript
// REMOVE THIS
<input name="socialMediaLink" placeholder="Instagram/TikTok link" />
```

#### New Flow
```typescript
// 1. Signup (no social media)
POST /api/v1/auth/signup/influencer
{
  name, email, password, phoneNo
}

// 2. After onboarding, add "Connect Social Media" section
<button onClick={connectInstagram}>Connect Instagram</button>
<button onClick={connectTikTok}>Connect TikTok</button>

// 3. Handle OAuth flow
const connectInstagram = async () => {
  const res = await fetch('/api/v1/social-media/instagram/auth', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { authUrl } = await res.json();
  window.location.href = authUrl; // Redirect to Instagram
};
```

## Breaking Changes

### API Changes
1. **Signup endpoint** no longer accepts `socialMediaLink`
2. **New endpoints** added for social media OAuth
3. **Influencer model** no longer has `socialMediaLink` field

### Frontend Changes Required
1. Remove social media link input from signup form
2. Add social media connection UI after onboarding
3. Handle OAuth redirect flow
4. Display connected accounts with metrics

## Rollback Plan

If you need to rollback:

```bash
# Restore database from backup
psql -U postgres beautiful_encer < backup_before_migration.sql

# Checkout previous git commit
git checkout <previous-commit-hash>

# Reinstall dependencies
npm install

# Regenerate Prisma client
npm run prisma
```

## Testing Checklist

- [ ] New influencer signup works without social media link
- [ ] Email verification works
- [ ] Onboarding completes successfully
- [ ] Instagram OAuth flow works
- [ ] TikTok OAuth flow works
- [ ] Connected accounts display correctly
- [ ] Data sync populates followers/posts
- [ ] Disconnect account works
- [ ] Manual sync works
- [ ] Tokens are encrypted in database
- [ ] Existing influencers can still log in

## Support

If you encounter issues during migration:
1. Check error logs in console
2. Verify all environment variables are set
3. Ensure Instagram/TikTok apps are configured correctly
4. Check database migration status: `npx prisma migrate status`
5. Review API documentation in API_DOCUMENTATION.md

## Security Notes

- All access tokens are encrypted using AES-256-GCM
- Encryption key must be at least 32 characters
- Never commit `.env` file to version control
- Use HTTPS in production for OAuth callbacks
- Implement rate limiting for API endpoints
- Set up token refresh before expiration
