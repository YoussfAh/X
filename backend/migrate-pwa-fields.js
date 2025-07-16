// Migration script to add missing PWA fields to existing database document
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import SystemSettings from './models/systemSettingsModel.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const migratePWAFields = async () => {
  await connectDB();
  
  console.log('=== MIGRATING PWA FIELDS ===');
  
  const generalSettings = await SystemSettings.findOne({ key: 'general' });
  
  if (generalSettings) {
    console.log('✅ Found general settings document');
    
    // Check if PWA fields are missing
    const currentSettings = generalSettings.appSettings;
    const missingFields = [];
    
    if (currentSettings.pwaIcon === undefined) missingFields.push('pwaIcon');
    if (currentSettings.pwaIconWithoutBackground === undefined) missingFields.push('pwaIconWithoutBackground');
    if (currentSettings.pwaSplashScreenImage === undefined) missingFields.push('pwaSplashScreenImage');
    
    if (missingFields.length > 0) {
      console.log(`🔧 Adding missing fields: ${missingFields.join(', ')}`);
      
      // Add missing PWA fields directly to avoid corruption
      if (!generalSettings.appSettings.pwaIcon) {
        generalSettings.appSettings.pwaIcon = '';
      }
      if (generalSettings.appSettings.pwaIconWithoutBackground === undefined) {
        generalSettings.appSettings.pwaIconWithoutBackground = false;
      }
      if (!generalSettings.appSettings.pwaSplashScreenImage) {
        generalSettings.appSettings.pwaSplashScreenImage = '';
      }
      
      // Mark the appSettings as modified
      generalSettings.markModified('appSettings');
      
      // Save the updated document
      await generalSettings.save();
      
      console.log('✅ Migration completed successfully!');
      console.log('New appSettings:', JSON.stringify(generalSettings.appSettings, null, 2));
    } else {
      console.log('✅ All PWA fields already exist');
    }
  } else {
    console.log('❌ No general settings found - creating new document with all fields');
    
    const newSettings = new SystemSettings({
      key: 'general',
      appSettings: {
        siteName: 'GRINDX',
        siteDescription: 'We offer the best exercises for optimal fitness',
        siteKeywords: 'fitness, exercises, health, workout, gym, nutrition',
        headerImage: '',
        faviconImage: '',
        faviconSvgCode: '',
        preserveIconRatio: true,
        pwaIconWithoutBackground: false,
        pwaIcon: '',
        pwaShortName: 'GRINDX',
        pwaThemeColor: '#4F46E5',
        pwaBackgroundColor: '#ffffff',
        pwaSplashScreenImage: '',
        ogImage: '',
        colorScheme: {
          primaryColor: '#4F46E5',
          secondaryColor: '#7C3AED'
        }
      }
    });
    
    await newSettings.save();
    console.log('✅ Created new settings document with all PWA fields');
  }
  
  // Verify the migration
  console.log('\n=== VERIFICATION ===');
  const verifySettings = await SystemSettings.findOne({ key: 'general' });
  const hasAllFields = !!(
    verifySettings.appSettings.pwaIcon !== undefined &&
    verifySettings.appSettings.pwaIconWithoutBackground !== undefined &&
    verifySettings.appSettings.pwaSplashScreenImage !== undefined
  );
  
  console.log('✅ All PWA fields present:', hasAllFields);
  console.log('PWA Icon:', verifySettings.appSettings.pwaIcon);
  console.log('PWA Icon Without Background:', verifySettings.appSettings.pwaIconWithoutBackground);
  console.log('PWA Splash Screen Image:', verifySettings.appSettings.pwaSplashScreenImage);
  
  process.exit(0);
};

migratePWAFields();
