import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_CONFIG } from '../config/rateLimitConfig.js';

// Rate limiter for API endpoints that return lists of data
export const apiDataRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs for data endpoints
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests that don't return data
  skip: (req, res) => {
    return res.statusCode !== 200;
  }
});

// Stricter rate limiter for bulk data endpoints
export const bulkDataRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 requests per hour for bulk endpoints
  message: {
    error: 'Too many data requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Session-based download tracking middleware
const downloadTracker = new Map();

export const trackDataDownloads = (req, res, next) => {
  const userId = req.user?._id?.toString();
  const ip = req.ip || req.connection.remoteAddress;
  const identifier = userId || ip;
  
  if (!identifier) return next();
  
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  // Clean old entries
  if (downloadTracker.has(identifier)) {
    const userDownloads = downloadTracker.get(identifier);
    downloadTracker.set(identifier, userDownloads.filter(time => now - time < oneHour));
  }
  
  // Check download count
  const downloads = downloadTracker.get(identifier) || [];
  if (downloads.length >= 200) { // Max 200 data requests per hour per user
    return res.status(429).json({
      error: 'Download limit exceeded. Please wait before requesting more data.',
      retryAfter: 3600
    });
  }
  
  // Add current download
  downloads.push(now);
  downloadTracker.set(identifier, downloads);
  
  next();
};

// Middleware to prevent page size manipulation
export const limitPageSize = (maxSize = 20) => (req, res, next) => {
  if (req.query.pageSize) {
    req.query.pageSize = Math.min(Number(req.query.pageSize), maxSize);
  }
  if (req.query.limit) {
    req.query.limit = Math.min(Number(req.query.limit), maxSize);
  }
  next();
};

// Registration-specific rate limiter with progressive restrictions
export const registrationRateLimit = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.registration.windowMs,
  max: RATE_LIMIT_CONFIG.registration.maxAttempts,
  message: {
    error: 'Too many registration attempts from this IP. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all registration attempts
  // Custom key generator to track by IP
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

// More lenient rate limiter for login attempts
export const loginRateLimit = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.login.windowMs,
  max: RATE_LIMIT_CONFIG.login.maxAttempts,
  message: {
    error: 'Too many login attempts from this IP. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed login attempts
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

// Rate limiter for OAuth endpoints like Google Login
export const googleLoginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Allow more requests than standard login as it's less of a brute-force vector
  message: {
    error: 'Too many authentication requests from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
}); 