import asyncHandler from '../middleware/asyncHandler.js';
import WorkoutSession from '../models/workoutSessionModel.js';
import WorkoutEntry from '../models/workoutEntryModel.js';
import Product from '../models/productModel.js';
import { startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';

// @desc    Create a new workout session
// @route   POST /api/workout-sessions
// @access  Private
const createWorkoutSession = asyncHandler(async (req, res) => {
  const {
    name,
    workoutType,
    difficulty,
    location,
    targetMuscleGroups,
    notes,
    isTemplate,
    templateName
  } = req.body;

  const session = await WorkoutSession.create({
    user: req.user._id,
    name: name || undefined,
    workoutType: workoutType || 'strength',
    difficulty: difficulty || 'intermediate',
    location: location || 'gym',
    targetMuscleGroups: targetMuscleGroups || [],
    notes: notes || '',
    isTemplate: isTemplate || false,
    templateName: templateName || undefined,
    status: 'active'
  });

  const populatedSession = await WorkoutSession.findById(session._id)
    .populate({
      path: 'exercises',
      populate: {
        path: 'product',
        select: 'name image muscleGroups primaryMuscleGroup'
      }
    });

  res.status(201).json(populatedSession);
});

// @desc    Get current active session for user
// @route   GET /api/workout-sessions/active
// @access  Private
const getActiveSession = asyncHandler(async (req, res) => {
  const activeSession = await WorkoutSession.findOne({
    user: req.user._id,
    status: 'active'
  })
    .populate({
      path: 'exercises',
      populate: {
        path: 'product',
        select: 'name image muscleGroups primaryMuscleGroup'
      },
      options: { sort: { exerciseOrder: 1 } }
    });

  res.json(activeSession);
});

// @desc    Get all workout sessions for user
// @route   GET /api/workout-sessions
// @access  Private
const getWorkoutSessions = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const { type, status, startDate, endDate } = req.query;

  const filter = { user: req.user._id };
  
  if (type) filter.workoutType = type;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.startTime = {};
    if (startDate) filter.startTime.$gte = new Date(startDate);
    if (endDate) filter.startTime.$lte = new Date(endDate);
  }

  const sessions = await WorkoutSession.find(filter)
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'exercises',
      populate: {
        path: 'product',
        select: 'name image muscleGroups primaryMuscleGroup'
      }
    });

  const total = await WorkoutSession.countDocuments(filter);

  res.json({
    sessions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get a specific workout session
// @route   GET /api/workout-sessions/:id
// @access  Private
const getWorkoutSessionById = asyncHandler(async (req, res) => {
  const session = await WorkoutSession.findById(req.params.id)
    .populate({
      path: 'exercises',
      populate: {
        path: 'product',
        select: 'name image muscleGroups primaryMuscleGroup instructions'
      },
      options: { sort: { exerciseOrder: 1 } }
    });

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Check if session belongs to user or user is admin
  if (session.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(401);
    throw new Error('Not authorized to view this session');
  }

  res.json(session);
});

// @desc    Update workout session
// @route   PUT /api/workout-sessions/:id
// @access  Private
const updateWorkoutSession = asyncHandler(async (req, res) => {
  const session = await WorkoutSession.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Check if session belongs to user or user is admin
  if (session.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(401);
    throw new Error('Not authorized to update this session');
  }

  const {
    name,
    status,
    endTime,
    notes,
    rating,
    energy,
    mood,
    location,
    caloriesBurned,
    tags,
    equipmentUsed
  } = req.body;

  // Update fields
  if (name !== undefined) session.name = name;
  if (status !== undefined) session.status = status;
  if (endTime !== undefined) session.endTime = new Date(endTime);
  if (notes !== undefined) session.notes = notes;
  if (rating !== undefined) session.rating = rating;
  if (energy !== undefined) session.energy = energy;
  if (mood !== undefined) session.mood = mood;
  if (location !== undefined) session.location = location;
  if (caloriesBurned !== undefined) session.caloriesBurned = caloriesBurned;
  if (tags !== undefined) session.tags = tags;
  if (equipmentUsed !== undefined) session.equipmentUsed = equipmentUsed;

  // If completing session, set end time if not provided
  if (status === 'completed' && !session.endTime) {
    session.endTime = new Date();
  }

  const updatedSession = await session.save();

  const populatedSession = await WorkoutSession.findById(updatedSession._id)
    .populate({
      path: 'exercises',
      populate: {
        path: 'product',
        select: 'name image muscleGroups primaryMuscleGroup'
      }
    });

  res.json(populatedSession);
});

// @desc    Delete workout session
// @route   DELETE /api/workout-sessions/:id
// @access  Private
const deleteWorkoutSession = asyncHandler(async (req, res) => {
  const session = await WorkoutSession.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Check if session belongs to user or user is admin
  if (session.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(401);
    throw new Error('Not authorized to delete this session');
  }

  // Remove session reference from workout entries
  await WorkoutEntry.updateMany(
    { session: session._id },
    { $unset: { session: 1 } }
  );

  await WorkoutSession.deleteOne({ _id: session._id });
  res.json({ message: 'Session removed' });
});

// @desc    Add exercise to session
// @route   POST /api/workout-sessions/:id/exercises
// @access  Private
const addExerciseToSession = asyncHandler(async (req, res) => {
  const session = await WorkoutSession.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Check if session belongs to user
  if (session.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to modify this session');
  }

  const { productId, sets, comments, feeling, restTime, exerciseOrder } = req.body;

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Exercise not found');
  }

  // Create workout entry
  const workoutEntry = await WorkoutEntry.create({
    user: req.user._id,
    product: productId,
    session: session._id,
    sets: sets || [],
    comments: comments || '',
    feeling: feeling || 'moderate',
    restTime: restTime || 90,
    exerciseOrder: exerciseOrder || session.exercises.length + 1,
    date: new Date()
  });

  // Add exercise to session
  session.exercises.push(workoutEntry._id);
  await session.save();

  // Return populated session
  const populatedSession = await WorkoutSession.findById(session._id)
    .populate({
      path: 'exercises',
      populate: {
        path: 'product',
        select: 'name image muscleGroups primaryMuscleGroup'
      }
    });

  res.json(populatedSession);
});

// @desc    Remove exercise from session
// @route   DELETE /api/workout-sessions/:id/exercises/:exerciseId
// @access  Private
const removeExerciseFromSession = asyncHandler(async (req, res) => {
  const session = await WorkoutSession.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Check if session belongs to user
  if (session.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to modify this session');
  }

  const exerciseId = req.params.exerciseId;

  // Remove exercise from session
  session.exercises = session.exercises.filter(
    ex => ex.toString() !== exerciseId
  );
  await session.save();

  // Delete the workout entry
  await WorkoutEntry.findByIdAndDelete(exerciseId);

  res.json({ message: 'Exercise removed from session' });
});

// @desc    Auto-group individual exercises into sessions
// @route   POST /api/workout-sessions/auto-group
// @access  Private
const autoGroupExercises = asyncHandler(async (req, res) => {
  const { timeWindow = 3 } = req.body; // hours

  // Get recent workout entries without sessions
  const entries = await WorkoutEntry.find({
    user: req.user._id,
    session: { $exists: false },
    date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  })
    .sort({ date: 1 })
    .populate('product', 'name muscleGroups primaryMuscleGroup');

  if (entries.length === 0) {
    return res.json({ message: 'No ungrouped exercises found', sessionsCreated: 0 });
  }

  const sessions = [];
  let currentSession = null;
  let sessionsCreated = 0;

  for (const entry of entries) {
    const entryTime = new Date(entry.date);

    if (currentSession && 
        (entryTime - currentSession.startTime) <= (timeWindow * 60 * 60 * 1000)) {
      currentSession.exercises.push(entry._id);
      currentSession.endTime = entryTime;
      
      if (entry.product.muscleGroups) {
        entry.product.muscleGroups.forEach(group => {
          if (!currentSession.targetMuscleGroups.includes(group)) {
            currentSession.targetMuscleGroups.push(group);
          }
        });
      }
    } else {
      currentSession = {
        user: req.user._id,
        startTime: entryTime,
        endTime: entryTime,
        exercises: [entry._id],
        status: 'completed',
        targetMuscleGroups: entry.product.muscleGroups || [],
        workoutType: 'strength'
      };
      sessions.push(currentSession);
    }
  }

  for (const sessionData of sessions) {
    const session = await WorkoutSession.create(sessionData);
    
    await WorkoutEntry.updateMany(
      { _id: { $in: sessionData.exercises } },
      { session: session._id }
    );
    
    sessionsCreated++;
  }

  res.json({
    message: `Successfully grouped ${entries.length} exercises into ${sessionsCreated} sessions`,
    sessionsCreated
  });
});

// @desc    Get workout statistics
// @route   GET /api/workout-sessions/stats
// @access  Private
const getWorkoutStats = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  
  let startDate;
  switch (period) {
    case 'week':
      startDate = subWeeks(new Date(), 1);
      break;
    case 'month':
      startDate = subMonths(new Date(), 1);
      break;
    case 'year':
      startDate = subMonths(new Date(), 12);
      break;
    default:
      startDate = subMonths(new Date(), 1);
  }

  const sessions = await WorkoutSession.find({
    user: req.user._id,
    startTime: { $gte: startDate },
    status: 'completed'
  }).populate('exercises');

  // Calculate statistics
  const stats = {
    totalWorkouts: sessions.length,
    totalDuration: sessions.reduce((sum, session) => sum + (session.duration || 0), 0),
    totalVolume: sessions.reduce((sum, session) => sum + (session.totalVolume || 0), 0),
    totalSets: sessions.reduce((sum, session) => sum + (session.totalSets || 0), 0),
    totalReps: sessions.reduce((sum, session) => sum + (session.totalReps || 0), 0),
    averageRating: sessions.length > 0 ? 
      sessions.reduce((sum, session) => sum + (session.rating || 0), 0) / sessions.length : 0,
    muscleGroupFrequency: {},
    workoutTypeDistribution: {},
    weeklyProgress: []
  };

  // Calculate muscle group frequency
  sessions.forEach(session => {
    session.targetMuscleGroups.forEach(group => {
      stats.muscleGroupFrequency[group] = (stats.muscleGroupFrequency[group] || 0) + 1;
    });
  });

  // Calculate workout type distribution
  sessions.forEach(session => {
    stats.workoutTypeDistribution[session.workoutType] = 
      (stats.workoutTypeDistribution[session.workoutType] || 0) + 1;
  });

  res.json(stats);
});

// @desc    Get workout templates
// @route   GET /api/workout-sessions/templates
// @access  Private
const getWorkoutTemplates = asyncHandler(async (req, res) => {
  const templates = await WorkoutSession.find({
    user: req.user._id,
    isTemplate: true
  })
    .populate({
      path: 'exercises',
      populate: {
        path: 'product',
        select: 'name image muscleGroups primaryMuscleGroup'
      }
    });

  res.json(templates);
});

// @desc    Create session from template
// @route   POST /api/workout-sessions/from-template/:templateId
// @access  Private
const createFromTemplate = asyncHandler(async (req, res) => {
  const template = await WorkoutSession.findById(req.params.templateId)
    .populate('exercises');

  if (!template || !template.isTemplate) {
    res.status(404);
    throw new Error('Template not found');
  }

  // Check if template belongs to user
  if (template.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to use this template');
  }

  // Create new session from template
  const sessionData = {
    user: req.user._id,
    name: template.templateName || template.name,
    workoutType: template.workoutType,
    targetMuscleGroups: template.targetMuscleGroups,
    difficulty: template.difficulty,
    location: template.location,
    equipmentUsed: template.equipmentUsed,
    notes: `Created from template: ${template.templateName}`,
    status: 'active'
  };

  const session = await WorkoutSession.create(sessionData);

  // Copy exercises from template
  for (const templateExercise of template.exercises) {
    const workoutEntry = await WorkoutEntry.create({
      user: req.user._id,
      product: templateExercise.product,
      session: session._id,
      sets: [], // Start with empty sets
      exerciseOrder: templateExercise.exerciseOrder,
      restTime: templateExercise.restTime,
      date: new Date()
    });

    session.exercises.push(workoutEntry._id);
  }

  await session.save();

  const populatedSession = await WorkoutSession.findById(session._id)
    .populate({
      path: 'exercises',
      populate: {
        path: 'product',
        select: 'name image muscleGroups primaryMuscleGroup'
      }
    });

  res.json(populatedSession);
});

export {
  createWorkoutSession,
  getActiveSession,
  getWorkoutSessions,
  getWorkoutSessionById,
  updateWorkoutSession,
  deleteWorkoutSession,
  addExerciseToSession,
  removeExerciseFromSession,
  autoGroupExercises,
  getWorkoutStats,
  getWorkoutTemplates,
  createFromTemplate
}; 