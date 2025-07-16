import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

/**
 * MongoDB Connection Tester for Vercel/Serverless environments
 * This script helps diagnose MongoDB connection issues
 */

const testConnection = async () => {
  console.log('🔍 Testing MongoDB connection...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Vercel environment:', process.env.VERCEL ? 'Yes' : 'No');
  
  // Check if MONGO_URI is available
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI environment variable is not set');
    return;
  }
  
  // Mask the URI for security (show only connection details)
  const maskedUri = process.env.MONGO_URI.replace(/:([^:@]+)@/, ':****@');
  console.log('MongoDB URI format:', maskedUri);
  
  try {
    // Test connection with serverless-optimized settings
    const connectionOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      family: 4,
      heartbeatFrequencyMS: 10000,
    };
    
    console.log('⏳ Attempting connection...');
    const startTime = Date.now();
    
    const connection = await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    
    const connectionTime = Date.now() - startTime;
    console.log(`✅ MongoDB Connected successfully in ${connectionTime}ms`);
    console.log('Host:', connection.connection.host);
    console.log('Database:', connection.connection.name);
    console.log('ReadyState:', connection.connection.readyState);
    
    // Test a simple operation
    console.log('⏳ Testing database operation...');
    const collections = await connection.connection.db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections in database`);
    
    // Test user collection specifically (most common source of timeout)
    console.log('⏳ Testing users collection...');
    const User = mongoose.model('User', new mongoose.Schema({}));
    const userCount = await User.countDocuments();
    console.log(`✅ Users collection accessible, contains ${userCount} documents`);
    
    await mongoose.connection.close();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.error('🚨 Server Selection Error - possible causes:');
      console.error('  - Network connectivity issues');
      console.error('  - MongoDB Atlas IP whitelist restrictions');
      console.error('  - Incorrect connection string');
      console.error('  - MongoDB Atlas cluster is paused');
    }
    
    if (error.message.includes('buffering timed out')) {
      console.error('🚨 Buffering Timeout Error - this is the issue you\'re experiencing');
      console.error('  - Connection is taking too long to establish');
      console.error('  - Consider using connection pooling');
      console.error('  - Check MongoDB Atlas performance tier');
    }
  }
};

// Environment-specific recommendations
const printRecommendations = () => {
  console.log('\n📋 Recommendations for Vercel deployment:');
  console.log('1. Use MongoDB Atlas M2+ tier (not M0 free tier) for better performance');
  console.log('2. Ensure IP whitelist includes 0.0.0.0/0 for Vercel serverless functions');
  console.log('3. Use connection pooling with maxPoolSize: 10');
  console.log('4. Set bufferCommands: false to avoid buffering issues');
  console.log('5. Consider implementing connection caching for serverless');
  console.log('6. Monitor MongoDB Atlas connection limits');
  
  if (process.env.VERCEL === '1') {
    console.log('\n🔧 Vercel-specific notes:');
    console.log('- Functions have 10s timeout on Hobby plan, 30s on Pro');
    console.log('- Each function invocation may create new DB connection');
    console.log('- Consider upgrading to Pro plan for longer timeouts');
  }
};

// Run the test
testConnection()
  .then(() => {
    printRecommendations();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    printRecommendations();
    process.exit(1);
  });
