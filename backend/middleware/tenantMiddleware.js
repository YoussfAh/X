import Tenant from '../models/tenantModel.js';
import asyncHandler from './asyncHandler.js';

// Extract tenant from request
export const identifyTenant = asyncHandler(async (req, res, next) => {
  let tenantId = null;
  let tenant = null;
  
  // 1. Check for tenant ID in headers (useful for API requests)
  const headerTenantId = req.headers['x-tenant-id'];
  
  // 2. Check for subdomain or custom domain
  const host = req.get('host') || '';
  const origin = req.get('origin') || '';
  const referer = req.get('referer') || '';
  
  console.log('[TENANT] Identifying tenant from request:', {
    host,
    origin,
    referer,
    headerTenantId,
    path: req.path,
    vercelUrl: process.env.VERCEL_URL,
    nodeEnv: process.env.NODE_ENV
  });
  
  // Try to find tenant from various sources
  if (headerTenantId) {
    // If tenant ID is provided in headers
    tenant = await Tenant.findById(headerTenantId);
    if (tenant && tenant.isActive()) {
      tenantId = tenant._id;
    }
  } else {
    // Extract domain to check
    let domainToCheck = host;
    
    // If origin is provided, extract hostname from it
    if (origin) {
      try {
        const originUrl = new URL(origin);
        domainToCheck = originUrl.hostname;
      } catch (e) {
        // Ignore URL parsing errors
      }
    }
    
    // Remove port number if present
    domainToCheck = domainToCheck.split(':')[0];
    
    // Check if it's localhost for development
    if (domainToCheck === 'localhost' || domainToCheck === '127.0.0.1' || domainToCheck.endsWith('.localhost')) {
      let tenantSlug = req.cookies.tenantSlug || req.query.tenant;
      
      // Extract tenant from subdomain like main.localhost
      if (!tenantSlug && domainToCheck.endsWith('.localhost')) {
        const subdomainMatch = domainToCheck.match(/^([a-z0-9-]+)\.localhost$/);
        if (subdomainMatch) {
          tenantSlug = subdomainMatch[1];
          console.log('[TENANT] Extracted tenant from subdomain:', tenantSlug);
        }
      }
      
      // Also try extracting from origin URL if available
      if (!tenantSlug && origin) {
        try {
          const originUrl = new URL(origin);
          const originHost = originUrl.hostname;
          if (originHost.endsWith('.localhost')) {
            const subdomainMatch = originHost.match(/^([a-z0-9-]+)\.localhost$/);
            if (subdomainMatch) {
              tenantSlug = subdomainMatch[1];
              console.log('[TENANT] Extracted tenant from origin subdomain:', tenantSlug);
            }
          }
        } catch (e) {
          // Ignore URL parsing errors
        }
      }
      
      if (tenantSlug) {
        tenant = await Tenant.findOne({ 
          slug: tenantSlug, 
          status: { $ne: 'suspended' } 
        });
      } else if (referer) {
        // Try to extract tenant from referer URL in development
        const refererMatch = referer.match(/tenant=([a-z0-9-]+)/);
        if (refererMatch) {
          tenant = await Tenant.findOne({ 
            slug: refererMatch[1], 
            status: { $ne: 'suspended' } 
          });
        }
      }
    } else {
      // Production: Use domain-based tenant identification
      tenant = await Tenant.findByDomain(domainToCheck);
      
      // If not found and it's a Vercel deployment, check for tenant parameter or subdomain
      if (!tenant && (domainToCheck.includes('.vercel.app') || process.env.VERCEL_URL)) {
        // First try tenant parameter
        const tenantSlug = req.query.tenant || req.cookies.tenantSlug;
        if (tenantSlug) {
          tenant = await Tenant.findOne({ 
            slug: tenantSlug, 
            status: { $ne: 'suspended' } 
          });
        }
        
        // If still not found, try extracting from Vercel subdomain
        if (!tenant && domainToCheck.includes('.vercel.app')) {
          const subdomainMatch = domainToCheck.match(/^([a-z0-9-]+)\.vercel\.app$/);
          if (subdomainMatch) {
            const possibleTenantSlug = subdomainMatch[1];
            // Don't treat the main app deployment as a tenant
            if (possibleTenantSlug !== 'pro-g' && possibleTenantSlug !== 'grindx') {
              tenant = await Tenant.findOne({ 
                slug: possibleTenantSlug, 
                status: { $ne: 'suspended' } 
              });
              console.log('[TENANT] Tried Vercel subdomain tenant:', possibleTenantSlug, tenant ? 'found' : 'not found');
            }
          }
        }
      }
    }
    
    if (tenant && tenant.isActive()) {
      tenantId = tenant._id;
    }
  }
  
  // Special handling for super admin routes
  if (req.path.startsWith('/api/super-admin')) {
    // Super admin routes don't require tenant
    req.tenant = null;
    req.tenantId = null;
    req.isSuperAdminRoute = true;
    return next();
  }
  
  // Attach tenant to request
  req.tenant = tenant;
  req.tenantId = tenantId;
  
  // Log tenant identification result
  console.log('[TENANT] Identified tenant:', {
    tenantId: tenantId?.toString(),
    tenantSlug: tenant?.slug,
    tenantName: tenant?.name
  });
  
  // For development and main app access without tenant
  if (!tenant) {
    // Check if this is a development environment or main app access
    const isDevelopment = process.env.NODE_ENV === 'development';
    const tenantSlugFromUrl = req.query.tenant || req.cookies.tenantSlug;
    
    // Check if subdomain is being used but no tenant found
    const isSubdomainAccess = origin && origin.match(/^https?:\/\/[^.]+\.localhost:300[0-9]$/);
    
    if (tenantSlugFromUrl || isSubdomainAccess) {
      // User is explicitly trying to access a specific tenant that doesn't exist
      res.status(400);
      throw new Error('Tenant not found. Please ensure you are accessing the correct URL.');
    }
    
    // If no explicit tenant is requested, allow main app access
    if (isDevelopment) {
      console.log('[TENANT] No tenant found for path:', req.path);
      console.log('[TENANT] Development mode: allowing main app access without tenant');
      // Don't set tenant - this indicates main app access
      req.tenant = null;
      req.tenantId = null;
      return next();
    }
  }
  
  // Check if tenant is in maintenance mode
  if (tenant && tenant.settings.maintenanceMode && !req.user?.isAdmin) {
    res.status(503);
    throw new Error(tenant.settings.maintenanceMessage);
  }
  
  next();
});

// Ensure user belongs to the tenant
export const ensureTenantAccess = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next();
  }
  
  // Super admins can access any tenant
  if (req.user.isSuperAdmin) {
    return next();
  }
  
  // Skip tenant check for super admin routes
  if (req.isSuperAdminRoute) {
    res.status(403);
    throw new Error('Access denied. Super admin privileges required.');
  }
  
  // For regular users, ensure they belong to the current tenant
  if (req.tenantId && !req.user.canAccessTenant(req.tenantId)) {
    res.status(403);
    throw new Error('Access denied. You do not have access to this tenant.');
  }
  
  next();
});

// Middleware to check tenant limits
export const checkTenantLimits = (resource) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.tenant) {
      return next();
    }
    
    const tenant = req.tenant;
    
    switch (resource) {
      case 'users':
        if (!tenant.canAddUser()) {
          res.status(403);
          throw new Error('User limit reached for this tenant. Please upgrade your plan.');
        }
        break;
        
      case 'collections':
        if (tenant.limits.maxCollections !== -1 && 
            tenant.statistics.collectionCount >= tenant.limits.maxCollections) {
          res.status(403);
          throw new Error('Collection limit reached for this tenant. Please upgrade your plan.');
        }
        break;
        
      case 'products':
        if (tenant.limits.maxProducts !== -1 && 
            tenant.statistics.productCount >= tenant.limits.maxProducts) {
          res.status(403);
          throw new Error('Product limit reached for this tenant. Please upgrade your plan.');
        }
        break;
        
      case 'ai':
        if (!tenant.limits.aiAnalysisEnabled) {
          res.status(403);
          throw new Error('AI analysis is not enabled for this tenant.');
        }
        if (tenant.statistics.aiRequestsThisMonth >= tenant.limits.maxAIRequestsPerMonth) {
          res.status(403);
          throw new Error('AI request limit reached for this month. Please try again next month or upgrade your plan.');
        }
        break;
        
      case 'storage':
        // This would need actual storage calculation
        const storageUsedGB = tenant.statistics.totalStorageUsedMB / 1024;
        if (storageUsedGB >= tenant.limits.maxStorageGB) {
          res.status(403);
          throw new Error('Storage limit reached for this tenant. Please upgrade your plan.');
        }
        break;
    }
    
    next();
  });
};

// Middleware to set tenant context for database queries
export const setTenantContext = asyncHandler(async (req, res, next) => {
  // Add helper method to filter queries by tenant
  req.addTenantFilter = (query) => {
    if (req.tenantId) {
      query.tenantId = req.tenantId;
    }
    return query;
  };
  
  // Add helper method to add tenant to new documents
  req.addTenantToDoc = (doc) => {
    if (req.tenantId) {
      doc.tenantId = req.tenantId;
    }
    return doc;
  };
  
  next();
});

export default {
  identifyTenant,
  ensureTenantAccess,
  checkTenantLimits,
  setTenantContext
}; 