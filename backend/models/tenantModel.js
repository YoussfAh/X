import mongoose from 'mongoose';

const tenantBrandingSchema = mongoose.Schema({
  appName: {
    type: String,
    default: 'Pro-G Fitness'
  },
  tagline: {
    type: String,
    default: 'Your Fitness Journey Starts Here'
  },
  primaryColor: {
    type: String,
    default: '#4F46E5'
  },
  secondaryColor: {
    type: String,
    default: '#7C3AED'
  },
  logo: {
    type: String,
    default: '/images/logo.png'
  },
  favicon: {
    type: String,
    default: '/favicon.ico'
  },
  // PWA specific branding
  pwaName: {
    type: String,
    default: 'Pro-G Fitness'
  },
  pwaShortName: {
    type: String,
    default: 'Pro-G'
  },
  pwaDescription: {
    type: String,
    default: 'Your personalized fitness companion'
  },
  pwaIcon192: {
    type: String,
    default: '/icons/icon-192x192.png'
  },
  pwaIcon512: {
    type: String,
    default: '/icons/icon-512x512.png'
  },
  pwaThemeColor: {
    type: String,
    default: '#4F46E5'
  },
  pwaBackgroundColor: {
    type: String,
    default: '#ffffff'
  },
  // Additional branding
  emailLogo: {
    type: String,
    default: null
  },
  customCSS: {
    type: String,
    default: ''
  }
}, { _id: false });

const tenantLimitsSchema = mongoose.Schema({
  maxUsers: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  maxStorageGB: {
    type: Number,
    default: 10
  },
  maxCollections: {
    type: Number,
    default: -1
  },
  maxProducts: {
    type: Number,
    default: -1
  },
  aiAnalysisEnabled: {
    type: Boolean,
    default: true
  },
  maxAIRequestsPerMonth: {
    type: Number,
    default: 1000
  },
  customDomainAllowed: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const tenantStatisticsSchema = mongoose.Schema({
  userCount: {
    type: Number,
    default: 0
  },
  activeUserCount: {
    type: Number,
    default: 0
  },
  collectionCount: {
    type: Number,
    default: 0
  },
  productCount: {
    type: Number,
    default: 0
  },
  totalStorageUsedMB: {
    type: Number,
    default: 0
  },
  aiRequestsThisMonth: {
    type: Number,
    default: 0
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const tenantSchema = mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    default: ''
  },
  
  // Domain Configuration
  subdomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens']
  },
  customDomain: {
    type: String,
    default: null,
    unique: true,
    sparse: true
  },
  
  // Branding
  branding: {
    type: tenantBrandingSchema,
    default: () => ({})
  },
  
  // Limits
  limits: {
    type: tenantLimitsSchema,
    default: () => ({})
  },
  
  // Statistics
  statistics: {
    type: tenantStatisticsSchema,
    default: () => ({})
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'trial', 'expired'],
    default: 'active'
  },
  
  // Billing
  plan: {
    type: String,
    enum: ['free', 'starter', 'professional', 'enterprise', 'custom'],
    default: 'free'
  },
  trialEndsAt: {
    type: Date,
    default: null
  },
  billingEmail: {
    type: String,
    default: null
  },
  
  // Owner/Admin
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Settings
  settings: {
    requireAccessCode: {
      type: Boolean,
      default: false
    },
    defaultAccessCode: {
      type: String,
      default: null
    },
    allowRegistration: {
      type: Boolean,
      default: true
    },
    requireEmailVerification: {
      type: Boolean,
      default: false
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: 'We are currently performing maintenance. Please check back soon.'
    }
  },
  
  // Contact Information
  contactEmail: {
    type: String,
    default: null
  },
  contactPhone: {
    type: String,
    default: null
  },
  
  // AI Configuration (if tenant has custom AI keys)
  aiConfig: {
    useOwnKeys: {
      type: Boolean,
      default: false
    },
    openaiApiKey: {
      type: String,
      default: null,
      select: false // Don't include in queries by default
    },
    geminiApiKey: {
      type: String,
      default: null,
      select: false
    }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for performance
tenantSchema.index({ slug: 1 });
tenantSchema.index({ subdomain: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ ownerId: 1 });

// Pre-save hook to generate slug from name if not provided
tenantSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  if (!this.subdomain && this.slug) {
    this.subdomain = this.slug;
  }
  
  next();
});

// Methods
tenantSchema.methods.isActive = function() {
  return this.status === 'active' || 
    (this.status === 'trial' && (!this.trialEndsAt || this.trialEndsAt > new Date()));
};

tenantSchema.methods.canAddUser = function() {
  if (this.limits.maxUsers === -1) return true;
  return this.statistics.userCount < this.limits.maxUsers;
};

tenantSchema.methods.getFullDomain = function(baseUrl) {
  if (this.customDomain) {
    return `https://${this.customDomain}`;
  }
  
  // For development
  if (baseUrl.includes('localhost')) {
    return `http://${this.subdomain}.localhost:3000`;
  }
  
  // For Vercel or production
  return `https://${this.subdomain}.${baseUrl.replace(/^https?:\/\//, '')}`;
};

// Static methods
tenantSchema.statics.findByDomain = async function(domain) {
  // Check if it's a custom domain
  let tenant = await this.findOne({ customDomain: domain, status: { $ne: 'suspended' } });
  if (tenant) return tenant;
  
  // Extract subdomain
  const parts = domain.split('.');
  if (parts.length > 2) {
    const subdomain = parts[0];
    tenant = await this.findOne({ subdomain, status: { $ne: 'suspended' } });
  }
  
  return tenant;
};

tenantSchema.statics.incrementStatistic = async function(tenantId, field, amount = 1) {
  const updateField = `statistics.${field}`;
  return await this.findByIdAndUpdate(
    tenantId,
    { 
      $inc: { [updateField]: amount },
      'statistics.lastActivityAt': new Date()
    },
    { new: true }
  );
};

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant; 