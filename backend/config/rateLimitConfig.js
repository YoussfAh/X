// Rate limiting configuration for the application
export const RATE_LIMIT_CONFIG = {
  // Registration limits
  registration: {
    // Express rate limit middleware settings
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 8, // Max registration attempts per window
    
    // Database-level limits (in userController.js)
    hourlyLimit: 10, // Max successful registrations per hour per IP
    dailyLimit: 50, // Max successful registrations per day per IP
    rapidLimit: 5, // Max registrations within 5 minutes per IP
    rapidWindowMs: 5 * 60 * 1000, // 5 minutes window for rapid detection
  },
  
  // Login limits
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 10, // Max login attempts per window. Reduced from 20 for enhanced security.
  },
  
  // API data access limits
  apiData: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // Max API requests per window
  },
  
  // Bulk data limits
  bulkData: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // Max bulk requests per window
  },
  
  // Download tracking limits
  downloads: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxDownloads: 200, // Max downloads per hour per user
  }
};

// Helper function to get registration limits
export const getRegistrationLimits = () => RATE_LIMIT_CONFIG.registration;

// Helper function to get login limits  
export const getLoginLimits = () => RATE_LIMIT_CONFIG.login;

// Helper function to update registration limits (for admin use)
export const updateRegistrationLimits = (newLimits) => {
  Object.assign(RATE_LIMIT_CONFIG.registration, newLimits);
  return RATE_LIMIT_CONFIG.registration;
}; 