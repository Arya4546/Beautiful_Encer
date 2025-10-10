# Beautiful Encer API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Most endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 1. Authentication Endpoints

### 1.1 Influencer Signup
**POST** `/auth/signup/influencer`

Register a new influencer account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phoneNo": "+1234567890"
}
```

**Response (201):**
```json
{
  "message": "Influencer registered successfully. Please check your email for an OTP to verify your account.",
  "userId": "uuid-here"
}
```

**Validation:**
- `name`, `email`, `password` are required
- `email` must be valid format
- `password` must be at least 8 characters
- `phoneNo` is optional

---

### 1.2 Verify OTP
**POST** `/auth/verify-otp`

Verify email address with OTP sent during signup.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully. Please complete your onboarding."
}
```

---

### 1.3 Login
**POST** `/auth/login`

Login to get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "accessToken": "jwt-token-here",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "INFLUENCER",
    "createdAt": "2025-10-10T17:00:00.000Z",
    "updatedAt": "2025-10-10T17:00:00.000Z"
  }
}
```

---

## 2. Onboarding Endpoints

### 2.1 Complete Influencer Onboarding
**POST** `/onboarding/influencer`

Complete influencer profile after email verification.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
```
profilePic: <file> (image file)
bio: "Lifestyle and beauty influencer based in NYC"
categories: ["beauty", "lifestyle", "fashion"]
region: "New York, USA"
age: 25
gender: "FEMALE"
```

**Response (200):**
```json
{
  "message": "Onboarding completed successfully",
  "influencer": {
    "id": "uuid",
    "bio": "Lifestyle and beauty influencer based in NYC",
    "profilePic": "https://cloudinary.com/...",
    "categories": ["beauty", "lifestyle", "fashion"],
    "region": "New York, USA",
    "age": 25,
    "gender": "FEMALE",
    "emailVerified": true,
    "status": "PENDING_APPROVAL"
  }
}
```

**Gender Options:**
- `MALE`
- `FEMALE`
- `NON_BINARY`
- `PREFER_NOT_TO_SAY`

---

## 3. Social Media Integration Endpoints

### 3.1 Initiate Instagram OAuth
**GET** `/social-media/instagram/auth`

Get Instagram authorization URL to redirect user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Redirect user to this URL to connect Instagram",
  "authUrl": "https://api.instagram.com/oauth/authorize?client_id=..."
}
```

**Usage:**
1. Call this endpoint from your frontend
2. Redirect user to the `authUrl`
3. User authorizes on Instagram
4. Instagram redirects back to callback URL

---

### 3.2 Instagram OAuth Callback
**GET** `/social-media/instagram/callback?code=xxx&state=xxx`

Handles Instagram OAuth callback (automatically called by Instagram).

**Query Parameters:**
- `code`: Authorization code from Instagram
- `state`: State parameter for CSRF protection

**Response (200):**
```json
{
  "message": "Instagram account connected successfully",
  "username": "johndoe_beauty"
}
```

---

### 3.3 Initiate TikTok OAuth
**GET** `/social-media/tiktok/auth`

Get TikTok authorization URL to redirect user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Redirect user to this URL to connect TikTok",
  "authUrl": "https://www.tiktok.com/v2/auth/authorize?client_key=..."
}
```

---

### 3.4 TikTok OAuth Callback
**GET** `/social-media/tiktok/callback?code=xxx&state=xxx`

Handles TikTok OAuth callback (automatically called by TikTok).

**Query Parameters:**
- `code`: Authorization code from TikTok
- `state`: State parameter for CSRF protection

**Response (200):**
```json
{
  "message": "TikTok account connected successfully",
  "username": "johndoe_official"
}
```

---

### 3.5 Get Connected Accounts
**GET** `/social-media/accounts`

Get all connected social media accounts for the influencer.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "platform": "INSTAGRAM",
      "platformUsername": "johndoe_beauty",
      "followersCount": 15000,
      "followingCount": 500,
      "postsCount": 120,
      "engagementRate": 4.5,
      "isActive": true,
      "lastSyncedAt": "2025-10-10T17:00:00.000Z",
      "createdAt": "2025-10-10T16:00:00.000Z"
    },
    {
      "id": "uuid",
      "platform": "TIKTOK",
      "platformUsername": "johndoe_official",
      "followersCount": 50000,
      "followingCount": 200,
      "postsCount": 85,
      "engagementRate": 8.2,
      "isActive": true,
      "lastSyncedAt": "2025-10-10T17:00:00.000Z",
      "createdAt": "2025-10-10T16:30:00.000Z"
    }
  ]
}
```

---

### 3.6 Sync Account Data
**POST** `/social-media/:platform/sync`

Manually trigger data sync for a connected account.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `platform`: Either `INSTAGRAM` or `TIKTOK`

**Example:**
```
POST /social-media/instagram/sync
```

**Response (200):**
```json
{
  "message": "INSTAGRAM data synced successfully"
}
```

---

### 3.7 Disconnect Account
**DELETE** `/social-media/:platform`

Disconnect a social media account.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `platform`: Either `INSTAGRAM` or `TIKTOK`

**Example:**
```
DELETE /social-media/INSTAGRAM
```

**Response (200):**
```json
{
  "message": "INSTAGRAM account disconnected successfully"
}
```

**Note:** This will also delete all associated posts from the database.

---

## 4. Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized: No token provided"
}
```

### 404 Not Found
```json
{
  "error": "Influencer not found"
}
```

### 409 Conflict
```json
{
  "error": "Email already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to register influencer"
}
```

---

## 5. Complete User Flow Example

### Step 1: Signup
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup/influencer \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePass123",
    "phoneNo": "+1234567890"
  }'
```

### Step 2: Verify OTP (check email)
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456"
  }'
```

### Step 3: Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePass123"
  }'
```

### Step 4: Complete Onboarding
```bash
curl -X POST http://localhost:3000/api/v1/onboarding/influencer \
  -H "Authorization: Bearer <access_token>" \
  -F "profilePic=@profile.jpg" \
  -F "bio=Beauty and lifestyle influencer" \
  -F "categories=[\"beauty\",\"lifestyle\"]" \
  -F "region=New York, USA" \
  -F "age=25" \
  -F "gender=FEMALE"
```

### Step 5: Connect Instagram
```bash
# Get auth URL
curl -X GET http://localhost:3000/api/v1/social-media/instagram/auth \
  -H "Authorization: Bearer <access_token>"

# Redirect user to the returned authUrl
# Instagram will redirect back to callback URL automatically
```

### Step 6: Connect TikTok
```bash
# Get auth URL
curl -X GET http://localhost:3000/api/v1/social-media/tiktok/auth \
  -H "Authorization: Bearer <access_token>"

# Redirect user to the returned authUrl
# TikTok will redirect back to callback URL automatically
```

### Step 7: View Connected Accounts
```bash
curl -X GET http://localhost:3000/api/v1/social-media/accounts \
  -H "Authorization: Bearer <access_token>"
```

---

## 6. Data Models

### User
```typescript
{
  id: string
  name: string
  email: string
  password: string (hashed)
  role: "INFLUENCER" | "SALON" | "ADMIN"
  createdAt: Date
  updatedAt: Date
}
```

### Influencer
```typescript
{
  id: string
  userId: string
  phoneNo: string | null
  status: "PENDING_APPROVAL" | "APPROVED"
  emailVerified: boolean
  bio: string | null
  profilePic: string | null
  categories: string[]
  region: string | null
  age: number | null
  gender: "MALE" | "FEMALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY" | null
  createdAt: Date
  updatedAt: Date
}
```

### SocialMediaAccount
```typescript
{
  id: string
  influencerId: string
  platform: "INSTAGRAM" | "TIKTOK"
  platformUserId: string
  platformUsername: string
  accessToken: string (encrypted)
  refreshToken: string | null (encrypted)
  tokenExpiresAt: Date | null
  isActive: boolean
  followersCount: number | null
  followingCount: number | null
  postsCount: number | null
  engagementRate: number | null
  lastSyncedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
```

### SocialMediaPost
```typescript
{
  id: string
  accountId: string
  platformPostId: string
  caption: string | null
  mediaUrl: string | null
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL" | "REEL" | "STORY"
  likesCount: number
  commentsCount: number
  sharesCount: number
  viewsCount: number | null
  engagementRate: number | null
  postedAt: Date
  createdAt: Date
  updatedAt: Date
}
```
