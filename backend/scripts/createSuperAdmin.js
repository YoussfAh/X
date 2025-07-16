import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';
import connectDB from '../config/db.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await connectDB();
    
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ isSuperAdmin: true });
    
    if (existingSuperAdmin) {
      console.log('❌ Super admin already exists:', existingSuperAdmin.email);
      console.log('To create a new super admin, first remove the existing one.');
      process.exit(0);
    }
    
    // Get credentials from command line arguments or environment variables
    const email = process.argv[2] || process.env.SUPER_ADMIN_EMAIL || 'superadmin@pro-g.com';
    const password = process.argv[3] || process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!@#';
    const name = process.argv[4] || 'Super Administrator';
    
    // Create super admin user
    const superAdmin = await User.create({
      name,
      email,
      password,
      isAdmin: true,
      isSuperAdmin: true,
      // Super admin doesn't belong to any specific tenant
      tenantId: undefined
    });
    
    console.log('✅ Super admin created successfully!');
    console.log('-----------------------------------');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('-----------------------------------');
    console.log('🔒 IMPORTANT: Please change the password immediately after first login!');
    console.log('🌐 Access the super admin panel at: /super-admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
};

// Usage instructions
if (process.argv.length < 3) {
  console.log('Usage: node createSuperAdmin.js <email> [password] [name]');
  console.log('Example: node createSuperAdmin.js admin@company.com MySecurePass123 "John Doe"');
  console.log('\nOr set environment variables:');
  console.log('SUPER_ADMIN_EMAIL=admin@company.com');
  console.log('SUPER_ADMIN_PASSWORD=MySecurePass123');
}

createSuperAdmin(); 