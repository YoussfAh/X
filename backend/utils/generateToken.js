import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import crypto from 'crypto';

const generateToken = async (res, userId) => {
  // Generate a unique session ID
  const sessionId = crypto.randomBytes(16).toString('hex');
  
  // Update the user's lastTokenIssuedAt timestamp and sessionId
  await User.findByIdAndUpdate(userId, { 
    lastTokenIssuedAt: new Date(),
    sessionId: sessionId 
  });

  const token = jwt.sign({ 
    userId, 
    issuedAt: Date.now(),
    sessionId: sessionId
  }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  // Set JWT as an HTTP-Only cookie
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
    sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none', // Important for cross-site requests in production
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Return sessionId so it can be included in the response
  return sessionId;
};

export default generateToken;
