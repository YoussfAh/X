import asyncHandler from '../middleware/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import User from '../models/userModel.js';
import Collection from '../models/collectionModel.js';
import { verifyGoogleToken } from '../config/googleAuth.js';
import { RATE_LIMIT_CONFIG } from '../config/rateLimitConfig.js';
import {
  validateAndCleanAssignedCollections,
  createAssignmentData,
} from '../utils/assignedCollectionsValidator.js';

// @desc    Auth user & get token
// @route   POST /api/users/auth
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Get client IP for tracking
  const clientIP = req.ip || req.connection.remoteAddress;
  // Get device ID from header if available
  const deviceId = req.headers['x-device-id'] || 'unknown';

  // Find user within the current tenant context
  const query = { email };
  if (req.tenantId) {
    query.tenantId = req.tenantId;
  }
  
  const user = await User.findOne(query);

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check if device is locked
    if (user.isDeviceLocked(deviceId)) {
    console.warn(`SECURITY: Locked device login attempt. User: ${user.email}, DeviceID: ${deviceId}, IP: ${clientIP}`);
    const deviceData = user.deviceLoginAttempts.get(deviceId);
    const lockUntil = new Date(deviceData.lockUntil);
    const minutesLeft = Math.ceil((lockUntil - Date.now()) / 60000);

    res.status(429); // Too Many Requests
    throw new Error(
      `This device is temporarily locked due to too many failed login attempts. Please wait for ${minutesLeft} minute${
        minutesLeft !== 1 ? 's' : ''
      } till you can try again.`
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
    await user.resetDeviceLoginAttempts(deviceId);

    // Generate token and return user info
    const sessionId = await generateToken(res, user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin || false, // Critical for super admin access
      age: user.age,
      fitnessGoal: user.fitnessGoal,
      injuries: user.injuries,
      additionalInfo: user.additionalInfo,
      whatsAppPhoneNumber: user.whatsAppPhoneNumber,
      instagramUsername: user.instagramUsername,
      facebookProfile: user.facebookProfile,
      twitterUsername: user.twitterUsername,
      carouselSlides: user.carouselSlides || [],
      lockedCollections: user.lockedCollections || [],
      accessedCollections: user.accessedCollections || [],
      quizAnswers: user.quizAnswers || [],
      preferences: user.preferences || { quizBannerDismissed: false },
      featureFlags: user.featureFlags || {},
      sessionId: sessionId, // Include sessionId in response
    });
  } else {
    // Increment login attempts on failed login
    await user.incrementDeviceLoginAttempts(deviceId);

    // Get updated device data after incrementing
    const deviceData = user.deviceLoginAttempts.get(deviceId);

    // Check if the device is now locked
        if (deviceData.lockUntil && deviceData.lockUntil > Date.now()) {
      console.error(`SECURITY: Device locked due to excessive login attempts. User: ${user.email}, DeviceID: ${deviceId}, IP: ${clientIP}`);
      const lockUntil = new Date(deviceData.lockUntil);
      const minutesLeft = Math.ceil((lockUntil - Date.now()) / 60000);

      res.status(429);
      throw new Error(
        `This device has been temporarily locked due to too many failed login attempts. Please wait for ${minutesLeft} minute${
          minutesLeft !== 1 ? 's' : ''
        } till you can try again.`
      );
    } else {
      // Calculate remaining attempts before lockout
            const attemptsRemaining = 25 - deviceData.attempts;
      console.warn(`SECURITY: Failed login attempt for user ${user.email}. DeviceID: ${deviceId}, IP: ${clientIP}, Attempts left: ${attemptsRemaining}`);

      // Only show warning message on the last 10 attempts
      if (attemptsRemaining <= 10) {
        res.status(401);
        throw new Error(
          `Invalid email or password. ${attemptsRemaining} attempt${
            attemptsRemaining !== 1 ? 's' : ''
          } remaining before this device is temporarily locked.`
        );
      } else {
        // For attempts 1-15, just show simple error without warning
        res.status(401);
        throw new Error('Invalid email or password.');
      }
    }
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    age,
    fitnessGoal,
    injuries,
    additionalInfo,
    whatsAppPhoneNumber,
  } = req.body;

  // Get client IP for tracking
  const clientIP = req.ip || req.connection.remoteAddress;

  // Check for multiple registrations from the same IP in a short time
  const recentRegistrations = await User.countDocuments({
    registrationIP: clientIP,
    createdAt: { $gt: new Date(Date.now() - 3600000) }, // Last hour
  });

  // More flexible rate limiting using configuration
  const { hourlyLimit, dailyLimit, rapidLimit, rapidWindowMs } =
    RATE_LIMIT_CONFIG.registration;

  const dailyRegistrations = await User.countDocuments({
    registrationIP: clientIP,
    createdAt: { $gt: new Date(Date.now() - 86400000) }, // Last 24 hours
  });

  // Check for potential automated attacks (very high volume)
  if (dailyRegistrations >= dailyLimit) {
    res.status(429); // Too Many Requests
    throw new Error(
      'Daily registration limit exceeded. Please contact support if this is legitimate.'
    );
  }

  // Progressive hourly limiting
  if (recentRegistrations >= hourlyLimit) {
    res.status(429); // Too Many Requests
    throw new Error(
      'Hourly registration limit exceeded. Please try again in an hour.'
    );
  }

  // Additional check for rapid successive registrations
  const veryRecentRegistrations = await User.countDocuments({
    registrationIP: clientIP,
    createdAt: { $gt: new Date(Date.now() - rapidWindowMs) },
  });

  if (veryRecentRegistrations >= rapidLimit) {
    res.status(429); // Too Many Requests
    throw new Error(
      'Too many rapid registrations. Please wait 5 minutes before creating another account.'
    );
  }

  // Check if user exists within this tenant
  const userQuery = { email };
  if (req.tenantId) {
    userQuery.tenantId = req.tenantId;
  }
  
  const userExists = await User.findOne(userQuery);

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user data with tenant context
  const userData = {
    name,
    email,
    password,
    registrationIP: clientIP,
    age: age || null,
    fitnessGoal: fitnessGoal || null,
    injuries: injuries || '',
    additionalInfo: additionalInfo || '',
    whatsAppPhoneNumber: whatsAppPhoneNumber || '',
  };
  
  // Add tenant ID if available
  if (req.tenantId) {
    userData.tenantId = req.tenantId;
  }

  const user = await User.create(userData);

  if (user) {
    // Update lastTokenIssuedAt to track this initial login session
    user.lastTokenIssuedAt = new Date();
    await user.save();

    // Use await with generateToken since it's now async
    await generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin || false, // Critical for super admin access
      age: user.age,
      fitnessGoal: user.fitnessGoal,
      injuries: user.injuries,
      additionalInfo: user.additionalInfo,
      whatsAppPhoneNumber: user.whatsAppPhoneNumber,
      carouselSlides: user.carouselSlides || [],
      lockedCollections: user.lockedCollections || [],
      accessedCollections: user.accessedCollections || [],
      quizAnswers: user.quizAnswers || [],
      preferences: user.preferences || { quizBannerDismissed: false },
      featureFlags: user.featureFlags || {},
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user with Google OAuth
// @route   POST /api/users/auth/google
// @access  Public
const authGoogleUser = asyncHandler(async (req, res) => {
  const { idToken, userInfo } = req.body;

  if (!idToken && !userInfo) {
    res.status(400);
    throw new Error('Google ID token or user info is required');
  }

  try {
    const googleUser = await verifyGoogleToken(idToken, userInfo);
    if (!googleUser.emailVerified) {
      res.status(400);
      throw new Error('Google email not verified');
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    const deviceId = req.headers['x-device-id'] || 'unknown';

    // Find user within tenant context
    const userQuery = { email: googleUser.email };
    if (req.tenantId) {
      userQuery.tenantId = req.tenantId;
    }
    
    let user = await User.findOne(userQuery);

    if (user) {
      // Security Check: If email exists, ensure it's not linked to a different Google account.
      if (user.authProvider === 'google' && user.googleId && user.googleId !== googleUser.googleId) {
        console.error(`SECURITY: Google account mismatch. Email: ${googleUser.email}, Existing GoogleID: ${user.googleId}, Attempted GoogleID: ${googleUser.googleId}`);
        res.status(409); // Conflict
        throw new Error('This email is already associated with a different Google account.');
      }

      // User exists, update details to link with Google.
      user.googleId = googleUser.googleId;
      user.authProvider = 'google';
      console.log(`INFO: Existing user ${user.email} logged in via Google. IP: ${clientIP}`);
    } else {
      // New user, create them
      console.log(`INFO: New user registration via Google. Email: ${googleUser.email}, IP: ${clientIP}`);
      const newUserData = {
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        authProvider: 'google',
        registrationIP: clientIP,
        password: `google-auth-${Math.random().toString(36).substring(7)}`, // Create dummy password
        // Initialize all fields to prevent validation errors
        fitnessGoal: 'other',
        quizAnswers: [],
        preferences: { quizBannerDismissed: false },
      };
      
      // Add tenant ID if available
      if (req.tenantId) {
        newUserData.tenantId = req.tenantId;
      }
      
      user = await User.create(newUserData);
    }

    // Update login info
    user.lastLoginIP = clientIP;
    user.lastDeviceId = deviceId;
    user.lastTokenIssuedAt = new Date();
    await user.save(); // Save after potential cleanup and updates

    // Generate token and respond
    const sessionId = await generateToken(res, user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin || false, // Critical for super admin access
      // Ensure all fields have a default value
      age: user.age || null,
      fitnessGoal: user.fitnessGoal || 'other',
      injuries: user.injuries || '',
      additionalInfo: user.additionalInfo || '',
      whatsAppPhoneNumber: user.whatsAppPhoneNumber || '',
      carouselSlides: user.carouselSlides || [],
      lockedCollections: user.lockedCollections || [],
      accessedCollections: user.accessedCollections || [],
      quizAnswers: user.quizAnswers || [],
      preferences: user.preferences || { quizBannerDismissed: false },
      featureFlags: user.featureFlags || {},
      authProvider: user.authProvider,
      sessionId: sessionId,
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(401);
    throw new Error('Google authentication failed: ' + error.message);
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
  res.clearCookie('jwt');
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin || false, // Critical for super admin access
      age: user.age,
      fitnessGoal: user.fitnessGoal,
      injuries: user.injuries,
      additionalInfo: user.additionalInfo,
      whatsAppPhoneNumber: user.whatsAppPhoneNumber,
      instagramUsername: user.instagramUsername,
      facebookProfile: user.facebookProfile,
      twitterUsername: user.twitterUsername,
      carouselSlides: user.carouselSlides || [],
      lockedCollections: user.lockedCollections || [],
      accessedCollections: user.accessedCollections || [],
      assignedCollections: user.assignedCollections || [],
      quizAnswers: user.quizAnswers || [],
      preferences: user.preferences || { quizBannerDismissed: false },
      featureFlags: user.featureFlags || {},
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user quiz banner preference
// @route   PUT /api/users/quiz-banner-preference
// @access  Private
const updateQuizBannerPreference = asyncHandler(async (req, res) => {
  const { dismissed } = req.body;
  const user = await User.findById(req.user._id);

  if (user) {
    if (!user.preferences) {
      user.preferences = {};
    }

    user.preferences.quizBannerDismissed = dismissed;
    user.preferences.dismissedAt = dismissed ? new Date() : null;

    const updatedUser = await user.save();

    res.json({
      message: 'Quiz banner preference updated successfully',
      preferences: updatedUser.preferences,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    // Update new profile fields if provided
    if (req.body.age !== undefined) user.age = req.body.age;
    if (req.body.fitnessGoal !== undefined)
      user.fitnessGoal = req.body.fitnessGoal;
    if (req.body.injuries !== undefined) user.injuries = req.body.injuries;
    if (req.body.additionalInfo !== undefined)
      user.additionalInfo = req.body.additionalInfo;
    if (req.body.whatsAppPhoneNumber !== undefined)
      user.whatsAppPhoneNumber = req.body.whatsAppPhoneNumber;
    if (req.body.instagramUsername !== undefined)
      user.instagramUsername = req.body.instagramUsername;
    if (req.body.facebookProfile !== undefined)
      user.facebookProfile = req.body.facebookProfile;
    if (req.body.twitterUsername !== undefined)
      user.twitterUsername = req.body.twitterUsername;
    if (req.body.carouselSlides !== undefined)
      user.carouselSlides = req.body.carouselSlides;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      age: updatedUser.age,
      fitnessGoal: updatedUser.fitnessGoal,
      injuries: updatedUser.injuries,
      additionalInfo: updatedUser.additionalInfo,
      whatsAppPhoneNumber: updatedUser.whatsAppPhoneNumber,
      instagramUsername: updatedUser.instagramUsername,
      facebookProfile: updatedUser.facebookProfile,
      twitterUsername: updatedUser.twitterUsername,
      carouselSlides: updatedUser.carouselSlides || [],
      lockedCollections: updatedUser.lockedCollections || [],
      accessedCollections: updatedUser.accessedCollections || [],
      assignedCollections: updatedUser.assignedCollections || [],
      quizAnswers: updatedUser.quizAnswers || [],
      preferences: updatedUser.preferences || { quizBannerDismissed: false },
      featureFlags: updatedUser.featureFlags || {},
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  // Extract filter parameters
  const keyword = req.query.keyword || '';
  const role = req.query.role || 'all';
  const codeAccess = req.query.codeAccess || 'all';
  const pageNumber = Number(req.query.pageNumber) || 1;
  const skipPagination = req.query.skipPagination === 'true';
  const pageSize = Number(req.query.pageSize) || 10; // Allow custom page size, default to 10

  // Build the filter query
  const filter = {};
  
  // Add tenant filter
  if (req.tenantId) {
    filter.tenantId = req.tenantId;
  }

  // Add keyword search (name or email)
  if (keyword) {
    filter.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { email: { $regex: keyword, $options: 'i' } },
    ];
  }

  // Add role filter
  if (role === 'admin') {
    filter.isAdmin = true;
  } else if (role === 'regular') {
    filter.isAdmin = false;
  }

  // For code access filtering, we need a different approach since it requires examining the accessedCollections array
  if (codeAccess === 'with-codes') {
    filter['accessedCollections.accessedWithCode'] = true;
  } else if (codeAccess === 'no-codes') {
    // This is trickier - we need to find users where either:
    // 1. accessedCollections doesn't exist or is empty, or
    // 2. No collection in accessedCollections has accessedWithCode=true
    filter.$or = [
      { accessedCollections: { $exists: false } },
      { accessedCollections: { $size: 0 } },
      { 'accessedCollections.accessedWithCode': { $ne: true } },
    ];

    // If we already have an $or for keyword search, we need to combine them
    if (keyword) {
      const keywordOr = filter.$or;
      const codeAccessOr = [
        { accessedCollections: { $exists: false } },
        { accessedCollections: { $size: 0 } },
        { 'accessedCollections.accessedWithCode': { $ne: true } },
      ];

      // Use $and to combine multiple $or conditions
      filter.$and = [{ $or: keywordOr }, { $or: codeAccessOr }];

      // Remove the original $or as it's now in $and
      delete filter.$or;
    }
  }

  // Count total users matching the filter
  const count = await User.countDocuments(filter);

  if (skipPagination) {
    // Return all users without pagination
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      users,
      page: 1,
      pages: 1,
      totalCount: count,
      // Add these for consistency with pagination response
      totalUsers: count,
      currentCount: users.length,
    });
  } else {
    // Calculate pagination
    const pages = Math.ceil(count / pageSize);
    const skip = pageSize * (pageNumber - 1);

    // Execute the query with pagination
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(skip);

    res.json({
      users,
      page: pageNumber,
      pages,
      totalCount: count,
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error('Can not delete admin user');
    }
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  console.log(`[USER DETAILS] Fetching user details for ID: ${req.params.id}`);
  
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('adminNotes.createdBy', 'name email')
    .populate('contactHistory.contactedBy', 'name email')
    .populate('pendingQuizzes.quizId')
    .populate('quizResults.quizId', 'name');

  if (user) {
    console.log(`[USER DETAILS] User found: ${user.email}`);
    console.log(`[USER DETAILS] Feature flags from DB:`, user.featureFlags);
    console.log(`[USER DETAILS] Pending quizzes: ${user.pendingQuizzes?.length || 0}`);
    console.log(`[USER DETAILS] Quiz results: ${user.quizResults?.length || 0}`);
    // Update time frame status before sending response
    if (user.timeFrame && user.timeFrame.startDate && user.timeFrame.endDate) {
      user.updateTimeFrameStatus();
      await user.save();
    }

    // Clean up assignedCollections - remove any malformed entries before returning
    let cleanedAssignedCollections = user.assignedCollections || [];
    if (Array.isArray(cleanedAssignedCollections)) {
      cleanedAssignedCollections = cleanedAssignedCollections.filter(
        (collection) => {
          return (
            collection.collectionId && collection.name && collection.assignedBy
          );
        }
      );
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      age: user.age,
      fitnessGoal: user.fitnessGoal,
      injuries: user.injuries,
      additionalInfo: user.additionalInfo,
      whatsAppPhoneNumber: user.whatsAppPhoneNumber,
      instagramUsername: user.instagramUsername,
      facebookProfile: user.facebookProfile,
      twitterUsername: user.twitterUsername,
      lastContactedAt: user.lastContactedAt,
      lastContactedBy: user.lastContactedBy,
      contactNotes: user.contactNotes,
      contactHistory: user.getContactHistory({ limit: 10 }), // Get last 10 contacts
      contactStats: user.getContactStats(),
      featureFlags: user.featureFlags || {},
      lockedCollections: user.lockedCollections || [],
      accessedCollections: user.accessedCollections || [],
      assignedCollections: cleanedAssignedCollections,
      // Include time frame information in response
      timeFrame: user.timeFrame || {},
      timeFrameHistory: user.getTimeFrameHistory() || [],
      adminNotes: user.adminNotes || [],
      // Include quiz information in response
      pendingQuizzes: user.pendingQuizzes || [],
      quizResults: user.quizResults || [],
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = Boolean(req.body.isAdmin);

    // Update fitness profile fields if provided
    if (req.body.age !== undefined) user.age = req.body.age;
    if (req.body.fitnessGoal !== undefined)
      user.fitnessGoal = req.body.fitnessGoal;
    if (req.body.injuries !== undefined) user.injuries = req.body.injuries;
    if (req.body.additionalInfo !== undefined)
      user.additionalInfo = req.body.additionalInfo;
    if (req.body.whatsAppPhoneNumber !== undefined)
      user.whatsAppPhoneNumber = req.body.whatsAppPhoneNumber;
    if (req.body.instagramUsername !== undefined)
      user.instagramUsername = req.body.instagramUsername;
    if (req.body.facebookProfile !== undefined)
      user.facebookProfile = req.body.facebookProfile;
    if (req.body.twitterUsername !== undefined)
      user.twitterUsername = req.body.twitterUsername;

    // Handle feature flags if provided
    if (req.body.featureFlags !== undefined) {
      console.log('🚩 Received feature flags update:', req.body.featureFlags);
      console.log('📊 Current user feature flags before:', user.featureFlags);
      
      // Initialize featureFlags if it doesn't exist
      if (!user.featureFlags) {
        user.featureFlags = {};
      }
      
      // Update each feature flag individually to ensure proper saving
      if (req.body.featureFlags.uploadMealImage !== undefined) {
        user.featureFlags.uploadMealImage = Boolean(req.body.featureFlags.uploadMealImage);
      }
      if (req.body.featureFlags.aiAnalysis !== undefined) {
        user.featureFlags.aiAnalysis = Boolean(req.body.featureFlags.aiAnalysis);
      }
      
      // Mark the nested path as modified for Mongoose to detect changes
      user.markModified('featureFlags');
      
      console.log('✅ Updated user feature flags after:', user.featureFlags);
      console.log('🔧 Marked featureFlags as modified for Mongoose');
    }

    // Handle time frame management
    if (
      req.body.timeFrameStartDate !== undefined ||
      req.body.timeFrameDuration !== undefined ||
      req.body.timeFrameDurationType !== undefined
    ) {
      const startDate = req.body.timeFrameStartDate
        ? new Date(req.body.timeFrameStartDate)
        : null;
      const duration = req.body.timeFrameDuration
        ? parseInt(req.body.timeFrameDuration)
        : null;
      const durationType = req.body.timeFrameDurationType || 'days';
      const override = req.body.timeFrameOverride === true;
      const notes = req.body.timeFrameNotes || '';

      if (startDate && duration && duration > 0) {
        // Use the model method to update time frame with options
        user.updateTimeFrame(startDate, duration, durationType, req.user._id, {
          override,
          notes,
        });
      } else {
        // Clear time frame if invalid data provided
        user.timeFrame.startDate = null;
        user.timeFrame.duration = null;
        user.timeFrame.durationType = 'days';
        user.timeFrame.endDate = null;
        user.timeFrame.isWithinTimeFrame = false;
        user.timeFrame.timeFrameSetAt = null;
        user.timeFrame.timeFrameSetBy = null;
      }
    }

    // Clean up assignedCollections - remove any malformed entries
    if (user.assignedCollections && Array.isArray(user.assignedCollections)) {
      user.assignedCollections = user.assignedCollections.filter(
        (collection) => {
          return (
            collection.collectionId && collection.name && collection.assignedBy
          );
        }
      );
    }

    const updatedUser = await user.save();
    
    console.log('💾 User saved successfully. Feature flags in response:', updatedUser.featureFlags);
    
    // Verify the save worked by re-fetching from database
    const verificationUser = await User.findById(req.params.id).select('featureFlags');
    console.log('🔍 Verification - Feature flags in database after save:', verificationUser.featureFlags);

    const responseData = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      age: updatedUser.age,
      fitnessGoal: updatedUser.fitnessGoal,
      injuries: updatedUser.injuries,
      additionalInfo: updatedUser.additionalInfo,
      whatsAppPhoneNumber: updatedUser.whatsAppPhoneNumber,
      instagramUsername: updatedUser.instagramUsername,
      facebookProfile: updatedUser.facebookProfile,
      twitterUsername: updatedUser.twitterUsername,
      featureFlags: updatedUser.featureFlags || {},
      lockedCollections: updatedUser.lockedCollections || [],
      accessedCollections: updatedUser.accessedCollections || [],
      assignedCollections: updatedUser.assignedCollections || [],
      // Include time frame information in response
      timeFrame: updatedUser.timeFrame || {},
      timeFrameHistory: updatedUser.getTimeFrameHistory() || [],
    };
    
    console.log('📤 Sending response with feature flags:', responseData.featureFlags);
    res.json(responseData);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user feature flags (for debugging)
// @route   GET /api/users/:id/feature-flags
// @access  Private/Admin
const getUserFeatureFlags = asyncHandler(async (req, res) => {
  console.log(`🔍 [FEATURE FLAGS DEBUG] Fetching feature flags for user ID: ${req.params.id}`);
  
  const user = await User.findById(req.params.id).select('featureFlags email');
  
  if (user) {
    console.log(`🔍 [FEATURE FLAGS DEBUG] User: ${user.email}`);
    console.log(`🔍 [FEATURE FLAGS DEBUG] Raw feature flags from DB:`, user.featureFlags);
    console.log(`🔍 [FEATURE FLAGS DEBUG] Feature flags type:`, typeof user.featureFlags);
    
    res.json({
      userId: user._id,
      email: user.email,
      featureFlags: user.featureFlags || {},
      rawFeatureFlags: user.featureFlags,
      hasFeatureFlags: !!user.featureFlags,
      uploadMealImage: user.featureFlags?.uploadMealImage || false,
      aiAnalysis: user.featureFlags?.aiAnalysis || false,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user's locked collections
// @route   GET /api/users/locked-collections
// @access  Private
const getUserLockedCollections = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json(user.lockedCollections || []);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Add locked collection to user
// @route   POST /api/users/locked-collections
// @access  Private
const addLockedCollection = asyncHandler(async (req, res) => {
  const { collectionId, price, expiresAt } = req.body;

  // Check if collection exists
  const collection = await Collection.findById(collectionId);
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  const user = await User.findById(req.user._id);

  if (user) {
    // Check if collection is already locked for this user
    const alreadyLocked = user.lockedCollections.find(
      (c) => c.collectionId.toString() === collectionId
    );

    if (alreadyLocked) {
      // If collection is already locked but expired, update it
      if (alreadyLocked.status === 'expired') {
        alreadyLocked.status = 'active';
        alreadyLocked.purchasedAt = Date.now();
        alreadyLocked.price = price;
        alreadyLocked.expiresAt = expiresAt || null;
      } else {
        res.status(400);
        throw new Error('Collection already purchased');
      }
    } else {
      // Add new locked collection
      user.lockedCollections.push({
        collectionId,
        name: collection.name,
        price,
        purchasedAt: Date.now(),
        expiresAt: expiresAt || null,
        status: 'active',
      });
    }

    await user.save();
    res.status(201).json(user.lockedCollections);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Admin: Add locked collection to a user
// @route   POST /api/users/:id/locked-collections
// @access  Private/Admin
const adminAddLockedCollection = asyncHandler(async (req, res) => {
  const { collectionId, price, expiresAt } = req.body;

  // Check if collection exists
  const collection = await Collection.findById(collectionId);
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  const user = await User.findById(req.params.id);

  if (user) {
    // Check if collection is already locked for this user
    const alreadyLocked = user.lockedCollections.find(
      (c) => c.collectionId.toString() === collectionId
    );

    if (alreadyLocked) {
      // If collection is already locked but expired, update it
      if (alreadyLocked.status === 'expired') {
        alreadyLocked.status = 'active';
        alreadyLocked.purchasedAt = Date.now();
        alreadyLocked.price = price;
        alreadyLocked.expiresAt = expiresAt || null;
      } else {
        res.status(400);
        throw new Error('Collection already purchased for this user');
      }
    } else {
      // Add new locked collection
      user.lockedCollections.push({
        collectionId,
        name: collection.name,
        price,
        purchasedAt: Date.now(),
        expiresAt: expiresAt || null,
        status: 'active',
      });
    }

    await user.save();
    res.status(201).json(user.lockedCollections);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Remove locked collection from user
// @route   DELETE /api/users/:userId/locked-collections/:collectionId
// @access  Private/Admin
const removeLockedCollection = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (user) {
    user.lockedCollections = user.lockedCollections.filter(
      (collection) =>
        collection.collectionId.toString() !== req.params.collectionId
    );

    await user.save();
    res.json({
      message: 'Collection access removed',
      lockedCollections: user.lockedCollections,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user's accessed collections (for tracking code access)
// @route   POST /api/users/accessed-collections
// @access  Private
const updateAccessedCollections = asyncHandler(async (req, res) => {
  const { collectionId, name, accessedWithCode } = req.body;
  const user = await User.findById(req.user._id);

  if (user) {
    // Check if this collection is already in the accessed collections
    const existingAccess = user.accessedCollections?.find(
      (c) => c.collectionId.toString() === collectionId
    );

    if (existingAccess) {
      // Update the last accessed timestamp
      existingAccess.lastAccessedAt = Date.now();
      existingAccess.accessCount += 1;

      // If this access was with a code, make sure we mark it
      if (accessedWithCode && !existingAccess.accessedWithCode) {
        existingAccess.accessedWithCode = true;
      }
    } else {
      // Add to accessed collections if it doesn't exist
      if (!user.accessedCollections) {
        user.accessedCollections = [];
      }

      user.accessedCollections.push({
        collectionId,
        name,
        firstAccessedAt: Date.now(),
        lastAccessedAt: Date.now(),
        accessCount: 1,
        accessedWithCode: !!accessedWithCode,
      });
    }

    await user.save();
    res.status(200).json({
      message: 'Accessed collections updated',
      accessedCollections: user.accessedCollections,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Admin update user password
// @route   PUT /api/users/:id/update-password
// @access  Private/Admin
const adminUpdateUserPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  const { password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error('Password is required');
  }

  if (user) {
    // Update the password
    user.password = password;

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      message: 'Password updated successfully',
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Admin assigns a collection to a user
// @route   POST /api/users/:id/assigned-collections
// @access  Private/Admin
const adminAssignCollection = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const collection = await Collection.findById(req.body.collectionId);
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  // Check if collection is already assigned
  const isAlreadyAssigned = user.assignedCollections.some(
    (ac) => ac.collectionId.toString() === collection._id.toString()
  );

  if (isAlreadyAssigned) {
    res.status(400);
    throw new Error('Collection is already assigned to this user');
  }

  // Create assignment data with all required fields
  const assignmentData = {
    collectionId: collection._id,
    name: collection.name,
    description: collection.description || '',
    image: collection.image || '/images/sample.jpg',
    displayOrder: req.body.displayOrder || 0,
    isPublic: collection.isPublic,
    assignedAt: new Date(),
    assignedBy: req.user._id,
    lastAccessedAt: null,
    accessCount: 0,
    notes: req.body.notes || '',
    status: 'active',
    tags: req.body.tags || [],
  };

  // Add to user's assigned collections
  user.assignedCollections.push(assignmentData);

  // Save user - this will trigger the pre-save hook that validates the data
  await user.save();

  res.status(201).json({
    message: 'Collection assigned successfully',
    assignedCollection: assignmentData,
  });
});

// @desc   Admin remove assigned collection from user
// @route   DELETE /api/users/:id/assigned-collections/:collectionId
// @access  Private/Admin
const adminRemoveAssignedCollection = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const collectionIdToRemove = req.params.collectionId;
  const initialCount = user.assignedCollections.length;

  user.assignedCollections = user.assignedCollections.filter(
    (c) => c.collectionId.toString() !== collectionIdToRemove
  );

  if (user.assignedCollections.length === initialCount) {
    res.status(404);
    throw new Error('Collection is not assigned to this user');
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Collection assignment removed successfully',
    assignedCollections: user.assignedCollections,
  });
});

// @desc   Get user's assigned collections
// @route   GET /api/users/:id/assigned-collections
// @access  Private/Admin
const getUserAssignedCollections = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate(
    'assignedCollections.assignedBy',
    'name'
  );
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Clean and validate assigned collections before returning
  const cleanedCollections = validateAndCleanAssignedCollections(
    user.assignedCollections || [],
    false
  );

  res.status(200).json(cleanedCollections);
});

// @desc   Update assigned collection details
// @route   PUT /api/users/:id/assigned-collections/:collectionId
// @access  Private/Admin
const updateAssignedCollection = asyncHandler(async (req, res) => {
  const { notes, tags, status } = req.body;
  const { id: userId, collectionId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const assignment = user.assignedCollections.find(
    (c) => c.collectionId.toString() === collectionId
  );
  if (!assignment) {
    res.status(404);
    throw new Error('Collection is not assigned to this user');
  }

  assignment.notes = notes !== undefined ? notes : assignment.notes;
  assignment.tags = tags !== undefined ? tags : assignment.tags;
  assignment.status = status !== undefined ? status : assignment.status;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Collection assignment updated successfully',
    assignedCollections: user.assignedCollections,
  });
});

// @desc   Batch assign collections to user
// @route   POST /api/users/:id/assigned-collections/batch
// @access  Private/Admin
const batchAssignCollections = asyncHandler(async (req, res) => {
  const { collections } = req.body;

  if (!collections || !Array.isArray(collections)) {
    res.status(400);
    throw new Error('Collections array is required');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const results = { successful: [], failed: [] };

  for (const col of collections) {
    try {
      const { collectionId, name, notes, tags } = col;
      if (
        user.assignedCollections.some(
          (c) => c.collectionId.toString() === collectionId
        )
      ) {
        results.failed.push({ collectionId, reason: 'Already assigned' });
        continue;
      }
      const collection = await Collection.findById(collectionId);
      if (!collection) {
        results.failed.push({ collectionId, reason: 'Collection not found' });
        continue;
      }
      // Use the utility function to create properly validated assignment data
      const assignmentData = createAssignmentData({
        collectionId,
        name: name || collection.name,
        assignedBy: req.user._id,
        collection,
        notes,
        tags,
        status: 'active',
      });
      user.assignedCollections.push(assignmentData);
      results.successful.push(collectionId);
    } catch (error) {
      results.failed.push({
        collectionId: col.collectionId,
        reason: error.message,
      });
    }
  }
  await user.save();
  res.status(200).json({
    success: true,
    message: 'Batch assignment completed',
    results,
    assignedCollections: user.assignedCollections,
  });
});

// @desc   Track collection access
// @route   POST /api/users/:id/assigned-collections/:collectionId/access
// @access  Private
const trackCollectionAccess = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const assignment = user.assignedCollections.find(
    (c) => c.collectionId.toString() === req.params.collectionId
  );
  if (!assignment) {
    res.status(404);
    throw new Error('Collection is not assigned to this user');
  }

  assignment.lastAccessedAt = new Date();
  assignment.accessCount = (assignment.accessCount || 0) + 1;
  await user.save();

  res
    .status(200)
    .json({ success: true, message: 'Access tracked successfully' });
});

// @desc    Refresh current user data
// @route   GET /api/users/refresh-data
// @access  Private
const refreshUserData = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      age: user.age,
      fitnessGoal: user.fitnessGoal,
      injuries: user.injuries,
      additionalInfo: user.additionalInfo,
      whatsAppPhoneNumber: user.whatsAppPhoneNumber,
      instagramUsername: user.instagramUsername,
      facebookProfile: user.facebookProfile,
      twitterUsername: user.twitterUsername,
      featureFlags: user.featureFlags || {},
      lockedCollections: user.lockedCollections || [],
      accessedCollections: user.accessedCollections || [],
      assignedCollections: user.assignedCollections || [],
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user statistics (counts for admin dashboard)
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = asyncHandler(async (req, res) => {
  // Build tenant filter
  const filter = {};
  if (req.tenantId) {
    filter.tenantId = req.tenantId;
  }

  // Count total users
  const totalUsers = await User.countDocuments(filter);

  // Count admin users
  const adminUsers = await User.countDocuments({ 
    ...filter,
    isAdmin: true 
  });

  // Count users with code access
  const usersWithCodeAccess = await User.countDocuments({
    ...filter,
    accessedCollections: {
      $elemMatch: { accessedWithCode: true },
    },
  });

  res.json({
    totalUsers,
    adminUsers,
    usersWithCodeAccess,
  });
});

// @desc    Update existing assigned collections with descriptions
// @route   PUT /api/users/:id/update-assigned-collections
// @access  Private/Admin
const updateExistingAssignedCollections = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  let updatedCount = 0;
  let failedCount = 0;

  for (const assignment of user.assignedCollections) {
    try {
      const originalCollection = await Collection.findById(
        assignment.collectionId
      );
      if (originalCollection) {
        assignment.description = originalCollection.description || '';
        assignment.image = originalCollection.image || '/images/sample.jpg';
        assignment.displayOrder = originalCollection.displayOrder;
        assignment.isPublic = originalCollection.isPublic;
        updatedCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      failedCount++;
    }
  }

  await user.save();
  res.status(200).json({
    success: true,
    message: `Updated ${updatedCount} assigned collections`,
    failed: failedCount,
    assignedCollections: user.assignedCollections,
  });
});

// @desc   Track when admin contacts a user (Enhanced with history)
// @route   POST /api/users/:id/contact
// @access  Private/Admin
const trackUserContact = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const {
    contactNotes,
    contactType = 'other',
    status = 'completed',
    duration,
    outcome,
    followUpDate,
    tags,
  } = req.body;

  // Create new contact entry with enhanced data
  const contactData = {
    contactedAt: new Date(),
    contactType,
    notes: contactNotes || '',
    status,
    duration: duration ? parseInt(duration) : null,
    outcome: outcome || '',
    followUpDate: followUpDate ? new Date(followUpDate) : null,
    tags: tags
      ? Array.isArray(tags)
        ? tags
        : tags.split(',').map((tag) => tag.trim())
      : [],
  };

  // Add contact entry to history
  const contactEntry = user.addContactEntry(contactData, req.user._id);

  await user.save();

  res.status(200).json({
    success: true,
    lastContactedAt: user.lastContactedAt,
    contactNotes: user.contactNotes,
    contactEntry: {
      _id: contactEntry._id,
      contactedAt: contactEntry.contactedAt,
      contactType: contactEntry.contactType,
      notes: contactEntry.notes,
      status: contactEntry.status,
      duration: contactEntry.duration,
      outcome: contactEntry.outcome,
      followUpDate: contactEntry.followUpDate,
      tags: contactEntry.tags,
    },
    message: 'User contact recorded successfully',
  });
});

// @desc    Get user contact history
// @route   GET /api/users/:id/contact-history
// @access  Private/Admin
const getUserContactHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('contactHistory.contactedBy', 'name email')
    .populate('contactHistory.updatedBy', 'name email');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { limit, contactType, status, includeInactive } = req.query;

  const options = {
    limit: limit ? parseInt(limit) : null,
    contactType: contactType || null,
    status: status || null,
    includeInactive: includeInactive === 'true',
  };

  const contactHistory = user.getContactHistory(options);
  const contactStats = user.getContactStats();

  res.json({
    contactHistory,
    contactStats,
    totalContacts: contactHistory.length,
  });
});

// @desc    Update a contact history entry
// @route   PUT /api/users/:id/contact-history/:contactId
// @access  Private/Admin
const updateContactEntry = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { contactId } = req.params;
  const updateData = req.body;

  // Process tags if provided
  if (updateData.tags && !Array.isArray(updateData.tags)) {
    updateData.tags = updateData.tags.split(',').map((tag) => tag.trim());
  }

  // Process duration if provided
  if (updateData.duration) {
    updateData.duration = parseInt(updateData.duration);
  }

  // Process followUpDate if provided
  if (updateData.followUpDate) {
    updateData.followUpDate = new Date(updateData.followUpDate);
  }

  try {
    const updatedEntry = user.updateContactEntry(
      contactId,
      updateData,
      req.user._id
    );
    await user.save();

    res.json({
      success: true,
      contactEntry: updatedEntry,
      message: 'Contact entry updated successfully',
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Delete a contact history entry (soft delete)
// @route   DELETE /api/users/:id/contact-history/:contactId
// @access  Private/Admin
const deleteContactEntry = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { contactId } = req.params;

  try {
    const deletedEntry = user.deleteContactEntry(contactId, req.user._id);
    await user.save();

    res.json({
      success: true,
      contactEntry: deletedEntry,
      message: 'Contact entry deleted successfully',
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Clear contact notes (legacy support)
// @route   POST /api/users/:id/contact/clear-notes
// @access  Private/Admin
const clearContactNotes = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.clearContactNotes();
  await user.save();

  res.json({
    success: true,
    message: 'Contact notes cleared successfully',
  });
});

// @desc    Get contacts that need follow-up across all users
// @route   GET /api/users/contact-follow-ups
// @access  Private/Admin
const getContactFollowUps = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .populate('contactHistory.contactedBy', 'name email')
    .select('name email contactHistory');

  const followUps = [];

  users.forEach((user) => {
    const userFollowUps = user.getContactsNeedingFollowUp();
    userFollowUps.forEach((contact) => {
      followUps.push({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
        contact: contact,
        daysOverdue: Math.ceil(
          (new Date() - new Date(contact.followUpDate)) / (1000 * 60 * 60 * 24)
        ),
      });
    });
  });

  // Sort by most overdue first
  followUps.sort((a, b) => b.daysOverdue - a.daysOverdue);

  res.json({
    followUps,
    totalFollowUps: followUps.length,
  });
});

// @desc    Validate user session (especially for mobile devices)
// @route   GET /api/users/validate-session
// @access  Private
const validateSession = asyncHandler(async (req, res) => {
  // This route is protected by the 'protect' middleware
  // If the request makes it here, the session is valid

  // Return a simple success response
  res.status(200).json({ valid: true });
});

// @desc    Save time frame settings with options (add or override)
// @route   POST /api/users/:id/timeframe
// @access  Private/Admin
const saveTimeFrameSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    const { startDate, duration, durationType, override, notes } = req.body;

    if (!startDate || !duration || duration <= 0) {
      res.status(400);
      throw new Error('Valid start date and duration are required');
    }

    const parsedStartDate = new Date(startDate);
    const parsedDuration = parseInt(duration);
    const parsedDurationType = durationType || 'days';
    const isOverride = override === true;
    const timeFrameNotes = notes || '';

    // Use the model method to update time frame
    user.updateTimeFrame(
      parsedStartDate,
      parsedDuration,
      parsedDurationType,
      req.user._id,
      {
        override: isOverride,
        notes: timeFrameNotes,
      }
    );

    const updatedUser = await user.save();

    res.json({
      message: `Time frame ${isOverride ? 'overridden' : 'added'} successfully`,
      timeFrame: updatedUser.timeFrame,
      timeFrameHistory: updatedUser.getTimeFrameHistory(),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user time frame history
// @route   GET /api/users/:id/timeframe/history
// @access  Private/Admin
const getTimeFrameHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('timeFrameHistory.setBy', 'name email')
    .populate('timeFrameHistory.replacedBy', 'name email');

  if (user) {
    const history = user.getTimeFrameHistory();

    res.json({
      timeFrameHistory: history,
      currentTimeFrame: user.timeFrame,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users with time frame management data
// @route   GET /api/users/timeframe/management
// @access  Private/Admin
const getTimeFrameManagement = asyncHandler(async (req, res) => {
  const {
    timeFrameStatus,
    daysUntilExpiration,
    lastContactFilter,
    search,
    hasWhatsApp,
    subscriptionType,
    page = 1,
    limit = 50,
    sortBy = 'endDate',
    sortOrder = 'asc',
  } = req.query;

  // Build query conditions
  const query = {};

  // Add tenant filter
  if (req.tenantId) {
    query.tenantId = req.tenantId;
  }

  // Search by name or email
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // Get all users with time frame data
  const users = await User.find(query)
    .populate('timeFrame.timeFrameSetBy', 'name email')
    .populate('lastContactedBy', 'name email')
    .select(
      'name email timeFrame lastContactedAt lastContactedBy contactNotes whatsAppPhoneNumber contactHistory'
    )
    .lean();

  // Process users and add calculated fields
  const processedUsers = users.map((user) => {
    let timeFrameStatusCalc = 'no-timeframe';
    let daysUntilEnd = null;
    let isWithinTimeFrame = false;

    if (user.timeFrame && user.timeFrame.startDate && user.timeFrame.endDate) {
      const now = new Date();
      const endDate = new Date(user.timeFrame.endDate);
      const startDate = new Date(user.timeFrame.startDate);

      isWithinTimeFrame = now >= startDate && now <= endDate;
      daysUntilEnd = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      if (daysUntilEnd < 0) {
        timeFrameStatusCalc = 'outside-timeframe';
      } else if (isWithinTimeFrame) {
        if (daysUntilEnd <= 7) {
          timeFrameStatusCalc = 'ending-week';
        } else if (daysUntilEnd <= 14) {
          timeFrameStatusCalc = 'ending-two-weeks';
        } else {
          timeFrameStatusCalc = 'within-timeframe';
        }
      } else {
        // Future timeframe not yet started
        timeFrameStatusCalc = 'future-timeframe';
      }
    }

    // Calculate last contact status
    let lastContactStatus = 'never';
    let daysSinceContact = null;

    if (user.lastContactedAt) {
      const now = new Date();
      const lastContact = new Date(user.lastContactedAt);
      daysSinceContact = Math.floor(
        (now - lastContact) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceContact === 0) {
        lastContactStatus = 'today';
      } else if (daysSinceContact <= 1) {
        lastContactStatus = 'yesterday';
      } else if (daysSinceContact <= 7) {
        lastContactStatus = 'week';
      } else if (daysSinceContact <= 30) {
        lastContactStatus = 'month';
      } else {
        lastContactStatus = 'long-ago';
      }
    }

    return {
      ...user,
      timeFrameStatusCalc,
      daysUntilEnd,
      isWithinTimeFrame,
      lastContactStatus,
      daysSinceContact,
    };
  });

  // Apply filters
  let filteredUsers = processedUsers;

  // Filter by time frame status (legacy support)
  if (timeFrameStatus && timeFrameStatus !== 'all') {
    filteredUsers = filteredUsers.filter(
      (user) => user.timeFrameStatusCalc === timeFrameStatus
    );
  }

  // Filter by days until expiration (new enhanced filter)
  if (daysUntilExpiration && daysUntilExpiration !== 'all') {
    filteredUsers = filteredUsers.filter((user) => {
      const days = user.daysUntilEnd;

      switch (daysUntilExpiration) {
        // Exact ranges (existing options)
        case 'today':
          return days === 0;
        case '1-3-days':
          return days !== null && days >= 1 && days <= 3;
        case '4-7-days':
          return days !== null && days >= 4 && days <= 7;
        case '8-14-days':
          return days !== null && days >= 8 && days <= 14;
        case '15-30-days':
          return days !== null && days >= 15 && days <= 30;
        case '31-60-days':
          return days !== null && days >= 31 && days <= 60;
        case '61-90-days':
          return days !== null && days >= 61 && days <= 90;
        case 'over-90-days':
          return days !== null && days > 90;
        case 'expired':
          return (
            user.timeFrameStatusCalc === 'outside-timeframe' ||
            (days !== null && days < 0)
          );
        case 'no-expiration':
          return user.timeFrameStatusCalc === 'no-timeframe';

        // New cumulative ranges (0 to X days)
        case '0-to-7':
          return days !== null && days >= 0 && days <= 7;
        case '0-to-14':
          return days !== null && days >= 0 && days <= 14;
        case '0-to-30':
          return days !== null && days >= 0 && days <= 30;
        case '0-to-60':
          return days !== null && days >= 0 && days <= 60;
        case '0-to-90':
          return days !== null && days >= 0 && days <= 90;
        case '0-to-180':
          return days !== null && days >= 0 && days <= 180;
        case '0-to-365':
          return days !== null && days >= 0 && days <= 365;

        default:
          return true;
      }
    });
  }

  // Filter by last contact (enhanced)
  if (lastContactFilter && lastContactFilter !== 'all') {
    filteredUsers = filteredUsers.filter((user) => {
      const daysSince = user.daysSinceContact;

      switch (lastContactFilter) {
        // Existing specific filters
        case 'quarter':
          return daysSince > 30 && daysSince <= 90;
        case 'needs-follow-up':
          // Users who need follow-up: ending soon but no recent contact
          return (
            (user.timeFrameStatusCalc === 'ending-week' ||
              user.timeFrameStatusCalc === 'ending-two-weeks') &&
            (user.lastContactStatus === 'never' || daysSince > 7)
          );

        // New cumulative ranges (contacted within 0 to X days)
        case 'contacted-0-to-7':
          return daysSince !== null && daysSince >= 0 && daysSince <= 7;
        case 'contacted-0-to-14':
          return daysSince !== null && daysSince >= 0 && daysSince <= 14;
        case 'contacted-0-to-30':
          return daysSince !== null && daysSince >= 0 && daysSince <= 30;
        case 'contacted-0-to-60':
          return daysSince !== null && daysSince >= 0 && daysSince <= 60;
        case 'contacted-0-to-90':
          return daysSince !== null && daysSince >= 0 && daysSince <= 90;
        case 'contacted-0-to-180':
          return daysSince !== null && daysSince >= 0 && daysSince <= 180;
        case 'contacted-0-to-365':
          return daysSince !== null && daysSince >= 0 && daysSince <= 365;

        default:
          return user.lastContactStatus === lastContactFilter;
      }
    });
  }

  // Filter by WhatsApp availability
  if (hasWhatsApp && hasWhatsApp !== 'all') {
    if (hasWhatsApp === 'with-whatsapp') {
      filteredUsers = filteredUsers.filter((user) => user.whatsAppPhoneNumber);
    } else if (hasWhatsApp === 'without-whatsapp') {
      filteredUsers = filteredUsers.filter((user) => !user.whatsAppPhoneNumber);
    }
  }

  // Sort users
  filteredUsers.sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case 'endDate':
        aVal = a.timeFrame?.endDate
          ? new Date(a.timeFrame.endDate)
          : new Date(0);
        bVal = b.timeFrame?.endDate
          ? new Date(b.timeFrame.endDate)
          : new Date(0);
        break;
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'lastContact':
        aVal = a.lastContactedAt ? new Date(a.lastContactedAt) : new Date(0);
        bVal = b.lastContactedAt ? new Date(b.lastContactedAt) : new Date(0);
        break;
      case 'daysUntilEnd':
        aVal = a.daysUntilEnd || 999999;
        bVal = b.daysUntilEnd || 999999;
        break;
      default:
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
    }

    if (sortOrder === 'desc') {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    } else {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    }
  });

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Calculate summary statistics
  const allUsers = processedUsers; // Use unfiltered data for main stats
  const stats = {
    // Main metrics
    total: allUsers.length,
    withinTimeframe: allUsers.filter(
      (u) => u.timeFrameStatusCalc === 'within-timeframe'
    ).length,
    outsideTimeframe: allUsers.filter(
      (u) => u.timeFrameStatusCalc === 'outside-timeframe'
    ).length,
    endingWeek: allUsers.filter((u) => u.timeFrameStatusCalc === 'ending-week')
      .length,
    endingTwoWeeks: allUsers.filter(
      (u) => u.timeFrameStatusCalc === 'ending-two-weeks'
    ).length,
    noTimeframe: allUsers.filter(
      (u) => u.timeFrameStatusCalc === 'no-timeframe'
    ).length,
    futureTimeframe: allUsers.filter(
      (u) => u.timeFrameStatusCalc === 'future-timeframe'
    ).length,

    // Contact metrics
    needsContact: allUsers.filter(
      (u) =>
        (u.timeFrameStatusCalc === 'ending-week' ||
          u.timeFrameStatusCalc === 'ending-two-weeks') &&
        (u.lastContactStatus === 'never' || u.daysSinceContact > 7)
    ).length,

    // Additional useful metrics
    activeSubscriptions: allUsers.filter(
      (u) =>
        u.timeFrameStatusCalc === 'within-timeframe' ||
        u.timeFrameStatusCalc === 'ending-week' ||
        u.timeFrameStatusCalc === 'ending-two-weeks'
    ).length,

    criticalActions: allUsers.filter(
      (u) =>
        u.timeFrameStatusCalc === 'ending-week' ||
        u.timeFrameStatusCalc === 'outside-timeframe'
    ).length,

    usersWithWhatsApp: allUsers.filter((u) => u.whatsAppPhoneNumber).length,
    usersNeverContacted: allUsers.filter((u) => u.lastContactStatus === 'never')
      .length,
    usersContactedToday: allUsers.filter((u) => u.lastContactStatus === 'today')
      .length,

    // Timeframe distribution
    expiringToday: allUsers.filter((u) => u.daysUntilEnd === 0).length,
    expiring1to3Days: allUsers.filter(
      (u) => u.daysUntilEnd >= 1 && u.daysUntilEnd <= 3
    ).length,
    expiring4to7Days: allUsers.filter(
      (u) => u.daysUntilEnd >= 4 && u.daysUntilEnd <= 7
    ).length,
    expiring8to14Days: allUsers.filter(
      (u) => u.daysUntilEnd >= 8 && u.daysUntilEnd <= 14
    ).length,
    expiring15to30Days: allUsers.filter(
      (u) => u.daysUntilEnd >= 15 && u.daysUntilEnd <= 30
    ).length,

    // Filtered results info
    filteredTotal: filteredUsers.length,
    hasFiltersApplied:
      timeFrameStatus !== 'all' ||
      daysUntilExpiration !== 'all' ||
      lastContactFilter !== 'all' ||
      search !== '' ||
      hasWhatsApp !== 'all',
  };

  res.json({
    users: paginatedUsers,
    stats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredUsers.length,
      pages: Math.ceil(filteredUsers.length / limit),
    },
  });
});

// @desc    Send WhatsApp message and record contact
// @route   POST /api/users/:id/whatsapp-contact
// @access  Private/Admin
const sendWhatsAppContact = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { message, messageTemplate } = req.body;

  if (!user.whatsAppPhoneNumber) {
    res.status(400);
    throw new Error('User does not have a WhatsApp phone number');
  }

  // Record the contact in history
  const contactData = {
    contactedAt: new Date(),
    contactType: 'whatsapp',
    notes: `WhatsApp message sent: ${message}`,
    status: 'completed',
    outcome: 'Message sent via WhatsApp',
    tags: ['whatsapp', 'automated-message'],
  };

  if (messageTemplate) {
    contactData.tags.push(`template:${messageTemplate}`);
  }

  // Add contact entry to history
  const contactEntry = user.addContactEntry(contactData, req.user._id);
  await user.save();

  // Generate WhatsApp URL
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${user.whatsAppPhoneNumber.replace(
    /[^0-9]/g,
    ''
  )}?text=${encodedMessage}`;

  res.json({
    success: true,
    whatsappUrl,
    message: 'Contact recorded and WhatsApp URL generated',
    contactEntry: {
      _id: contactEntry._id,
      contactedAt: contactEntry.contactedAt,
      contactType: contactEntry.contactType,
      notes: contactEntry.notes,
      status: contactEntry.status,
      outcome: contactEntry.outcome,
      tags: contactEntry.tags,
    },
  });
});

// @desc    Process message template with user data
// @route   POST /api/users/timeframe/process-template
// @access  Private/Admin
const processMessageTemplate = asyncHandler(async (req, res) => {
  const { template, userIds } = req.body;

  if (!template || !userIds || !Array.isArray(userIds)) {
    res.status(400);
    throw new Error('Template and user IDs are required');
  }

  const users = await User.find({ _id: { $in: userIds } })
    .select('name email timeFrame whatsAppPhoneNumber')
    .lean();

  const processedMessages = users.map((user) => {
    let processedMessage = template;

    // Replace user placeholders
    processedMessage = processedMessage.replace(/\[user\]/g, user.name);
    processedMessage = processedMessage.replace(/\[name\]/g, user.name);
    processedMessage = processedMessage.replace(/\[email\]/g, user.email);

    // Replace time frame placeholders
    if (user.timeFrame) {
      if (user.timeFrame.endDate) {
        const endDate = new Date(user.timeFrame.endDate);
        processedMessage = processedMessage.replace(
          /\[endDate\]/g,
          endDate.toLocaleDateString()
        );
        processedMessage = processedMessage.replace(
          /\[endDateFormatted\]/g,
          endDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        );

        const now = new Date();
        const daysUntilEnd = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        processedMessage = processedMessage.replace(
          /\[daysUntilEnd\]/g,
          daysUntilEnd
        );
      }

      if (user.timeFrame.startDate) {
        const startDate = new Date(user.timeFrame.startDate);
        processedMessage = processedMessage.replace(
          /\[startDate\]/g,
          startDate.toLocaleDateString()
        );
      }

      processedMessage = processedMessage.replace(
        /\[duration\]/g,
        user.timeFrame.duration || ''
      );
      processedMessage = processedMessage.replace(
        /\[durationType\]/g,
        user.timeFrame.durationType || ''
      );
    }

    return {
      userId: user._id,
      userName: user.name,
      hasWhatsApp: !!user.whatsAppPhoneNumber,
      whatsAppNumber: user.whatsAppPhoneNumber,
      processedMessage,
    };
  });

  res.json({
    template,
    processedMessages,
    totalUsers: processedMessages.length,
    usersWithWhatsApp: processedMessages.filter((m) => m.hasWhatsApp).length,
  });
});

// @desc    Remove all regular users (keep admins)
// @route   DELETE /api/users/cleanup-regular-users
// @access  Private/Admin
const cleanupRegularUsers = asyncHandler(async (req, res) => {
  // Only allow admin users to perform this action
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error('Access denied. Admin privileges required.');
  }

  // Get current user counts
  const allUsers = await User.find({}).select('name email isAdmin');
  const adminUsers = allUsers.filter((u) => u.isAdmin);
  const regularUsers = allUsers.filter((u) => !u.isAdmin);

  console.log(
    `🗑️ Cleanup request: ${regularUsers.length} regular users, ${adminUsers.length} admin users`
  );

  if (regularUsers.length === 0) {
    return res.json({
      success: true,
      message: 'No regular users to remove',
      removedCount: 0,
      remainingAdmins: adminUsers.length,
    });
  }

  // Remove only regular users (keep admins)
  const result = await User.deleteMany({ isAdmin: { $ne: true } });

  console.log(`✅ Successfully removed ${result.deletedCount} regular users`);

  res.json({
    success: true,
    message: `Successfully removed ${result.deletedCount} regular users`,
    removedCount: result.deletedCount,
    remainingAdmins: adminUsers.length,
    removedUsers: regularUsers.map((u) => ({ email: u.email, name: u.name })),
  });
});

// @desc    Add an admin note to a user
// @route   POST /api/users/:id/admin-notes
// @access  Admin
const addAdminNote = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const user = await User.findById(req.params.id);

  if (user) {
    const adminNote = {
      note,
      createdBy: req.user._id, // Admin's ID
    };

    user.adminNotes.push(adminNote);
    await user.save();
    // Re-populate the newly added note's creator to return the name
    await user.populate('adminNotes.createdBy', 'name email');
    res.status(201).json({
      message: 'Admin note added successfully',
      adminNotes: user.adminNotes,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete an admin note from a user
// @route   DELETE /api/users/:id/admin-notes/:noteId
// @access  Admin
const deleteAdminNote = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Mongoose's .pull() method is used to remove instances from a subdocument array
    user.adminNotes.pull({ _id: req.params.noteId });
    await user.save();
    // Re-populate to ensure the returned data is consistent
    await user.populate('adminNotes.createdBy', 'name email');
    res.json({ message: 'Admin note removed', adminNotes: user.adminNotes });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get current rate limit configuration
// @route   GET /api/users/admin/rate-limits
// @access  Private/Admin
const getRateLimitConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    config: RATE_LIMIT_CONFIG,
    message: 'Current rate limit configuration',
  });
});

// @desc    Update rate limit configuration
// @route   PUT /api/users/admin/rate-limits
// @access  Private/Admin
const updateRateLimitConfig = asyncHandler(async (req, res) => {
  const { registration, login, apiData, bulkData, downloads } = req.body;

  // Validate and update registration limits
  if (registration) {
    if (registration.hourlyLimit && registration.hourlyLimit > 0) {
      RATE_LIMIT_CONFIG.registration.hourlyLimit = registration.hourlyLimit;
    }
    if (registration.dailyLimit && registration.dailyLimit > 0) {
      RATE_LIMIT_CONFIG.registration.dailyLimit = registration.dailyLimit;
    }
    if (registration.rapidLimit && registration.rapidLimit > 0) {
      RATE_LIMIT_CONFIG.registration.rapidLimit = registration.rapidLimit;
    }
    if (registration.maxAttempts && registration.maxAttempts > 0) {
      RATE_LIMIT_CONFIG.registration.maxAttempts = registration.maxAttempts;
    }
  }

  // Validate and update login limits
  if (login) {
    if (login.maxAttempts && login.maxAttempts > 0) {
      RATE_LIMIT_CONFIG.login.maxAttempts = login.maxAttempts;
    }
  }

  // Update other configurations as needed
  if (apiData) {
    if (apiData.maxRequests && apiData.maxRequests > 0) {
      RATE_LIMIT_CONFIG.apiData.maxRequests = apiData.maxRequests;
    }
  }

  if (bulkData) {
    if (bulkData.maxRequests && bulkData.maxRequests > 0) {
      RATE_LIMIT_CONFIG.bulkData.maxRequests = bulkData.maxRequests;
    }
  }

  if (downloads) {
    if (downloads.maxDownloads && downloads.maxDownloads > 0) {
      RATE_LIMIT_CONFIG.downloads.maxDownloads = downloads.maxDownloads;
    }
  }

  res.json({
    success: true,
    config: RATE_LIMIT_CONFIG,
    message: 'Rate limit configuration updated successfully',
  });
});

// @desc    Remove all assigned collections from a user
// @route   DELETE /api/users/:id/assigned-collections/all
// @access  Private/Admin
const removeAllAssignedCollections = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Remove all assigned collections
  user.assignedCollections = [];
  await user.save();

  res.json({ message: 'All collections removed successfully' });
});

export {
  authUser,
  authGoogleUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  updateQuizBannerPreference,
  getUsers,
  deleteUser,
  getUserById,
  getUserFeatureFlags,
  updateUser,
  getUserLockedCollections,
  addLockedCollection,
  adminAddLockedCollection,
  removeLockedCollection,
  updateAccessedCollections,
  adminUpdateUserPassword,
  adminAssignCollection,
  adminRemoveAssignedCollection,
  getUserAssignedCollections,
  updateAssignedCollection,
  batchAssignCollections,
  trackCollectionAccess,
  refreshUserData,
  getUserStats,
  updateExistingAssignedCollections,
  trackUserContact,
  getUserContactHistory,
  updateContactEntry,
  deleteContactEntry,
  clearContactNotes,
  getContactFollowUps,
  validateSession,
  saveTimeFrameSettings,
  getTimeFrameHistory,
  getTimeFrameManagement,
  sendWhatsAppContact,
  processMessageTemplate,
  cleanupRegularUsers,
  addAdminNote,
  deleteAdminNote,
  getRateLimitConfig,
  updateRateLimitConfig,
  removeAllAssignedCollections,
};
