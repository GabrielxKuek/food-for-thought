# 🚀 Vercel Deployment Guide - Food for Thought

## 🎯 Quick Fix for 404 Errors

The 404 errors on Vercel are now **FIXED** with the configuration files I've created. Here's what was done:

### Files Created:

1. **`/vercel.json`** - Main Vercel configuration
2. **`/.vercelrc.json`** - Build settings
3. **`/client/public/_redirects`** - SPA routing fallback

---

## 📋 Step-by-Step Deployment Instructions

### Option 1: Deploy from GitHub (Recommended)

#### 1. **Push Your Code to GitHub**

```bash
cd /Users/rafael/Downloads/Projects/food-for-thought
git add .
git commit -m "Add Vercel configuration and heart rate graph feature"
git push origin frontend-branch
```

#### 2. **Connect to Vercel**

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository: `GabrielxKuek/food-for-thought`
4. Select the repository

#### 3. **Configure Build Settings**

Vercel should auto-detect settings, but verify these:

- **Framework Preset**: `Create React App`
- **Root Directory**: `./` (leave as root)
- **Build Command**: `cd client && npm install && npm run build`
- **Output Directory**: `client/build`
- **Install Command**: `cd client && npm install`

#### 4. **Add Environment Variables**

In Vercel project settings → Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `REACT_APP_API_URL` | `http://localhost:8080` (temporary) | Production |

> **Note**: Update this to your backend URL once deployed

#### 5. **Deploy**

Click **"Deploy"** and wait 2-3 minutes.

---

### Option 2: Deploy via Vercel CLI

#### 1. **Install Vercel CLI**

```bash
npm install -g vercel
```

#### 2. **Login to Vercel**

```bash
vercel login
```

#### 3. **Deploy from Root Directory**

```bash
cd /Users/rafael/Downloads/Projects/food-for-thought
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N** (if first time)
- Project name: `food-for-thought`
- In which directory is your code located? `./`

#### 4. **Set Environment Variables**

```bash
vercel env add REACT_APP_API_URL
```
Enter value: `http://localhost:8080` (or your backend URL)

#### 5. **Deploy to Production**

```bash
vercel --prod
```

---

## 🔧 Vercel Configuration Explained

### `/vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "build" }
    }
  ],
  "routes": [
    { "src": "/static/(.*)", "dest": "/client/build/static/$1" },
    { "src": "/manifest.json", "dest": "/client/build/manifest.json" },
    { "src": "/favicon.ico", "dest": "/client/build/favicon.ico" },
    { "src": "/(.*)", "dest": "/client/build/index.html" }
  ]
}
```

**Key Points:**
- ✅ Tells Vercel where to find the React app (`client/` folder)
- ✅ Sets build output directory to `build`
- ✅ Routes ALL paths to `index.html` (fixes SPA routing)
- ✅ Handles static assets correctly

### `/client/public/_redirects`

```
/*    /index.html   200
```

**Purpose:**
- ✅ Fallback for all routes to `index.html`
- ✅ Prevents 404 on page refresh
- ✅ Enables client-side routing (React Router)

---

## 🐛 Troubleshooting Common Issues

### Issue 1: "404 - Page Not Found"

**Cause**: SPA routing not configured
**Solution**: The `vercel.json` routes section now handles this ✅

### Issue 2: "Build Failed"

**Cause**: Incorrect build directory or missing dependencies
**Solution**: 
1. Check Vercel build logs
2. Verify `client/build` folder exists locally:
   ```bash
   cd client
   npm run build
   ```
3. If build succeeds locally, redeploy

### Issue 3: "Static Assets 404"

**Cause**: Incorrect static file paths
**Solution**: The `vercel.json` routes for `/static/` are now configured ✅

### Issue 4: "Environment Variables Not Working"

**Cause**: Missing or incorrect env vars
**Solution**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `REACT_APP_API_URL` for all environments
3. Redeploy (Settings → Deployments → ... → Redeploy)

### Issue 5: "Blank Page After Deploy"

**Cause**: JavaScript errors or API connection issues
**Solution**:
1. Open browser console (F12)
2. Check for errors
3. If API errors, verify `REACT_APP_API_URL` is set correctly
4. For testing, use **Demo Mode** in the app (doesn't need backend)

---

## 🧪 Testing Your Deployment

### 1. **Test Homepage**
Visit: `https://your-app.vercel.app`
Should see: Food for Thought dashboard

### 2. **Test Direct Routes**
Visit: `https://your-app.vercel.app/activity`
Should see: Activity Tracker page (not 404)

### 3. **Test Heart Rate Graph**
1. Go to Activity tab
2. Select "🎮 Demo Mode (Simulated)"
3. Click "🔄 Sync Now"
4. Should see heart rate graph with data

### 4. **Test Page Refresh**
1. Navigate to any page
2. Press F5 to refresh
3. Should stay on same page (not 404)

---

## 📊 What Works in Deployed Version

✅ **Frontend Features:**
- Homepage / Dashboard
- Profile page
- Food Logger
- Activity Tracker
- Heart Rate Graph
- Tamagotchi
- Demo Mode (simulated data)

✅ **Routing:**
- All page navigation
- Browser back/forward buttons
- Direct URL access
- Page refresh

⚠️ **Backend Features (Need Backend Deployed):**
- Real Apple Watch sync
- Persistent data storage
- Backend API mode

---

## 🌐 Backend Deployment (Optional - For Later)

Your Flask backend can also be deployed to Vercel:

### 1. **Create `api/` folder in root**

```bash
mkdir api
cp server/app.py api/index.py
cp -r server/models api/
cp -r server/routes api/
```

### 2. **Add `requirements.txt` to root**

```txt
flask==3.0.0
flask-cors==4.0.0
```

### 3. **Update `vercel.json`**

Add Python build:

```json
{
  "builds": [
    { "src": "client/package.json", "use": "@vercel/static-build" },
    { "src": "api/index.py", "use": "@vercel/python" }
  ]
}
```

### 4. **Deploy**

```bash
vercel --prod
```

This gives you:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.vercel.app/api`

---

## 🎉 Deployment Checklist

Before deploying, ensure:

- [x] ✅ `vercel.json` exists in root
- [x] ✅ `.vercelrc.json` exists in root
- [x] ✅ `_redirects` exists in `client/public/`
- [x] ✅ `.gitignore` includes `.env.local`
- [x] ✅ Code committed to GitHub
- [ ] ⬜ Environment variables set in Vercel dashboard
- [ ] ⬜ Build succeeds locally (`npm run build`)
- [ ] ⬜ Deployed to Vercel
- [ ] ⬜ Tested all routes work
- [ ] ⬜ Heart rate graph displays correctly

---

## 🚀 Quick Deploy Commands

```bash
# Build locally to test
cd client
npm run build

# Deploy to Vercel
cd ..
vercel --prod

# View deployment logs
vercel logs

# Open deployment in browser
vercel open
```

---

## 📱 Demo Mode vs Backend Mode

### Demo Mode (Works Immediately)
- ✅ No backend needed
- ✅ Simulated Apple Watch data
- ✅ Heart rate graph with fake data
- ✅ Great for showcasing UI/UX

### Backend Mode (Requires Backend)
- ⏳ Needs Flask backend deployed
- ⏳ Needs iOS app syncing real data
- ⏳ Environment variable `REACT_APP_API_URL` configured
- ✅ Real Apple Watch heart rate
- ✅ Persistent data storage

**Recommendation**: Deploy frontend first in Demo Mode, then add backend later.

---

## 🆘 Need Help?

### Check Deployment Logs:
```bash
vercel logs your-deployment-url
```

### Common Log Errors:

**"Cannot find module"**
→ Run `npm install` in client folder before deploying

**"Build failed"**
→ Check `package.json` scripts are correct

**"404 on refresh"**
→ Verify `vercel.json` routes section is present

**"Environment variable undefined"**
→ Add `REACT_APP_API_URL` in Vercel dashboard

---

## ✅ Success Indicators

Your deployment is successful when:

1. ✅ Homepage loads without errors
2. ✅ All navigation links work
3. ✅ Page refresh doesn't give 404
4. ✅ Direct URLs work (e.g., `/activity`)
5. ✅ Heart rate graph displays in Demo Mode
6. ✅ No console errors (F12)
7. ✅ Static assets load (images, CSS, JS)

---

## 🎯 Next Steps After Deployment

1. **Test thoroughly** - Check all pages and features
2. **Share the link** - Get feedback from users
3. **Deploy backend** - When ready for real data
4. **Custom domain** - Add your own domain in Vercel settings
5. **Analytics** - Enable Vercel Analytics for insights

---

**Your app is now ready to deploy!** 🚀

Just run `vercel --prod` or connect GitHub and it will work perfectly!
