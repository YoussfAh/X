import asyncHandler from '../middleware/asyncHandler.js';
import WaterTracking from '../models/waterTrackingModel.js';

// @desc    Get today's water tracking
// @route   GET /api/water-tracking/today
// @access  Private
const getTodaysWaterTracking = asyncHandler(async (req, res) => {
  const tracking = await WaterTracking.getTodaysTracking(req.user._id);
  
  res.json({
    success: true,
    data: tracking
  });
});

// @desc    Get water tracking history
// @route   GET /api/water-tracking/history
// @access  Private
const getWaterTrackingHistory = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 30 } = req.query;
  
  const query = { user: req.user._id };
  
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const history = await WaterTracking.find(query)
    .sort({ date: -1 })
    .limit(parseInt(limit));
  
  res.json({
    success: true,
    count: history.length,
    data: history
  });
});

// @desc    Add water glasses
// @route   POST /api/water-tracking/add
// @access  Private
const addWaterIntake = asyncHandler(async (req, res) => {
  const { amount = 1, note = '' } = req.body;
  
  if (amount <= 0 || amount > 10) {
    res.status(400);
    throw new Error('Amount must be between 1 and 10 glasses');
  }
  
  const tracking = await WaterTracking.getTodaysTracking(req.user._id);
  await tracking.addWater(amount, note);
  
  res.json({
    success: true,
    message: `Added ${amount} glass${amount > 1 ? 'es' : ''} of water`,
    data: tracking
  });
});

// @desc    Remove water glasses
// @route   POST /api/water-tracking/remove
// @access  Private
const removeWaterIntake = asyncHandler(async (req, res) => {
  const { amount = 1 } = req.body;
  
  if (amount <= 0 || amount > 10) {
    res.status(400);
    throw new Error('Amount must be between 1 and 10 glasses');
  }
  
  const tracking = await WaterTracking.getTodaysTracking(req.user._id);
  await tracking.removeWater(amount);
  
  res.json({
    success: true,
    message: `Removed ${amount} glass${amount > 1 ? 'es' : ''} of water`,
    data: tracking
  });
});

// @desc    Reset daily water intake
// @route   POST /api/water-tracking/reset
// @access  Private
const resetWaterIntake = asyncHandler(async (req, res) => {
  const tracking = await WaterTracking.getTodaysTracking(req.user._id);
  await tracking.resetWater();
  
  res.json({
    success: true,
    message: 'Water intake reset to 0',
    data: tracking
  });
});

// @desc    Update daily water goal
// @route   PUT /api/water-tracking/goal
// @access  Private
const updateWaterGoal = asyncHandler(async (req, res) => {
  const { goal } = req.body;
  
  if (!goal || goal < 1 || goal > 20) {
    res.status(400);
    throw new Error('Goal must be between 1 and 20 glasses');
  }
  
  const tracking = await WaterTracking.getTodaysTracking(req.user._id);
  tracking.goal = goal;
  await tracking.save();
  
  res.json({
    success: true,
    message: `Daily water goal updated to ${goal} glasses`,
    data: tracking
  });
});

// @desc    Get water tracking analytics
// @route   GET /api/water-tracking/analytics
// @access  Private
const getWaterTrackingAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  
  const analytics = await WaterTracking.aggregate([
    {
      $match: {
        user: req.user._id,
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalGlasses: { $sum: '$glasses' },
        avgGlasses: { $avg: '$glasses' },
        maxGlasses: { $max: '$glasses' },
        daysTracked: { $sum: 1 },
        daysMetGoal: {
          $sum: {
            $cond: [
              { $gte: ['$glasses', '$goal'] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  const result = analytics[0] || {
    totalGlasses: 0,
    avgGlasses: 0,
    maxGlasses: 0,
    daysTracked: 0,
    daysMetGoal: 0
  };
  
  // Calculate weekly data for the last 7 days
  const weeklyData = await WaterTracking.find({
    user: req.user._id,
    date: {
      $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  }).sort({ date: 1 });
  
  res.json({
    success: true,
    data: {
      ...result,
      weeklyData,
      streakDays: 0 // Calculate streak if needed
    }
  });
});

export {
  getTodaysWaterTracking,
  getWaterTrackingHistory,
  addWaterIntake,
  removeWaterIntake,
  resetWaterIntake,
  updateWaterGoal,
  getWaterTrackingAnalytics
}; 