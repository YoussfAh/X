import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';

// Load environment variables
dotenv.config();

const testConnection = async () => {
  try {
    console.log('Attempting to connect to MongoDB Atlas...'.yellow);
    console.log(`Using URI: ${process.env.MONGO_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://USERNAME:PASSWORD@')}`.cyan);
    
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(` MongoDB Connected: ${conn.connection.host}`.green.underline);
    console.log('Connection test successful!'.green.bold);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Connection closed'.yellow);
    
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.bold);
    console.error('Connection test failed!'.red.bold);
    process.exit(1);
  }
};

testConnection();