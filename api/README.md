# Beautiful Encer - Influencer Marketing Platform API

A comprehensive Node.js + Express + TypeScript + PostgreSQL API for managing nano and micro-influencers with Instagram and TikTok OAuth integration.

## Features

- ✅ **Influencer Authentication**: Secure signup, OTP verification, JWT-based login
- ✅ **Profile Onboarding**: Complete profile with bio, categories, region, profile picture
- ✅ **Instagram Integration**: OAuth-based account linking with automatic data sync
- ✅ **TikTok Integration**: OAuth-based account linking with automatic data sync
- ✅ **Data Collection**: Automatic sync of followers, posts, engagement metrics
- ✅ **Secure Storage**: AES-256-GCM encryption for access tokens
- ✅ **RESTful API**: Clean, well-documented endpoints
- ✅ **Type Safety**: Full TypeScript implementation
- ✅ **Database**: PostgreSQL with Prisma ORM

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **HTTP Client**: Axios
- **Encryption**: Node.js Crypto (AES-256-GCM)

## Project Structure

```
api/
├── src/
│   ├── config/
│   │   └── cloudinary.config.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── onboarding.controller.ts
│   │   └── socialMedia.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   └── multer.config.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── onboarding.routes.ts
│   │   └── socialMedia.routes.ts
│   ├── services/
│   │   ├── email.service.ts
│   │   ├── jwt.service.ts
│   │   ├── instagram.service.ts
│   │   └── tiktok.service.ts
│   ├── utils/
│   │   └── encryption.util.ts
│   ├── types/
│   │   └── express.d.ts
│   ├── lib/
│   │   └── prisma.ts
│   └── server.ts
├── prisma/
│   └── schema.prisma
├── .env.example
├── package.json
├── tsconfig.json
├── API_DOCUMENTATION.md
├── SOCIAL_MEDIA_SETUP.md
├── MIGRATION_GUIDE.md
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Instagram App credentials (see SOCIAL_MEDIA_SETUP.md)
- TikTok App credentials (see SOCIAL_MEDIA_SETUP.md)

### Installation

1. **Clone the repository**
   ```bash
   cd api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in all required values:
   - Database connection string
   - JWT secrets
   - Encryption key (32+ characters)
   - Email configuration
   - Cloudinary credentials
   - Instagram API credentials
   - TikTok API credentials

4. **Generate encryption key**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output to `ENCRYPTION_KEY` in `.env`

5. **Set up database**
   ```bash
   # Generate Prisma client
   npm run prisma

   # Run migrations
   npx prisma migrate dev --name initial_setup
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

   Server will run at `http://localhost:3000`

### Verify Installation

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

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup/influencer` - Register influencer
- `POST /api/v1/auth/verify-otp` - Verify email with OTP
- `POST /api/v1/auth/login` - Login

### Onboarding
- `POST /api/v1/onboarding/influencer` - Complete profile (protected)

### Social Media
- `GET /api/v1/social-media/instagram/auth` - Get Instagram OAuth URL (protected)
- `GET /api/v1/social-media/instagram/callback` - Instagram callback
- `GET /api/v1/social-media/tiktok/auth` - Get TikTok OAuth URL (protected)
- `GET /api/v1/social-media/tiktok/callback` - TikTok callback
- `GET /api/v1/social-media/accounts` - Get connected accounts (protected)
- `POST /api/v1/social-media/:platform/sync` - Manual sync (protected)
- `DELETE /api/v1/social-media/:platform` - Disconnect account (protected)

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed endpoint documentation.

## User Flow

1. **Signup**: Influencer registers with name, email, password
2. **Email Verification**: Receives OTP via email, verifies account
3. **Login**: Gets JWT access token
4. **Onboarding**: Completes profile (bio, categories, region, photo)
5. **Connect Social Media**: Links Instagram and/or TikTok via OAuth
6. **Data Sync**: System automatically syncs followers, posts, engagement
7. **Dashboard**: View connected accounts and metrics

## Social Media Integration

### Instagram
- Uses Instagram Basic Display API / Graph API
- Requires Facebook Developer account
- OAuth 2.0 flow for secure authentication
- Fetches: profile, followers, posts, engagement

### TikTok
- Uses TikTok for Developers API
- Requires TikTok Developer account
- OAuth 2.0 flow for secure authentication
- Fetches: profile, followers, videos, engagement

See [SOCIAL_MEDIA_SETUP.md](./SOCIAL_MEDIA_SETUP.md) for detailed setup instructions.

## Security Features

### Token Encryption
- All social media access tokens encrypted with AES-256-GCM
- PBKDF2 key derivation with 100,000 iterations
- Unique salt and IV for each encryption
- Authentication tags for integrity verification

### Password Security
- bcrypt hashing with 12 rounds
- Minimum 8 character password requirement
- Passwords never stored in plain text

### JWT Authentication
- Separate access and refresh tokens
- HTTP-only cookies for refresh tokens
- Token expiration and rotation

### CSRF Protection
- State parameter in OAuth flows
- Validates state on callback

## Database Schema

### Key Models
- **User**: Authentication and basic info
- **Influencer**: Profile and onboarding data
- **SocialMediaAccount**: Connected accounts with encrypted tokens
- **SocialMediaPost**: Synced posts/videos with engagement
- **OTP**: Email verification codes

See `prisma/schema.prisma` for complete schema.

## Development

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Generate Prisma client
npm run prisma

# Create migration
npx prisma migrate dev --name migration_name

# View database in Prisma Studio
npx prisma studio
```

### Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - JWT access token secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `ENCRYPTION_KEY` - 32+ character encryption key
- `EMAIL_*` - Email service configuration
- `CLOUDINARY_*` - Cloudinary credentials
- `INSTAGRAM_*` - Instagram API credentials
- `TIKTOK_*` - TikTok API credentials

## Production Deployment

### Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique secrets for JWT and encryption
- [ ] Enable HTTPS for all endpoints
- [ ] Update OAuth redirect URIs to production URLs
- [ ] Submit Instagram app for review
- [ ] Submit TikTok app for production access
- [ ] Set up database backups
- [ ] Configure CORS properly
- [ ] Implement rate limiting
- [ ] Set up monitoring and logging
- [ ] Use environment-based configuration
- [ ] Set up automated token refresh jobs
- [ ] Configure proper error handling

### Deployment Platforms
- **Heroku**: Add PostgreSQL addon, set environment variables
- **Railway**: Connect GitHub, add PostgreSQL, set env vars
- **AWS**: EC2 + RDS PostgreSQL
- **DigitalOcean**: App Platform + Managed PostgreSQL
- **Vercel**: Serverless functions (requires adaptation)

## Testing

### Manual Testing Flow

1. **Test Signup**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/signup/influencer \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
   ```

2. **Check email for OTP and verify**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","otp":"123456"}'
   ```

3. **Login**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

4. **Complete onboarding** (use token from login)
5. **Connect Instagram** (use token)
6. **View connected accounts** (use token)

## Troubleshooting

### Common Issues

**Prisma Client Errors**
```bash
npm run prisma
npx prisma generate
```

**Database Connection Failed**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

**Instagram/TikTok OAuth Fails**
- Verify app credentials in .env
- Check redirect URIs match exactly
- Ensure app is not in sandbox mode (for production)

**Encryption Errors**
- Ensure ENCRYPTION_KEY is at least 32 characters
- Don't change encryption key after storing tokens

## Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Social Media Setup](./SOCIAL_MEDIA_SETUP.md) - Instagram/TikTok setup guide
- [Migration Guide](./MIGRATION_GUIDE.md) - Upgrading from old system

## License

Proprietary - Beautiful Encer

## Support

For issues or questions, please contact the development team.
