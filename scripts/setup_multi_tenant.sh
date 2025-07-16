#!/bin/bash

# Pro-G Multi-Tenant Setup Script
# Run this script to begin multi-tenant implementation

echo "🚀 Starting Pro-G Multi-Tenant Implementation..."

# 1. Create tenant migration scripts
echo "📁 Creating migration scripts..."
mkdir -p scripts/migrations
mkdir -p scripts/setup

# 2. Database migration script
cat > scripts/migrations/001_add_tenant_support.js << 'EOF'
// Migration: Add tenant support to existing collections
import mongoose from 'mongoose';
import { Tenant } from '../models/Tenant.js';

export async function up() {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Create default tenant for existing data
      const defaultTenant = new Tenant({
        name: 'Default Tenant',
        subdomain: 'app',
        owner: null, // Will be set later
        branding: {
          primaryColor: '#007bff',
          secondaryColor: '#6c757d'
        }
      });

      await defaultTenant.save({ session });

      // Add tenantId to all existing collections
      const collections = [
        'users', 'products', 'orders', 'collections',
        'workouts', 'workoutsessions', 'diets', 'messages'
      ];

      for (const collectionName of collections) {
        await mongoose.connection.db.collection(collectionName).updateMany(
          { tenantId: { $exists: false } },
          { $set: { tenantId: defaultTenant._id } },
          { session }
        );
      }

      console.log(`✅ Migration completed. Default tenant ID: ${defaultTenant._id}`);
    });
  } finally {
    await session.endSession();
  }
}

export async function down() {
  // Remove tenantId from all collections
  const collections = [
    'users', 'products', 'orders', 'collections',
    'workouts', 'workoutsessions', 'diets', 'messages'
  ];

  for (const collectionName of collections) {
    await mongoose.connection.db.collection(collectionName).updateMany(
      {},
      { $unset: { tenantId: "" } }
    );
  }

  // Remove tenants collection
  await mongoose.connection.db.collection('tenants').drop();

  console.log('✅ Migration rolled back');
}
EOF

# 3. Tenant setup script for new clients
cat > scripts/setup/create_tenant.js << 'EOF'
// Script to create a new tenant for a coaching business
import mongoose from 'mongoose';
import { Tenant } from '../models/Tenant.js';
import { User } from '../models/User.js';

export async function createTenant({
  name,
  subdomain,
  ownerEmail,
  ownerName,
  plan = 'starter',
  branding = {}
}) {
  try {
    // Check if subdomain is available
    const existingTenant = await Tenant.findOne({ subdomain });
    if (existingTenant) {
      throw new Error(`Subdomain ${subdomain} already exists`);
    }

    // Create owner user first
    const owner = new User({
      name: ownerName,
      email: ownerEmail,
      role: 'admin',
      isEmailVerified: true
    });

    // Create tenant
    const tenant = new Tenant({
      name,
      subdomain,
      owner: owner._id,
      branding: {
        primaryColor: branding.primaryColor || '#007bff',
        secondaryColor: branding.secondaryColor || '#6c757d',
        logo: branding.logo || null,
        ...branding
      },
      subscription: {
        plan,
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial
      }
    });

    // Set tenant for owner
    owner.tenantId = tenant._id;

    await tenant.save();
    await owner.save();

    console.log(`✅ Tenant created successfully:`);
    console.log(`   Name: ${name}`);
    console.log(`   Subdomain: ${subdomain}.pro-g.com`);
    console.log(`   Owner: ${ownerEmail}`);
    console.log(`   Plan: ${plan}`);

    return { tenant, owner };
  } catch (error) {
    console.error('❌ Failed to create tenant:', error.message);
    throw error;
  }
}

// CLI usage
if (process.argv[2]) {
  const config = JSON.parse(process.argv[2]);
  createTenant(config);
}
EOF

# 4. Environment setup for multi-tenant
echo "⚙️ Creating environment configurations..."

cat > .env.multi-tenant << 'EOF'
# Multi-Tenant Configuration
MULTI_TENANT_ENABLED=true
DEFAULT_DOMAIN=pro-g.com
ALLOW_CUSTOM_DOMAINS=true

# Subdomain Configuration
SUBDOMAIN_WHITELIST=www,api,admin,app
TENANT_CACHE_TTL=300

# Feature Flags
ENABLE_TENANT_REGISTRATION=true
ENABLE_CUSTOM_BRANDING=true
ENABLE_WHITE_LABEL=true

# Billing Configuration
STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
WEBHOOK_SECRET=your_webhook_secret
EOF

# 5. Docker configuration for scaling
cat > docker-compose.multi-tenant.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - MULTI_TENANT_ENABLED=true
      - MONGODB_URI=${MONGODB_URI}
    ports:
      - "5002:5002"
    depends_on:
      - mongodb
      - redis

  frontend:
    build: ./frontend
    environment:
      - REACT_APP_API_URL=https://api.pro-g.com
      - REACT_APP_MULTI_TENANT=true
    ports:
      - "3000:80"

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - frontend
      - backend

volumes:
  mongodb_data:
EOF

# 6. Nginx configuration for subdomains
mkdir -p nginx
cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5002;
    }

    upstream frontend {
        server frontend:80;
    }

    # API subdomain
    server {
        listen 80;
        server_name api.pro-g.com;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }

    # Wildcard subdomain for tenants
    server {
        listen 80;
        server_name *.pro-g.com;

        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }

    # Main domain
    server {
        listen 80;
        server_name pro-g.com www.pro-g.com;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
EOF

echo "✅ Multi-tenant setup scripts created!"
echo ""
echo "📋 Next Steps:"
echo "1. Review the implementation guide: docs/MULTI_TENANT_IMPLEMENTATION_GUIDE.md"
echo "2. Run database migration: node scripts/migrations/001_add_tenant_support.js"
echo "3. Create your first tenant: node scripts/setup/create_tenant.js '{\"name\":\"Coach Business\",\"subdomain\":\"coach1\",\"ownerEmail\":\"coach@example.com\",\"ownerName\":\"Coach Name\"}'"
echo "4. Update your backend models to include tenant middleware"
echo "5. Deploy using: docker-compose -f docker-compose.multi-tenant.yml up"
echo ""
echo "💰 Revenue Potential:"
echo "   - 10 coaches × $299/month = $2,990/month"
echo "   - Scale to 50 coaches = $15,000+/month"
echo "   - Much lower costs than 10 separate deployments"
