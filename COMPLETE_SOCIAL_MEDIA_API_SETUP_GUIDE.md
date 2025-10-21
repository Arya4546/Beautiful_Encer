# 🎯 Complete Social Media API Setup Guide
## Instagram & TikTok Integration - Beginner to Expert

> **Last Updated**: October 18, 2025  
> **Difficulty**: Beginner-Friendly  
> **Time Required**: 2-3 hours  
> **Cost**: Free tier available for both platforms



## 🔧 Prerequisites & Requirements {#prerequisites}

### What You Need Before Starting:

1. **Facebook/Meta Account**
   - Personal Facebook account (must be active)
   - Valid email address
   - Phone number for 2FA verification

2. **TikTok Account**
   - TikTok account (personal or business)
   - Valid email address
   - Phone number verification

3. **Business Information** (if applicable)
   - Business name
   - Business website URL
   - Privacy Policy URL
   - Terms of Service URL

4. **Technical Requirements**
   - Modern web browser (Chrome, Firefox, Edge)
   - Text editor for storing keys
   - Access to your Beautiful Encer project files

5. **Optional but Recommended**
   - Credit card for Apify (free tier available)
   - HTTPS-enabled domain for callbacks

---


## 🎵 TikTok API Setup {#tiktok-setup}

TikTok has a more restrictive API compared to Instagram. Let's set it up step by step.

---

### Step 1: Create TikTok Developer Account

#### 1.1 Go to TikTok for Developers

```
🔗 URL: https://developers.tiktok.com/
```

**What you'll see:**
- TikTok Developers homepage
- Blue "Register" button (top-right corner)
- Or "Log in" if you already have an account

**Actions:**
1. Click **"Register"** button (top-right)
2. A registration modal appears

#### 1.2 Choose Registration Method

**You'll see three options:**
- 📧 Email
- 📱 Phone Number
- 🔗 TikTok Account (Recommended)

**Choose "TikTok Account" (easiest):**

**Actions:**
1. Click **"TikTok Account"** tab
2. Click **"Continue with TikTok"** button
3. Enter your TikTok username/email and password
4. Click **"Log in"**

**If using Email:**
1. Click **"Email"** tab
2. Enter your email address
3. Create a password (8+ characters, mix of letters and numbers)
4. Click **"Send code"**
5. Check your email for 6-digit verification code
6. Enter code and click **"Submit"**

#### 1.3 Complete Developer Profile

**After logging in, you'll see a profile form:**

**Required Fields:**
- **Developer Name**: Your name or company name
- **Developer Type**: 
  - Choose **"Individual"** or **"Company"**
  - For Beautiful Encer: Choose **"Company"**
- **Country/Region**: Select your country
- **Email**: Your contact email
- **Phone Number**: Your contact number (for verification)

**Actions:**
1. Fill in all required fields
2. Accept **"TikTok Developer Agreement"** checkbox
3. Click **"Submit"** button

#### 1.4 Verify Email and Phone

**Email Verification:**
- Check your email inbox
- Click the verification link
- Or enter the 6-digit code on the page

**Phone Verification:**
- Enter your phone number
- Click **"Send Code"**
- Enter 6-digit SMS code
- Click **"Verify"**

---

### Step 2: Create Your First TikTok App

#### 2.1 Access Developer Portal

**After verification, you'll see:**
- Developer Dashboard
- Navigation menu on the left
- "My apps" or "Manage apps" option

**Actions:**
1. Click **"Manage apps"** in the left sidebar
2. You'll see "My Apps" page with a **"Connect an app"** button

#### 2.2 Connect New App

**Actions:**
1. Click **"Connect an app"** button (top-right, blue button)
2. A modal appears: "Create a new app" or "Connect existing app"
3. Click **"Create a new app"**

#### 2.3 App Information Form

**You'll see a detailed form with multiple sections:**

**Section 1: Basic Information**

**App Name:**
- Enter: `Beautiful Encer`
- This will be shown to users during authorization

**App Description:**
- Enter a clear description:
  ```
  Beautiful Encer connects beauty salons with authentic influencers for 
  marketing campaigns. We help analyze influencer metrics and facilitate 
  collaborations between salons and content creators.
  ```

**App Icon:**
- Upload a square image (512x512px recommended)
- PNG or JPG format
- Must represent your app visually

**Section 2: App Type**

**Select app type:**
- Options: Web App, Mobile App, Desktop App
- For Beautiful Encer: Choose **"Web App"**

**Section 3: Platforms**

**Check applicable platforms:**
- ✅ **Web** (required)
- ☐ iOS (optional, if you have mobile app)
- ☐ Android (optional, if you have mobile app)

**Section 4: Contact Information**

**Developer Contact:**
- Email: Your support email
- Phone: Your contact number
- Website: `https://yourdomain.com`

**Section 5: Compliance**

**Privacy Policy URL:**
- Enter: `https://yourdomain.com/privacy`
- **Must be publicly accessible**
- Must explain how you handle TikTok user data

**Terms of Service URL:**
- Enter: `https://yourdomain.com/terms`
- **Must be publicly accessible**

**Actions:**
1. Fill in all required fields
2. Click **"Submit"** button at the bottom

#### 2.4 App Review

**What happens next:**
- TikTok reviews your app (can take 1-7 days)
- You'll receive email notification when approved
- Initial status: "Draft" or "Under Review"

**While waiting, you can continue with configuration**

---

### Step 3: Configure App Settings

#### 3.1 Get App Credentials

**After app creation (even in draft mode):**

**What you'll see:**
- Your app listed in "My Apps"
- App name with a settings/gear icon

**Actions:**
1. Click on your **app name** or **settings icon**
2. You'll see the App Details page
3. Look for **"App Credentials"** section (usually at top)

**You'll find:**

**Client Key:**
- Example: `aw9x8v7u6t5r4s3q2w1e`
- Click **"Copy"** icon to copy

**Client Secret:**
- Initially hidden (shown as: ••••••••••)
- Click **"Show"** to reveal
- Example: `Ab1Cd2Ef3Gh4Ij5Kl6Mn7Op8Qq9Rs0`
- Click **"Copy"** icon to copy

**⚠️ Save these immediately and securely:**
```
Client Key: [paste here]
Client Secret: [paste here - NEVER share publicly!]
```

#### 3.2 Set Redirect URIs

**In the same App Details page:**

**Find "Redirect URI" section:**
- This is where TikTok will send users after login

**Actions:**
1. Click **"Add Redirect URI"** button
2. Enter your callback URLs (one at a time):

**Development URL:**
```
http://localhost:3000/api/auth/tiktok/callback
```

**Production URL:**
```
https://yourdomain.com/api/auth/tiktok/callback
```

3. Click **"Add"** or **"+"** button for each URI
4. Click **"Save"** button

**⚠️ IMPORTANT:**
- URIs must match EXACTLY (including http/https, trailing slash)
- TikTok will reject if there's any mismatch

---

### Step 4: Request API Scopes/Permissions

#### 4.1 Understand TikTok Scopes

**TikTok API has different permission scopes:**

**User Scopes (for user data):**
- `user.info.basic` - Basic profile info (username, avatar)
- `user.info.profile` - Extended profile (bio, follower count)
- `user.info.stats` - User statistics (likes, followers, following)

**Video Scopes (for content data):**
- `video.list` - List user's videos
- `video.publish` - Publish videos (not needed for Beautiful Encer)

**Comment Scopes:**
- `comment.list` - Read comments on videos

**For Beautiful Encer, you need:**
- ✅ `user.info.basic`
- ✅ `user.info.profile`
- ✅ `user.info.stats`
- ✅ `video.list`
- ✅ `comment.list`

#### 4.2 Request Scopes

**Actions:**
1. In App Details page, find **"Scopes"** or **"Permissions"** section
2. You'll see a list of available scopes
3. Click the checkbox next to each scope you need
4. Click **"Request Access"** or **"Submit for Review"**

**What happens:**
- TikTok reviews your scope request
- May ask for justification
- Approval can take 3-7 days

**Providing Justification:**

If asked why you need each scope, use these templates:

**user.info.basic:**
```
We need basic user information to create influencer profiles in our 
platform, allowing salons to discover and verify TikTok creators.
```

**user.info.profile:**
```
Extended profile data helps salons evaluate influencer authenticity, 
engagement, and suitability for beauty brand collaborations.
```

**user.info.stats:**
```
User statistics enable our analytics dashboard to show influencer 
metrics, helping salons make data-driven partnership decisions.
```

**video.list:**
```
Access to video lists allows salons to review influencer content 
quality and relevance to beauty/lifestyle niches.
```

---

### Step 5: Implement TikTok Login Flow

#### 5.1 Generate Authorization URL

**TikTok uses OAuth 2.0 flow. Here's how it works:**

**Step 1: Build Authorization URL**

```javascript
const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';

const params = new URLSearchParams({
  client_key: 'YOUR_CLIENT_KEY',
  scope: 'user.info.basic,user.info.profile,user.info.stats,video.list',
  response_type: 'code',
  redirect_uri: 'https://yourdomain.com/api/auth/tiktok/callback',
  state: 'random_string_for_security' // Generate random string
});

const authUrl = `${TIKTOK_AUTH_URL}?${params.toString()}`;
```

**Redirect user to `authUrl`**

#### 5.2 Handle Callback

**After user authorizes, TikTok redirects to your callback URL with:**
- `code` parameter (authorization code)
- `state` parameter (should match what you sent)

**Example callback:**
```
https://yourdomain.com/api/auth/tiktok/callback?code=abc123xyz&state=random_string_for_security
```

#### 5.3 Exchange Code for Access Token

**Make a POST request to get access token:**

**Endpoint:**
```
POST https://open.tiktokapis.com/v2/oauth/token/
```

**Request Body (application/x-www-form-urlencoded):**
```
client_key=YOUR_CLIENT_KEY
client_secret=YOUR_CLIENT_SECRET
code=abc123xyz
grant_type=authorization_code
redirect_uri=https://yourdomain.com/api/auth/tiktok/callback
```

**cURL Example:**
```bash
curl -X POST 'https://open.tiktokapis.com/v2/oauth/token/' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-d 'client_key=YOUR_CLIENT_KEY' \
-d 'client_secret=YOUR_CLIENT_SECRET' \
-d 'code=abc123xyz' \
-d 'grant_type=authorization_code' \
-d 'redirect_uri=https://yourdomain.com/api/auth/tiktok/callback'
```

**Response:**
```json
{
  "access_token": "act.example12345Example12345Example",
  "expires_in": 86400,
  "open_id": "open_id_example",
  "refresh_token": "rft.example12345Example12345Example",
  "refresh_expires_in": 2592000,
  "scope": "user.info.basic,user.info.profile",
  "token_type": "Bearer"
}
```

**Save the access_token - you'll use this for API calls!**

---

### Step 6: Test TikTok API

#### 6.1 Get User Information

**Endpoint:**
```
GET https://open.tiktokapis.com/v2/user/info/
```

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "fields": ["open_id", "union_id", "avatar_url", "display_name", "follower_count", "following_count", "likes_count", "video_count"]
}
```

**cURL Example:**
```bash
curl -X POST 'https://open.tiktokapis.com/v2/user/info/' \
-H 'Authorization: Bearer act.example12345' \
-H 'Content-Type: application/json' \
-d '{
  "fields": ["open_id", "union_id", "avatar_url", "display_name", "follower_count", "following_count", "likes_count", "video_count"]
}'
```

**Expected Response:**
```json
{
  "data": {
    "user": {
      "open_id": "open_id_123",
      "union_id": "union_id_456",
      "avatar_url": "https://...",
      "display_name": "John Doe",
      "follower_count": 5000,
      "following_count": 500,
      "likes_count": 25000,
      "video_count": 150
    }
  },
  "error": {
    "code": "ok",
    "message": "",
    "log_id": "202510181234567890"
  }
}
```

✅ **If you see user data, your TikTok API is working!**

#### 6.2 Get User Videos

**Endpoint:**
```
POST https://open.tiktokapis.com/v2/video/list/
```

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "max_count": 20,
  "fields": ["id", "create_time", "cover_image_url", "share_url", "video_description", "duration", "like_count", "comment_count", "share_count", "view_count"]
}
```

**Expected Response:**
```json
{
  "data": {
    "videos": [
      {
        "id": "video123",
        "create_time": 1697654321,
        "cover_image_url": "https://...",
        "share_url": "https://www.tiktok.com/@user/video/123",
        "video_description": "Video caption here",
        "duration": 30,
        "like_count": 1500,
        "comment_count": 80,
        "share_count": 50,
        "view_count": 15000
      }
    ],
    "cursor": 20,
    "has_more": true
  },
  "error": {
    "code": "ok",
    "message": ""
  }
}
```

---

### 📝 TikTok API Keys Summary

**Save these in a secure location:**

```env
# TikTok API Credentials
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
TIKTOK_REDIRECT_URI=https://yourdomain.com/api/auth/tiktok/callback
TIKTOK_API_VERSION=v2
```

---

## 🤖 Apify Setup for Instagram Scraping {#apify-setup}

**Alternative to Instagram Graph API - Easier but costs money**

---

### Step 1: Create Apify Account

#### 1.1 Sign Up

```
🔗 URL: https://apify.com/
```

**Actions:**
1. Click **"Sign up free"** button (top-right)
2. Choose signup method:
   - Email
   - Google account (recommended)
   - GitHub account

**Using Google (easiest):**
1. Click **"Sign up with Google"**
2. Select your Google account
3. Grant permissions

#### 1.2 Complete Profile

**After signup:**
- Enter your name
- Choose account type: "Developer" or "Business"
- Click **"Continue"**

**Free Tier Includes:**
- $5 free credit monthly
- Access to all scrapers
- Perfect for testing

---

### Step 2: Choose Instagram Scraper

#### 2.1 Browse Apify Store

**Actions:**
1. Click **"Store"** in top navigation
2. In search box, type: `instagram`
3. You'll see multiple Instagram scrapers

**Recommended Scrapers:**

**Option 1: Instagram Profile Scraper** (Best for influencer data)
- By: `apify`
- Name: `instagram-profile-scraper`
- Price: ~$5 per 1000 profiles
- **Best for**: Getting follower count, bio, profile data

**Option 2: Instagram Scraper** (Comprehensive)
- By: `jaroslavhejlek`  
- Name: `instagram-scraper`
- Price: ~$5-10 per run (depending on data volume)
- **Best for**: Posts, comments, hashtags, locations

**For Beautiful Encer, use Instagram Profile Scraper**

#### 2.2 Try the Scraper

**Actions:**
1. Click on **"Instagram Profile Scraper"**
2. Click **"Try for free"** button
3. You'll see a testing interface

---

### Step 3: Configure and Test Scraper

#### 3.1 Input Configuration

**You'll see an input form with options:**

**usernames (required):**
- Enter Instagram usernames to scrape
- Example:
  ```json
  [
    "beautysalon_tokyo",
    "hairartist_kyoto",
    "makeupinfluencer"
  ]
  ```

**resultsLimit:**
- Number of results to return
- For testing: `10`
- For production: `100` or `1000`

**resultsType:**
- Options: `posts`, `details`, `tagged`
- Choose: `details` (for profile info)

**Example Configuration:**
```json
{
  "usernames": [
    "beautysalon_tokyo"
  ],
  "resultsLimit": 1,
  "resultsType": "details"
}
```

#### 3.2 Run Test Scrape

**Actions:**
1. With configuration set, click **"Start"** button (bottom-right, green)
2. Scraper starts running
3. You'll see a progress bar
4. Wait 30-60 seconds

**While running, you'll see:**
- Status: "RUNNING"
- Logs showing progress
- Estimated time remaining

#### 3.3 View Results

**After completion:**

**Actions:**
1. Status changes to "SUCCEEDED"
2. Click **"Results"** tab at the top
3. You'll see scraped data

**Example Result:**
```json
{
  "username": "beautysalon_tokyo",
  "full_name": "Beauty Salon Tokyo",
  "biography": "Professional beauty salon in Tokyo...",
  "followers": 5420,
  "following": 890,
  "posts_count": 342,
  "is_verified": false,
  "is_business": true,
  "profile_pic_url": "https://...",
  "external_url": "https://beautysalon.com"
}
```

✅ **If you see data like this, Apify is working!**

---

### Step 4: Get API Token

#### 4.1 Access API Settings

**Actions:**
1. Click on your **profile icon** (top-right corner)
2. Select **"Settings"** from dropdown
3. In left sidebar, click **"Integrations"**
4. You'll see **"API tokens"** section

#### 4.2 Create API Token

**Actions:**
1. Click **"Create new token"** button
2. A modal appears

**Token Configuration:**
- **Token name**: `Beautiful Encer API`
- **Description**: `API token for Beautiful Encer Instagram integration`
- **Permissions**: Leave default (Full access) for simplicity

3. Click **"Create"** button

#### 4.3 Copy Token

**A new token appears:**
```
apify_api_1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R
```

**⚠️ CRITICAL:**
- This token is shown **ONLY ONCE**
- Copy it immediately
- Store it securely
- You cannot retrieve it later (only create new one)

**Actions:**
1. Click **"Copy"** button
2. Paste in a secure location (password manager or .env file)

---

### Step 5: Use Apify API in Code

#### 5.1 Install Apify Client

**For Node.js/TypeScript:**
```bash
npm install apify-client
```

#### 5.2 Example Integration

**Scrape Instagram Profile:**

```typescript
import { ApifyClient } from 'apify-client';

// Initialize client with your token
const client = new ApifyClient({
    token: 'YOUR_APIFY_API_TOKEN',
});

// Function to scrape Instagram profile
async function scrapeInstagramProfile(username: string) {
    try {
        // Prepare Actor input
        const input = {
            usernames: [username],
            resultsLimit: 1,
            resultsType: "details"
        };

        // Run the Actor and wait for it to finish
        const run = await client.actor("apify/instagram-profile-scraper").call(input);

        // Fetch Actor results from the run's dataset
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        // Return first result
        return items[0];
    } catch (error) {
        console.error('Error scraping Instagram:', error);
        throw error;
    }
}

// Usage
scrapeInstagramProfile('beautysalon_tokyo')
    .then(data => {
        console.log('Profile data:', data);
        console.log('Followers:', data.followers);
        console.log('Posts:', data.posts_count);
    })
    .catch(err => console.error(err));
```

#### 5.3 Batch Scraping Multiple Profiles

```typescript
async function scrapeMultipleProfiles(usernames: string[]) {
    const input = {
        usernames: usernames,
        resultsLimit: usernames.length,
        resultsType: "details"
    };

    const run = await client.actor("apify/instagram-profile-scraper").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    return items;
}

// Usage
const influencers = ['user1', 'user2', 'user3'];
scrapeMultipleProfiles(influencers)
    .then(profiles => {
        profiles.forEach(profile => {
            console.log(`${profile.username}: ${profile.followers} followers`);
        });
    });
```

---

### Step 6: Monitor Usage and Costs

#### 6.1 Check Usage Dashboard

**Actions:**
1. Go to **Dashboard** in Apify
2. Click **"Usage"** tab
3. You'll see:
   - Credits used this month
   - Credits remaining
   - Cost breakdown by actor

#### 6.2 Set Usage Limits

**Prevent overspending:**

**Actions:**
1. Go to **Settings** > **Billing**
2. Find **"Spending limit"** section
3. Set monthly limit: `$50` (recommended for 50-100 influencers)
4. Enable **"Email alerts"** at 80% usage
5. Click **"Save"**

#### 6.3 Estimate Costs

**Instagram Profile Scraper Costs:**
- ~100 profiles = $1-2
- ~500 profiles = $5-8
- ~1000 profiles = $10-15

**Monthly estimate for Beautiful Encer:**
- 50-100 influencers monitored daily
- Update once per day
- Cost: **~$30-50/month**

---

### 📝 Apify API Keys Summary

```env
# Apify Credentials
APIFY_API_TOKEN=apify_api_1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R
APIFY_ACTOR_ID=apify/instagram-profile-scraper
```

---

## 🧪 Testing Your APIs {#testing-apis}

### Test Instagram Graph API

**Using cURL:**

```bash
curl -X GET "https://graph.facebook.com/v18.0/{INSTAGRAM_ACCOUNT_ID}?fields=id,username,followers_count,media_count&access_token={ACCESS_TOKEN}"
```

**Expected Response:**
```json
{
  "id": "17841405309211844",
  "username": "beautysalon_tokyo",
  "followers_count": 5420,
  "media_count": 342
}
```

### Test TikTok API

**Using cURL:**

```bash
curl -X POST "https://open.tiktokapis.com/v2/user/info/" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
-H "Content-Type: application/json" \
-d '{"fields": ["display_name", "follower_count"]}'
```

### Test Apify API

**Using cURL:**

```bash
curl -X POST "https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs?token=YOUR_APIFY_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "usernames": ["beautysalon_tokyo"],
  "resultsLimit": 1,
  "resultsType": "details"
}'
```

---

## 🔌 Integrating Keys into Beautiful Encer {#integration}

### Step 1: Create Environment File

**Create `.env` file in your project root:**

```bash
# Navigate to project
cd d:\Code\Beautiful_Encer\api

# Create .env file
notepad .env
```

### Step 2: Add All API Keys

**Paste this template and fill in your values:**

```env
# ==================================
# INSTAGRAM API (Meta/Facebook)
# ==================================
INSTAGRAM_APP_ID=your_app_id_here
INSTAGRAM_APP_SECRET=your_app_secret_here
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id
INSTAGRAM_API_VERSION=v18.0
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback

# ==================================
# TIKTOK API
# ==================================
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
TIKTOK_REDIRECT_URI=http://localhost:3000/api/auth/tiktok/callback
TIKTOK_API_VERSION=v2

# ==================================
# APIFY (Instagram Scraping)
# ==================================
APIFY_API_TOKEN=apify_api_your_token_here
APIFY_INSTAGRAM_ACTOR_ID=apify/instagram-profile-scraper

# ==================================
# APPLICATION SETTINGS
# ==================================
NODE_ENV=development
PORT=3000
DATABASE_URL=your_database_connection_string
```

### Step 3: Update Your Code

**In `api/src/services/socialMedia.service.ts`:**

```typescript
import axios from 'axios';
import { ApifyClient } from 'apify-client';

// Instagram Graph API Service
export class InstagramService {
    private accessToken: string;
    private apiVersion: string;
    
    constructor() {
        this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN!;
        this.apiVersion = process.env.INSTAGRAM_API_VERSION!;
    }
    
    async getUserProfile(username: string) {
        try {
            const response = await axios.get(
                `https://graph.facebook.com/${this.apiVersion}/${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID}`,
                {
                    params: {
                        fields: 'id,username,followers_count,media_count,profile_picture_url',
                        access_token: this.accessToken
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Instagram API Error:', error);
            throw error;
        }
    }
    
    async getUserMedia(limit: number = 25) {
        try {
            const response = await axios.get(
                `https://graph.facebook.com/${this.apiVersion}/${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`,
                {
                    params: {
                        fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
                        limit: limit,
                        access_token: this.accessToken
                    }
                }
            );
            return response.data.data;
        } catch (error) {
            console.error('Instagram Media Error:', error);
            throw error;
        }
    }
}

// TikTok API Service
export class TikTokService {
    private clientKey: string;
    private clientSecret: string;
    
    constructor() {
        this.clientKey = process.env.TIKTOK_CLIENT_KEY!;
        this.clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
    }
    
    async getUserInfo(accessToken: string) {
        try {
            const response = await axios.post(
                'https://open.tiktokapis.com/v2/user/info/',
                {
                    fields: ['open_id', 'display_name', 'avatar_url', 'follower_count', 'following_count', 'likes_count']
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data.data.user;
        } catch (error) {
            console.error('TikTok API Error:', error);
            throw error;
        }
    }
    
    async getUserVideos(accessToken: string, maxCount: number = 20) {
        try {
            const response = await axios.post(
                'https://open.tiktokapis.com/v2/video/list/',
                {
                    max_count: maxCount,
                    fields: ['id', 'create_time', 'cover_image_url', 'share_url', 'like_count', 'comment_count', 'view_count']
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data.data.videos;
        } catch (error) {
            console.error('TikTok Videos Error:', error);
            throw error;
        }
    }
}

// Apify Service (Instagram Scraping)
export class ApifyService {
    private client: ApifyClient;
    
    constructor() {
        this.client = new ApifyClient({
            token: process.env.APIFY_API_TOKEN!
        });
    }
    
    async scrapeInstagramProfile(username: string) {
        try {
            const input = {
                usernames: [username],
                resultsLimit: 1,
                resultsType: 'details'
            };
            
            const run = await this.client
                .actor(process.env.APIFY_INSTAGRAM_ACTOR_ID!)
                .call(input);
            
            const { items } = await this.client
                .dataset(run.defaultDatasetId)
                .listItems();
            
            return items[0];
        } catch (error) {
            console.error('Apify Scraping Error:', error);
            throw error;
        }
    }
    
    async scrapeMultipleProfiles(usernames: string[]) {
        try {
            const input = {
                usernames: usernames,
                resultsLimit: usernames.length,
                resultsType: 'details'
            };
            
            const run = await this.client
                .actor(process.env.APIFY_INSTAGRAM_ACTOR_ID!)
                .call(input);
            
            const { items } = await this.client
                .dataset(run.defaultDatasetId)
                .listItems();
            
            return items;
        } catch (error) {
            console.error('Apify Batch Scraping Error:', error);
            throw error;
        }
    }
}
```

### Step 4: Test Integration

**Create a test file `api/src/test-apis.ts`:**

```typescript
import { InstagramService, TikTokService, ApifyService } from './services/socialMedia.service';

async function testAllAPIs() {
    console.log('🧪 Testing Social Media APIs...\n');
    
    // Test Instagram Graph API
    console.log('📸 Testing Instagram Graph API...');
    try {
        const instagram = new InstagramService();
        const profile = await instagram.getUserProfile('test');
        console.log('✅ Instagram API working!');
        console.log('   Followers:', profile.followers_count);
    } catch (error) {
        console.error('❌ Instagram API failed:', error.message);
    }
    
    // Test Apify
    console.log('\n🤖 Testing Apify Scraper...');
    try {
        const apify = new ApifyService();
        const data = await apify.scrapeInstagramProfile('beautysalon_tokyo');
        console.log('✅ Apify working!');
        console.log('   Username:', data.username);
        console.log('   Followers:', data.followers);
    } catch (error) {
        console.error('❌ Apify failed:', error.message);
    }
    
    // Note: TikTok requires user access token from OAuth flow
    console.log('\n🎵 TikTok API requires user authentication');
    console.log('   Implement OAuth flow to test');
}

testAllAPIs();
```

**Run the test:**
```bash
npm run ts-node src/test-apis.ts
```

---

## 🔧 Troubleshooting {#troubleshooting}

### Common Instagram API Issues

**Error: "Invalid OAuth access token"**
- ✅ **Solution**: Token expired, generate new long-lived token
- Go back to Step 5.3 and create new token

**Error: "Insufficient permissions"**
- ✅ **Solution**: Add required permissions in Graph API Explorer
- Check you have `instagram_basic`, `instagram_manage_insights`

**Error: "Instagram account not found"**
- ✅ **Solution**: Ensure account is Business/Creator account
- Verify it's linked to a Facebook Page

**Error: "Rate limit exceeded"**
- ✅ **Solution**: You're making too many requests
- Instagram allows ~200 calls per hour per user
- Implement caching and rate limiting

### Common TikTok API Issues

**Error: "Invalid client_key"**
- ✅ **Solution**: Double-check your Client Key from app settings
- Ensure no extra spaces when copying

**Error: "Redirect URI mismatch"**
- ✅ **Solution**: URI must match EXACTLY
- Check http vs https
- Check trailing slashes
- Verify in TikTok app settings

**Error: "Scope not approved"**
- ✅ **Solution**: Request scope approval in developer portal
- Wait for TikTok review (3-7 days)

**Error: "Access token expired"**
- ✅ **Solution**: Implement token refresh flow
- Use `refresh_token` to get new `access_token`

### Common Apify Issues

**Error: "Actor not found"**
- ✅ **Solution**: Check actor ID is correct
- Should be `apify/instagram-profile-scraper`

**Error: "Insufficient funds"**
- ✅ **Solution**: Add credits to your Apify account
- Go to Billing > Add credits

**Error: "Rate limit from Instagram"**
- ✅ **Solution**: Instagram blocked Apify temporarily
- Wait 1-2 hours
- Reduce scraping frequency
- Use proxy rotation (premium Apify feature)

**Scraper returns empty data**
- ✅ **Solution**: Instagram changed their HTML structure
- Contact Apify support
- They update scrapers regularly

---

## 📚 Additional Resources

### Official Documentation

**Instagram Graph API:**
- 📖 [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- 📖 [Getting Started Guide](https://developers.facebook.com/docs/instagram-api/getting-started)
- 📖 [API Reference](https://developers.facebook.com/docs/instagram-api/reference)

**TikTok API:**
- 📖 [TikTok for Developers](https://developers.tiktok.com/doc/overview)
- 📖 [Login Kit Guide](https://developers.tiktok.com/doc/login-kit-web)
- 📖 [API Reference](https://developers.tiktok.com/doc/user-info-basic)

**Apify:**
- 📖 [Apify Documentation](https://docs.apify.com/)
- 📖 [Instagram Scrapers](https://apify.com/store?search=instagram)
- 📖 [API Client for Node.js](https://docs.apify.com/api/client/js)

### Video Tutorials

**Instagram API:**
- 🎥 [Instagram Graph API Tutorial](https://www.youtube.com/results?search_query=instagram+graph+api+tutorial)

**TikTok API:**
- 🎥 [TikTok API Integration](https://www.youtube.com/results?search_query=tiktok+api+tutorial)

### Community Support

**Stack Overflow:**
- [Instagram API Questions](https://stackoverflow.com/questions/tagged/instagram-api)
- [TikTok API Questions](https://stackoverflow.com/questions/tagged/tiktok-api)

**Discord/Slack Communities:**
- Apify Community Discord
- Meta Developers Community

---

## ✅ Final Checklist

Before going to production, ensure you have:

### Instagram
- [ ] Meta Developer account created
- [ ] App created and configured
- [ ] Instagram Business account connected
- [ ] Long-lived access token generated (60 days)
- [ ] OAuth redirect URIs configured
- [ ] Privacy policy and terms of service URLs added
- [ ] Tested API calls successfully
- [ ] Implemented token refresh mechanism
- [ ] Set up error handling and logging

### TikTok
- [ ] TikTok Developer account created
- [ ] App submitted and approved
- [ ] Client Key and Secret obtained
- [ ] Redirect URIs configured
- [ ] Required scopes approved
- [ ] OAuth flow implemented
- [ ] Tested user info and video APIs
- [ ] Implemented token refresh
- [ ] Set up error handling

### Apify (If Using)
- [ ] Apify account created
- [ ] API token generated
- [ ] Tested Instagram Profile Scraper
- [ ] Usage limits configured
- [ ] Billing alerts enabled
- [ ] Integrated into codebase
- [ ] Error handling implemented

### Integration
- [ ] All API keys in `.env` file
- [ ] Environment variables loaded correctly
- [ ] Service classes implemented
- [ ] Error handling and logging added
- [ ] Rate limiting implemented
- [ ] Caching strategy implemented
- [ ] Tests passing
- [ ] Documentation updated

---

## 🎉 Congratulations!

You've successfully set up Instagram and TikTok APIs for Beautiful Encer!

**Next Steps:**
1. Test all integrations thoroughly in development
2. Monitor API usage and costs
3. Implement robust error handling
4. Add rate limiting and caching
5. Set up monitoring and alerts
6. Prepare for production deployment

**Questions or Issues?**
- Check the troubleshooting section above
- Consult official documentation
- Reach out to API support teams

**Good luck with your Beautiful Encer project! 🚀**

---

**Document Version**: 1.0  
**Last Updated**: October 18, 2025  
**Maintained by**: Beautiful Encer Development Team
