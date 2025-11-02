# Beautiful_Encer Web (Frontend)

[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-Latest-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![React Query](https://img.shields.io/badge/React%20Query-5.0-FF4154.svg)](https://tanstack.com/query/)

> **Modern, responsive frontend for Beautiful_Encer - A dual-sided influencer marketing platform built with React 19 and TypeScript.**

This is the web frontend application built with **React 19**, **TypeScript**, **Vite**, and **TailwindCSS**. It provides an intuitive user interface for influencers and salons to discover, connect, and collaborate through real-time chat and comprehensive profile management.

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Routing & Navigation](#-routing--navigation)
- [State Management](#-state-management)
- [API Integration](#-api-integration)
- [Real-Time Features](#-real-time-features)
- [Components](#-components)
- [Styling](#-styling)
- [Internationalization (i18n)](#-internationalization-i18n)
- [Forms & Validation](#-forms--validation)
- [Image Handling](#-image-handling)
- [Deployment](#-deployment)
- [Best Practices](#-best-practices)

---

## 🏗 Architecture Overview

Beautiful_Encer Web follows a **component-based architecture** with clear separation of concerns:

```
┌─────────────────────────────────────┐
│          User Interface             │
│   (React Components + TailwindCSS)  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Routing Layer                │
│       (React Router v7)             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      State Management               │
│  ├─ Zustand (UI/Local State)        │
│  └─ React Query (Server State)      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Service Layer                  │
│  (API calls + Business Logic)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      HTTP Client (Axios)            │
│  + WebSocket (Socket.IO)            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Backend API + Socket.IO        │
└─────────────────────────────────────┘
```

### Key Design Principles

1. **Component Composition** - Reusable, single-responsibility components
2. **Separation of Concerns** - UI logic separate from business logic
3. **Server State Management** - React Query handles all server data
4. **Local State Management** - Zustand for UI state (auth, notifications)
5. **Type Safety** - Full TypeScript coverage with strict mode
6. **Responsive Design** - Mobile-first approach with TailwindCSS
7. **Real-Time Updates** - Socket.IO for live chat and notifications

---

## 🛠 Tech Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1 | UI library |
| **TypeScript** | 5.9 | Type-safe JavaScript |
| **Vite** | Latest | Build tool & dev server |
| **TailwindCSS** | 3.4 | Utility-first CSS framework |
| **React Router** | 7.9 | Client-side routing |
| **React Query** | 5.90 | Server state management |
| **Zustand** | 5.0 | Client state management |
| **Socket.IO Client** | 4.8 | Real-time communication |
| **Axios** | 1.12 | HTTP client |

### Key Dependencies

```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.9.4",
    "@tanstack/react-query": "^5.90.2",
    "zustand": "^5.0.8",
    "axios": "^1.12.2",
    "socket.io-client": "^4.8.1",
    "react-hook-form": "^7.64.0",
    "@hookform/resolvers": "^5.2.2",
    "yup": "^1.7.1",
    "react-hot-toast": "^2.6.0",
    "react-i18next": "^16.0.0",
    "i18next": "^25.6.0",
    "framer-motion": "^12.23.22",
    "lucide-react": "^0.545.0",
    "date-fns": "^4.1.0",
    "dayjs": "^1.11.18",
    "classnames": "^2.5.1",
    "recharts": "^3.3.0"
  }
}
```

---

## 📁 Project Structure

```
web/
├── public/                          # Static assets
│   ├── images/                      # Public images
│   └── locales/                     # i18n translation files (if using public folder)
│
├── src/
│   ├── main.tsx                     # Application entry point
│   ├── App.tsx                      # Root component with routing
│   ├── App.css                      # Global styles
│   ├── index.css                    # Tailwind imports
│   │
│   ├── assets/                      # Static assets (images, icons)
│   │   └── placeholder.svg          # Fallback image placeholder
│   │
│   ├── components/                  # Reusable components
│   │   ├── common/                  # Shared components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── ImageWithFallback.tsx
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomNav.tsx        # Mobile navigation
│   │   │   └── Footer.tsx
│   │   │
│   │   ├── ui/                      # UI primitives
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Avatar.tsx
│   │   │
│   │   ├── admin/                   # Admin-specific components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── ActivityLogTable.tsx
│   │   │
│   │   ├── RouteProtection.tsx      # Protected route wrapper
│   │   ├── LanguageSwitcher.tsx     # i18n language selector
│   │   ├── FilterPanel.tsx          # Discovery filters
│   │   ├── ProfileModal.tsx         # User profile modal
│   │   ├── InstagramConnect.tsx     # Instagram integration
│   │   ├── InstagramDataDisplay.tsx
│   │   ├── TikTokConnect.tsx        # TikTok integration
│   │   ├── TikTokDataDisplay.tsx
│   │   ├── YoutubeConnect.tsx       # YouTube integration
│   │   ├── YoutubeDataDisplay.tsx
│   │   └── MessageActionsDropdown.tsx
│   │
│   ├── pages/                       # Page components
│   │   ├── LandingPage.tsx          # Public landing page
│   │   ├── DashboardPage.tsx        # User dashboard
│   │   ├── DiscoveryPage.tsx        # Search influencers/salons
│   │   ├── RequestsPage.tsx         # Connection requests
│   │   ├── ChatPage.tsx             # Real-time chat
│   │   ├── NotificationsPage.tsx    # Notifications
│   │   ├── ProfilePage.tsx          # Own profile
│   │   ├── UserProfilePage.tsx      # View other profiles
│   │   ├── SocialMediaPage.tsx      # Social media management
│   │   ├── ErrorPage.tsx            # 404 page
│   │   │
│   │   ├── auth/                    # Authentication pages
│   │   │   ├── SignupPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── VerifyOtpPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── VerifyForgotOTPPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   │
│   │   ├── onboarding/              # Onboarding pages
│   │   │   ├── InfluencerOnboarding.tsx
│   │   │   └── SalonOnboarding.tsx
│   │   │
│   │   ├── legal/                   # Legal pages
│   │   │   ├── TermsPage.tsx
│   │   │   └── PrivacyPolicyPage.tsx
│   │   │
│   │   └── admin/                   # Admin pages
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminUsers.tsx
│   │       ├── AdminConnections.tsx
│   │       ├── AdminActivityLogs.tsx
│   │       └── AdminProfilePage.tsx
│   │
│   ├── services/                    # API service layer
│   │   ├── auth.service.ts          # Authentication APIs
│   │   ├── onboarding.service.ts    # Onboarding APIs
│   │   ├── discovery.service.ts     # Discovery/search APIs
│   │   ├── connection.service.ts    # Connection request APIs
│   │   ├── chat.service.ts          # Chat APIs
│   │   ├── notification.service.ts  # Notification APIs
│   │   ├── profile.service.ts       # Profile APIs
│   │   └── admin.service.ts         # Admin APIs
│   │
│   ├── store/                       # Zustand stores
│   │   ├── authStore.ts             # Authentication state
│   │   └── notificationStore.ts     # Notification state
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts               # Auth utilities
│   │   ├── useSocket.ts             # Socket.IO hook
│   │   └── useDebounce.ts           # Debounce utility
│   │
│   ├── lib/                         # Library configurations
│   │   ├── axios.ts                 # Axios instance + interceptors
│   │   ├── socket.ts                # Socket.IO client setup
│   │   └── queryClient.ts           # React Query config
│   │
│   ├── config/                      # App configuration
│   │   └── api.config.ts            # API endpoints
│   │
│   ├── constants/                   # Constants
│   │   ├── categories.ts            # Category definitions
│   │   ├── regions.ts               # Japanese prefectures
│   │   └── index.ts
│   │
│   ├── types/                       # TypeScript types
│   │   └── index.ts                 # Shared type definitions
│   │
│   ├── utils/                       # Utility functions
│   │   ├── formatters.ts            # Date, number formatters
│   │   ├── validators.ts            # Input validation
│   │   └── helpers.ts               # General helpers
│   │
│   └── i18n/                        # Internationalization
│       ├── index.ts                 # i18n setup
│       └── locales/
│           ├── en.json              # English translations
│           └── ja.json              # Japanese translations
│
├── .env.example                     # Environment template
├── package.json
├── tsconfig.json                    # TypeScript config
├── tsconfig.app.json                # App-specific TS config
├── tsconfig.node.json               # Node-specific TS config
├── vite.config.ts                   # Vite configuration
├── tailwind.config.js               # Tailwind configuration
├── postcss.config.js                # PostCSS configuration
├── eslint.config.js                 # ESLint configuration
├── vercel.json                      # Vercel deployment config
└── README.md                        # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 9.0.0
- **Backend API running** (see `api/README.md`)

### Installation

1. **Navigate to web directory**
   ```powershell
   cd web
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Set up environment variables**
   ```powershell
   # Copy the example file
   cp .env.example .env
   
   # Edit .env
   # VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```

4. **Start development server**
   ```powershell
   npm run dev
   ```

The app will start on `http://localhost:5173` (or another port if 5173 is busy).

### Development Workflow

```powershell
# Start dev server with hot reload
npm run dev

# Type checking
npm run build

# Lint code
npm run lint

# Preview production build
npm run build
npm run preview
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the `web/` directory:

```bash
# API Base URL
VITE_API_BASE_URL=http://localhost:3000/api/v1

# For production
# VITE_API_BASE_URL=https://api.beautifulencer.com/api/v1
```

**Note:** All environment variables in Vite must be prefixed with `VITE_` to be exposed to the client.

### Accessing Environment Variables

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

---

## 🧭 Routing & Navigation

Beautiful_Encer uses **React Router v7** for client-side routing.

### Route Structure

```typescript
// App.tsx
<Routes>
  {/* Public routes */}
  <Route path="/" element={<LandingPage />} />
  <Route path="/terms" element={<TermsPage />} />
  <Route path="/privacy" element={<PrivacyPolicyPage />} />
  
  {/* Auth routes (redirect if authenticated) */}
  <Route element={<PublicRoute />}>
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/verify-otp" element={<VerifyOtpPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  </Route>
  
  {/* Onboarding routes (redirect if already onboarded) */}
  <Route element={<OnboardingRoute />}>
    <Route path="/onboarding/influencer" element={<InfluencerOnboarding />} />
    <Route path="/onboarding/salon" element={<SalonOnboarding />} />
  </Route>
  
  {/* Protected routes (require authentication) */}
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/discovery" element={<DiscoveryPage />} />
    <Route path="/requests" element={<RequestsPage />} />
    <Route path="/chat" element={<ChatPage />} />
    <Route path="/notifications" element={<NotificationsPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/profile/:userId" element={<UserProfilePage />} />
    <Route path="/social-media" element={<SocialMediaPage />} />
  </Route>
  
  {/* Admin routes */}
  <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/users" element={<AdminUsers />} />
    <Route path="/admin/connections" element={<AdminConnections />} />
    <Route path="/admin/activity-logs" element={<AdminActivityLogs />} />
  </Route>
  
  {/* 404 */}
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

### Route Protection

**ProtectedRoute Component:**
```typescript
// components/RouteProtection.tsx
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles 
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
```

**PublicRoute (redirect authenticated users):**
```typescript
export const PublicRoute: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
```

### Navigation

**Programmatic Navigation:**
```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to route
navigate('/dashboard');

// Navigate with state
navigate('/profile', { state: { from: 'chat' } });

// Go back
navigate(-1);
```

**Link Component:**
```typescript
import { Link } from 'react-router-dom';

<Link to="/profile" className="text-blue-500">
  View Profile
</Link>
```

---

## 🗂 State Management

Beautiful_Encer uses a **hybrid state management approach**:

- **Zustand** - UI/Local state (auth, notifications)
- **React Query** - Server state (API data, caching, mutations)

### Zustand Stores

**Auth Store (`store/authStore.ts`):**
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user, isAuthenticated: !!user });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  initializeAuth: () => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');

    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }

    try {
      const user = JSON.parse(userStr || '');
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },
}));
```

**Usage:**
```typescript
const { user, isAuthenticated, logout } = useAuthStore();

if (isAuthenticated) {
  console.log(`Welcome, ${user.name}`);
}
```

**Notification Store (`store/notificationStore.ts`):**
```typescript
interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnreadCount: () => set((state) => ({ 
    unreadCount: state.unreadCount + 1 
  })),
  decrementUnreadCount: () => set((state) => ({ 
    unreadCount: Math.max(0, state.unreadCount - 1) 
  })),
}));
```

### React Query (Server State)

**Configuration (`lib/queryClient.ts`):**
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
```

**Usage in Components:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discoveryService } from '../services/discovery.service';

const DiscoveryPage = () => {
  const queryClient = useQueryClient();

  // Fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['influencers', filters],
    queryFn: () => discoveryService.getInfluencers(filters),
  });

  // Mutation
  const sendRequestMutation = useMutation({
    mutationFn: connectionService.sendRequest,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['influencers'] });
      toast.success('Request sent!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSendRequest = (userId: string) => {
    sendRequestMutation.mutate({ userId, message: 'Hello!' });
  };

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {data.map((influencer) => (
        <InfluencerCard 
          key={influencer.id} 
          influencer={influencer}
          onSendRequest={handleSendRequest}
        />
      ))}
    </div>
  );
};
```

---

## 🔌 API Integration

### Axios Configuration

**Axios Instance (`lib/axios.ts`):**
```typescript
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 (unauthorized)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto-logout on 401
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### Service Layer

Services encapsulate all API calls:

**Auth Service (`services/auth.service.ts`):**
```typescript
import axios from '../lib/axios';
import { API_ENDPOINTS } from '../config/api.config';

class AuthService {
  async signup(data: SignupData) {
    const response = await axios.post(API_ENDPOINTS.AUTH.INFLUENCER_SIGNUP, data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, { 
      email, 
      password 
    });
    
    // Store token
    localStorage.setItem('accessToken', response.data.data.accessToken);
    
    return response.data.data.user;
  }

  async verifyOTP(email: string, otp: string) {
    const response = await axios.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { 
      email, 
      otp 
    });
    return response.data;
  }
}

export default new AuthService();
```

**Discovery Service (`services/discovery.service.ts`):**
```typescript
class DiscoveryService {
  async getInfluencers(params: DiscoveryParams) {
    const response = await axios.get(API_ENDPOINTS.DISCOVERY.INFLUENCERS, { 
      params 
    });
    return response.data.data;
  }

  async getSalons(params: DiscoveryParams) {
    const response = await axios.get(API_ENDPOINTS.DISCOVERY.SALONS, { 
      params 
    });
    return response.data.data;
  }
}

export default new DiscoveryService();
```

### API Endpoints Configuration

**Centralized Endpoints (`config/api.config.ts`):**
```typescript
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL,
  TIMEOUT: 120000,
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    INFLUENCER_SIGNUP: '/auth/signup/influencer',
    SALON_SIGNUP: '/auth/signup/salon',
    VERIFY_OTP: '/auth/verify-otp',
    LOGIN: '/auth/login',
    // ... more endpoints
  },
  DISCOVERY: {
    INFLUENCERS: '/discovery/influencers',
    SALONS: '/discovery/salons',
  },
  // ... more categories
} as const;
```

---

## 🔄 Real-Time Features

Beautiful_Encer uses **Socket.IO** for real-time chat and notifications.

### Socket.IO Setup

**Socket Configuration (`lib/socket.ts`):**
```typescript
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api.config';

let socket: Socket | null = null;

export const initializeSocket = () => {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    console.error('[Socket] No token found');
    return null;
  }

  // Extract base URL (remove /api/v1 suffix)
  const baseURL = API_CONFIG.BASE_URL.replace('/api/v1', '');

  socket = io(baseURL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

### Socket Hook

**Custom Hook (`hooks/useSocket.ts`):**
```typescript
import { useEffect, useState } from 'react';
import { initializeSocket, getSocket, disconnectSocket } from '../lib/socket';
import { Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = initializeSocket();
    setSocket(socketInstance);

    if (socketInstance) {
      socketInstance.on('connect', () => setIsConnected(true));
      socketInstance.on('disconnect', () => setIsConnected(false));
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  return { socket, isConnected };
};
```

### Chat Implementation

**Chat Page with Socket.IO:**
```typescript
const ChatPage = () => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !currentConversationId) return;

    // Join conversation room
    socket.emit('join_conversation', { conversationId: currentConversationId });

    // Listen for new messages
    socket.on('message_sent', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for typing indicators
    socket.on('user_typing', ({ userId }: { userId: string }) => {
      console.log(`${userId} is typing...`);
    });

    // Cleanup
    return () => {
      socket.off('message_sent');
      socket.off('user_typing');
      socket.emit('leave_conversation', { conversationId: currentConversationId });
    };
  }, [socket, currentConversationId]);

  const sendMessage = (content: string) => {
    if (!socket) return;

    // Optimistic update
    const tempMessage = { id: 'temp', content, createdAt: new Date() };
    setMessages((prev) => [...prev, tempMessage]);

    // Send via API (Socket.IO emits from server)
    chatService.sendMessage(currentConversationId!, content);
  };

  return (
    <div>
      <div className="connection-status">
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      
      <MessageList messages={messages} />
      <MessageInput onSend={sendMessage} />
    </div>
  );
};
```

### Notification Updates

```typescript
const App = () => {
  const { socket } = useSocket();
  const { incrementUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (!socket) return;

    socket.on('notification_received', (notification) => {
      toast.info(notification.message);
      incrementUnreadCount();
    });

    return () => {
      socket.off('notification_received');
    };
  }, [socket, incrementUnreadCount]);

  return <Routes>{/* ... */}</Routes>;
};
```

---

## 🧩 Components

### Component Categories

1. **Common Components** - Reusable UI primitives
2. **Layout Components** - Page structure (Navbar, Sidebar, etc.)
3. **Feature Components** - Business-specific components
4. **Page Components** - Top-level route components

### Common Components

**Button (`components/common/Button.tsx`):**
```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}) => {
  const baseStyles = 'rounded-lg font-medium transition-colors';
  
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  );
};
```

**ImageWithFallback (`components/common/ImageWithFallback.tsx`):**
```typescript
interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  fallbackSrc = '/assets/placeholder.svg',
  className = '',
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setImageSrc(fallbackSrc);
      setHasError(true);
    }
  };

  return (
    <img 
      src={imageSrc} 
      alt={alt} 
      className={className}
      onError={handleError}
    />
  );
};
```

### Layout Components

**Navbar (`components/layout/Navbar.tsx`):**
```typescript
export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="text-2xl font-bold text-blue-600">
          Beautiful_Encer
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/discovery" className="nav-link">
            Discovery
          </Link>
          <Link to="/requests" className="nav-link">
            Requests
          </Link>
          <Link to="/chat" className="nav-link">
            Chat
          </Link>
          
          <Link to="/notifications" className="relative">
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>

          <button onClick={handleLogout}>
            <LogOut size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};
```

---

## 🎨 Styling

Beautiful_Encer uses **TailwindCSS** for styling with a mobile-first approach.

### Tailwind Configuration

**tailwind.config.js:**
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          // ... full color scale
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Custom brand colors
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        // Custom spacing values
      },
    },
  },
  plugins: [],
};
```

### Responsive Design

Tailwind uses mobile-first breakpoints:

```typescript
<div className="
  w-full          // Mobile (default)
  md:w-1/2        // Tablet (≥768px)
  lg:w-1/3        // Desktop (≥1024px)
  xl:w-1/4        // Large desktop (≥1280px)
">
  Content
</div>
```

**Breakpoints:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Common Utility Patterns

```typescript
// Card
<div className="bg-white rounded-lg shadow-md p-6">

// Button
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">

// Input
<input className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">

// Flexbox
<div className="flex items-center justify-between gap-4">

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### Custom Styles

Global styles in `index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  .btn-primary {
    @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors;
  }
  
  .nav-link {
    @apply text-gray-700 hover:text-blue-600 transition-colors;
  }
}
```

---

## 🌐 Internationalization (i18n)

Beautiful_Encer supports **English** and **Japanese** using **react-i18next**.

### i18n Setup

**Configuration (`i18n/index.ts`):**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ja from './locales/ja.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ja: { translation: ja },
    },
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

### Translation Files

**English (`i18n/locales/en.json`):**
```json
{
  "common": {
    "welcome": "Welcome",
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading..."
  },
  "auth": {
    "login": "Login",
    "signup": "Sign Up",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot Password?"
  },
  "discovery": {
    "searchInfluencers": "Search Influencers",
    "searchSalons": "Search Salons",
    "filters": "Filters",
    "noResults": "No results found"
  }
}
```

**Japanese (`i18n/locales/ja.json`):**
```json
{
  "common": {
    "welcome": "ようこそ",
    "save": "保存",
    "cancel": "キャンセル",
    "loading": "読み込み中..."
  },
  "auth": {
    "login": "ログイン",
    "signup": "新規登録",
    "email": "メールアドレス",
    "password": "パスワード",
    "forgotPassword": "パスワードをお忘れですか？"
  }
}
```

### Using Translations

```typescript
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('auth.login')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
};
```

### Language Switcher

```typescript
const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <select 
      value={i18n.language} 
      onChange={(e) => changeLanguage(e.target.value)}
    >
      <option value="en">English</option>
      <option value="ja">日本語</option>
    </select>
  );
};
```

---

## 📝 Forms & Validation

Beautiful_Encer uses **React Hook Form** + **Yup** for form handling and validation.

### Form Example

```typescript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Min 8 characters').required('Password is required'),
});

type FormData = yup.InferType<typeof schema>;

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authService.login(data.email, data.password);
      toast.success('Login successful!');
    } catch (error) {
      toast.error('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('email')}
          type="email"
          placeholder="Email"
          className="input"
        />
        {errors.email && <p className="error">{errors.email.message}</p>}
      </div>

      <div>
        <input
          {...register('password')}
          type="password"
          placeholder="Password"
          className="input"
        />
        {errors.password && <p className="error">{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
};
```

### Validation Schemas

**Common Validation Patterns:**
```typescript
// Email
yup.string().email('Invalid email').required('Required')

// Password (min 8 chars, must contain uppercase, lowercase, number)
yup.string()
  .min(8, 'Minimum 8 characters')
  .matches(/[A-Z]/, 'Must contain uppercase')
  .matches(/[a-z]/, 'Must contain lowercase')
  .matches(/[0-9]/, 'Must contain number')
  .required('Required')

// Phone number (optional)
yup.string().matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').nullable()

// URL
yup.string().url('Invalid URL').nullable()

// Age range
yup.number().min(18, 'Minimum age 18').max(100, 'Maximum age 100').required()

// Terms acceptance (checkbox)
yup.boolean().oneOf([true], 'Must accept terms')
```

---

## 🖼️ Image Handling

### Cloudinary Integration

Images are uploaded to Cloudinary via the backend API.

**Upload Example:**
```typescript
const ProfilePictureUpload = () => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Only images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max file size: 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('profilePic', file);

      const response = await profileService.uploadPicture(formData);
      toast.success('Picture uploaded!');
      
      // Update UI with new image URL
      setUser({ ...user, profilePic: response.data.profilePic });
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <Spinner />}
    </div>
  );
};
```

### Image Proxy

External images (Instagram/TikTok) are proxied through the backend to avoid CORS issues:

```typescript
const proxyImageUrl = (externalUrl: string) => {
  if (!externalUrl) return '/assets/placeholder.svg';
  
  return `${API_CONFIG.BASE_URL}/proxy/image?url=${encodeURIComponent(externalUrl)}`;
};

// Usage
<ImageWithFallback 
  src={proxyImageUrl(user.profilePicture)} 
  alt={user.name}
/>
```

---

## 🚀 Deployment

### Production Build

```powershell
cd web
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Deployment on Vercel

**1. Install Vercel CLI (optional)**
```powershell
npm install -g vercel
```

**2. Deploy**
```powershell
# From web directory
vercel

# Or configure vercel.json and deploy via Git
```

**vercel.json Configuration:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "env": {
    "VITE_API_BASE_URL": "https://api.beautifulencer.com/api/v1"
  }
}
```

**3. Set Environment Variables**
In Vercel dashboard, add:
- `VITE_API_BASE_URL` = Your production API URL

### Deployment on Netlify

**1. Build Command**
```
npm run build
```

**2. Publish Directory**
```
dist
```

**3. Redirects**
Create `public/_redirects`:
```
/*    /index.html   200
```

**4. Environment Variables**
Add in Netlify dashboard:
- `VITE_API_BASE_URL`

### Deployment on Custom VPS

**Using Nginx:**
```bash
# Build locally or via CI/CD
npm run build

# Copy dist/ to server
scp -r dist/* user@server:/var/www/beautifulencer/

# Nginx config
server {
    listen 80;
    server_name beautifulencer.com;
    root /var/www/beautifulencer;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}

# Restart Nginx
sudo systemctl restart nginx

# Install SSL with Let's Encrypt
sudo certbot --nginx -d beautifulencer.com
```

### Pre-Deployment Checklist

- [ ] Update `VITE_API_BASE_URL` to production API
- [ ] Run `npm run build` successfully
- [ ] Test production build locally: `npm run preview`
- [ ] Verify API endpoints are accessible
- [ ] Check console for errors
- [ ] Test on multiple devices (mobile/desktop)
- [ ] Verify Socket.IO connection works
- [ ] Test authentication flow end-to-end
- [ ] Check image uploads/display
- [ ] Verify i18n translations
- [ ] Enable HTTPS
- [ ] Set up monitoring (Sentry, etc.)

---

## 📚 Best Practices

### Code Organization

1. **Component Structure**: One component per file
2. **File Naming**: PascalCase for components, camelCase for utilities
3. **Import Order**: React → Third-party → Local imports
4. **Export Pattern**: Named exports for utilities, default for components

### TypeScript

1. **Type Definitions**: Define types in `types/index.ts` or co-located
2. **Avoid `any`**: Use `unknown` or specific types
3. **Interface vs Type**: Use `type` for props, `interface` for extendable objects
4. **Strict Mode**: Always enabled

### Performance

1. **Code Splitting**: Use React.lazy() for route-based splitting
   ```typescript
   const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
   ```

2. **Memoization**: Use `React.memo()` for expensive components
   ```typescript
   const ExpensiveComponent = React.memo(({ data }) => {
     // ...
   });
   ```

3. **Avoid Inline Functions**: Define callbacks outside JSX when possible
4. **Optimize Images**: Use appropriate formats (WebP), lazy loading
5. **Virtual Lists**: Use `react-window` for long lists

### State Management

1. **Local State First**: Use `useState` for UI-only state
2. **Zustand for Global UI State**: Auth, notifications
3. **React Query for Server State**: All API data
4. **Avoid Prop Drilling**: Use context or stores for deeply nested props

### Security

1. **Never Store Sensitive Data**: Don't store passwords/tokens in plain text
2. **XSS Prevention**: React escapes JSX by default, but be careful with `dangerouslySetInnerHTML`
3. **CSRF Protection**: API handles this with JWT
4. **Content Security Policy**: Configure in deployment
5. **Validate All Inputs**: Use Yup schemas

### Accessibility

1. **Semantic HTML**: Use `<button>`, `<nav>`, `<main>`, etc.
2. **Alt Text**: Always provide for images
3. **Keyboard Navigation**: Ensure all interactive elements are keyboard-accessible
4. **ARIA Labels**: Add where needed for screen readers
5. **Color Contrast**: Ensure WCAG AA compliance

### Error Handling

1. **Error Boundaries**: Wrap routes in error boundaries
   ```typescript
   class ErrorBoundary extends React.Component {
     componentDidCatch(error, errorInfo) {
       console.error('Error:', error, errorInfo);
     }
     render() {
       if (this.state.hasError) {
         return <ErrorPage />;
       }
       return this.props.children;
     }
   }
   ```

2. **Toast Notifications**: Use react-hot-toast for user feedback
3. **Graceful Degradation**: Show fallbacks for failed API calls
4. **Retry Logic**: React Query handles this automatically

---

## 🆘 Troubleshooting

### Common Issues

**1. API Connection Fails**
- Verify `VITE_API_BASE_URL` is set correctly
- Check backend is running and accessible
- Inspect network tab for CORS errors

**2. Socket.IO Not Connecting**
- Ensure token is valid and not expired
- Check Socket.IO server is running
- Verify CORS settings on backend
- Check browser console for errors

**3. Images Not Loading**
- Check image URLs are accessible
- Verify proxy endpoint is working
- Ensure fallback images exist

**4. Routes Not Working After Deploy**
- Configure rewrites/redirects for SPA
- Vercel: See `vercel.json`
- Netlify: Add `_redirects` file

**5. Build Errors**
- Run `npm run build` locally first
- Fix TypeScript errors
- Check for missing dependencies

**6. Styling Issues**
- Ensure Tailwind classes are correct
- Check responsive breakpoints
- Verify TailwindCSS is configured properly

**7. Form Validation Not Working**
- Check Yup schema matches form fields
- Verify resolver is configured in useForm
- Console.log errors object to debug

---

## 📖 Additional Resources

### Documentation

- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Vite**: https://vitejs.dev/guide/
- **TailwindCSS**: https://tailwindcss.com/docs
- **React Router**: https://reactrouter.com/
- **React Query**: https://tanstack.com/query/latest
- **Zustand**: https://docs.pmnd.rs/zustand/
- **React Hook Form**: https://react-hook-form.com/
- **Socket.IO Client**: https://socket.io/docs/v4/client-api/

### Tools

- **VS Code Extensions**:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin (Volar)
  
- **Browser DevTools**:
  - React Developer Tools
  - Redux DevTools (for debugging Zustand)

---

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow code style guidelines
4. Write descriptive commit messages
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

**Code Standards:**
- Use TypeScript strict mode
- Follow ESLint rules
- Add JSDoc comments for complex functions
- Ensure components are responsive
- Update i18n translations for new features

---

## 📧 Support

For questions or issues:
- Open an issue on GitHub
- Contact: support@beautifulencer.com

---

**Built with ❤️ for the Beautiful_Encer platform**
