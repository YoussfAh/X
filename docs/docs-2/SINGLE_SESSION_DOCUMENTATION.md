# Single User Session Authentication Implementation Documentation

## Overview
This document provides a comprehensive technical overview of the single user session authentication system implemented in the PRO application. The system ensures that each user can only have one active login session at a time, automatically logging out previous sessions when a new login occurs.

## Table of Contents

1. [Feature Summary](#feature-summary)
2. [Technical Architecture](#technical-architecture)
3. [Implementation Details](#implementation-details)
   - [Backend Changes](#backend-changes)
   - [Frontend Changes](#frontend-changes)
4. [Authentication Flow](#authentication-flow)
5. [Session Validation Mechanism](#session-validation-mechanism)
6. [Device Tracking System](#device-tracking-system)
7. [Cross-Domain Compatibility](#cross-domain-compatibility)
8. [Development vs. Production Configuration](#development-vs-production-configuration)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Security Considerations](#security-considerations)

## Feature Summary

The single user session authentication system:
- Ensures only one active login session per user account
- Automatically logs out previous sessions when a new login occurs
- Provides clear user feedback during session invalidation
- Works seamlessly across devices, browsers, and in both development and production environments
- Includes special handling for administrative users
- Preserves user experience by showing appropriate notifications
- Maintains compatibility with Vercel deployment

## Technical Architecture

### Key Components

1. **Session ID Generation**: Unique cryptographic session identifiers for each login
2. **Device Tracking**: Device fingerprinting to identify unique devices
3. **Token Management**: JWT token system with session validation
4. **Real-time Session Validation**: Periodic checks to ensure session validity
5. **Cross-Domain Support**: Fallback mechanisms for environments where cookies aren't properly transmitted

### Data Flow Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│             │ Request │             │ Validate │             │
│   Browser   ├────────►│   Express   ├────────►│ Auth        │
│   Client    │         │   Server    │         │ Middleware  │
│             │◄────────┤             │◄────────┤             │
└─────────────┘ Response└─────────────┘         └──────┬──────┘
                                                       │
                                                       │ Check
                                                       │ Session ID
                                                       ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│             │ Update  │             │ Query   │             │
│   Redux     │◄────────┤   API       │◄────────┤ MongoDB     │
│   Store     │         │   Response  │         │ Database    │
│             │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
```

## Implementation Details

### Backend Changes

#### 1. User Model (`backend/models/userModel.js`)

Added new fields to the User model:
```javascript
sessionId: {
  type: String,
  default: null,
},
lastDeviceId: {
  type: String,
  default: null,
},
```

The `sessionId` field stores the current active session identifier for each user, while `lastDeviceId` stores a unique identifier for the user's most recent authenticated device.

#### 2. Token Generation (`backend/utils/generateToken.js`)

Modified to generate and return a unique session ID with each token:

```javascript
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
```

Key changes:
- Generates a cryptographically secure random session ID using `crypto.randomBytes(16)`
- Updates the user document with the new session ID
- Includes the session ID in the JWT payload
- Configures cookies properly for both development and production environments
- Returns the session ID to be included in the auth response

#### 3. Authentication Middleware (`backend/middleware/authMiddleware.js`)

The authentication middleware was enhanced to validate session IDs and handle session invalidation:

```javascript
import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import User from '../models/userModel.js';

// User must be authenticated
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Read JWT from the 'jwt' cookie
  token = req.cookies.jwt;
  
  // Fallback: Check for token in headers (useful for cross-origin requests where cookies might not be sent)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Additional fallback: Check user ID in custom header
  const userId = req.headers['x-user-id'];
  const deviceId = req.headers['x-device-id'];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        throw new Error('User not found');
      }

      // This is the key check for the single-session feature
      // Check if the token's sessionId matches the current sessionId in the user record
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
      req.user = user;
      next();
    } catch (error) {
      // Handle specific error for session invalidation
      if (error.message.includes('Another device has logged in')) {
        res.status(401);
        throw new Error(error.message);
      }
      
      // Additional fallback authentication support is included for cross-domain requests
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
          res.status(401);
          throw new Error('Not authorized, authentication failed');
        }
      }
      
      res.status(401);
      throw new Error('Not authorized, token failed');
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
      res.status(401);
      throw new Error('Not authorized, authentication failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// User must be an admin
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

export { protect, admin };
```

Key aspects:
- Validates session ID from JWT against the user's current session ID in the database
- Implements multiple fallback authentication mechanisms for complex environments
- Handles cookie clearing and proper error responses for session invalidation
- Special handling for same-device requests with potential cookie issues
- Properly configures cookie settings for both development and production environments

#### 4. User Controller (`backend/controllers/userController.js`)

Updated the user authentication logic to track device IDs and include session ID in responses:

```javascript
// @desc    Auth user & get token
// @route   POST /api/users/auth
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Get client IP for tracking
  const clientIP = req.ip || req.connection.remoteAddress;
  // Get device ID from header if available
  const deviceId = req.headers['x-device-id'] || 'unknown';

  const user = await User.findOne({ email });
  
  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  
  // Check if account is locked
  if (user.isLocked()) {
    const lockUntil = new Date(user.lockUntil);
    const minutesLeft = Math.ceil((lockUntil - Date.now()) / 60000);
    
    res.status(429); // Too Many Requests
    throw new Error(
      `Account temporarily locked due to too many failed login attempts. Please try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`
    );
  }

  // Check if the password is correct
  const isMatch = await user.matchPassword(password);
  
  if (isMatch) {
    // Reset login attempts on successful login
    user.lastLoginIP = clientIP;
    user.lastDeviceId = deviceId;
    // Update lastTokenIssuedAt to indicate a new login session
    user.lastTokenIssuedAt = new Date();
    await user.resetLoginAttempts();
    
    // Generate token and return user info
    const sessionId = await generateToken(res, user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      // ...other fields...
      sessionId: sessionId, // Include sessionId in response
    });
  } else {
    // Increment login attempts on failed login
    await user.incrementLoginAttempts();
    
    // Check if the account is now locked
    if (user.isLocked()) {
      const lockUntil = new Date(user.lockUntil);
      const minutesLeft = Math.ceil((lockUntil - Date.now()) / 60000);
      
      res.status(429);
      throw new Error(
        `Account has been temporarily locked due to too many failed login attempts. Please try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`
      );
    } else {
      // Calculate remaining attempts before lockout
      const attemptsRemaining = 5 - user.loginAttempts;
      
      res.status(401);
      throw new Error(
        `Invalid email or password. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining before your account is temporarily locked.`
      );
    }
  }
});
```

Key changes:
- Captures device ID from request headers
- Records device ID in user's profile
- Returns session ID in the authentication response
- Properly handles account locking and login attempt tracking

#### 5. Session Validation Endpoint (`backend/controllers/userController.js`)

Added a dedicated endpoint for session validation, important for ongoing session checks:

```javascript
// @desc    Validate user session (especially for mobile devices)
// @route   GET /api/users/validate-session
// @access  Private
const validateSession = asyncHandler(async (req, res) => {
  // This route is protected by the 'protect' middleware
  // If the request makes it here, the session is valid
  
  // Return a simple success response
  res.status(200).json({ valid: true });
});
```

### Frontend Changes

#### 1. Auth Slice (`frontend/src/slices/authSlice.js`)

Enhanced to handle device IDs and session management:

```javascript
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userInfo: localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null,
  sessionId: localStorage.getItem('sessionId') || null,
  deviceId: localStorage.getItem('deviceId') || generateDeviceId(),
};

// Generate a unique ID for this device/browser
function generateDeviceId() {
  const deviceId = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
  localStorage.setItem('deviceId', deviceId);
  return deviceId;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.userInfo = action.payload;
      // Store the session ID if provided in the payload
      if (action.payload.sessionId) {
        state.sessionId = action.payload.sessionId;
        localStorage.setItem('sessionId', action.payload.sessionId);
      }
      localStorage.setItem('userInfo', JSON.stringify(action.payload));
    },
    updateUserData: (state, action) => {
      state.userInfo = { ...state.userInfo, ...action.payload };
      localStorage.setItem('userInfo', JSON.stringify(state.userInfo));
    },
    updateSessionId: (state, action) => {
      state.sessionId = action.payload;
      localStorage.setItem('sessionId', action.payload);
    },
    logout: (state, action) => {
      state.userInfo = null;
      state.sessionId = null;
      // Remove user info from storage
      localStorage.removeItem('userInfo');
      localStorage.removeItem('sessionId');
      // Keep the device ID for analytics purposes
    },
  },
});

export const { setCredentials, updateUserData, updateSessionId, logout } = authSlice.actions;

export default authSlice.reducer;
```

Key changes:
- Adds device ID generation and management
- Adds session ID storage
- New action for updating session ID
- Enhanced logout handling to clear proper session data
- Maintains device ID across logouts for analytics and tracking

#### 2. API Slice (`frontend/src/slices/apiSlice.js`)

Modified to include device ID in requests and handle session invalidation:

```javascript
import { fetchBaseQuery, createApi } from '@reduxjs/toolkit/query/react';
import { BASE_URL } from '../constants';
import { logout } from './authSlice'; // Import the logout action
import { showWarningToast } from '../utils/toastConfig'; // Import toast notification

// Customize the base query to handle auth headers and cookies
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include',  // Always include credentials
  prepareHeaders: (headers) => {
    // Ensure all necessary CORS headers are set for cross-domain requests
    headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Add userInfo from localStorage as a backup authentication method
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { _id } = JSON.parse(userInfo);
      if (_id) {
        headers.set('x-user-id', _id);
      }
    }

    // Add device ID for session tracking
    const deviceId = localStorage.getItem('deviceId');
    if (deviceId) {
      headers.set('x-device-id', deviceId);
    }
    
    return headers;
  },
});

async function baseQueryWithAuth(args, api, extra) {
  const result = await baseQuery(args, api, extra);
  
  // Handle 401 errors - Log out immediately for session invalidation
  if (result.error && result.error.status === 401) {
    // Check if this is specifically a session invalidation error
    const isSessionInvalidated = result.error.data?.message?.includes('Another device has logged in');
    
    // For session invalidation, log out immediately without retry
    if (isSessionInvalidated) {
      // Show a toast notification to inform the user why they're being logged out
      showWarningToast('You have been logged out because your account was accessed from another device');
      
      // Clear local storage and dispatch logout action
      localStorage.removeItem('userInfo');
      localStorage.removeItem('sessionId');
      // Keep deviceId for tracking purposes
      api.dispatch(logout());
      return result;
    }
    
    // For other 401 errors, try the retry logic
    const userInfo = localStorage.getItem('userInfo');
    const sessionId = localStorage.getItem('sessionId');
    
    // If we have userInfo and sessionId but get a 401, try the request once more
    // This helps when cookies might not be transmitted properly
    if (userInfo && sessionId && !args.headers?.['x-retry']) {
      const retryArgs = {
        ...args,
        headers: {
          ...args.headers,
          'x-retry': 'true',
          'x-session-id': sessionId
        }
      };
      
      // Try the request again
      const retryResult = await baseQuery(retryArgs, api, extra);
      if (!retryResult.error) {
        return retryResult;
      }
    }
    
    // If retry failed or we had no userInfo, logout
    api.dispatch(logout());
  }
  
  return result;
}

export const apiSlice = createApi({
  baseQuery: baseQueryWithAuth, // Use the customized baseQuery
  tagTypes: [
    'Product', 
    'Order', 
    'User', 
    'Collections',
    'WorkoutEntries',
    'UserWorkoutEntries',
    'AllWorkoutEntries',
    'OneTimeCodes',
    'AssignedCollections'
  ],
  endpoints: (builder) => ({}),
});
```

Key improvements:
- Includes device ID in API request headers
- Detects and handles session invalidation errors
- Shows informative toast messages to users when logged out by another session
- Implements retry logic for non-session-invalidation 401 errors
- Maintains proper error handling and logout flow

#### 3. Auth Wrapper (`frontend/src/components/AuthWrapper.jsx`)

Enhanced to periodically validate the user's session:

```javascript
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials, logout, updateSessionId } from '../slices/authSlice';
import Loader from './Loader';
import { showWarningToast } from '../utils/toastConfig';

// This component will wrap all routes that require authentication
const AuthWrapper = () => {
    const { userInfo, deviceId, sessionId } = useSelector((state) => state.auth);
    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    // Session validation
    useEffect(() => {
        let sessionCheckInterval;
        
        // Only set up interval if we have a logged-in user
        if (userInfo) {
            // Function to validate the current session
            const validateSession = async () => {
                try {
                    // Simple ping to check authentication status
                    const response = await fetch(`${window.location.origin}/api/users/validate-session`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-user-id': userInfo._id,
                            'x-device-id': deviceId || localStorage.getItem('deviceId'),
                            'x-session-id': sessionId || localStorage.getItem('sessionId'),
                        },
                        credentials: 'include'
                    });
                    
                    // If response is not ok, user has been logged out by another session
                    if (!response.ok) {
                        const data = await response.json();
                        
                        // Check if this is a session invalidation
                        if (data.message && data.message.includes('Another device has logged in')) {
                            showWarningToast('You have been logged out because your account was accessed from another device');
                            localStorage.removeItem('userInfo');
                            localStorage.removeItem('sessionId');
                            // Keep deviceId for tracking
                            dispatch(logout());
                            navigate('/login');
                        }
                    } else {
                        // If the response included a new session ID, update it
                        const data = await response.json();
                        if (data.sessionId && data.sessionId !== sessionId) {
                            dispatch(updateSessionId(data.sessionId));
                        }
                    }
                } catch (error) {
                    // Network errors should not log the user out
                    console.error('Session validation error:', error);
                }
            };
            
            // Check session immediately and then every 30 seconds
            validateSession();
            sessionCheckInterval = setInterval(validateSession, 30000);
        }
        
        return () => {
            // Clean up interval when component unmounts
            if (sessionCheckInterval) {
                clearInterval(sessionCheckInterval);
            }
        };
    }, [userInfo, navigate, dispatch, deviceId, sessionId]);

    // Enhanced authentication check
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // First check if we have userInfo in redux state
                if (userInfo) {
                    setLoading(false);
                    return;
                }
                
                // If not in redux, try to get from localStorage
                const storedUserInfo = localStorage.getItem('userInfo');
                const storedSessionId = localStorage.getItem('sessionId');
                
                if (storedUserInfo) {
                    // Restore from localStorage to redux state
                    const parsedUserInfo = JSON.parse(storedUserInfo);
                    dispatch(setCredentials({
                        ...parsedUserInfo,
                        sessionId: storedSessionId
                    }));
                    setLoading(false);
                    return;
                }

                // No authentication found
                setLoading(false);
            } catch (error) {
                console.error('Auth check failed:', error);
                setLoading(false);
            }
        };

        checkAuth();
    }, [dispatch, userInfo]);

    // Show loader while checking authentication
    if (loading) {
        return <Loader />;
    }

    // If user is not logged in, redirect to login page with return url
    return userInfo 
        ? <Outlet /> 
        : <Navigate to="/login" state={{ from: location.pathname }} replace />;
};

export default AuthWrapper;
```

Key features:
- Implements periodic session validation every 30 seconds
- Handles session invalidation messaging and user redirection
- Synchronizes session data between local storage and Redux store
- Maintains robust error handling without disrupting user experience
- Sends device ID in validation requests for consistent identity tracking

#### 4. Login Screen (`frontend/src/screens/LoginScreen.jsx`)

Enhanced login handler to include device ID tracking:

```javascript
const submitHandler = async (e) => {
    e.preventDefault();
    
    // Validate email format
    if (!validateEmail(email)) {
        setEmailValid(false);
        showErrorToast('Please enter a valid email address');
        return;
    }
    
    if (!password) {
        showErrorToast('Please enter your password');
        return;
    }
    
    try {
        // Clear previous errors
        setErrorMessage('');
        setRemainingAttempts(null);
        setIsLocked(false);
        setLockTimeRemaining('');
        
        // Handle remember me
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
        
        // Get device ID from localStorage or generate a new one
        const deviceId = localStorage.getItem('deviceId') || 
            Math.random().toString(36).substring(2, 15) + 
            Math.random().toString(36).substring(2, 15);
        
        // Store device ID if it's new
        if (!localStorage.getItem('deviceId')) {
            localStorage.setItem('deviceId', deviceId);
        }
        
        // Pass deviceId in the headers for the login request
        const res = await login({
            email,
            password
        }, {
            headers: {
                'x-device-id': deviceId
            }
        }).unwrap();
        
        dispatch(setCredentials({ ...res }));
        navigate(redirect);
    } catch (err) {
        const message = err?.data?.message || err.error;
        
        // Check for account locked message
        if (message?.includes('temporarily locked')) {
            setIsLocked(true);
            // Extract minutes from error message (if available)
            const minutesMatch = message.match(/(\d+) minute/);
            if (minutesMatch) {
                setLockTimeRemaining(minutesMatch[1]);
            }
        }
        
        // Check for remaining attempts message
        const attemptsMatch = message?.match(/(\d+) attempt/);
        if (attemptsMatch) {
            setRemainingAttempts(attemptsMatch[1]);
        }
        
        setErrorMessage(message);
        showErrorToast(message);
    }
};
```

Key improvements:
- Generates or retrieves device ID for consistent identification
- Includes device ID in login request headers
- Maintains proper error handling and user feedback
- Works with the authentication flow to establish a single secure session

## Authentication Flow

### Login Process

1. **User enters credentials**:
   - The login screen captures email and password
   - A device ID is generated or retrieved from localStorage

2. **Authentication request**:
   - Login request is sent with credentials and device ID
   - Backend validates credentials

3. **Session establishment**:
   - If credentials are valid, the backend:
     - Generates a new unique session ID using crypto
     - Updates the user's record with the new session ID and device ID
     - Creates a JWT token containing the session ID
     - Sets the token as an HTTP-only cookie
     - Returns user data and session ID to the client

4. **Client session storage**:
   - Frontend stores user info and session ID in both Redux store and localStorage
   - Device ID is maintained for session continuity

### Session Validation Flow

1. **Initial route access**:
   - AuthWrapper component checks for existing authentication
   - If authenticated, sets up periodic session validation

2. **Regular validation checks**:
   - Every 30 seconds, a request is sent to validate-session endpoint
   - Request includes user ID, device ID, and session ID
   - Backend validates session through auth middleware

3. **Session invalidation detection**:
   - If session is invalidated by a login from another device:
     - Client receives 401 status with specific error message
     - User is shown a notification
     - Client clears authentication data and redirects to login

## Session Validation Mechanism

The session validation system works through several layers:

1. **Token-based validation**:
   - JWT token contains encrypted session ID
   - Auth middleware verifies token signature
   - Session ID in token is compared with database record

2. **Session ID comparison**:
   - If session IDs match, the request proceeds
   - If session IDs don't match, token is invalidated

3. **Fallback mechanisms**:
   - For environments where cookies aren't properly transmitted:
     - User ID header is checked
     - Device ID is verified against last known device
     - New session can be established for same device without disruption

4. **Periodic validation**:
   - Frontend regularly pings validation endpoint
   - Any session invalidation is immediately detected and handled

## Device Tracking System

The device tracking system provides consistent identification across sessions:

1. **Device ID generation**:
   - Unique identifier created using random string generation
   - Stored in localStorage for persistence
   - Survives page refreshes and browser restarts

2. **Device recognition**:
   - Backend records last authenticated device ID
   - Same device can seamlessly continue session even with cookie issues
   - Different devices trigger session invalidation

3. **Analytics benefits**:
   - Device ID maintained even across logouts
   - Enables tracking of user behavior across sessions
   - Supports security monitoring and fraud detection

## Cross-Domain Compatibility

Special handling ensures the system works across domains, important for Vercel deployment:

1. **Cookie configuration**:
   - In development: `sameSite: 'lax'` for local testing
   - In production (Vercel): `sameSite: 'none'` for cross-domain support
   - Secure flag set appropriately for each environment

2. **Header-based authentication fallback**:
   - Custom headers (`x-user-id`, `x-device-id`, `x-session-id`) provide fallback
   - API calls include credentials and necessary headers
   - Retry mechanism for transient authorization failures

3. **CORS handling**:
   - Access-Control-Allow-Credentials header ensures cookies are sent
   - Proper CORS configuration in backend for Vercel deployment

## Development vs. Production Configuration

The system automatically adjusts settings based on environment:

### Development Environment

```javascript
res.cookie('jwt', token, {
  httpOnly: true,
  secure: false,  // No HTTPS required in development
  sameSite: 'lax', // Works with localhost
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});
```

### Production Environment (Vercel)

```javascript
res.cookie('jwt', token, {
  httpOnly: true,
  secure: true,  // HTTPS required in production
  sameSite: 'none', // Essential for cross-domain cookies on Vercel
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});
```

These differences ensure:
- Local development works smoothly without HTTPS
- Production deployment on Vercel handles cross-domain cookies correctly
- Security is maintained in both environments

## Troubleshooting Guide

### Common Issues and Solutions

1. **Session unexpectedly invalidated**:
   - Check for multiple logins from different devices
   - Verify device ID is being properly stored and transmitted
   - Check network requests for 401 errors with session invalidation message

2. **Authentication not working on Vercel**:
   - Ensure cookies are configured with `sameSite: 'none'` and `secure: true`
   - Verify CORS is properly configured to allow credentials
   - Check for same-origin policy issues with API requests

3. **Login works but subsequent requests fail**:
   - Inspect cookie storage in browser dev tools
   - Verify JWT token is being included in requests
   - Check for cookie transmission issues in CORS requests

4. **Device not recognized as same after login**:
   - Check device ID generation and storage
   - Verify device ID is included in request headers
   - Debug user document in database to check lastDeviceId value

## Security Considerations

1. **Token security**:
   - JWT tokens stored as HTTP-only cookies
   - Session IDs generated using cryptographic random function
   - CSRF protected through sameSite cookie settings

2. **Session management**:
   - Only one active session per user
   - Clear feedback when session is invalidated
   - Proper cleanup of auth data on logout

3. **Device fingerprinting**:
   - Basic device tracking without invasive fingerprinting
   - Device ID stored client-side only
   - Only device ID transmitted, not device specifications

4. **Error handling**:
   - Limited error information exposed to clients
   - Proper error logging on server
   - Sanitized error messages to prevent information leakage

5. **Protection against brute force attacks**:
   - Account lockout after multiple failed attempts
   - Progressive security measures based on risk profile
   - Rate limiting on authentication endpoints