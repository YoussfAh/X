// Database debugging script to check current system settings
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

const checkSystemSettings = async () => {
  await connectDB();
  
  console.log('=== CHECKING SYSTEM SETTINGS DATABASE ===');
  
  const generalSettings = await SystemSettings.findOne({ key: 'general' });
  
  if (generalSettings) {
    console.log('✅ Found general settings:');
    console.log('Full document:', JSON.stringify(generalSettings, null, 2));
    console.log('\n📋 App Settings:', JSON.stringify(generalSettings.appSettings, null, 2));
    
    // Check if PWA fields exist
    const hasNewFields = !!(generalSettings.appSettings?.pwaIcon !== undefined);
    console.log('\n🔍 Has new PWA fields:', hasNewFields);
    
    if (!hasNewFields) {
      console.log('\n❌ ISSUE: Database missing new PWA fields!');
      console.log('Need to add: pwaIcon');
    }
  } else {
    console.log('❌ No general settings found in database');
  }
  
  process.exit(0);
};

checkSystemSettings();
