# 🚀 Complete Vercel Deployment Guide - Pro-G Multi-Tenant Application

## 📋 Overview

This guide will help you deploy your Pro-G multi-tenant fitness application to Vercel with full support for:
- ✅ Multi-tenant architecture
- ✅ Dynamic subdomain routing
- ✅ AI analysis features
- ✅ Database connectivity
- ✅ File uploads via Cloudinary
- ✅ Authentication & authorization

---

## 🎯 Deployment Strategy

### Option 1: Single Project Deployment (Recommended)
Deploy both frontend and backend as a single Vercel project using the monorepo setup.

### Option 2: Separate Projects
Deploy frontend and backend as separate Vercel projects for better resource management.

---

## 🔧 Prerequisites

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Prepare Environment Variables
Copy `env.example` to `.env.local` and fill in your values:
```bash
cp env.example .env.local
```

---

## 🚀 Quick Deployment (Option 1 - Single Project)

### Step 1: Run the Deployment Script
```bash
./deploy.sh
```

### Step 2: Follow the Prompts
- Choose your Vercel account/team
- Set project name (e.g., `pro-g-fitness`)
- Choose deployment type (production or preview)

### Step 3: Configure Environment Variables
In the Vercel dashboard, go to your project → Settings → Environment Variables and add:

#### Backend Environment Variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_super_secret_jwt_key_here
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=production
```

#### Frontend Environment Variables:
```
REACT_APP_API_URL=https://your-app.vercel.app
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id
```

---

## 🔄 Manual Deployment (Option 2 - Separate Projects)

### Deploy Backend First

1. **Create Backend Project**
```bash
cd backend
vercel
```

2. **Configure Backend Settings**
- Framework: Other
- Build Command: (leave empty)
- Output Directory: (leave empty)
- Install Command: npm install

3. **Add Backend Environment Variables** (same as above)

### Deploy Frontend Second

1. **Create Frontend Project**
```bash
cd frontend
vercel
```

2. **Configure Frontend Settings**
- Framework: Create React App
- Build Command: npm run build
- Output Directory: build
- Install Command: npm install

3. **Add Frontend Environment Variables**
```
REACT_APP_API_URL=https://your-backend-project.vercel.app
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id
```

---

## 🌐 Multi-Tenant Configuration

### Subdomain Setup
Your app will automatically handle tenant routing via subdomains:

- `https://main-tenant.your-app.vercel.app` → Main tenant
- `https://tenant1.your-app.vercel.app` → Tenant 1
- `https://tenant2.your-app.vercel.app` → Tenant 2

### Custom Domain Setup (Optional)

1. **Add Custom Domain in Vercel**
   - Go to Project → Settings → Domains
   - Add your custom domain (e.g., `fitness-app.com`)

2. **Configure DNS**
   - Add CNAME record pointing to your Vercel deployment
   - Add wildcard CNAME for subdomains: `*.fitness-app.com`

3. **Update Environment Variables**
```
CUSTOM_DOMAIN=fitness-app.com
FRONTEND_URL=https://fitness-app.com
```

---

## 🔐 Security Configuration

### CORS Settings
The backend is configured to automatically allow:
- ✅ Vercel deployment URLs (`*.vercel.app`)
- ✅ Custom domains in production
- ✅ Localhost subdomains for development
- ✅ Tenant-specific domains

### Authentication
- JWT tokens work seamlessly with Vercel
- Google OAuth is configured for production
- Session management is handled via secure cookies

---

## 📊 Database Configuration

### MongoDB Atlas Setup
1. **Create MongoDB Atlas Account**
2. **Create Database Cluster**
3. **Configure Network Access**
   - Add `0.0.0.0/0` for Vercel (or specific Vercel IPs)
4. **Create Database User**
5. **Get Connection String**

### Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```

---

## 🖼️ File Upload Configuration

### Cloudinary Setup
1. **Create Cloudinary Account**
2. **Get API Credentials**
3. **Configure Upload Presets**
4. **Add Environment Variables**

### Upload Folders
- User avatars: `/avatars/`
- Progress images: `/progress/`
- Meal images: `/meals/`
- Hero images: `/hero/`

---

## 🤖 AI Service Configuration

### Google Gemini API
1. **Get API Key from Google AI Studio**
2. **Set Rate Limits**
3. **Configure Usage Quotas**
4. **Add to Environment Variables**

---

## 🧪 Testing Your Deployment

### 1. Basic Functionality
```bash
# Test API endpoint
curl https://your-app.vercel.app/api/config/paypal

# Test frontend
curl https://your-app.vercel.app
```

### 2. Authentication Flow
- Test user registration
- Test login/logout
- Test Google OAuth

### 3. Multi-Tenant Features
- Test tenant switching
- Test subdomain routing
- Test tenant-specific branding

### 4. AI Analysis
- Test AI analysis features
- Test data aggregation
- Test tenant data isolation

---

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs in Vercel dashboard
# Common fixes:
npm run build:frontend  # Test locally
npm run install-all     # Reinstall dependencies
```

#### Database Connection Issues
```bash
# Test MongoDB connection
# Check IP whitelist in MongoDB Atlas
# Verify connection string format
```

#### CORS Errors
```bash
# Check origin in browser dev tools
# Verify CORS configuration in backend/server.js
# Ensure frontend URL matches backend CORS settings
```

#### Environment Variables
```bash
# Verify all required env vars are set
# Check variable names (case-sensitive)
# Redeploy after adding new variables
```

---

## 📈 Performance Optimization

### Frontend Optimization
- ✅ Code splitting implemented
- ✅ Image optimization via Cloudinary
- ✅ Lazy loading for components
- ✅ Service worker for caching

### Backend Optimization
- ✅ Database connection pooling
- ✅ API response caching
- ✅ Optimized queries with indexes
- ✅ Rate limiting configured

---

## 🔄 Continuous Deployment

### GitHub Integration
1. **Connect GitHub Repository**
   - Go to Vercel dashboard
   - Connect your GitHub repo
   - Enable auto-deployments

2. **Branch Configuration**
   - `main` → Production deployments
   - `develop` → Preview deployments
   - Feature branches → Preview deployments

### Deployment Hooks
```bash
# Preview deployment on PR
git push origin feature-branch

# Production deployment
git push origin main
```

---

## 📝 Post-Deployment Checklist

### Essential Tasks
- [ ] All environment variables configured
- [ ] Database connection working
- [ ] Authentication flow tested
- [ ] File uploads working
- [ ] AI analysis functional
- [ ] Multi-tenant routing tested
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Performance monitoring setup

### Optional Enhancements
- [ ] Custom error pages
- [ ] Analytics integration
- [ ] Monitoring and logging
- [ ] Backup strategies
- [ ] CDN optimization

---

## 🆘 Support & Resources

### Vercel Documentation
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)

### Pro-G Specific Help
- Check deployment logs in Vercel dashboard
- Review backend logs for API errors
- Test individual components locally first
- Use browser dev tools for frontend debugging

---

## 🎉 Success!

Your Pro-G multi-tenant fitness application is now deployed to Vercel! 

**Your app is available at:**
- Main app: `https://your-app.vercel.app`
- Tenant subdomains: `https://tenant-name.your-app.vercel.app`
- Custom domain: `https://your-domain.com` (if configured)

**Next Steps:**
1. Set up your first tenant
2. Configure branding and settings
3. Test all features thoroughly
4. Monitor performance and usage
5. Scale as needed

Happy deploying! 🚀 