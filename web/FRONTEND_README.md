# Beautiful Encer - Frontend

Professional React + TypeScript + Vite frontend for the Beautiful Encer influencer marketing platform.

## 🚀 Features

- ✅ **Modern Stack**: React 19, TypeScript, Vite, TailwindCSS
- ✅ **State Management**: Zustand for global state
- ✅ **Animations**: Framer Motion for smooth transitions
- ✅ **Form Handling**: React Hook Form with validation
- ✅ **API Integration**: Axios with interceptors
- ✅ **Routing**: React Router v7
- ✅ **Notifications**: React Toastify
- ✅ **Type Safety**: Full TypeScript implementation
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Professional UI**: Premium design with gradients and animations

## 📁 Project Structure

```
web/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── AuthLayout.tsx          # Auth pages layout
│   │   └── ui/
│   │       ├── Button.tsx              # Reusable button component
│   │       ├── Input.tsx               # Input field with validation
│   │       ├── Select.tsx              # Select dropdown
│   │       ├── MultiSelect.tsx         # Multi-select with tags
│   │       └── FileUpload.tsx          # Drag & drop file upload
│   ├── config/
│   │   └── api.config.ts               # API endpoints configuration
│   ├── lib/
│   │   └── axios.ts                    # Axios instance with interceptors
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── SignupPage.tsx          # Signup with role selection
│   │   │   ├── LoginPage.tsx           # Login page
│   │   │   └── VerifyOtpPage.tsx       # OTP verification
│   │   ├── onboarding/
│   │   │   ├── InfluencerOnboarding.tsx
│   │   │   └── SalonOnboarding.tsx
│   │   ├── LandingPage.tsx             # Landing page
│   │   └── DashboardPage.tsx           # Post-onboarding dashboard
│   ├── services/
│   │   ├── auth.service.ts             # Auth API calls
│   │   └── onboarding.service.ts       # Onboarding API calls
│   ├── store/
│   │   └── authStore.ts                # Zustand auth store
│   ├── types/
│   │   └── index.ts                    # TypeScript types
│   ├── App.tsx                         # Main app with routes
│   ├── main.tsx                        # App entry point
│   └── index.css                       # Global styles + animations
├── .env                                # Environment variables
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Configure Environment

The `.env` file is already created with:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### 3. Start Development Server

```bash
npm run dev
```

The app will run at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## 🎨 Design System

### Colors

- **Primary Gradient**: Purple to Pink (`from-purple-600 to-pink-600`)
- **Secondary Gradient**: Blue to Cyan (`from-blue-600 to-cyan-600`)
- **Success**: Green (`#10b981`)
- **Error**: Red (`#ef4444`)
- **Background**: Gradient from purple/pink/blue tones

### Typography

- **Font**: System fonts (Inter-like)
- **Headings**: Bold, large sizes with gradients
- **Body**: Regular weight, readable sizes

### Components

All UI components follow a consistent design:
- Rounded corners (`rounded-xl`, `rounded-2xl`)
- Smooth transitions (`transition-all duration-300`)
- Hover effects with scale
- Focus states with ring
- Gradient backgrounds for primary actions

## 📱 Pages & Routes

### Public Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | LandingPage | Marketing landing page |
| `/signup` | SignupPage | Role selection + signup form |
| `/login` | LoginPage | User login |
| `/verify-otp` | VerifyOtpPage | Email verification |

### Protected Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/influencer/onboarding` | InfluencerOnboarding | Complete influencer profile |
| `/salon/onboarding` | SalonOnboarding | Complete salon profile |
| `/dashboard` | DashboardPage | Post-onboarding dashboard |

## 🔐 Authentication Flow

```
1. Landing Page
   ↓
2. Signup (Choose Role: Influencer or Salon)
   ↓
3. Fill Signup Form
   ↓
4. Verify OTP (sent to email)
   ↓
5. Login
   ↓
6. Onboarding (role-specific)
   ↓
7. Dashboard
```

## 🎯 Key Features

### 1. Role-Based Signup

Users choose between Influencer or Salon before filling the signup form.

### 2. OTP Verification

6-digit OTP input with:
- Auto-focus next input
- Paste support
- Visual feedback

### 3. Influencer Onboarding

- Profile picture upload (drag & drop)
- Bio textarea
- Multi-select categories
- Region input
- Age input
- Gender selection

### 4. Salon Onboarding

- Business logo upload (optional)
- Business name
- Description
- Preferred influencer categories (multi-select)
- Website, established year, team size
- Operating hours
- Social media handles (Instagram, TikTok, Facebook)

### 5. Form Validation

All forms use React Hook Form with validation:
- Required fields
- Email format
- Password strength (min 8 characters)
- Password confirmation match
- Age validation
- URL validation

### 6. Toast Notifications

Success/error messages for all actions:
- Signup success
- OTP verification
- Login success
- Onboarding completion
- API errors

## 🔧 API Integration

### Axios Configuration

- Base URL from environment variable
- Automatic token injection
- 401 handling (auto-logout)
- Request/response interceptors

### Services

**Auth Service** (`auth.service.ts`):
- `influencerSignup()`
- `salonSignup()`
- `verifyOtp()`
- `login()`
- `logout()`

**Onboarding Service** (`onboarding.service.ts`):
- `influencerOnboarding()`
- `salonOnboarding()`

## 🎭 Animations

### Framer Motion

- Page transitions
- Component entrance animations
- Hover effects
- Button interactions
- Loading states

### Custom CSS Animations

- `fadeIn` - Smooth fade in
- `blob` - Floating background blobs
- Smooth scrolling
- Custom scrollbar

## 📦 State Management

### Zustand Store

**Auth Store** (`authStore.ts`):
- `user` - Current user object
- `isAuthenticated` - Auth status
- `setUser()` - Update user
- `logout()` - Clear auth
- `initializeAuth()` - Load from localStorage

## 🎨 UI Components

### Button

```tsx
<Button variant="primary" size="md" isLoading={false} fullWidth>
  Click Me
</Button>
```

**Variants**: `primary`, `secondary`, `outline`, `ghost`  
**Sizes**: `sm`, `md`, `lg`

### Input

```tsx
<Input
  label="Email"
  type="email"
  placeholder="Enter email"
  icon={<FiMail />}
  error="Error message"
/>
```

### MultiSelect

```tsx
<MultiSelect
  label="Categories"
  options={['beauty', 'lifestyle', 'fashion']}
  value={selected}
  onChange={setSelected}
/>
```

### FileUpload

```tsx
<FileUpload
  label="Profile Picture"
  accept="image/*"
  onChange={(file) => setFile(file)}
/>
```

## 🚨 Error Handling

- API errors shown via toast
- Form validation errors inline
- Network errors handled gracefully
- 401 errors trigger auto-logout

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: `sm`, `md`, `lg`, `xl`
- Touch-friendly interactions
- Optimized for all screen sizes

## 🔒 Security

- JWT tokens in localStorage
- Automatic token injection
- CSRF protection via state parameter
- No sensitive data in URLs
- Secure password handling

## 🧪 Testing

### Manual Testing Checklist

- [ ] Signup as Influencer
- [ ] Signup as Salon
- [ ] OTP verification
- [ ] Login
- [ ] Influencer onboarding
- [ ] Salon onboarding
- [ ] Dashboard access
- [ ] Logout
- [ ] Form validations
- [ ] Error handling
- [ ] Responsive design

## 🚀 Deployment

### Build

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

### Deploy to Vercel

```bash
vercel
```

### Deploy to Netlify

```bash
netlify deploy --prod
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:3000/api/v1` |

## 🐛 Troubleshooting

### API Connection Issues

- Ensure backend is running on `http://localhost:3000`
- Check `.env` file has correct API URL
- Verify CORS is enabled on backend

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Regenerate types
npm run build
```

## 📚 Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Routing
- **Zustand** - State management
- **React Hook Form** - Forms
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **React Icons** - Icons

## 🎯 Next Steps

1. ✅ Basic auth flow complete
2. ✅ Onboarding complete
3. 🔄 Add Instagram/TikTok OAuth (later)
4. 🔄 Build dashboard features
5. 🔄 Add profile management
6. 🔄 Add messaging system
7. 🔄 Add campaign management

## 📄 License

Proprietary - Beautiful Encer

## 👥 Support

For issues or questions, contact the development team.
