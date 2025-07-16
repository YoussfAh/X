import { ensureConnection } from '../config/db.js';
import mongoose from 'mongoose';

/**
 * Middleware to ensure MongoDB connection is active before processing requests
 * This is crucial for serverless environments like Vercel
 */
export const ensureDbConnection = async (req, res, next) => {
  try {
    // Check if connection is already active
    if (mongoose.connection.readyState === 1) {
      return next();
    }

    console.log('Database connection not ready, establishing connection...');
    
    // Ensure connection is established
    await ensureConnection();
    
    console.log('Database connection established successfully');
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    
    // Return a proper error response
    return res.status(500).json({
      message: 'Database connection error',
      error: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message
    });
  }
};

/**
 * Enhanced version with retry logic
 */
export const ensureDbConnectionWithRetry = async (req, res, next) => {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Check if connection is already active
      if (mongoose.connection.readyState === 1) {
        return next();
      }

      console.log(`Database connection attempt ${retries + 1}/${maxRetries}...`);
      
      // Ensure connection is established
      await ensureConnection();
      
      console.log('Database connection established successfully');
      return next();
    } catch (error) {
      retries++;
      console.error(`Database connection attempt ${retries} failed:`, error.message);
      
      if (retries >= maxRetries) {
        console.error('Max retries reached, database connection failed');
        return res.status(500).json({
          message: 'Database connection error after multiple retries',
          error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message
        });
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
    }
  }
};
