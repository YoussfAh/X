import mongoose from 'mongoose';

// Create a test tenant
const createTestTenant = async () => {
  try {
    // Direct MongoDB connection
    const MONGO_URI = "mongodb+srv://yousseefah:yousseefah@cluster0.a7kzq.mongodb.net/dbg?retryWrites=true&w=majority";
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      bufferCommands: false,
    });
    console.log('MongoDB connected successfully');

    // Import tenant model after connection
    const { default: Tenant } = await import('../models/tenantModel.js');
    
    // Check if tenant already exists
    const existingTenant = await Tenant.findOne({ slug: 'main' });
    if (existingTenant) {
      console.log('✅ Tenant "main" already exists');
      console.log('Tenant ID:', existingTenant._id);
      console.log('Tenant Status:', existingTenant.status);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create new tenant
    const tenant = new Tenant({
      name: 'Main Tenant',
      slug: 'main',
      plan: 'basic',
      status: 'active',
      domains: [],
      branding: {
        primaryColor: '#7C3AED',
        secondaryColor: '#A78BFA',
        logoUrl: '',
        faviconUrl: '',
        appName: 'Pro-G Main',
        metaTitle: 'Pro-G Fitness - Main Tenant',
        metaDescription: 'Professional fitness platform for main tenant',
        customCSS: ''
      },
      pwaSettings: {
        enabled: true,
        appName: 'Pro-G Main',
        shortName: 'Pro-G',
        description: 'Professional fitness platform',
        themeColor: '#7C3AED',
        backgroundColor: '#ffffff',
        startUrl: '/',
        display: 'standalone',
        orientation: 'portrait'
      },
      limits: {
        maxUsers: 100,
        maxCollections: 50,
        maxProducts: 100,
        maxStorage: 1073741824, // 1GB
        maxAIRequests: 1000
      },
      settings: {
        allowRegistration: true,
        requireEmailVerification: false,
        maintenanceMode: false,
        maintenanceMessage: 'System under maintenance'
      }
    });

    await tenant.save();
    
    console.log('✅ Test tenant "main" created successfully!');
    console.log('Tenant ID:', tenant._id);
    console.log('You can now access it at:');
    console.log('- Query parameter: http://localhost:3000?tenant=main');
    console.log('- Subdomain: http://main.localhost:3000');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createTestTenant(); 