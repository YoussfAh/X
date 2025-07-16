import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import User from '../models/userModel.js';

// User must be authenticated
const protect = asyncHandler(async (req, res, next) => {
  console.log(`[AUTH] protect middleware triggered for: ${req.originalUrl}`);
  let token;

  // Read JWT from the 'jwt' cookie
  token = req.cookies.jwt;
  
  // Fallback: Check for token in headers (useful for cross-origin requests where cookies might not be sent)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Additional fallback: Check user ID in custom header (set by our enhanced frontend)
  const userId = req.headers['x-user-id'];
  const deviceId = req.headers['x-device-id'];

  if (token) {
    try {
            console.log('[AUTH] Token found, attempting to verify...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        throw new Error('User not found');
      }

      // Check if the token's sessionId matches the current sessionId in the user record
      // This is the key check for the single-session feature
      if (decoded.sessionId && user.sessionId && decoded.sessionId !== user.sessionId) {
        res.clearCookie('jwt', {
          httpOnly: true,
          secure: process.env.NODE_ENV !== 'development',
          sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
        });
        res.status(401);
        throw new Error('Session expired: Another device has logged in to this account');
      }

      // Token is valid and session is current, set the user in the request
      console.log(`[AUTH] JWT token valid. User found and verified: ${user.email}`);
      req.user = user;
      next();
    } catch (error) {
            console.error(`[AUTH] Token verification failed for token: ${token}. Error:`, error);
      
      // Handle specific error for session invalidation
      if (error.message.includes('Another device has logged in')) {
        res.status(401);
        throw new Error(error.message);
      }
      
      // If token is invalid but we have userId header, try to authenticate that way
      if (userId) {
        try {
          const user = await User.findById(userId).select('-password');
          if (user) {
            req.user = user;
            // We'll need to generate a new sessionId and token
            const crypto = await import('crypto');
            const newSessionId = crypto.randomBytes(16).toString('hex');
            
            // Check if this is the same device that has an active session
            if (deviceId && user.lastDeviceId === deviceId) {
              // This is likely the same device having cookie issues - allow the session
              user.sessionId = newSessionId;
              user.lastTokenIssuedAt = new Date();
              await user.save();
              
              // Generate a new token with the new sessionId
              const newToken = jwt.sign({ 
                userId: user._id, 
                issuedAt: Date.now(),
                sessionId: newSessionId
              }, process.env.JWT_SECRET, {
                expiresIn: '30d',
              });
              
              res.cookie('jwt', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development',
                sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
              });
              
              next();
              return;
            }
          }
        } catch (fallbackError) {
          console.error('User ID authentication failed:', fallbackError);
          res.status(401);
          throw new Error('Not authorized, authentication failed');
        }
      }
      
      res.status(401);
            throw new Error(`Not authorized, token failed. Reason: ${error.message}`);
    }
  } else if (userId) {
    // If no token but we have userId header, try to authenticate that way
    try {
      const user = await User.findById(userId).select('-password');
      if (user) {
        req.user = user;
        
        // Check if this is the same device that has an active session
        if (deviceId && user.lastDeviceId === deviceId) {
          // Generate a new sessionId
          const crypto = await import('crypto');
          const newSessionId = crypto.randomBytes(16).toString('hex');
          
          // Update the user's sessionId
          user.sessionId = newSessionId;
          user.lastTokenIssuedAt = new Date();
          await user.save();
          
          // Generate a new token with the new sessionId
          const newToken = jwt.sign({ 
            userId: user._id,
            issuedAt: Date.now(),
            sessionId: newSessionId
          }, process.env.JWT_SECRET, {
            expiresIn: '30d',
          });
          
          res.cookie('jwt', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          });
          
          next();
          return;
        }
      }
      
      res.status(401);
      throw new Error('Not authorized, invalid user ID');
    } catch (error) {
      console.error('User ID authentication failed:', error);
      res.status(401);
      throw new Error('Not authorized, authentication failed');
    }
  } else {
    res.status(401);
        console.log('[AUTH] No token found in cookies or headers.');
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// User must be an admin
const admin = (req, res, next) => {
  console.log(`[AUTH] admin middleware triggered. User: ${req.user ? req.user.email : 'None'}. IsAdmin: ${req.user ? req.user.isAdmin : 'N/A'}`);
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

export { protect, admin };
