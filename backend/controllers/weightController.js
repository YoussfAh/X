import asyncHandler from '../middleware/asyncHandler.js';
import Weight from '../models/weightModel.js';

// @desc    Create new weight entry
// @route   POST /api/weight
// @access  Private
const createWeightEntry = asyncHandler(async (req, res) => {
  const { weight, unit, date, notes } = req.body;

  if (!weight || !date) {
    res.status(400);
    throw new Error('Please provide weight and date.');
  }

  const weightEntry = new Weight({
    user: req.user._id,
    weight,
    unit: unit || 'kg',
    date: new Date(date),
    notes: notes || '',
    tenantId: req.tenantId, // Add tenant context
  });

  const createdWeightEntry = await weightEntry.save();
  res.status(201).json(createdWeightEntry);
});

// @desc    Get user's weight entries
// @route   GET /api/weight
// @access  Private
const getWeightEntries = asyncHandler(async (req, res) => {
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

  const weightEntries = await Weight.find(filter)
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Weight.countDocuments(filter);

  res.json({
    weightEntries,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
});

// @desc    Get weight entry by ID
// @route   GET /api/weight/:id
// @access  Private
const getWeightEntryById = asyncHandler(async (req, res) => {
  const weightEntry = await Weight.findById(req.params.id);

  if (!weightEntry) {
    res.status(404);
    throw new Error('Weight entry not found');
  }

  if (weightEntry.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  res.json(weightEntry);
});

// @desc    Update weight entry
// @route   PUT /api/weight/:id
// @access  Private
const updateWeightEntry = asyncHandler(async (req, res) => {
  const weightEntry = await Weight.findById(req.params.id);

  if (!weightEntry) {
    res.status(404);
    throw new Error('Weight entry not found');
  }

  if (weightEntry.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  const { weight, unit, date, notes } = req.body;

  weightEntry.weight = weight || weightEntry.weight;
  weightEntry.unit = unit || weightEntry.unit;
  weightEntry.date = date ? new Date(date) : weightEntry.date;
  weightEntry.notes = notes !== undefined ? notes : weightEntry.notes;

  const updatedWeightEntry = await weightEntry.save();
  res.json(updatedWeightEntry);
});

// @desc    Delete weight entry
// @route   DELETE /api/weight/:id
// @access  Private
const deleteWeightEntry = asyncHandler(async (req, res) => {
  const weightEntry = await Weight.findById(req.params.id);

  if (!weightEntry) {
    res.status(404);
    throw new Error('Weight entry not found');
  }

  if (weightEntry.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  await weightEntry.deleteOne();
  res.json({ message: 'Weight entry removed' });
});

// @desc    Get latest weight entry
// @route   GET /api/weight/latest
// @access  Private
const getLatestWeightEntry = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  
  // Add tenant filtering
  if (req.tenantId) {
    filter.tenantId = req.tenantId;
  }

  const weightEntry = await Weight.findOne(filter).sort({ date: -1 });

  res.json(weightEntry);
});

export {
  createWeightEntry,
  getWeightEntries,
  getWeightEntryById,
  updateWeightEntry,
  deleteWeightEntry,
  getLatestWeightEntry,
}; 