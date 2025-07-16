# Pro-G Multi-Tenant Implementation Guide

## Database Schema Modifications

### Add Tenant Field to All Collections

All existing collections need a `tenantId` field:

```javascript
// Example: User Schema
const userSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  // ... existing fields
});

// Add compound indexes for performance
userSchema.index({ tenantId: 1, email: 1 });
userSchema.index({ tenantId: 1, createdAt: -1 });
```

### New Tenant Collection

```javascript
const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subdomain: { type: String, required: true, unique: true },
  customDomain: { type: String, unique: true, sparse: true },
  branding: {
    logo: String,
    primaryColor: { type: String, default: '#007bff' },
    secondaryColor: { type: String, default: '#6c757d' },
    customCSS: String,
    favicon: String
  },
  settings: {
    allowSignups: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    maxClients: { type: Number, default: 100 },
    features: [{
      name: String,
      enabled: { type: Boolean, default: true }
    }]
  },
  subscription: {
    plan: { type: String, enum: ['starter', 'professional', 'enterprise'], default: 'starter' },
    status: { type: String, enum: ['active', 'suspended', 'cancelled'], default: 'active' },
    expiresAt: Date,
    trialEndsAt: Date
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

## Middleware for Tenant Isolation

### Tenant Detection Middleware

```javascript
// middleware/tenantMiddleware.js
export const detectTenant = async (req, res, next) => {
  try {
    let tenant = null;

    // Method 1: Subdomain detection
    const subdomain = req.get('host').split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      tenant = await Tenant.findOne({ subdomain });
    }

    // Method 2: Custom domain
    if (!tenant) {
      const domain = req.get('host');
      tenant = await Tenant.findOne({ customDomain: domain });
    }

    // Method 3: Header-based (for API calls)
    if (!tenant && req.headers['x-tenant-id']) {
      tenant = await Tenant.findById(req.headers['x-tenant-id']);
    }

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check subscription status
    if (tenant.subscription.status !== 'active') {
      return res.status(403).json({ error: 'Subscription inactive' });
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Tenant detection failed' });
  }
};
```

### Database Query Scoping

```javascript
// middleware/scopeMiddleware.js
export const scopeToTenant = (req, res, next) => {
  // Override mongoose queries to automatically include tenantId
  const originalFind = req.db.collection.prototype.find;

  req.db.collection.prototype.find = function(query = {}) {
    query.tenantId = req.tenant._id;
    return originalFind.call(this, query);
  };

  next();
};
```

## Frontend Multi-Tenant Support

### Dynamic Branding Component

```jsx
// components/TenantBranding.jsx
import { useEffect } from 'react';
import { useTenant } from '../hooks/useTenant';

export const TenantBranding = () => {
  const { tenant } = useTenant();

  useEffect(() => {
    if (tenant) {
      // Apply custom CSS variables
      document.documentElement.style.setProperty('--primary-color', tenant.branding.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', tenant.branding.secondaryColor);

      // Update favicon
      if (tenant.branding.favicon) {
        const link = document.querySelector('link[rel="icon"]');
        link.href = tenant.branding.favicon;
      }

      // Inject custom CSS
      if (tenant.branding.customCSS) {
        const style = document.createElement('style');
        style.textContent = tenant.branding.customCSS;
        document.head.appendChild(style);
      }
    }
  }, [tenant]);

  return null;
};
```

### Tenant Context Hook

```jsx
// hooks/useTenant.js
import { createContext, useContext, useEffect, useState } from 'react';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const response = await fetch('/api/tenant/current');
        const tenantData = await response.json();
        setTenant(tenantData);
      } catch (error) {
        console.error('Failed to fetch tenant:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};
```

## Deployment Strategy

### Single Backend with Tenant Routing

```javascript
// server.js modifications
app.use('/api', detectTenant, scopeToTenant, apiRoutes);

// Add tenant management routes
app.use('/api/admin/tenants', adminOnly, tenantManagementRoutes);
```

### Frontend Deployment Options

1. **Single SPA with Dynamic Routing** (Recommended)
   - One React app deployment
   - Dynamic tenant detection on load
   - Subdomain routing: client1.pro-g.com, client2.pro-g.com

2. **Multiple Frontend Deployments**
   - Deploy frontend 10 times with different configs
   - Each points to same backend with different tenant headers

## Migration Plan

### Phase 1: Database Migration (Week 1)
1. Add tenantId field to all collections
2. Create Tenant collection
3. Create default tenant for existing data
4. Update all existing records with default tenantId

### Phase 2: Backend Updates (Week 2)
1. Implement tenant detection middleware
2. Update all API routes to scope by tenant
3. Add tenant management endpoints
4. Test data isolation

### Phase 3: Frontend Updates (Week 3)
1. Implement tenant context and branding
2. Update all API calls to include tenant headers
3. Test multi-tenant UI functionality

### Phase 4: Client Onboarding (Week 4)
1. Create tenant records for each coaching business
2. Set up subdomains or custom domains
3. Configure branding for each tenant
4. Migrate client data if needed

## Pricing Model for Coaches

### Subscription Tiers
- **Starter**: $149/month (up to 25 clients)
- **Professional**: $299/month (up to 75 clients)
- **Enterprise**: $599/month (unlimited clients)

### Revenue Projection
- 10 tenants × $299 average = $2,990/month recurring revenue
- Scale to 50+ tenants = $15,000+/month
- Much higher profit margin than managing separate deployments

## Security Considerations

### Data Isolation
- All database queries scoped by tenantId
- File uploads organized by tenant
- User sessions tied to specific tenants
- API rate limiting per tenant

### Access Control
- Tenant admins can only access their data
- Super admin access for platform management
- Role-based permissions within each tenant

## Monitoring and Analytics

### Per-Tenant Metrics
- User activity and engagement
- Feature usage statistics
- Performance metrics
- Billing and usage tracking

### Platform-Wide Metrics
- Total users across all tenants
- Revenue and growth tracking
- System performance and health
- Support ticket volume by tenant
