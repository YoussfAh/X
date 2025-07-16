# Vercel Deployment Guide - Pro-G Monorepo

## 🚀 Quick Fix Summary

**PROBLEM SOLVED:** MongoDB timeout issues and Vercel deployment failures have been fixed with:

1. ✅ **Robust MongoDB Connection** - Added connection caching, retry logic, and optimized settings
2. ✅ **Build Scripts** - Added proper build scripts to root package.json
3. ✅ **Vercel Configuration** - Fixed vercel.json for frontend-only deployment
4. ✅ **Error Handling** - Enhanced error handling for production deployment

---

## 📁 Project Structure

```
pro-g/
├── frontend/           # React frontend (deploys to Vercel)
├── backend/           # Express API (deploy separately)
├── package.json       # Root package with build scripts
├── vercel.json        # Vercel config for frontend
└── VERCEL_DEPLOYMENT_GUIDE.md
```

---

## 🎯 Deployment Strategy

### Option 1: Frontend + Backend (Recommended)

Deploy **frontend** and **backend** as **separate Vercel projects** for better performance:

#### A. Deploy Frontend
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project" → Import from Git
3. Select your repository
4. **Root Directory:** `frontend`
5. **Framework:** Create React App
6. **Build Command:** `npm run build`
7. **Output Directory:** `build`
8. **Install Command:** `npm install`

#### B. Deploy Backend  
1. Create another Vercel project
2. **Root Directory:** `backend`
3. **Framework:** Other
4. **Build Command:** Leave empty
5. **Output Directory:** Leave empty

### Option 2: Frontend Only (Current Setup)

Deploy from root directory (frontend only):

1. **Root Directory:** `.` (root)
2. **Framework:** Create React App
3. **Build Command:** `npm run build:frontend`
4. **Output Directory:** `frontend/build`
5. **Install Command:** `npm run install-all`

---

## 🔧 Environment Variables

### Frontend Environment Variables (Vercel Dashboard)

```bash
# Add these in Vercel Dashboard → Project → Settings → Environment Variables

REACT_APP_API_URL=https://your-backend-url.vercel.app
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id
```

### Backend Environment Variables (Vercel Dashboard)

```bash
# Add these for your backend Vercel project

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🛠️ Fixed Issues

### ✅ MongoDB Connection Timeouts
- **Added connection caching** for serverless environments
- **Retry logic** for all database operations
- **Optimized connection settings** for Vercel
- **Enhanced error handling** with proper logging

### ✅ Build Script Errors
- Added `build:frontend` script to root package.json
- Added `build` script for monorepo deployment
- Fixed frontend build configuration

### ✅ Missing Public Directory
- Updated vercel.json to correctly point to `frontend/build`
- Added proper routing configuration
- Set correct output directory

---

## 🚨 Deployment Commands (Local Testing)

Test your build locally before deploying:

```bash
# Test frontend build
npm run build:frontend

# Test if build directory exists
ls frontend/build

# Test local server
cd frontend && npx serve build
```

---

## 📋 Pre-Deployment Checklist

### Frontend
- [ ] Environment variables added to Vercel
- [ ] Build script runs successfully
- [ ] `frontend/build` directory exists and has content
- [ ] API URL points to deployed backend

### Backend  
- [ ] MongoDB connection string is correct
- [ ] All environment variables are set
- [ ] `backend/vercel.js` exists and exports app
- [ ] CORS is configured for frontend domain

---

## 🔍 Troubleshooting

### Build Fails
```bash
# Check if dependencies install correctly
npm run install-all

# Test build locally
npm run build:frontend

# Check build output
ls -la frontend/build
```

### MongoDB Connection Issues
```bash
# Test MongoDB connection (run from backend directory)
cd backend && node test-vercel-mongodb.js
```

### Deployment Issues
1. **Clear Vercel cache** in project settings
2. **Redeploy** from Vercel dashboard
3. **Check build logs** in Vercel deployment tab
4. **Verify environment variables** are set correctly

---

## 🎉 Success Indicators

After successful deployment:

✅ **Frontend:** Accessible at your Vercel domain  
✅ **Build logs:** No errors in Vercel dashboard  
✅ **API calls:** Working connection to backend  
✅ **MongoDB:** No timeout errors in logs  
✅ **Authentication:** Login/registration working  

---

## 📞 Support

If you encounter issues:

1. **Check Vercel build logs** for specific errors
2. **Verify environment variables** are correctly set
3. **Test MongoDB connection** using the test script
4. **Check CORS settings** if API calls fail

Your MongoDB timeout issues have been completely resolved with the new connection handling system!
