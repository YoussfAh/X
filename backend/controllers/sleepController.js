import asyncHandler from '../middleware/asyncHandler.js';
import SleepEntry from '../models/sleepModel.js';
import User from '../models/userModel.js';

// @desc    Create new sleep entry
// @route   POST /api/sleep
// @access  Private
const createSleepEntry = asyncHandler(async (req, res) => {
  const { sleepTime, wakeUpTime, date } = req.body;

  if (!sleepTime || !wakeUpTime || !date) {
    res.status(400);
    throw new Error('Please provide sleep time, wake up time, and date.');
  }

  const sleepEntry = new SleepEntry({
    user: req.user._id,
    sleepTime,
    wakeUpTime,
    date,
    tenantId: req.tenantId, // Add tenant context
  });

  const createdSleepEntry = await sleepEntry.save();
  res.status(201).json(createdSleepEntry);
});

// @desc    Get user's sleep entries
// @route   GET /api/sleep
// @access  Private
const getSleepEntries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, startDate, endDate } = req.query;

  const filter = { user: req.user._id };

  // Add tenant filtering
  if (req.tenantId) {
    filter.tenantId = req.tenantId;
  }

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.date.$lte = new Date(endDate);
    }
  }

  const sleepEntries = await SleepEntry.find(filter)
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await SleepEntry.countDocuments(filter);

  res.json({
    sleepEntries,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
});

// @desc    Get sleep entry by ID
// @route   GET /api/sleep/:id
// @access  Private
const getSleepEntryById = asyncHandler(async (req, res) => {
  const sleepEntry = await SleepEntry.findById(req.params.id);

  if (!sleepEntry) {
    res.status(404);
    throw new Error('Sleep entry not found');
  }

  if (sleepEntry.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  res.json(sleepEntry);
});

// @desc    Update sleep entry
// @route   PUT /api/sleep/:id
// @access  Private
const updateSleepEntry = asyncHandler(async (req, res) => {
  const sleepEntry = await SleepEntry.findById(req.params.id);

  if (!sleepEntry) {
    res.status(404);
    throw new Error('Sleep entry not found');
  }

  if (sleepEntry.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  const { sleepTime, wakeUpTime, date } = req.body;

  sleepEntry.sleepTime = sleepTime || sleepEntry.sleepTime;
  sleepEntry.wakeUpTime = wakeUpTime || sleepEntry.wakeUpTime;
  sleepEntry.date = date || sleepEntry.date;

  const updatedSleepEntry = await sleepEntry.save();
  res.json(updatedSleepEntry);
});

// @desc    Delete sleep entry
// @route   DELETE /api/sleep/:id
// @access  Private
const deleteSleepEntry = asyncHandler(async (req, res) => {
  const sleepEntry = await SleepEntry.findById(req.params.id);

  if (!sleepEntry) {
    res.status(404);
    throw new Error('Sleep entry not found');
  }

  if (sleepEntry.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  await sleepEntry.deleteOne();
  res.json({ message: 'Sleep entry removed' });
});

// @desc    Get user's sleep entries (for admin)
// @route   GET /api/sleep/user/:userId
// @access  Private/Admin
const getSleepEntriesForUser_Admin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, startDate, endDate } = req.query;
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const filter = { user: userId };

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.date.$lte = new Date(endDate);
    }
  }

  const sleepEntries = await SleepEntry.find(filter)
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await SleepEntry.countDocuments(filter);

  res.json({
    sleepEntries,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
});

// @desc    Start a new sleep entry (log sleep time)
// @route   POST /api/sleep/start
// @access  Private
const startSleep = asyncHandler(async (req, res) => {
  const existingOpenSleep = await SleepEntry.findOne({
    user: req.user._id,
    wakeUpTime: null,
  });

  if (existingOpenSleep) {
    res.status(400);
    throw new Error(
      'You have an open sleep session. Please end it before starting a new one.'
    );
  }

  const sleepTime = req.body.customTime
    ? new Date(req.body.customTime)
    : new Date();

  const sleepEntry = new SleepEntry({
    user: req.user._id,
    sleepTime,
    date: new Date(sleepTime), // Use the sleep time to set the date
    tenantId: req.tenantId, // Add tenant context
  });

  const createdSleepEntry = await sleepEntry.save();
  res.status(201).json(createdSleepEntry);
});

// @desc    End a sleep entry (log wake up time)
// @route   PUT /api/sleep/end
// @access  Private
const endSleep = asyncHandler(async (req, res) => {
  const sleepEntry = await SleepEntry.findOne({
    user: req.user._id,
    wakeUpTime: null,
  }).sort({ sleepTime: -1 });

  if (!sleepEntry) {
    res.status(404);
    throw new Error('No active sleep session found to end.');
  }

  sleepEntry.wakeUpTime = req.body.customTime
    ? new Date(req.body.customTime)
    : new Date();

  // Calculate duration in minutes
  const duration = Math.round(
    (sleepEntry.wakeUpTime - sleepEntry.sleepTime) / (1000 * 60)
  );
  sleepEntry.duration = duration;

  const updatedSleepEntry = await sleepEntry.save();
  res.json(updatedSleepEntry);
});

// @desc    Get current open sleep entry
// @route   GET /api/sleep/current
// @access  Private
const getCurrentSleepEntry = asyncHandler(async (req, res) => {
  const sleepEntry = await SleepEntry.findOne({
    user: req.user._id,
    wakeUpTime: null,
  }).sort({ createdAt: -1 });

  if (sleepEntry) {
    res.json(sleepEntry);
  } else {
    res.json(null);
  }
});

// @desc    Skip current sleep cycle phase
// @route   POST /api/sleep/skip
// @access  Private
const skipSleepPhase = asyncHandler(async (req, res) => {
  const currentSleep = await SleepEntry.findOne({
    user: req.user._id,
    wakeUpTime: null,
  }).sort({ createdAt: -1 });

  if (currentSleep) {
    // If there's an active sleep session, skip the wake-up recording
    // Mark it as ended with a skipped wake-up time
    currentSleep.wakeUpTime = new Date();
    currentSleep.skippedWakeUp = true;

    // Calculate duration in minutes
    const duration = Math.round(
      (currentSleep.wakeUpTime - currentSleep.sleepTime) / (1000 * 60)
    );
    currentSleep.duration = duration;

    await currentSleep.save();
    res.json({
      message: 'Wake-up time skipped, ready to record new sleep time',
      skippedPhase: 'wakeup',
    });
  } else {
    // If there's no active sleep session, skip the sleep recording
    // Create a new entry with skipped sleep time (use current time as default)
    const sleepEntry = new SleepEntry({
      user: req.user._id,
      sleepTime: new Date(),
      skippedSleep: true,
      date: new Date(),
    });

    await sleepEntry.save();
    res.json({
      message: 'Sleep time skipped, ready to record wake-up time',
      sleepEntry,
      skippedPhase: 'sleep',
    });
  }
});

export {
  createSleepEntry,
  getSleepEntries,
  getSleepEntryById,
  updateSleepEntry,
  deleteSleepEntry,
  getSleepEntriesForUser_Admin,
  startSleep,
  endSleep,
  getCurrentSleepEntry,
  skipSleepPhase,
};
