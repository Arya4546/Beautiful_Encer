# Postman Testing Guide - Beautiful Encer API

Complete guide for testing all API endpoints using Postman.

**Base URL**: `http://localhost:3000/api/v1`

---

## Table of Contents
1. [Influencer APIs](#influencer-apis)
2. [Salon APIs](#salon-apis)
3. [Social Media Integration APIs](#social-media-integration-apis)
4. [Environment Setup](#environment-setup)

---

## Influencer APIs

### 1. Influencer Signup

**Endpoint**: `POST /auth/signup/influencer`

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNo": "+1234567890"
}
```

**Expected Response** (201):
```json
{
  "message": "Influencer registered successfully. Please check your email for an OTP to verify your account.",
  "userId": "uuid-here"
}
```

---

### 2. Verify OTP (Influencer)

**Endpoint**: `POST /auth/verify-otp`

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Expected Response** (200):
```json
{
  "message": "Email verified successfully. Please complete your onboarding.",
  "role": "INFLUENCER"
}
```

---

### 3. Influencer Login

**Endpoint**: `POST /auth/login`

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response** (200):
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

**Note**: Save the `accessToken` for subsequent requests!

---

### 4. Influencer Onboarding

**Endpoint**: `POST /onboarding/influencer`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Body** (Form Data):
```
profilePic: [Select File]
bio: "Beauty and lifestyle influencer based in NYC"
categories: ["beauty", "lifestyle", "fashion"]
region: "New York, USA"
age: 25
gender: FEMALE
```

**In Postman**:
1. Select `Body` tab
2. Choose `form-data`
3. Add key-value pairs:
   - `profilePic` (type: File) - Select an image file
   - `bio` (type: Text) - "Beauty and lifestyle influencer based in NYC"
   - `categories` (type: Text) - `["beauty", "lifestyle", "fashion"]`
   - `region` (type: Text) - "New York, USA"
   - `age` (type: Text) - `25`
   - `gender` (type: Text) - `FEMALE`

**Gender Options**: `MALE`, `FEMALE`, `NON_BINARY`, `PREFER_NOT_TO_SAY`

**Expected Response** (200):
```json
{
  "message": "Onboarding completed successfully",
  "influencer": {
    "id": "uuid",
    "phoneNo": "+1234567890",
    "status": "PENDING_APPROVAL",
    "emailVerified": true,
    "bio": "Beauty and lifestyle influencer based in NYC",
    "profilePic": "https://cloudinary.com/...",
    "categories": ["beauty", "lifestyle", "fashion"],
    "region": "New York, USA",
    "age": 25,
    "gender": "FEMALE",
    "createdAt": "2025-10-10T17:00:00.000Z",
    "updatedAt": "2025-10-10T17:00:00.000Z",
    "userId": "uuid"
  }
}
```

---

## Salon APIs

### 5. Salon Signup

**Endpoint**: `POST /auth/signup/salon`

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "name": "Glamour Salon",
  "email": "contact@glamoursalon.com",
  "password": "password123",
  "phoneNo": "+1234567890"
}
```

**Expected Response** (201):
```json
{
  "message": "Salon registered successfully. Please check your email for an OTP to verify your account.",
  "userId": "uuid-here"
}
```

---

### 6. Verify OTP (Salon)

**Endpoint**: `POST /auth/verify-otp`

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "email": "contact@glamoursalon.com",
  "otp": "123456"
}
```

**Expected Response** (200):
```json
{
  "message": "Email verified successfully. Please complete your onboarding.",
  "role": "SALON"
}
```

---

### 7. Salon Login

**Endpoint**: `POST /auth/login`

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "email": "contact@glamoursalon.com",
  "password": "password123"
}
```

**Expected Response** (200):
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

**Note**: Save the `accessToken` for subsequent requests!

---

### 8. Salon Onboarding

**Endpoint**: `POST /onboarding/salon`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Body** (Form Data):
```
profilePic: [Select File]
businessName: "Glamour Beauty Salon"
description: "Premium beauty salon looking to collaborate with influencers"
preferredCategories: ["beauty", "lifestyle", "fashion", "wellness"]
website: "https://glamoursalon.com"
establishedYear: 2015
teamSize: 12
operatingHours: {"monday":"9:00-18:00","tuesday":"9:00-18:00"}
instagramHandle: "glamoursalon"
tiktokHandle: "glamoursalon"
facebookPage: "https://facebook.com/glamoursalon"
```

**In Postman**:
1. Select `Body` tab
2. Choose `form-data`
3. Add key-value pairs:
   - `profilePic` (type: File) - Select an image file
   - `businessName` (type: Text) - "Glamour Beauty Salon"
   - `description` (type: Text) - "Premium beauty salon looking to collaborate with influencers"
   - `preferredCategories` (type: Text) - `["beauty", "lifestyle", "fashion", "wellness"]`
   - `website` (type: Text) - "https://glamoursalon.com"
   - `establishedYear` (type: Text) - `2015`
   - `teamSize` (type: Text) - `12`
   - `operatingHours` (type: Text) - `{"monday":"9:00-18:00","tuesday":"9:00-18:00"}`
   - `instagramHandle` (type: Text) - "glamoursalon"
   - `tiktokHandle` (type: Text) - "glamoursalon"
   - `facebookPage` (type: Text) - "https://facebook.com/glamoursalon"

**Expected Response** (200):
```json
{
  "message": "Salon onboarding completed successfully",
  "salon": {
    "id": "uuid",
    "phoneNo": "+1234567890",
    "status": "PENDING_APPROVAL",
    "emailVerified": true,
    "businessName": "Glamour Beauty Salon",
    "description": "Premium beauty salon looking to collaborate with influencers",
    "profilePic": "https://cloudinary.com/...",
    "preferredCategories": ["beauty", "lifestyle", "fashion", "wellness"],
    "website": "https://glamoursalon.com",
    "establishedYear": 2015,
    "teamSize": 12,
    "operatingHours": "{\"monday\":\"9:00-18:00\",\"tuesday\":\"9:00-18:00\"}",
    "instagramHandle": "glamoursalon",
    "tiktokHandle": "glamoursalon",
    "facebookPage": "https://facebook.com/glamoursalon",
    "createdAt": "2025-10-10T17:00:00.000Z",
    "updatedAt": "2025-10-10T17:00:00.000Z",
    "userId": "uuid"
  }
}
```

---

## Social Media Integration APIs

### 9. Get Instagram Auth URL

**Endpoint**: `GET /social-media/instagram/auth`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Body**: None

**Expected Response** (200):
```json
{
  "message": "Redirect user to this URL to connect Instagram",
  "authUrl": "https://api.instagram.com/oauth/authorize?client_id=..."
}
```

**Note**: Copy the `authUrl` and open it in a browser to authorize Instagram.

---

### 10. Get TikTok Auth URL

**Endpoint**: `GET /social-media/tiktok/auth`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Body**: None

**Expected Response** (200):
```json
{
  "message": "Redirect user to this URL to connect TikTok",
  "authUrl": "https://www.tiktok.com/v2/auth/authorize?client_key=..."
}
```

**Note**: Copy the `authUrl` and open it in a browser to authorize TikTok.

---

### 11. Get Connected Accounts

**Endpoint**: `GET /social-media/accounts`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Body**: None

**Expected Response** (200):
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

### 12. Sync Instagram Data

**Endpoint**: `POST /social-media/instagram/sync`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Body**: None

**Expected Response** (200):
```json
{
  "message": "INSTAGRAM data synced successfully"
}
```

---

### 13. Sync TikTok Data

**Endpoint**: `POST /social-media/tiktok/sync`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Body**: None

**Expected Response** (200):
```json
{
  "message": "TIKTOK data synced successfully"
}
```

---

### 14. Disconnect Instagram

**Endpoint**: `DELETE /social-media/INSTAGRAM`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Body**: None

**Expected Response** (200):
```json
{
  "message": "INSTAGRAM account disconnected successfully"
}
```

---

### 15. Disconnect TikTok

**Endpoint**: `DELETE /social-media/TIKTOK`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Body**: None

**Expected Response** (200):
```json
{
  "message": "TIKTOK account disconnected successfully"
}
```

---

### 16. Health Check

**Endpoint**: `GET /health` (Note: No `/api/v1` prefix)

**Full URL**: `http://localhost:3000/health`

**Headers**: None

**Body**: None

**Expected Response** (200):
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

## Environment Setup

### Postman Environment Variables

Create a Postman environment with these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| base_url | http://localhost:3000/api/v1 | |
| influencer_token | | (Set after influencer login) |
| salon_token | | (Set after salon login) |
| influencer_email | john@example.com | |
| salon_email | contact@glamoursalon.com | |

### Setting Up Environment

1. Click on "Environments" in Postman
2. Create new environment "Beautiful Encer - Local"
3. Add the variables above
4. Save and select the environment

### Auto-Save Token After Login

In the login request, go to the "Tests" tab and add:

```javascript
// For Influencer Login
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("influencer_token", jsonData.accessToken);
}

// For Salon Login
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("salon_token", jsonData.accessToken);
}
```

Then use `{{influencer_token}}` or `{{salon_token}}` in Authorization headers.

---

## Complete Testing Flow

### Influencer Flow

1. **Signup**: `POST /auth/signup/influencer`
2. **Check Email** for OTP
3. **Verify OTP**: `POST /auth/verify-otp`
4. **Login**: `POST /auth/login` (Save token)
5. **Onboarding**: `POST /onboarding/influencer` (Use token)
6. **Get Instagram Auth**: `GET /social-media/instagram/auth` (Use token)
7. **Authorize on Instagram** (Browser)
8. **Get Connected Accounts**: `GET /social-media/accounts` (Use token)

### Salon Flow

1. **Signup**: `POST /auth/signup/salon`
2. **Check Email** for OTP
3. **Verify OTP**: `POST /auth/verify-otp`
4. **Login**: `POST /auth/login` (Save token)
5. **Onboarding**: `POST /onboarding/salon` (Use token)

---

## Common Errors

### 400 Bad Request
```json
{
  "error": "Missing required fields: name, email, and password are required"
}
```
**Solution**: Check all required fields are provided.

### 401 Unauthorized
```json
{
  "error": "Unauthorized: No token provided"
}
```
**Solution**: Add `Authorization: Bearer <token>` header.

### 409 Conflict
```json
{
  "error": "Email already exists"
}
```
**Solution**: Use a different email or login with existing account.

### 500 Internal Server Error
```json
{
  "error": "Failed to register influencer"
}
```
**Solution**: Check server logs and database connection.

---

## Tips for Testing

1. **Use Collections**: Organize requests into folders (Auth, Onboarding, Social Media)
2. **Use Variables**: Store tokens and base URL as environment variables
3. **Add Tests**: Use Postman's test scripts to validate responses
4. **Save Examples**: Save successful responses as examples for reference
5. **Use Pre-request Scripts**: Auto-generate test data if needed

---

## Postman Collection Import

You can create a collection with all these endpoints and export it as JSON for team sharing.

**Collection Structure**:
```
Beautiful Encer API
├── Auth
│   ├── Influencer Signup
│   ├── Salon Signup
│   ├── Verify OTP
│   └── Login
├── Onboarding
│   ├── Influencer Onboarding
│   └── Salon Onboarding
├── Social Media
│   ├── Get Instagram Auth URL
│   ├── Get TikTok Auth URL
│   ├── Get Connected Accounts
│   ├── Sync Instagram
│   ├── Sync TikTok
│   ├── Disconnect Instagram
│   └── Disconnect TikTok
└── Health Check
```

---

## Notes

- All timestamps are in ISO 8601 format
- UUIDs are automatically generated
- Passwords are hashed with bcrypt
- OTPs expire after 10 minutes
- JWT tokens expire based on server configuration
- File uploads must be images (jpg, png, etc.)
- Arrays in form-data must be JSON strings: `["item1", "item2"]`

---

## Need Help?

- Check server logs for detailed error messages
- Verify database connection
- Ensure all environment variables are set
- Check Cloudinary configuration for image uploads
- Verify email service is configured for OTP delivery
