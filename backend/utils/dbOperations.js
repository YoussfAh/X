import mongoose from 'mongoose';
import { ensureConnection } from '../config/db.js';

/**
 * Database operation wrapper with timeout handling and retries
 * Specifically designed for Vercel serverless environment
 */

/**
 * Execute a database operation with retry logic and timeout handling
 * @param {Function} operation - The database operation to execute
 * @param {Object} options - Configuration options
 * @returns {Promise} - The result of the operation
 */
export const executeWithRetry = async (operation, options = {}) => {
  const {
    maxRetries = 3,
    timeoutMs = 8000, // 8 seconds timeout
    retryDelay = 1000, // 1 second delay between retries
    operationName = 'Database Operation'
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure connection is active before operation
      await ensureConnection();

      // Set a timeout for the operation
      const operationPromise = operation();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`${operationName} timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      // Race between operation and timeout
      const result = await Promise.race([operationPromise, timeoutPromise]);
      
      console.log(`✅ ${operationName} completed successfully on attempt ${attempt}`);
      return result;

    } catch (error) {
      lastError = error;
      console.error(`❌ ${operationName} failed on attempt ${attempt}:`, error.message);

      // Don't retry on certain types of errors
      if (
        error.name === 'ValidationError' ||
        error.name === 'CastError' ||
        error.message.includes('duplicate key') ||
        error.message.includes('E11000')
      ) {
        throw error; // Don't retry validation or duplicate key errors
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error(`💥 ${operationName} failed after ${maxRetries} attempts`);
        throw lastError;
      }

      // Wait before retry with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Retrying ${operationName} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Wrapper for User.findOne with retry logic
 */
export const findUserWithRetry = async (query, options = {}) => {
  const User = mongoose.model('User');
  return executeWithRetry(
    () => User.findOne(query),
    { operationName: 'User.findOne', ...options }
  );
};

/**
 * Wrapper for User.create with retry logic
 */
export const createUserWithRetry = async (userData, options = {}) => {
  const User = mongoose.model('User');
  return executeWithRetry(
    () => User.create(userData),
    { operationName: 'User.create', ...options }
  );
};

/**
 * Wrapper for User.findById with retry logic
 */
export const findUserByIdWithRetry = async (id, options = {}) => {
  const User = mongoose.model('User');
  return executeWithRetry(
    () => User.findById(id),
    { operationName: 'User.findById', ...options }
  );
};

/**
 * Wrapper for User.findByIdAndUpdate with retry logic
 */
export const updateUserWithRetry = async (id, updateData, mongooseOptions = {}, retryOptions = {}) => {
  const User = mongoose.model('User');
  return executeWithRetry(
    () => User.findByIdAndUpdate(id, updateData, mongooseOptions),
    { operationName: 'User.findByIdAndUpdate', ...retryOptions }
  );
};

/**
 * Generic wrapper for any database operation
 */
export const executeDbOperation = async (operation, operationName = 'Database Operation') => {
  return executeWithRetry(operation, { operationName });
};

/**
 * Check if the error is a timeout/connection error
 */
export const isConnectionError = (error) => {
  return (
    error.message.includes('buffering timed out') ||
    error.message.includes('connection timed out') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('ECONNREFUSED') ||
    error.name === 'MongooseServerSelectionError' ||
    error.name === 'MongoNetworkError' ||
    error.name === 'MongoTimeoutError'
  );
};

/**
 * Enhanced error handler for database operations
 */
export const handleDbError = (error, operation = 'Database operation') => {
  console.error(`Database error in ${operation}:`, error);

  if (isConnectionError(error)) {
    return {
      message: 'Database connection issue. Please try again.',
      type: 'CONNECTION_ERROR',
      shouldRetry: true
    };
  }

  if (error.name === 'ValidationError') {
    return {
      message: 'Invalid data provided.',
      type: 'VALIDATION_ERROR',
      shouldRetry: false,
      details: error.errors
    };
  }

  if (error.message.includes('duplicate key') || error.message.includes('E11000')) {
    return {
      message: 'Resource already exists.',
      type: 'DUPLICATE_ERROR',
      shouldRetry: false
    };
  }

  return {
    message: 'An unexpected database error occurred.',
    type: 'UNKNOWN_ERROR',
    shouldRetry: false
  };
};
