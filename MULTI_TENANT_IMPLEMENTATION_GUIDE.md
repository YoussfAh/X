# 🚀 Pro-G Multi-Tenant System - Complete Implementation Guide

## 🎯 System Overview

The Pro-G multi-tenant system allows a single deployment to serve multiple isolated client instances, each with:
- **Complete data isolation**
- **Custom branding and URLs**
- **Independent user management**
- **Separate app configurations**

## 🏗️ Architecture

### Main App (No Tenant)
- **URL:** `https://your-app.vercel.app` or `http://localhost:3000`
- **Purpose:** Landing page + Super Admin tenant management
- **Access:** Only super admins can create/manage tenants
- **Data:** Main app data (not shared with tenants)

### Tenant Apps
- **URL:** `https://your-app.vercel.app?tenant=SLUG` or `http://localhost:3000?tenant=SLUG`
- **Purpose:** Complete Pro-G app instance for that tenant
- **Access:** Tenant users only see their tenant's data
- **Data:** Completely isolated per tenant

## 🔐 Access Control

### 1. Super Admin (Main App Only)
- Can access `/super-admin` routes
- Can create/manage/delete tenants
- Can view all tenant statistics
- Cannot see tenant user data (privacy)

### 2. Tenant Admin
- Can manage their tenant's data only
- Cannot see other tenants
- Cannot access super admin features
- Full admin within their tenant

### 3. Regular User
- Belongs to one tenant only
- Sees only their tenant's data
- Standard app functionality

## 🌐 URL Structure

### Development
```
Main App:        http://localhost:3000
Tenant App:      http://localhost:3000?tenant=acme-fitness
Super Admin:     http://localhost:3000/super-admin
```

### Production (Vercel)
```
Main App:        https://pro-g.vercel.app
Tenant App:      https://pro-g.vercel.app?tenant=acme-fitness
Super Admin:     https://pro-g.vercel.app/super-admin
```

### Future Enhancement (Custom Domains)
```
Tenant App:      https://acme.pro-g.app (subdomain)
Tenant App:      https://fitness.acme.com (custom domain)
```

## 📊 Data Isolation

Every model includes `tenantId`:
```javascript
// All queries automatically filtered by tenant
const products = await Product.find({ tenantId: req.tenantId });
```

### Models with Tenant Isolation:
- ✅ Users (unique email per tenant)
- ✅ Products  
- ✅ Collections
- ✅ Orders
- ✅ Workouts
- ✅ Diet Entries
- ✅ Sleep Records
- ✅ Quiz Data
- ✅ All other app data

## 🛡️ Security

### Authentication Flow
1. User visits `app.com?tenant=acme`
2. Frontend detects tenant "acme"
3. Login request includes tenant context
4. Backend validates user belongs to "acme"
5. JWT includes tenant info
6. All subsequent requests filtered by tenant

### Tenant Isolation
- Database queries ALWAYS filtered by `tenantId`
- Middleware validates tenant access
- Super admins bypass tenant checks
- Cross-tenant access blocked

## 🎨 Tenant Customization

Each tenant can customize:
```javascript
{
  branding: {
    appName: "ACME Fitness",
    logo: "https://...",
    primaryColor: "#FF5733",
    secondaryColor: "#C70039",
    favicon: "https://..."
  },
  pwa: {
    name: "ACME Fitness App",
    shortName: "ACME",
    themeColor: "#FF5733"
  },
  settings: {
    allowRegistration: true,
    maintenanceMode: false
  }
}
```

## 🔧 Implementation Details

### Backend Middleware Stack
```javascript
app.use('/api', identifyTenant);     // 1. Identify tenant from request
app.use('/api', setTenantContext);   // 2. Set helpers for queries
app.use('/api', protect);            // 3. Authenticate user
app.use('/api', ensureTenantAccess); // 4. Validate tenant access
```

### Frontend Tenant Detection
```javascript
// TenantContext.js
const identifyTenant = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant');
  return tenantParam || null; // null = main app
};
```

### Database Query Pattern
```javascript
// Controller example
const getProducts = async (req, res) => {
  const query = {};
  
  // Main app shows all products
  // Tenant app shows only tenant products
  if (req.tenantId) {
    query.tenantId = req.tenantId;
  }
  
  const products = await Product.find(query);
  res.json(products);
};
```

## 📦 Deployment

### Environment Variables
```env
# Backend
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret
NODE_ENV=production

# Frontend  
REACT_APP_API_URL=https://your-api.vercel.app
```

### Vercel Configuration
```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ]
}
```

## 🧪 Testing the System

### 1. Create Super Admin
```bash
cd backend
node scripts/setSuperAdmin.js your@email.com
```

### 2. Access Super Admin Panel
```
http://localhost:3000/super-admin
```

### 3. Create Test Tenant
- Name: "Test Fitness"
- Slug: "test" 
- Admin Email: "admin@test.com"

### 4. Access Tenant App
```
http://localhost:3000?tenant=test
```

### 5. Verify Isolation
- Create data in main app
- Create data in tenant app
- Verify no data crossover

## 🚨 Important Notes

1. **Main App != Tenant**
   - Main app is for landing/marketing
   - Tenants are isolated app instances
   - No data sharing between them

2. **User Accounts**
   - Users exist per tenant
   - Same email can exist in different tenants
   - Super admins only in main app

3. **Tenant Creation**
   - Only super admins can create tenants
   - Each tenant gets unique slug
   - Slug used in URL for access

4. **Data Privacy**
   - Tenants cannot see each other's data
   - Super admins manage tenants, not tenant data
   - Complete isolation enforced

## 🔍 Troubleshooting

### "Tenant not found" Error
- Check URL has correct `?tenant=slug`
- Verify tenant exists and is active
- Clear cookies/cache

### Cannot Access Super Admin
- Verify user has `isSuperAdmin: true`
- Must be in main app (no tenant param)
- Check authentication token

### Data Bleeding Between Tenants  
- Verify all queries use `tenantId`
- Check middleware stack order
- Review controller filters

## 🎉 Success Checklist

- [ ] Main app works without tenant
- [ ] Super admin can access `/super-admin`
- [ ] Can create new tenants
- [ ] Tenant URLs work (`?tenant=slug`)
- [ ] Data isolated between tenants
- [ ] Custom branding applies
- [ ] Authentication tenant-aware
- [ ] Works on Vercel deployment 
 
 
 
 
 