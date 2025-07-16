import asyncHandler from '../middleware/asyncHandler.js';
import OneTimeCode from '../models/oneTimeCodeModel.js';
import Collection from '../models/collectionModel.js';
import User from '../models/userModel.js';
import crypto from 'crypto';

// @desc    Generate a new one-time access code for a collection
// @route   POST /api/one-time-codes/generate
// @access  Private/Admin
const generateOneTimeCode = asyncHandler(async (req, res) => {
  const { collectionId, expiryDays, maxUses = 1 } = req.body;

  // Verify the collection exists
  const collection = await Collection.findById(collectionId);
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  // Validate maxUses
  if (maxUses < 1 || maxUses > 1000) {
    res.status(400);
    throw new Error('Max uses must be between 1 and 1000');
  }

  // Generate a short, unique code
  // Format: 6 characters alphanumeric (easier for users to type)
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (expiryDays || 30));

  // Create the one-time code
  const oneTimeCode = new OneTimeCode({
    code,
    collectionId: collectionId, // Changed from collection to collectionId
    collectionName: collection.name,
    createdBy: req.user._id,
    expiresAt,
    maxUses,
  });

  const createdCode = await oneTimeCode.save();

  res.status(201).json(createdCode);
});

// @desc    Generate multiple one-time access codes for a collection
// @route   POST /api/one-time-codes/batch-generate
// @access  Private/Admin
const generateBatchCodes = asyncHandler(async (req, res) => {
  const { collectionId, quantity, expiryDays, maxUses = 1 } = req.body;

  if (!quantity || quantity < 1 || quantity > 100) {
    res.status(400);
    throw new Error('Quantity must be between 1 and 100');
  }

  // Validate maxUses
  if (maxUses < 1 || maxUses > 1000) {
    res.status(400);
    throw new Error('Max uses must be between 1 and 1000');
  }

  // Verify the collection exists
  const collection = await Collection.findById(collectionId);
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  // Calculate expiration date for all codes
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (expiryDays || 30));

  // Generate codes
  const codesToCreate = [];
  const generatedCodes = [];

  for (let i = 0; i < quantity; i++) {
    // Generate a short, unique code
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    generatedCodes.push(code);

    codesToCreate.push({
      code,
      collectionId: collectionId, // Changed from collection to collectionId
      collectionName: collection.name,
      createdBy: req.user._id,
      expiresAt,
      maxUses,
    });
  }

  // Insert all codes at once
  const createdCodes = await OneTimeCode.insertMany(codesToCreate);

  res.status(201).json({
    success: true,
    count: createdCodes.length,
    codes: createdCodes,
  });
});

// @desc    Generate a universal one-time access code that works for all collections
// @route   POST /api/one-time-codes/generate-universal
// @access  Private/Admin
const generateUniversalCode = asyncHandler(async (req, res) => {
  const { expiryDays, maxUses = 1 } = req.body;

  // Validate maxUses
  if (maxUses < 1 || maxUses > 1000) {
    res.status(400);
    throw new Error('Max uses must be between 1 and 1000');
  }

  // Create a placeholder collection reference
  // We'll use the first collection as a reference, but the code will work universally
  const firstCollection = await Collection.findOne({ requiresCode: true });

  if (!firstCollection) {
    res.status(404);
    throw new Error('No collections with access protection found');
  }

  // Generate a unique code with a special prefix to distinguish universal codes
  // Format: U-xxxxxx (where x is alphanumeric)
  const codeValue = crypto.randomBytes(3).toString('hex').toUpperCase();
  const code = `U-${codeValue}`;

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (expiryDays || 30));

  // Create the universal one-time code
  const oneTimeCode = new OneTimeCode({
    code,
    collectionId: firstCollection._id, // Reference collection (but will work for all)
    collectionName: 'Universal Access',
    createdBy: req.user._id,
    expiresAt,
    isUniversal: true, // Mark this code as universal
    maxUses,
  });

  const createdCode = await oneTimeCode.save();

  res.status(201).json(createdCode);
});

// @desc    Generate multiple universal one-time access codes
// @route   POST /api/one-time-codes/batch-generate-universal
// @access  Private/Admin
const generateBatchUniversalCodes = asyncHandler(async (req, res) => {
  const { quantity, expiryDays, maxUses = 1 } = req.body;

  if (!quantity || quantity < 1 || quantity > 100) {
    res.status(400);
    throw new Error('Quantity must be between 1 and 100');
  }

  // Validate maxUses
  if (maxUses < 1 || maxUses > 1000) {
    res.status(400);
    throw new Error('Max uses must be between 1 and 1000');
  }

  // Create a placeholder collection reference
  // We'll use the first collection as a reference, but the codes will work universally
  const firstCollection = await Collection.findOne({ requiresCode: true });

  if (!firstCollection) {
    res.status(404);
    throw new Error('No collections with access protection found');
  }

  // Calculate expiration date for all codes
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (expiryDays || 90)); // Default to 90 days for universal codes

  // Generate codes
  const codesToCreate = [];
  const generatedCodes = [];

  for (let i = 0; i < quantity; i++) {
    // Generate a unique code with a special prefix to distinguish universal codes
    // Format: U-xxxxxx (where x is alphanumeric)
    const codeValue = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code = `U-${codeValue}`;
    generatedCodes.push(code);

    codesToCreate.push({
      code,
      collectionId: firstCollection._id, // Reference collection (but will work for all)
      collectionName: 'Universal Access',
      createdBy: req.user._id,
      expiresAt,
      isUniversal: true, // Mark this code as universal
      maxUses,
    });
  }

  // Insert all codes at once
  const createdCodes = await OneTimeCode.insertMany(codesToCreate);

  res.status(201).json({
    success: true,
    count: createdCodes.length,
    codes: createdCodes,
  });
});

// @desc    Validate and use a one-time code
// @route   POST /api/one-time-codes/validate
// @access  Private
const validateOneTimeCode = asyncHandler(async (req, res) => {
  const { code, collectionId } = req.body;

  if (!code) {
    res.status(400);
    throw new Error('Access code is required');
  }

  // Find the code
  const oneTimeCode = await OneTimeCode.findOne({ code: code.toUpperCase() });

  if (!oneTimeCode) {
    res.status(404);
    throw new Error('Invalid access code');
  }

  // Check if the code has reached its maximum uses
  if (oneTimeCode.currentUses >= oneTimeCode.maxUses) {
    res.status(400);
    throw new Error('This access code has reached its maximum number of uses');
  }

  // Check if the code is expired
  if (oneTimeCode.expiresAt < new Date()) {
    res.status(400);
    throw new Error('This access code has expired');
  }

  // Check if the code is universal or matches the requested collection
  if (
    !oneTimeCode.isUniversal &&
    collectionId &&
    oneTimeCode.collectionId.toString() !== collectionId
  ) {
    res.status(403);
    throw new Error(
      'This access code is not valid for the requested collection'
    );
  }

  // Get user's IP address and user agent for tracking
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';

  // Update the code usage
  oneTimeCode.currentUses += 1;

  // Add to usage history
  oneTimeCode.usageHistory.push({
    usedBy: req.user._id,
    usedAt: new Date(),
    ipAddress,
    userAgent,
  });

  // Mark as used if it reaches maximum uses (for backward compatibility)
  if (oneTimeCode.currentUses >= oneTimeCode.maxUses) {
    oneTimeCode.isUsed = true;
    oneTimeCode.usedBy = req.user._id;
    oneTimeCode.usedAt = new Date();
  }

  await oneTimeCode.save();

  // Get the collection info - if universal, get the specific requested collection
  const collectionToAccess = await Collection.findById(
    collectionId || oneTimeCode.collectionId
  );

  if (!collectionToAccess) {
    res.status(404);
    throw new Error('Collection not found');
  }

  // Add the collection to user's accessed collections
  const user = await User.findById(req.user._id);

  // Check if collection is already in user's accessedCollections
  const existingAccessedCollection = user.accessedCollections.find(
    (ac) => ac.collectionId.toString() === collectionToAccess._id.toString()
  );

  if (existingAccessedCollection) {
    // Update existing record
    existingAccessedCollection.lastAccessedAt = new Date();
    existingAccessedCollection.accessCount += 1;
    existingAccessedCollection.accessedWithCode = true;
  } else {
    // Add new record
    user.accessedCollections.push({
      collectionId: collectionToAccess._id,
      name: collectionToAccess.name,
      firstAccessedAt: new Date(),
      lastAccessedAt: new Date(),
      accessCount: 1,
      accessedWithCode: true,
    });
  }

  // Check if the collection is already in user's lockedCollections
  const existingLockedCollection = user.lockedCollections.find(
    (lc) => lc.collectionId.toString() === collectionToAccess._id.toString()
  );

  if (!existingLockedCollection) {
    // Add to lockedCollections if not already present
    // Set expiration to 1 year from now (or adjust as needed)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    user.lockedCollections.push({
      collectionId: collectionToAccess._id,
      name: collectionToAccess.name,
      status: 'active',
      purchasedAt: new Date(),
      expiresAt: expiresAt,
      price: 0, // Free access via code
    });
  } else if (existingLockedCollection.status !== 'active') {
    // If it exists but is expired, reactivate it
    existingLockedCollection.status = 'active';
    existingLockedCollection.purchasedAt = new Date();

    // Set new expiration date
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    existingLockedCollection.expiresAt = expiresAt;
  }

  await user.save();

  // Return success response with collection info and usage details
  res.status(200).json({
    success: true,
    message: oneTimeCode.isUniversal
      ? 'Universal access code successfully validated'
      : 'Access code successfully validated',
    collection: {
      _id: collectionToAccess._id,
      name: collectionToAccess.name,
      description: collectionToAccess.description,
      image: collectionToAccess.image,
    },
    codeUsage: {
      currentUses: oneTimeCode.currentUses,
      maxUses: oneTimeCode.maxUses,
      remainingUses: oneTimeCode.maxUses - oneTimeCode.currentUses,
    },
  });
});

// @desc    Get all active one-time codes for a collection (admin only)
// @route   GET /api/one-time-codes/:collectionId
// @access  Private/Admin
const getOneTimeCodesByCollection = asyncHandler(async (req, res) => {
  const collectionId = req.params.collectionId;

  // Verify the collection exists
  const collection = await Collection.findById(collectionId);
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }

  // Get codes that still have available uses for this collection
  const oneTimeCodes = await OneTimeCode.find({
    collectionId: collectionId,
    $expr: { $lt: ['$currentUses', '$maxUses'] }, // Still has available uses
    expiresAt: { $gt: new Date() }, // Not expired
  }).sort({ createdAt: -1 });

  res.json(oneTimeCodes);
});

// @desc    Get all one-time codes (with filtering options)
// @route   GET /api/one-time-codes
// @access  Private/Admin
const getAllOneTimeCodes = asyncHandler(async (req, res) => {
  const { isUsed, expired, collectionId, available } = req.query;
  const filter = {};

  // Apply filters if provided
  if (isUsed !== undefined) {
    filter.isUsed = isUsed === 'true';
  }

  if (available === 'true') {
    // Show only codes that still have available uses
    filter.$expr = { $lt: ['$currentUses', '$maxUses'] };
    filter.expiresAt = { $gt: new Date() };
  } else if (available === 'false') {
    // Show only exhausted codes
    filter.$expr = { $gte: ['$currentUses', '$maxUses'] };
  }

  if (expired === 'true') {
    filter.expiresAt = { $lt: new Date() };
  } else if (expired === 'false') {
    filter.expiresAt = { $gt: new Date() };
  }

  if (collectionId) {
    filter.collectionId = collectionId;
  }

  const oneTimeCodes = await OneTimeCode.find(filter)
    .populate('collectionId', 'name')
    .populate('createdBy', 'name')
    .populate('usedBy', 'name email')
    .populate('usageHistory.usedBy', 'name email')
    .sort({ createdAt: -1 });

  res.json(oneTimeCodes);
});

// @desc    Get all universal access codes
// @route   GET /api/one-time-codes/universal
// @access  Private/Admin
const getUniversalCodes = asyncHandler(async (req, res) => {
  // Get all universal codes that still have available uses
  const universalCodes = await OneTimeCode.find({
    isUniversal: true,
    $expr: { $lt: ['$currentUses', '$maxUses'] }, // Still has available uses
    expiresAt: { $gt: new Date() }, // Not expired
  }).populate('usageHistory.usedBy', 'name email')
    .sort({ createdAt: -1 });

  res.json(universalCodes);
});

// @desc    Delete a one-time code
// @route   DELETE /api/one-time-codes/:id
// @access  Private/Admin
const deleteOneTimeCode = asyncHandler(async (req, res) => {
  const oneTimeCode = await OneTimeCode.findById(req.params.id);

  if (!oneTimeCode) {
    res.status(404);
    throw new Error('Code not found');
  }

  // Allow deletion of codes that still have available uses or are completely exhausted
  // Only prevent deletion if the code has been partially used but still has uses remaining
  if (oneTimeCode.currentUses > 0 && oneTimeCode.currentUses < oneTimeCode.maxUses) {
    res.status(400);
    throw new Error('Cannot delete a code that has been partially used but still has remaining uses. Wait for it to be fully exhausted or expire.');
  }

  await oneTimeCode.deleteOne();
  res.json({ message: 'Access code removed' });
});

export {
  generateOneTimeCode,
  generateBatchCodes,
  generateUniversalCode,
  generateBatchUniversalCodes,
  validateOneTimeCode,
  getOneTimeCodesByCollection,
  getAllOneTimeCodes,
  getUniversalCodes,
  deleteOneTimeCode,
};
