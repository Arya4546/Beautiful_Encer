# Quick Installation Guide

## 📦 Install Backend Dependencies

Run this command to install the new packages:

```bash
cd api
npm install
```

This will install:
- `node-cron@^3.0.3` - For scheduling automated token refresh and data sync
- `express-rate-limit@^7.4.0` - For rate limiting protection

## 🔐 Generate Encryption Keys

After installation, generate your encryption keys:

```bash
node -e "const crypto = require('crypto'); console.log('Copy these to your .env file:\n'); console.log('ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex')); console.log('ENCRYPTION_IV=' + crypto.randomBytes(16).toString('hex')); console.log('CRON_JOB_SECRET=' + crypto.randomBytes(32).toString('hex'));"
```

Copy the output and paste into your `api/.env` file.

## ✅ Verify Installation

Start your server:

```bash
npm run dev
```

Look for these messages in the console:
```
[server]: Running at http://localhost:3000
[cron]: Automated jobs initialized successfully
[TokenRefreshJob] Initialized - will run daily at 2:00 AM
[DataSyncScheduler] Initialized - will run daily at 3:00 AM
```

## 📚 Next Steps

1. ✅ **Install dependencies** (above)
2. ✅ **Generate encryption keys** (above)
3. 📖 **Get OAuth credentials** - Follow `OAUTH_CREDENTIALS_SETUP_GUIDE.md`
4. 🧪 **Test OAuth flow** - Try connecting Instagram/TikTok
5. 📊 **Monitor logs** - Check token refresh and data sync

## 🆘 Need Help?

- Check `BACKEND_FIXES_IMPLEMENTATION.md` for detailed technical docs
- Check `OAUTH_CREDENTIALS_SETUP_GUIDE.md` for getting Instagram/TikTok credentials
- Check `SOCIAL_MEDIA_INTEGRATION_REVIEW.md` for full code review
