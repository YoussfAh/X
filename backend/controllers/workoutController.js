import asyncHandler from '../middleware/asyncHandler.js';
import WorkoutEntry from '../models/workoutEntryModel.js';
import WorkoutSession from '../models/workoutSessionModel.js';
import Product from '../models/productModel.js';
import Collection from '../models/collectionModel.js';

// @desc    Add workout entry for a product
// @route   POST /api/workout
// @access  Private
const addWorkoutEntry = asyncHandler(async (req, res) => {
  const { productId, collectionId, sets, comments, feeling, sessionId, autoCreateSession = true } = req.body;

  // Validate input
  if (!productId || !sets || !sets.length) {
    res.status(400);
    throw new Error('Missing required fields - productId and sets are required');
  }

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Exercise not found');
  }

  // Verify collection exists if provided
  let collection = null;
  if (collectionId) {
    collection = await Collection.findById(collectionId);
    if (!collection) {
      res.status(404);
      throw new Error('Collection not found');
    }
  }

  // Handle session association
  let session = null;
  if (sessionId) {
    // Use provided session
    session = await WorkoutSession.findById(sessionId);
    if (!session || session.user.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error('Session not found or not authorized');
    }
  } else if (autoCreateSession) {
    // Find active session or create new one
    session = await WorkoutSession.findOne({
      user: req.user._id,
      status: 'active',
      ...(req.tenantId && { tenantId: req.tenantId })
    });

    if (!session) {
      // Create new session
      session = await WorkoutSession.create({
        tenantId: req.tenantId || null,
        user: req.user._id,
        workoutType: product.exerciseType || 'strength',
        targetMuscleGroups: product.muscleGroups || [],
        status: 'active'
      });
    }
  }

  // Validate sets data
  const validatedSets = sets.map(set => ({
    weight: Number(set.weight),
    reps: Number(set.reps),
    notes: set.notes || ''
  }));

  // Get next exercise order for session
  let exerciseOrder = 1;
  if (session) {
    const existingExercises = await WorkoutEntry.countDocuments({ session: session._id });
    exerciseOrder = existingExercises + 1;
  }

  // Create entry with session reference and tenant ID
  const workoutEntry = await WorkoutEntry.create({
    tenantId: req.tenantId || null,
    user: req.user._id,
    product: productId,
    session: session?._id || null,
    collectionId: collection?._id || null,
    parentCollection: collection?.parentCollection || null,
    sets: validatedSets,
    feeling: feeling || 'moderate',
    comments: comments || '',
    exerciseOrder,
    date: new Date()
  });

  // Add exercise to session if session exists
  if (session) {
    if (!session.exercises.includes(workoutEntry._id)) {
      session.exercises.push(workoutEntry._id);
      await session.save();
    }
  }

  if (workoutEntry) {
    const populatedEntry = await WorkoutEntry.findById(workoutEntry._id)
      .populate('product', 'name image muscleGroups primaryMuscleGroup')
      .populate('session', 'name startTime status')
      .populate('collectionId', 'name')
      .populate('parentCollection', 'name')
      .populate('user', 'name');

    res.status(201).json(populatedEntry);
  } else {
    res.status(400);
    throw new Error('Invalid workout data');
  }
});

// @desc    Get all workout entries for current user
// @route   GET /api/workout
// @access  Private
const getMyWorkoutEntries = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  
  // Add tenant filter
  if (req.tenantId) {
    filter.tenantId = req.tenantId;
  }

  const entries = await WorkoutEntry.find(filter)
    .sort({ date: -1 })
    .populate('product', 'name image muscleGroups primaryMuscleGroup')
    .populate('collectionId', 'name')
    .populate('parentCollection', 'name');

  res.json(entries);
});

// @desc    Get workout entries for specific product
// @route   GET /api/workout/product/:productId
// @access  Private
const getWorkoutEntriesByProduct = asyncHandler(async (req, res) => {
  const filter = {
    user: req.user._id,
    product: req.params.productId
  };
  
  // Add tenant filter
  if (req.tenantId) {
    filter.tenantId = req.tenantId;
  }

  const entries = await WorkoutEntry.find(filter)
    .sort({ date: -1 })
    .populate('product', 'name image muscleGroups primaryMuscleGroup')
    .populate('collectionId', 'name')
    .populate('parentCollection', 'name');

  res.json(entries);
});

// @desc    Get a specific workout entry
// @route   GET /api/workout/:id
// @access  Private
const getWorkoutEntryById = asyncHandler(async (req, res) => {
  const entry = await WorkoutEntry.findById(req.params.id)
    .populate('product', 'name image muscleGroups primaryMuscleGroup')
    .populate('collectionId', 'name')
    .populate('parentCollection', 'name')
    .populate('user', 'name');

  if (entry) {
    // Check if entry belongs to user or user is admin
    if (entry.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      res.status(401);
      throw new Error('Not authorized to view this entry');
    }

    res.json(entry);
  } else {
    res.status(404);
    throw new Error('Entry not found');
  }
});

// @desc    Update a workout entry
// @route   PUT /api/workout/:id
// @access  Private
const updateWorkoutEntry = asyncHandler(async (req, res) => {
  const { sets, comments, feeling } = req.body;

  const entry = await WorkoutEntry.findById(req.params.id);

  if (entry) {
    // Check if entry belongs to user or user is admin
    if (entry.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      res.status(401);
      throw new Error('Not authorized to update this entry');
    }

    // Validate sets data if provided
    const validatedSets = sets ? sets.map(set => ({
      weight: Number(set.weight),
      reps: Number(set.reps),
      notes: set.notes || ''
    })) : entry.sets;

    entry.sets = validatedSets;
    entry.comments = comments !== undefined ? comments : entry.comments;
    entry.feeling = feeling || entry.feeling;

    const updatedEntry = await entry.save();

    // Return populated entry
    const populatedEntry = await WorkoutEntry.findById(updatedEntry._id)
      .populate('product', 'name image muscleGroups primaryMuscleGroup')
      .populate('collectionId', 'name')
      .populate('parentCollection', 'name')
      .populate('user', 'name');

    res.json(populatedEntry);
  } else {
    res.status(404);
    throw new Error('Entry not found');
  }
});

// @desc    Delete a workout entry
// @route   DELETE /api/workout/:id
// @access  Private
const deleteWorkoutEntry = asyncHandler(async (req, res) => {
  const entry = await WorkoutEntry.findById(req.params.id);

  if (entry) {
    // Check if entry belongs to user or user is admin
    if (entry.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      res.status(401);
      throw new Error('Not authorized to delete this entry');
    }

    await WorkoutEntry.deleteOne({ _id: entry._id });
    res.json({ message: 'Entry removed' });
  } else {
    res.status(404);
    throw new Error('Entry not found');
  }
});

// @desc    Get workout entries for a specific user (Admin only)
// @route   GET /api/workout/admin/user/:userId
// @access  Private/Admin
const getUserWorkoutEntries = asyncHandler(async (req, res) => {
  const entries = await WorkoutEntry.find({ user: req.params.userId })
    .sort({ date: -1 })
    .populate('product', 'name image muscleGroups primaryMuscleGroup')
    .populate('collectionId', 'name')
    .populate('parentCollection', 'name')
    .populate('user', 'name');

  res.json(entries);
});

// @desc    Get all workout entries (Admin only)
// @route   GET /api/workout/admin/all
// @access  Private/Admin
const getAllWorkoutEntries = asyncHandler(async (req, res) => {
  const pageSize = 10; // Display 10 workouts per page
  const page = Number(req.query.pageNumber) || 1;

  // Build search and filter parameters
  let keyword = req.query.keyword ? req.query.keyword.trim() : '';
  let filterUser = req.query.user ? req.query.user.trim() : '';
  let filterProduct = req.query.product ? req.query.product.trim() : '';

  // We need to perform aggregation to search through populated fields
  // Create a match criteria object with $and operator for combining filters
  const matchCriteria = { $and: [] };

  // Add keyword search if provided
  if (keyword) {
    matchCriteria.$and.push({
      $or: [
        { 'productData.name': { $regex: keyword, $options: 'i' } },
        { 'userData.name': { $regex: keyword, $options: 'i' } },
        { 'collectionData.name': { $regex: keyword, $options: 'i' } },
        { 'comments': { $regex: keyword, $options: 'i' } }
      ]
    });
  }

  // Add user filter if provided
  if (filterUser) {
    matchCriteria.$and.push({
      'userData.name': { $regex: filterUser, $options: 'i' }
    });
  }

  // Add product filter if provided
  if (filterProduct) {
    matchCriteria.$and.push({
      'productData.name': { $regex: filterProduct, $options: 'i' }
    });
  }

  // If we have no $and conditions, remove it
  if (matchCriteria.$and.length === 0) {
    delete matchCriteria.$and;
  }

  // Get the total count for pagination and all filtered entries for global stats
  const filteredEntries = await WorkoutEntry.aggregate([
    // First lookup product details
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productData'
      }
    },
    // Then lookup user details
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userData'
      }
    },
    // Then lookup collection details
    {
      $lookup: {
        from: 'collections',
        localField: 'collectionId',
        foreignField: '_id',
        as: 'collectionData'
      }
    },
    // Apply all our filter criteria
    { $match: matchCriteria.$and ? matchCriteria : {} }
  ]);

  const count = filteredEntries.length;

  // Calculate global statistics across all matching entries
  let globalStats = {
    totalWorkouts: count,
    totalSets: 0,
    totalWeight: 0,
    totalReps: 0,
    repsCount: 0
  };

  // Calculate stats from all filtered entries
  filteredEntries.forEach(entry => {
    if (entry.sets && entry.sets.length) {
      globalStats.totalSets += entry.sets.length;

      entry.sets.forEach(set => {
        if (set.weight) globalStats.totalWeight += set.weight;
        if (set.reps) {
          globalStats.totalReps += set.reps;
          globalStats.repsCount++;
        }
      });
    }
  });

  // Calculate average reps per set
  globalStats.avgReps = globalStats.repsCount > 0
    ? Math.round(globalStats.totalReps / globalStats.repsCount)
    : 0;

  // Round the total weight for cleaner display
  globalStats.totalWeight = Math.round(globalStats.totalWeight);

  // Now perform the actual query with pagination for the current page entries
  const paginatedEntries = await WorkoutEntry.aggregate([
    // First lookup product details
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productData'
      }
    },
    // Then lookup user details
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userData'
      }
    },
    // Then lookup collection details
    {
      $lookup: {
        from: 'collections',
        localField: 'collectionId',
        foreignField: '_id',
        as: 'collectionData'
      }
    },
    // Apply all our filter criteria
    { $match: matchCriteria.$and ? matchCriteria : {} },
    // Sort by date, newest first
    { $sort: { date: -1 } },
    // Apply pagination
    { $skip: pageSize * (page - 1) },
    { $limit: pageSize }
  ]);

  // Now we need to properly populate the references for the frontend
  const populatedEntries = await WorkoutEntry.populate(paginatedEntries, [
    { path: 'product', select: 'name image' },
    { path: 'collectionId', select: 'name' },
    { path: 'parentCollection', select: 'name' },
    { path: 'user', select: 'name' }
  ]);

  return res.json({
    entries: populatedEntries,
    page,
    pages: Math.ceil(count / pageSize),
    count: count,
    globalStats // Include the global stats in the response
  });
});

export {
  addWorkoutEntry,
  getMyWorkoutEntries,
  getWorkoutEntriesByProduct,
  getWorkoutEntryById,
  updateWorkoutEntry,
  deleteWorkoutEntry,
  getUserWorkoutEntries,
  getAllWorkoutEntries
};
