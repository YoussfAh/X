import asyncHandler from '../middleware/asyncHandler.js';
import Tenant from '../models/tenantModel.js';
import User from '../models/userModel.js';
import Collection from '../models/collectionModel.js';
import Product from '../models/productModel.js';
import generateToken from '../utils/generateToken.js';

// @desc    Create new tenant
// @route   POST /api/super-admin/tenants
// @access  Super Admin
export const createTenant = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    subdomain,
    ownerEmail,
    ownerName,
    ownerPassword,
    plan,
    contactEmail,
    contactPhone,
    notes
  } = req.body;

  // Validate subdomain
  if (!subdomain || !subdomain.match(/^[a-z0-9-]+$/)) {
    res.status(400);
    throw new Error('Invalid subdomain. Use only lowercase letters, numbers, and hyphens.');
  }

  // Check if subdomain is already taken
  const existingTenant = await Tenant.findOne({ subdomain });
  if (existingTenant) {
    res.status(400);
    throw new Error('Subdomain already taken');
  }

  // Create tenant owner user
  const ownerUser = await User.create({
    name: ownerName,
    email: ownerEmail,
    password: ownerPassword,
    isAdmin: true,
    tenantId: null // Will be updated after tenant creation
  });

  // Create tenant
  const tenant = await Tenant.create({
    name,
    description,
    subdomain,
    slug: subdomain,
    ownerId: ownerUser._id,
    plan: plan || 'free',
    contactEmail: contactEmail || ownerEmail,
    contactPhone,
    notes,
    createdBy: req.user._id,
    status: 'active'
  });

  // Update owner user with tenant ID
  ownerUser.tenantId = tenant._id;
  await ownerUser.save();

  // Increment user count
  await Tenant.incrementStatistic(tenant._id, 'userCount', 1);

  // Get the full domain URL
  const baseUrl = process.env.FRONTEND_URL || `http://localhost:3000`;
  const accessUrl = tenant.getFullDomain(baseUrl);

  res.status(201).json({
    _id: tenant._id,
    name: tenant.name,
    subdomain: tenant.subdomain,
    status: tenant.status,
    plan: tenant.plan,
    owner: {
      _id: ownerUser._id,
      name: ownerUser.name,
      email: ownerUser.email
    },
    accessUrl,
    createdAt: tenant.createdAt
  });
});

// @desc    Get all tenants
// @route   GET /api/super-admin/tenants
// @access  Super Admin
export const getTenants = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = req.query.search || '';
  const status = req.query.status || '';
  const plan = req.query.plan || '';

  const query = {};

  // Add search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { subdomain: { $regex: search, $options: 'i' } },
      { contactEmail: { $regex: search, $options: 'i' } }
    ];
  }

  // Add status filter
  if (status && status !== 'all') {
    query.status = status;
  }

  // Add plan filter
  if (plan && plan !== 'all') {
    query.plan = plan;
  }

  const count = await Tenant.countDocuments(query);

  const tenants = await Tenant.find(query)
    .populate('ownerId', 'name email')
    .limit(limit)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  // Add access URLs to each tenant
  const baseUrl = process.env.FRONTEND_URL || `http://localhost:3000`;
  const tenantsWithUrls = tenants.map(tenant => ({
    ...tenant.toObject(),
    accessUrl: tenant.getFullDomain(baseUrl)
  }));

  res.json({
    tenants: tenantsWithUrls,
    page,
    pages: Math.ceil(count / limit),
    total: count
  });
});

// @desc    Get tenant by ID
// @route   GET /api/super-admin/tenants/:id
// @access  Super Admin
export const getTenantById = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id)
    .populate('ownerId', 'name email')
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email');

  if (!tenant) {
    res.status(404);
    throw new Error('Tenant not found');
  }

  const baseUrl = process.env.FRONTEND_URL || `http://localhost:3000`;
  
  res.json({
    ...tenant.toObject(),
    accessUrl: tenant.getFullDomain(baseUrl)
  });
});

// @desc    Update tenant
// @route   PUT /api/super-admin/tenants/:id
// @access  Super Admin
export const updateTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error('Tenant not found');
  }

  const {
    name,
    description,
    contactEmail,
    contactPhone,
    notes,
    billingEmail
  } = req.body;

  // Update fields
  if (name) tenant.name = name;
  if (description !== undefined) tenant.description = description;
  if (contactEmail) tenant.contactEmail = contactEmail;
  if (contactPhone !== undefined) tenant.contactPhone = contactPhone;
  if (notes !== undefined) tenant.notes = notes;
  if (billingEmail !== undefined) tenant.billingEmail = billingEmail;
  
  tenant.lastModifiedBy = req.user._id;

  const updatedTenant = await tenant.save();

  res.json(updatedTenant);
});

// @desc    Delete tenant (soft delete)
// @route   DELETE /api/super-admin/tenants/:id
// @access  Super Admin
export const deleteTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error('Tenant not found');
  }

  // Soft delete by setting status to suspended
  tenant.status = 'suspended';
  tenant.lastModifiedBy = req.user._id;
  await tenant.save();

  res.json({ message: 'Tenant suspended successfully' });
});

// @desc    Get tenant statistics
// @route   GET /api/super-admin/tenants/:id/statistics
// @access  Super Admin
export const getTenantStatistics = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error('Tenant not found');
  }

  // Get real-time statistics
  const userCount = await User.countDocuments({ tenantId: tenant._id });
  const activeUserCount = await User.countDocuments({ 
    tenantId: tenant._id,
    lastLoginAttempt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Active in last 30 days
  });
  const collectionCount = await Collection.countDocuments({ tenantId: tenant._id });
  const productCount = await Product.countDocuments({ tenantId: tenant._id });

  // Update tenant statistics
  tenant.statistics.userCount = userCount;
  tenant.statistics.activeUserCount = activeUserCount;
  tenant.statistics.collectionCount = collectionCount;
  tenant.statistics.productCount = productCount;
  await tenant.save();

  res.json({
    statistics: tenant.statistics,
    limits: tenant.limits,
    usage: {
      users: `${userCount}${tenant.limits.maxUsers !== -1 ? `/${tenant.limits.maxUsers}` : ''}`,
      collections: `${collectionCount}${tenant.limits.maxCollections !== -1 ? `/${tenant.limits.maxCollections}` : ''}`,
      products: `${productCount}${tenant.limits.maxProducts !== -1 ? `/${tenant.limits.maxProducts}` : ''}`,
      storage: `${(tenant.statistics.totalStorageUsedMB / 1024).toFixed(2)}/${tenant.limits.maxStorageGB} GB`,
      aiRequests: `${tenant.statistics.aiRequestsThisMonth}/${tenant.limits.maxAIRequestsPerMonth}`
    }
  });
});

// @desc    Update tenant branding
// @route   PUT /api/super-admin/tenants/:id/branding
// @access  Super Admin
export const updateTenantBranding = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error('Tenant not found');
  }

  // Update branding fields
  Object.keys(req.body).forEach(key => {
    if (tenant.branding[key] !== undefined) {
      tenant.branding[key] = req.body[key];
    }
  });

  tenant.lastModifiedBy = req.user._id;
  const updatedTenant = await tenant.save();

  res.json({
    branding: updatedTenant.branding
  });
});

// @desc    Update tenant limits
// @route   PUT /api/super-admin/tenants/:id/limits
// @access  Super Admin
export const updateTenantLimits = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error('Tenant not found');
  }

  // Update limits
  Object.keys(req.body).forEach(key => {
    if (tenant.limits[key] !== undefined) {
      tenant.limits[key] = req.body[key];
    }
  });

  tenant.lastModifiedBy = req.user._id;
  const updatedTenant = await tenant.save();

  res.json({
    limits: updatedTenant.limits
  });
});

// @desc    Toggle tenant status
// @route   PUT /api/super-admin/tenants/:id/status
// @access  Super Admin
export const toggleTenantStatus = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error('Tenant not found');
  }

  const { status } = req.body;

  if (!['active', 'suspended', 'trial', 'expired'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  tenant.status = status;
  tenant.lastModifiedBy = req.user._id;
  
  if (status === 'trial' && !tenant.trialEndsAt) {
    // Set trial end date to 14 days from now
    tenant.trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  }

  const updatedTenant = await tenant.save();

  res.json({
    status: updatedTenant.status,
    trialEndsAt: updatedTenant.trialEndsAt
  });
});

// @desc    Get tenant users
// @route   GET /api/super-admin/tenants/:id/users
// @access  Super Admin
export const getTenantUsers = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error('Tenant not found');
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const users = await User.find({ tenantId: tenant._id })
    .select('-password')
    .limit(limit)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const count = await User.countDocuments({ tenantId: tenant._id });

  res.json({
    users,
    page,
    pages: Math.ceil(count / limit),
    total: count
  });
});

// @desc    Generate tenant access URL
// @route   GET /api/super-admin/tenants/:id/access-url
// @access  Super Admin
export const generateTenantAccessUrl = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error('Tenant not found');
  }

  const baseUrl = process.env.FRONTEND_URL || `http://localhost:3000`;
  const accessUrl = tenant.getFullDomain(baseUrl);

  // For development, also provide alternative access methods
  const developmentUrls = {
    primary: accessUrl,
    queryParam: `${baseUrl}?tenant=${tenant.slug}`,
    cookieBased: `${baseUrl}/set-tenant/${tenant.slug}`
  };

  res.json({
    accessUrl,
    subdomain: tenant.subdomain,
    customDomain: tenant.customDomain,
    developmentUrls: process.env.NODE_ENV === 'development' ? developmentUrls : undefined
  });
});

// @desc    Reset tenant data
// @route   POST /api/super-admin/tenants/:id/reset
// @access  Super Admin
export const resetTenantData = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error('Tenant not found');
  }

  const { keepUsers, keepSettings } = req.body;

  // Delete all tenant data except users if specified
  if (!keepUsers) {
    await User.deleteMany({ 
      tenantId: tenant._id, 
      _id: { $ne: tenant.ownerId } // Keep owner
    });
  }

  // Delete all other tenant data
  await Collection.deleteMany({ tenantId: tenant._id });
  await Product.deleteMany({ tenantId: tenant._id });
  // Add other model deletions as needed

  // Reset statistics
  tenant.statistics = {
    userCount: keepUsers ? await User.countDocuments({ tenantId: tenant._id }) : 1,
    activeUserCount: keepUsers ? await User.countDocuments({ 
      tenantId: tenant._id,
      lastLoginAttempt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }) : 1,
    collectionCount: 0,
    productCount: 0,
    totalStorageUsedMB: 0,
    aiRequestsThisMonth: 0,
    lastActivityAt: new Date()
  };

  if (!keepSettings) {
    // Reset settings to defaults
    tenant.settings = {
      requireAccessCode: false,
      defaultAccessCode: null,
      allowRegistration: true,
      requireEmailVerification: false,
      maintenanceMode: false,
      maintenanceMessage: 'We are currently performing maintenance. Please check back soon.'
    };
  }

  tenant.lastModifiedBy = req.user._id;
  await tenant.save();

  res.json({
    message: 'Tenant data reset successfully',
    tenant: {
      _id: tenant._id,
      name: tenant.name,
      statistics: tenant.statistics
    }
  });
});

// @desc    Export tenant data
// @route   GET /api/super-admin/tenants/:id/export
// @access  Super Admin
export const exportTenantData = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id)
    .populate('ownerId', 'name email')
    .populate('createdBy', 'name email');

  if (!tenant) {
    res.status(404);
    throw new Error('Tenant not found');
  }

  // Gather all tenant data
  const users = await User.find({ tenantId: tenant._id }).select('-password');
  const collections = await Collection.find({ tenantId: tenant._id });
  const products = await Product.find({ tenantId: tenant._id });

  const exportData = {
    tenant: tenant.toObject(),
    statistics: {
      userCount: users.length,
      collectionCount: collections.length,
      productCount: products.length
    },
    users: users.map(user => ({
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    })),
    collections: collections.length,
    products: products.length,
    exportedAt: new Date(),
    exportedBy: req.user.email
  };

  res.json(exportData);
});

// @desc    Switch to tenant (super admin accesses tenant as admin)
// @route   POST /api/super-admin/tenants/:id/switch
// @access  Super Admin
export const switchToTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error('Tenant not found');
  }

  if (tenant.status !== 'active') {
    res.status(400);
    throw new Error('Cannot switch to inactive tenant');
  }

  // Create a temporary admin session for the super admin in this tenant
  const tempAdminUser = {
    _id: req.user._id,
    name: `${req.user.name} (Super Admin)`,
    email: req.user.email,
    isAdmin: true,
    isSuperAdmin: true,
    tenantId: tenant._id
  };

  // Generate token with tenant context
  generateToken(res, tempAdminUser._id);

  const baseUrl = process.env.FRONTEND_URL || `http://localhost:3000`;
  const accessUrl = tenant.getFullDomain(baseUrl);

  res.json({
    message: 'Switched to tenant successfully',
    tenant: {
      _id: tenant._id,
      name: tenant.name,
      subdomain: tenant.subdomain
    },
    accessUrl,
    user: {
      _id: tempAdminUser._id,
      name: tempAdminUser.name,
      email: tempAdminUser.email,
      isAdmin: tempAdminUser.isAdmin,
      isSuperAdmin: tempAdminUser.isSuperAdmin
    }
  });
});

export default {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  getTenantStatistics,
  updateTenantBranding,
  updateTenantLimits,
  toggleTenantStatus,
  getTenantUsers,
  generateTenantAccessUrl,
  resetTenantData,
  exportTenantData,
  switchToTenant
}; 