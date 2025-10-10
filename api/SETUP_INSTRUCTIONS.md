# Setup Instructions - Beautiful Encer API

## Step-by-Step Setup Guide

Follow these steps to get the Beautiful Encer API running on your machine.

---

## 1. Install Dependencies

Open terminal in the `api` directory and run:

```bash
npm install
```

This will install:
- express, axios, cors
- @prisma/client, prisma
- bcryptjs, jsonwebtoken
- multer, cloudinary
- nodemailer
- TypeScript and type definitions

---

## 2. Configure Environment Variables

### Generate Encryption Key

Run this command to generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (it will be a 64-character hex string).

### Create .env File

Copy the example file:

```bash
cp .env.example .env
```

Or create `.env` manually with this content:

```env
# Server
PORT=3000
NODE_ENV=development

# Database - UPDATE THIS
DATABASE_URL="postgresql://postgres:password@localhost:5432/beautiful_encer?schema=public"

# JWT Secrets - GENERATE UNIQUE VALUES
JWT_ACCESS_SECRET=your_jwt_access_secret_min_32_characters_long
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_characters_long

# Encryption Key - USE THE GENERATED KEY FROM ABOVE
ENCRYPTION_KEY=paste_the_64_char_hex_string_here

# Email Configuration - UPDATE WITH YOUR SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@beautifulencer.com

# Cloudinary - UPDATE WITH YOUR CREDENTIALS
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Instagram API - LEAVE EMPTY FOR NOW, SETUP LATER
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/v1/social-media/instagram/callback

# TikTok API - LEAVE EMPTY FOR NOW, SETUP LATER
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=http://localhost:3000/api/v1/social-media/tiktok/callback
```

### Important Notes:
- **DATABASE_URL**: Update with your PostgreSQL credentials
- **JWT Secrets**: Use long random strings (32+ characters)
- **ENCRYPTION_KEY**: Use the generated hex string
- **Email**: For Gmail, use App Password (not regular password)
- **Cloudinary**: Sign up at cloudinary.com for free account
- **Instagram/TikTok**: Can be configured later

---

## 3. Set Up PostgreSQL Database

### Option A: Local PostgreSQL

1. **Install PostgreSQL** (if not installed)
   - Windows: Download from postgresql.org
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Start PostgreSQL**
   ```bash
   # Mac
   brew services start postgresql
   
   # Linux
   sudo service postgresql start
   
   # Windows - runs automatically after install
   ```

3. **Create Database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE beautiful_encer;
   
   # Exit
   \q
   ```

4. **Update DATABASE_URL in .env**
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/beautiful_encer?schema=public"
   ```

### Option B: Cloud Database (Recommended for beginners)

Use a free cloud PostgreSQL service:

**Supabase (Recommended)**
1. Go to supabase.com
2. Create free account
3. Create new project
4. Copy connection string from Settings → Database
5. Paste into DATABASE_URL in .env

**Railway**
1. Go to railway.app
2. Create free account
3. New Project → Add PostgreSQL
4. Copy DATABASE_URL
5. Paste into .env

---

## 4. Generate Prisma Client

```bash
npm run prisma
```

This generates the Prisma client based on your schema.

---

## 5. Run Database Migrations

```bash
npx prisma migrate dev --name initial_setup
```

This will:
- Create all database tables
- Set up relationships
- Apply indexes

You should see output like:
```
✔ Generated Prisma Client
✔ Applied migration: initial_setup
```

---

## 6. Verify Database Setup

Open Prisma Studio to view your database:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can see all your tables.

---

## 7. Set Up Email (Gmail Example)

### For Gmail:

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Security → 2-Step Verification → Turn On

2. **Generate App Password**
   - Security → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Beautiful Encer"
   - Copy the 16-character password

3. **Update .env**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=the_16_char_app_password
   EMAIL_FROM=noreply@beautifulencer.com
   ```

---

## 8. Set Up Cloudinary

1. **Sign up** at cloudinary.com (free tier is enough)
2. **Get credentials** from Dashboard
3. **Update .env**
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

---

## 9. Start the Server

```bash
npm run dev
```

You should see:
```
[server]: Running at http://localhost:3000
```

---

## 10. Test the API

### Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Test Signup

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup/influencer \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phoneNo": "+1234567890"
  }'
```

Expected response:
```json
{
  "message": "Influencer registered successfully. Please check your email for an OTP to verify your account.",
  "userId": "some-uuid"
}
```

Check your email for the OTP!

---

## 11. Set Up Instagram API (Optional - Can Do Later)

See [SOCIAL_MEDIA_SETUP.md](./SOCIAL_MEDIA_SETUP.md) for detailed instructions.

Quick steps:
1. Create Facebook Developer account
2. Create app
3. Add Instagram Basic Display product
4. Configure OAuth redirect URI
5. Get App ID and Secret
6. Update .env

---

## 12. Set Up TikTok API (Optional - Can Do Later)

See [SOCIAL_MEDIA_SETUP.md](./SOCIAL_MEDIA_SETUP.md) for detailed instructions.

Quick steps:
1. Register at TikTok for Developers
2. Create app
3. Configure OAuth redirect URI
4. Get Client Key and Secret
5. Update .env

---

## Common Issues & Solutions

### Issue: "Cannot connect to database"
**Solution**: 
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Test connection: `psql "your_database_url"`

### Issue: "Prisma Client not generated"
**Solution**:
```bash
npm run prisma
npx prisma generate
```

### Issue: "Email not sending"
**Solution**:
- For Gmail, use App Password (not regular password)
- Enable 2FA first
- Check EMAIL_HOST and EMAIL_PORT are correct

### Issue: "Module not found"
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Port 3000 already in use"
**Solution**:
- Change PORT in .env to 3001 or another port
- Or kill the process using port 3000

### Issue: TypeScript errors about Prisma types
**Solution**:
```bash
npm run prisma
npx prisma generate
# Restart your IDE/editor
```

---

## Next Steps

1. ✅ API is running
2. ✅ Database is set up
3. ✅ Email is working
4. ✅ File upload is configured

**Now you can:**
- Test the complete signup flow
- Build a frontend to consume the API
- Set up Instagram/TikTok OAuth when ready
- Deploy to production

---

## Development Workflow

### Daily Development
```bash
# Start server with hot reload
npm run dev
```

### After Schema Changes
```bash
# Generate Prisma client
npm run prisma

# Create and run migration
npx prisma migrate dev --name describe_your_changes
```

### View Database
```bash
# Open Prisma Studio
npx prisma studio
```

---

## Production Deployment

When ready to deploy:

1. Set `NODE_ENV=production` in environment
2. Use strong secrets (not the example ones)
3. Use HTTPS for all URLs
4. Update OAuth redirect URIs to production URLs
5. Set up database backups
6. Configure monitoring

See [README.md](./README.md) for detailed production checklist.

---

## Getting Help

- **API Documentation**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Social Media Setup**: See [SOCIAL_MEDIA_SETUP.md](./SOCIAL_MEDIA_SETUP.md)
- **Migration Guide**: See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

---

## You're All Set! 🎉

Your Beautiful Encer API is now ready for development!
