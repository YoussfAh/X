import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tenant from '../models/tenantModel.js';
import User from '../models/userModel.js';
import connectDB from '../config/db.js';

dotenv.config();

const createDefaultTenant = async () => {
  try {
    await connectDB();
    
    // Check if main tenant already exists
    const existingTenant = await Tenant.findOne({ slug: 'main' });
    
    if (existingTenant) {
      console.log('❌ Main tenant already exists');
      console.log('Tenant ID:', existingTenant._id);
      console.log('Access URL:', existingTenant.getFullDomain(process.env.FRONTEND_URL || 'http://localhost:3000'));
      process.exit(0);
    }
    
    // Find super admin to set as creator
    const superAdmin = await User.findOne({ isSuperAdmin: true });
    
    if (!superAdmin) {
      console.log('❌ No super admin found. Please create a super admin first.');
      console.log('Run: npm run create-super-admin');
      process.exit(1);
    }
    
    // Create admin user for the main tenant
    const adminUser = await User.create({
      name: 'Main Admin',
      email: 'admin@main.pro-g.com',
      password: 'Admin123!@#',
      isAdmin: true,
      tenantId: null // Will be updated after tenant creation
    });
    
    // Create main tenant
    const mainTenant = await Tenant.create({
      name: 'Main Pro-G',
      description: 'The main Pro-G fitness application',
      slug: 'main',
      subdomain: 'main',
      ownerId: adminUser._id,
      createdBy: superAdmin._id,
      plan: 'enterprise',
      status: 'active',
      branding: {
        appName: 'Pro-G Fitness',
        tagline: 'Your Fitness Journey Starts Here',
        primaryColor: '#4F46E5',
        secondaryColor: '#7C3AED',
        pwaName: 'Pro-G Fitness',
        pwaShortName: 'Pro-G'
      },
      limits: {
        maxUsers: -1, // Unlimited
        maxStorageGB: 100,
        maxCollections: -1,
        maxProducts: -1,
        aiAnalysisEnabled: true,
        maxAIRequestsPerMonth: 10000
      },
      settings: {
        allowRegistration: true,
        requireEmailVerification: false
      }
    });
    
    // Update admin user with tenant ID
    adminUser.tenantId = mainTenant._id;
    await adminUser.save();
    
    // Update tenant statistics
    await Tenant.incrementStatistic(mainTenant._id, 'userCount', 1);
    
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const accessUrl = mainTenant.getFullDomain(baseUrl);
    
    console.log('✅ Main tenant created successfully!');
    console.log('-----------------------------------');
    console.log('Tenant Details:');
    console.log('- Name:', mainTenant.name);
    console.log('- Subdomain:', mainTenant.subdomain);
    console.log('- Access URL:', accessUrl);
    console.log('- Development URL: http://localhost:3000?tenant=main');
    console.log('\nAdmin Credentials:');
    console.log('- Email: admin@main.pro-g.com');
    console.log('- Password: Admin123!@#');
    console.log('-----------------------------------');
    console.log('🔒 IMPORTANT: Please change the admin password immediately!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating default tenant:', error);
    process.exit(1);
  }
};

createDefaultTenant(); 