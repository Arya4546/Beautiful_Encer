# Beautiful Encer - Complete Setup Guide

## 🎉 Project Overview

A professional influencer marketing platform with:
- **Backend**: Node.js + Express + TypeScript + PostgreSQL + Prisma
- **Frontend**: React + TypeScript + Vite + TailwindCSS + Framer Motion

---

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed
- Git installed
- Code editor (VS Code recommended)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Backend Setup

```bash
# Navigate to API folder
cd api

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output and paste it as ENCRYPTION_KEY in .env

# Update .env with your database credentials
# DATABASE_URL="postgresql://postgres:password@localhost:5432/beautiful_encer?schema=public"

# Generate Prisma client
npm run prisma

# Run database migration
npx prisma migrate dev --name initial_setup

# Start backend server
npm run dev
```

Backend will run at: `http://localhost:3000`

### Step 2: Frontend Setup

```bash
# Open new terminal, navigate to web folder
cd web

# Install dependencies
npm install

# Start frontend server
npm run dev
```

Frontend will run at: `http://localhost:5173`

---

## 🎯 Testing the Application

### 1. Open Frontend

Visit: `http://localhost:5173`

### 2. Test Influencer Flow

1. Click "Sign Up as Influencer"
2. Fill the form:
   - Name: John Doe
   - Email: john@example.com
   - Password: password123
3. Check your email for OTP (or check backend console logs)
4. Enter OTP to verify
5. Login with credentials
6. Complete onboarding:
   - Upload profile picture
   - Enter bio
   - Select categories (beauty, lifestyle, etc.)
   - Enter region, age, gender
7. Submit and see dashboard

### 3. Test Salon Flow

1. Click "Sign Up as Salon"
2. Fill the form:
   - Name: Glamour Salon
   - Email: salon@example.com
   - Password: password123
3. Verify OTP
4. Login
5. Complete onboarding:
   - Upload logo (optional)
   - Enter business name
   - Enter description
   - Select preferred influencer categories
   - Add website, social media handles, etc.
6. Submit and see dashboard

---

## 📁 Project Structure

```
Beautiful_Encer/
├── api/                          # Backend
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   ├── controllers/         # Route controllers
│   │   ├── middlewares/         # Auth, multer, etc.
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   ├── utils/               # Utilities
│   │   ├── lib/                 # Prisma client
│   │   └── server.ts            # Entry point
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── .env                     # Environment variables
│   └── package.json
│
└── web/                         # Frontend
    ├── src/
    │   ├── components/          # Reusable components
    │   ├── config/              # API config
    │   ├── lib/                 # Axios instance
    │   ├── pages/               # Page components
    │   ├── services/            # API services
    │   ├── store/               # Zustand store
    │   ├── types/               # TypeScript types
    │   ├── App.tsx              # Main app
    │   └── main.tsx             # Entry point
    ├── .env                     # Environment variables
    └── package.json
```

---

## 🔑 Key Features Implemented

### Backend ✅

- [x] Influencer signup with OTP verification
- [x] Salon signup with OTP verification
- [x] Login (shared for both roles)
- [x] Influencer onboarding (profile, categories, region, etc.)
- [x] Salon onboarding (business info, preferred categories)
- [x] JWT authentication
- [x] File upload with Cloudinary
- [x] Email service for OTP
- [x] Instagram OAuth integration (ready)
- [x] TikTok OAuth integration (ready)
- [x] Encrypted token storage
- [x] Database schema with Prisma

### Frontend ✅

- [x] Beautiful landing page
- [x] Role-based signup flow
- [x] OTP verification page
- [x] Login page
- [x] Influencer onboarding form
- [x] Salon onboarding form
- [x] Dashboard page
- [x] Toast notifications
- [x] Form validation
- [x] Responsive design
- [x] Smooth animations
- [x] API integration
- [x] State management (Zustand)
- [x] Protected routes

---

## 🌐 API Endpoints

### Authentication

```
POST /api/v1/auth/signup/influencer  - Register influencer
POST /api/v1/auth/signup/salon       - Register salon
POST /api/v1/auth/verify-otp         - Verify email
POST /api/v1/auth/login              - Login
```

### Onboarding

```
POST /api/v1/onboarding/influencer   - Complete influencer profile
POST /api/v1/onboarding/salon        - Complete salon profile
```

### Social Media (Ready for later)

```
GET  /api/v1/social-media/instagram/auth      - Get Instagram OAuth URL
GET  /api/v1/social-media/instagram/callback  - Instagram callback
GET  /api/v1/social-media/tiktok/auth         - Get TikTok OAuth URL
GET  /api/v1/social-media/tiktok/callback     - TikTok callback
GET  /api/v1/social-media/accounts             - Get connected accounts
POST /api/v1/social-media/:platform/sync      - Sync data
DEL  /api/v1/social-media/:platform           - Disconnect account
```

---

## 🔧 Environment Variables

### Backend (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/beautiful_encer?schema=public"

# JWT
JWT_ACCESS_SECRET=your_jwt_access_secret_min_32_characters
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_characters

# Encryption
ENCRYPTION_KEY=generated_64_char_hex_string

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@beautifulencer.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Instagram (optional for now)
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/v1/social-media/instagram/callback

# TikTok (optional for now)
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=http://localhost:3000/api/v1/social-media/tiktok/callback
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## 🎨 Tech Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT (jsonwebtoken)
- **Password**: bcryptjs
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **HTTP Client**: Axios
- **Encryption**: Node.js Crypto (AES-256-GCM)

### Frontend

- **Library**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Routing**: React Router v7
- **State**: Zustand
- **Forms**: React Hook Form
- **HTTP**: Axios
- **Notifications**: React Toastify
- **Icons**: React Icons

---

## 📚 Documentation

- **Backend API**: `api/POSTMAN_TESTING_GUIDE.md`
- **Salon API**: `api/SALON_API_DOCUMENTATION.md`
- **Social Media Setup**: `api/SOCIAL_MEDIA_SETUP.md`
- **Frontend**: `web/FRONTEND_README.md`

---

## 🐛 Troubleshooting

### Backend Issues

**Database Connection Failed**
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env
psql -U postgres -c "SELECT 1"
```

**Prisma Errors**
```bash
npm run prisma
npx prisma generate
```

**Email Not Sending**
- Use Gmail App Password (not regular password)
- Enable 2FA first in Google Account

### Frontend Issues

**API Connection Failed**
- Ensure backend is running on port 3000
- Check `.env` has correct API URL
- Verify CORS is enabled on backend

**Build Errors**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🚀 Next Steps

### Immediate (Already Done)

- ✅ User authentication (signup, login, OTP)
- ✅ Onboarding flows (influencer & salon)
- ✅ Database schema
- ✅ API endpoints
- ✅ Frontend pages
- ✅ Form validation
- ✅ File uploads

### Phase 2 (Later)

- 🔄 Instagram OAuth connection
- 🔄 TikTok OAuth connection
- 🔄 Social media data sync
- 🔄 Dashboard with analytics
- 🔄 Search & discovery
- 🔄 Messaging system
- 🔄 Campaign management
- 🔄 Admin panel

---

## 📝 Testing Checklist

### Backend

- [ ] Influencer signup works
- [ ] Salon signup works
- [ ] OTP email received
- [ ] OTP verification works
- [ ] Login works
- [ ] Influencer onboarding works
- [ ] Salon onboarding works
- [ ] File upload works
- [ ] JWT tokens generated
- [ ] Database records created

### Frontend

- [ ] Landing page loads
- [ ] Signup flow works
- [ ] OTP page works
- [ ] Login works
- [ ] Onboarding forms work
- [ ] File upload works
- [ ] Form validation works
- [ ] Toast notifications show
- [ ] Routing works
- [ ] Responsive on mobile
- [ ] Animations smooth

---

## 🎯 Success Criteria

✅ **Backend Running**: `http://localhost:3000/health` returns `{"status":"ok"}`  
✅ **Frontend Running**: `http://localhost:5173` loads landing page  
✅ **Database Connected**: Prisma Studio shows tables  
✅ **Complete Flow**: Can signup → verify → login → onboard → dashboard  

---

## 💡 Tips

1. **Use Postman**: Import `api/POSTMAN_TESTING_GUIDE.md` for API testing
2. **Check Logs**: Backend console shows OTP codes during development
3. **Prisma Studio**: Run `npx prisma studio` to view database
4. **Hot Reload**: Both backend and frontend have hot reload enabled
5. **TypeScript**: Fix any TypeScript errors before testing

---

## 🎉 You're All Set!

Your Beautiful Encer platform is now ready for development and testing!

**Backend**: `http://localhost:3000`  
**Frontend**: `http://localhost:5173`  
**Database**: Prisma Studio at `http://localhost:5555`

Happy coding! 🚀
