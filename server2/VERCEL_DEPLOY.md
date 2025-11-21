# 🚀 Deploy Express + Redis Backend to Vercel

## Prerequisites

You need a **free Upstash Redis** account because Vercel serverless functions need a serverless Redis.

---

## Step 1: Create Upstash Redis Database

1. Go to https://console.upstash.com/
2. Sign up (free tier includes 10,000 commands/day)
3. Click **Create Database**
4. Choose:
   - **Name**: `food-for-thought-redis`
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
   - **Type**: Regional (free)
5. Click **Create**

---

## Step 2: Get Redis URL

1. In your Upstash database dashboard, scroll down to **REST API** section
2. Copy the **Redis URL** (looks like: `rediss://default:xxxxx@xxxxx.upstash.io:6379`)
3. Keep this handy for next step

---

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to server2 folder
cd server2

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name? food-for-thought-api
# - Directory? ./
# - Override settings? N

# Add environment variable
vercel env add REDIS_URL
# Paste your Upstash Redis URL when prompted
# Select: Production, Preview, Development (all)

# Add CORS origin
vercel env add CORS_ORIGIN
# Enter: https://food-for-thought-lovat.vercel.app
# Select: Production, Preview, Development (all)

# Redeploy with environment variables
vercel --prod
```

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository or upload `server2` folder
3. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `server2`
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
4. Add **Environment Variables**:
   - `REDIS_URL`: Your Upstash Redis URL
   - `CORS_ORIGIN`: `https://food-for-thought-lovat.vercel.app`
5. Click **Deploy**

---

## Step 4: Update Your Apps

After deployment, you'll get a URL like: `https://food-for-thought-api.vercel.app`

### Update iOS App (`ios/APIService.swift`):

```swift
// Change from:
private let baseURL = "http://192.168.1.26:8080"

// To:
private let baseURL = "https://food-for-thought-api.vercel.app"
```

### Update React App (`client/.env`):

```bash
# Change from:
REACT_APP_API_URL=http://192.168.1.26:8080

# To:
REACT_APP_API_URL=https://food-for-thought-api.vercel.app
```

Rebuild both apps and test!

---

## Step 5: Test Deployment

```bash
# Test health endpoint
curl https://YOUR_VERCEL_URL.vercel.app/api/health/test

# Should return:
# {"status":"healthy","message":"Health API is running","timestamp":"..."}
```

---

## 🎯 Data Flow After Deployment

```
Apple Watch
    ↓
iOS App → https://YOUR_API.vercel.app/api/health/sync
    ↓
Vercel Serverless Function → Upstash Redis (Cloud)
    ↓
React App ← https://YOUR_API.vercel.app/api/health/user123
    ↓
HealthContext → HeartRateGraph
```

---

## 📊 Free Tier Limits

**Upstash Redis Free Tier:**
- ✅ 10,000 commands/day
- ✅ 256 MB storage
- ✅ Enough for 100+ users syncing every 5 minutes

**Vercel Free Tier:**
- ✅ 100 GB bandwidth/month
- ✅ 100 hours serverless execution/month
- ✅ Unlimited API requests

**This is MORE than enough for your MVP!** 🎉

---

## 🔧 Troubleshooting

### Redis Connection Error:

Make sure your `REDIS_URL` starts with `rediss://` (with double 's' for SSL) for Upstash.

### CORS Error:

Make sure `CORS_ORIGIN` environment variable matches your frontend URL exactly.

### "Module not found" Error:

Make sure `package.json` is in the root of your `server2` directory.

---

## 🚨 Important Notes

1. **No local Redis needed** - Upstash is fully cloud-based
2. **Data persists** - Unlike local in-memory, your data survives across deployments
3. **Automatic scaling** - Vercel + Upstash scale automatically
4. **HTTPS automatically** - Vercel provides SSL for free

---

## Quick Deploy Script

Save this as `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Navigate to server2
cd server2

# Deploy to production
vercel --prod

echo "✅ Deployment complete!"
echo "🔗 Update your iOS and React apps with the new URL"
```

Run: `chmod +x deploy.sh && ./deploy.sh`
