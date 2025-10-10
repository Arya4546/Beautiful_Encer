# Salon API Documentation

Complete API reference for salon signup, onboarding, and management in the Beautiful Encer platform.

---

## Authentication Flow for Salons

```
1. Salon Signup (POST /api/v1/auth/signup/salon)
   ↓
2. Email Verification (POST /api/v1/auth/verify-otp)
   ↓
3. Login (POST /api/v1/auth/login)
   ↓
4. Onboarding (POST /api/v1/onboarding/salon)
   ↓
5. Ready to use platform
```

---

## 1. Salon Signup

### Endpoint
```
POST /api/v1/auth/signup/salon
```

### Description
Register a new salon account. An OTP will be sent to the provided email for verification.

### Request Body
```json
{
  "name": "Glamour Salon",
  "email": "contact@glamoursalon.com",
  "password": "securePassword123",
  "phoneNo": "+1234567890"
}
```

### Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Salon owner/contact person name |
| email | string | Yes | Business email (must be valid format) |
| password | string | Yes | Password (minimum 8 characters) |
| phoneNo | string | No | Contact phone number |

### Success Response (201)
```json
{
  "message": "Salon registered successfully. Please check your email for an OTP to verify your account.",
  "userId": "uuid-here"
}
```

### Error Responses

**400 Bad Request**
```json
{
  "error": "Missing required fields: name, email, and password are required"
}
```

**400 Bad Request - Invalid Email**
```json
{
  "error": "Invalid email format"
}
```

**400 Bad Request - Weak Password**
```json
{
  "error": "Password must be at least 8 characters long"
}
```

**409 Conflict - Email Exists**
```json
{
  "error": "Email already exists"
}
```

### Example cURL
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup/salon \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Glamour Salon",
    "email": "contact@glamoursalon.com",
    "password": "securePassword123",
    "phoneNo": "+1234567890"
  }'
```

---

## 2. Verify OTP

### Endpoint
```
POST /api/v1/auth/verify-otp
```

### Description
Verify email address using the OTP sent during signup. Works for both salons and influencers.

### Request Body
```json
{
  "email": "contact@glamoursalon.com",
  "otp": "123456"
}
```

### Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Email used during signup |
| otp | string | Yes | 6-digit OTP from email |

### Success Response (200)
```json
{
  "message": "Email verified successfully. Please complete your onboarding.",
  "role": "SALON"
}
```

### Error Responses

**400 Bad Request - Invalid OTP**
```json
{
  "error": "Invalid OTP"
}
```

**400 Bad Request - Expired OTP**
```json
{
  "error": "OTP has expired"
}
```

**404 Not Found**
```json
{
  "error": "User not found"
}
```

### Example cURL
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contact@glamoursalon.com",
    "otp": "123456"
  }'
```

---

## 3. Login

### Endpoint
```
POST /api/v1/auth/login
```

### Description
Login to get JWT access token. Works for both salons and influencers.

### Request Body
```json
{
  "email": "contact@glamoursalon.com",
  "password": "securePassword123"
}
```

### Success Response (200)
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Glamour Salon",
    "email": "contact@glamoursalon.com",
    "role": "SALON",
    "createdAt": "2025-10-10T17:00:00.000Z",
    "updatedAt": "2025-10-10T17:00:00.000Z"
  }
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": "Invalid credentials"
}
```

### Example cURL
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contact@glamoursalon.com",
    "password": "securePassword123"
  }'
```

---

## 4. Salon Onboarding

### Endpoint
```
POST /api/v1/onboarding/salon
```

### Description
Complete salon profile with business details, location, and images. This is a protected endpoint requiring authentication.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

### Form Data Fields

#### Required Fields
| Field | Type | Description |
|-------|------|-------------|
| businessName | string | Official business name |
| description | string | Detailed salon description |
| preferredCategories | JSON array | Types of influencers they want (e.g., ["beauty", "lifestyle", "fashion"]) |

#### Optional Fields
| Field | Type | Description |
|-------|------|-------------|
| profilePic | file | Salon logo/profile picture |
| website | string | Salon website URL |
| establishedYear | number | Year salon was established |
| teamSize | number | Number of staff members |
| operatingHours | JSON string | Business hours |
| instagramHandle | string | Instagram username (without @) |
| tiktokHandle | string | TikTok username (without @) |
| facebookPage | string | Facebook page URL |

### Example Form Data
```
businessName: "Glamour Beauty Salon"
description: "Premium beauty salon looking to collaborate with influencers for marketing campaigns"
preferredCategories: ["beauty", "lifestyle", "fashion", "wellness"]
website: "https://glamoursalon.com"
establishedYear: 2015
teamSize: 12
operatingHours: {"monday": "9:00-18:00", "tuesday": "9:00-18:00", ...}
instagramHandle: "glamoursalon"
tiktokHandle: "glamoursalon"
facebookPage: "https://facebook.com/glamoursalon"
profilePic: <file>
```

### Success Response (200)
```json
{
  "message": "Salon onboarding completed successfully",
  "salon": {
    "id": "uuid",
    "phoneNo": "+1234567890",
    "status": "PENDING_APPROVAL",
    "emailVerified": true,
    "businessName": "Glamour Beauty Salon",
    "description": "Premium beauty salon offering...",
    "profilePic": "https://cloudinary.com/...",
    "coverImage": "https://cloudinary.com/...",
    "categories": ["haircut", "coloring", "spa", "manicure", "pedicure"],
    "address": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "zipCode": "10001",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "website": "https://glamoursalon.com",
    "establishedYear": 2015,
    "teamSize": 12,
    "operatingHours": "{\"monday\": \"9:00-18:00\", ...}",
    "instagramHandle": "glamoursalon",
    "facebookPage": "https://facebook.com/glamoursalon",
    "createdAt": "2025-10-10T17:00:00.000Z",
    "updatedAt": "2025-10-10T17:00:00.000Z",
    "userId": "uuid"
  }
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**400 Bad Request - Missing Fields**
```json
{
  "error": "Missing required fields: businessName, description, categories, address, city, state, and country are required"
}
```

**400 Bad Request - Invalid Categories**
```json
{
  "error": "Categories must be a non-empty array"
}
```

**404 Not Found**
```json
{
  "error": "Salon record not found"
}
```

### Example cURL
```bash
curl -X POST http://localhost:3000/api/v1/onboarding/salon \
  -H "Authorization: Bearer <access_token>" \
  -F "businessName=Glamour Beauty Salon" \
  -F "description=Premium beauty salon offering haircuts, coloring, spa treatments" \
  -F 'categories=["haircut","coloring","spa","manicure","pedicure"]' \
  -F "address=123 Main Street" \
  -F "city=New York" \
  -F "state=NY" \
  -F "country=USA" \
  -F "zipCode=10001" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  -F "website=https://glamoursalon.com" \
  -F "establishedYear=2015" \
  -F "teamSize=12" \
  -F "instagramHandle=glamoursalon" \
  -F "profilePic=@logo.jpg" \
  -F "coverImage=@cover.jpg"
```

---

## Data Models

### Salon Model
```typescript
{
  id: string
  phoneNo: string | null
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED"
  emailVerified: boolean
  businessName: string | null
  description: string | null
  profilePic: string | null
  coverImage: string | null
  categories: string[]
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  zipCode: string | null
  latitude: number | null
  longitude: number | null
  website: string | null
  establishedYear: number | null
  teamSize: number | null
  operatingHours: string | null
  instagramHandle: string | null
  facebookPage: string | null
  createdAt: Date
  updatedAt: Date
  userId: string
}
```

### User Model (Salon)
```typescript
{
  id: string
  name: string
  email: string
  password: string (hashed)
  role: "SALON"
  createdAt: Date
  updatedAt: Date
}
```

---

## Suggested Service Categories

Common salon service categories:
- `haircut`
- `coloring`
- `highlights`
- `balayage`
- `keratin_treatment`
- `hair_styling`
- `blowout`
- `extensions`
- `perming`
- `straightening`
- `spa`
- `facial`
- `massage`
- `manicure`
- `pedicure`
- `nail_art`
- `waxing`
- `threading`
- `makeup`
- `bridal`
- `eyelash_extensions`
- `microblading`
- `skincare`

---

## Operating Hours Format

Operating hours should be a JSON string:

```json
{
  "monday": "9:00-18:00",
  "tuesday": "9:00-18:00",
  "wednesday": "9:00-18:00",
  "thursday": "9:00-20:00",
  "friday": "9:00-20:00",
  "saturday": "10:00-17:00",
  "sunday": "closed"
}
```

Or with breaks:
```json
{
  "monday": "9:00-13:00,14:00-18:00",
  "tuesday": "9:00-13:00,14:00-18:00",
  ...
}
```

---

## Complete Flow Example

### 1. Signup
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup/salon \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Glamour Salon",
    "email": "contact@glamoursalon.com",
    "password": "securePassword123",
    "phoneNo": "+1234567890"
  }'
```

### 2. Verify OTP (check email)
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contact@glamoursalon.com",
    "otp": "123456"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contact@glamoursalon.com",
    "password": "securePassword123"
  }'
```

### 4. Complete Onboarding
```bash
curl -X POST http://localhost:3000/api/v1/onboarding/salon \
  -H "Authorization: Bearer <token_from_login>" \
  -F "businessName=Glamour Beauty Salon" \
  -F "description=Premium beauty salon" \
  -F 'categories=["haircut","coloring","spa"]' \
  -F "address=123 Main Street" \
  -F "city=New York" \
  -F "state=NY" \
  -F "country=USA" \
  -F "profilePic=@logo.jpg"
```

---

## Status Workflow

```
PENDING_APPROVAL (default after onboarding)
    ↓
APPROVED (by admin)
    ↓
Can access full platform features

Alternative paths:
- REJECTED (if onboarding doesn't meet requirements)
- SUSPENDED (if violates terms)
```

---

## Best Practices

1. **Images**: Upload high-quality images
   - Profile Pic: Square, minimum 400x400px
   - Cover Image: 1200x400px recommended

2. **Description**: Write detailed, engaging description
   - Highlight unique services
   - Mention specializations
   - Include awards/certifications

3. **Categories**: Select all applicable services
   - Be specific and comprehensive
   - Helps with search and matching

4. **Location**: Provide accurate address
   - Include latitude/longitude for map display
   - Verify address is correct

5. **Operating Hours**: Keep updated
   - Include special holiday hours
   - Update for seasonal changes

6. **Social Media**: Link active accounts
   - Use username only for Instagram (no @)
   - Full URL for Facebook

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `409` - Conflict (duplicate email)
- `500` - Internal Server Error

---

## Security Notes

- Passwords are hashed with bcrypt (12 rounds)
- JWT tokens expire after configured time
- OTP expires after 10 minutes
- Email verification required before onboarding
- All file uploads validated and sanitized
- Images stored securely on Cloudinary

---

## Rate Limiting (Recommended for Production)

Implement rate limiting for:
- Signup: 5 requests per hour per IP
- OTP verification: 5 attempts per email
- Login: 10 requests per hour per IP
- Onboarding: 3 requests per hour per user
