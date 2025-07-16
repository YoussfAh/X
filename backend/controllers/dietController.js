import asyncHandler from '../middleware/asyncHandler.js';
import DietEntry from '../models/dietEntryModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';

// @desc    Create new diet entry
// @route   POST /api/diet
// @access  Private
const createDietEntry = asyncHandler(async (req, res) => {
  const {
    productId,
    collectionId,
    mealType,
    items,
    feeling,
    energyLevel,
    comments,
    date,
    isCustomMeal,
    customMealName,
    customMealDescription,
    customNutrition,
    image,
  } = req.body;

  let product = null;
  let calculatedNutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  };

  if (isCustomMeal) {
    // For custom meals, use provided nutrition data
    calculatedNutrition = customNutrition || calculatedNutrition;
  } else {
    // Validate product exists and is a meal/diet product
    const productQuery = { _id: productId };
    if (req.tenantId) {
      productQuery.tenantId = req.tenantId;
    }
    
    product = await Product.findOne(productQuery);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    if (!product.isMealDiet) {
      res.status(400);
      throw new Error('Product is not a meal/diet item');
    }

    // Calculate nutrition based on product nutrition and quantities
    if (items && items.length > 0) {
      items.forEach((item) => {
        const multiplier = item.quantity || 1;

        // Convert units if needed (basic conversion for common units)
        let unitMultiplier = 1;
        if (item.unit === 'grams' && product.nutrition.servingWeight) {
          unitMultiplier = item.quantity / product.nutrition.servingWeight;
        } else {
          unitMultiplier = multiplier;
        }

        calculatedNutrition.calories +=
          (product.nutrition.calories || 0) * unitMultiplier;
        calculatedNutrition.protein +=
          (product.nutrition.protein || 0) * unitMultiplier;
        calculatedNutrition.carbs +=
          (product.nutrition.carbs || 0) * unitMultiplier;
        calculatedNutrition.fat +=
          (product.nutrition.fat || 0) * unitMultiplier;
        calculatedNutrition.fiber +=
          (product.nutrition.fiber || 0) * unitMultiplier;
      });
    } else {
      // Default to 1 serving if no items specified
      calculatedNutrition = {
        calories: product.nutrition.calories || 0,
        protein: product.nutrition.protein || 0,
        carbs: product.nutrition.carbs || 0,
        fat: product.nutrition.fat || 0,
        fiber: product.nutrition.fiber || 0,
      };
    }
  }

  const dietEntry = new DietEntry({
    user: req.user._id,
    product: isCustomMeal ? null : productId,
    collectionId,
    date: date || Date.now(),
    mealType: mealType || 'other',
    items: items || [{ quantity: 1, unit: 'serving' }],
    feeling: feeling || 'satisfied',
    energyLevel: energyLevel || 'medium',
    comments,
    calories: Math.round(calculatedNutrition.calories),
    protein: Math.round(calculatedNutrition.protein * 10) / 10,
    carbs: Math.round(calculatedNutrition.carbs * 10) / 10,
    fat: Math.round(calculatedNutrition.fat * 10) / 10,
    fiber: Math.round(calculatedNutrition.fiber * 10) / 10,
    isCustomMeal,
    customMealName,
    customMealDescription,
    customNutrition: isCustomMeal ? customNutrition : undefined,
    image,
    tenantId: req.tenantId, // Add tenant context
  });

  const createdDietEntry = await dietEntry.save();

  // Populate product details for response
  const populatedEntry = await DietEntry.findById(createdDietEntry._id)
    .populate('product', 'name image nutrition mealType')
    .populate('collectionId', 'name');

  res.status(201).json(populatedEntry);
});

// @desc    Get user's diet entries
// @route   GET /api/diet
// @access  Private
const getDietEntries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, startDate, endDate, mealType } = req.query;

  const filter = { user: req.user._id };

  // Add tenant filtering
  if (req.tenantId) {
    filter.tenantId = req.tenantId;
  }

  // Date filtering
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter.date.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  // Meal type filtering
  if (mealType && mealType !== 'all') {
    filter.mealType = mealType;
  }

  const dietEntries = await DietEntry.find(filter)
    .populate('product', 'name image nutrition mealType dietaryRestrictions')
    .populate('collectionId', 'name')
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await DietEntry.countDocuments(filter);

  res.json({
    dietEntries,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
});

// @desc    Get diet entry by ID
// @route   GET /api/diet/:id
// @access  Private
const getDietEntryById = asyncHandler(async (req, res) => {
  const dietEntry = await DietEntry.findById(req.params.id)
    .populate('product', 'name image nutrition mealType')
    .populate('collectionId', 'name');

  if (!dietEntry) {
    res.status(404);
    throw new Error('Diet entry not found');
  }

  // Make sure user owns this diet entry
  if (dietEntry.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  res.json(dietEntry);
});

// @desc    Update diet entry
// @route   PUT /api/diet/:id
// @access  Private
const updateDietEntry = asyncHandler(async (req, res) => {
  const dietEntry = await DietEntry.findById(req.params.id);

  if (!dietEntry) {
    res.status(404);
    throw new Error('Diet entry not found');
  }

  // Make sure user owns this diet entry
  if (dietEntry.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  const {
    mealType,
    items,
    feeling,
    energyLevel,
    comments,
    date,
    customNutrition,
    customMealDescription,
    image,
  } = req.body;

  // Update fields
  if (mealType) dietEntry.mealType = mealType;
  if (items) dietEntry.items = items;
  if (feeling) dietEntry.feeling = feeling;
  if (energyLevel) dietEntry.energyLevel = energyLevel;
  if (comments !== undefined) dietEntry.comments = comments;
  if (date) dietEntry.date = date;
  if (customMealDescription !== undefined)
    dietEntry.customMealDescription = customMealDescription;
  if (image !== undefined) dietEntry.image = image;

  // Recalculate nutrition if items changed and it's not a custom meal
  if (items && !dietEntry.isCustomMeal && dietEntry.product) {
    const product = await Product.findById(dietEntry.product);
    if (product) {
      let calculatedNutrition = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      };

      items.forEach((item) => {
        const multiplier = item.quantity || 1;
        calculatedNutrition.calories +=
          (product.nutrition.calories || 0) * multiplier;
        calculatedNutrition.protein +=
          (product.nutrition.protein || 0) * multiplier;
        calculatedNutrition.carbs +=
          (product.nutrition.carbs || 0) * multiplier;
        calculatedNutrition.fat += (product.nutrition.fat || 0) * multiplier;
        calculatedNutrition.fiber +=
          (product.nutrition.fiber || 0) * multiplier;
      });

      dietEntry.calories = Math.round(calculatedNutrition.calories);
      dietEntry.protein = Math.round(calculatedNutrition.protein * 10) / 10;
      dietEntry.carbs = Math.round(calculatedNutrition.carbs * 10) / 10;
      dietEntry.fat = Math.round(calculatedNutrition.fat * 10) / 10;
      dietEntry.fiber = Math.round(calculatedNutrition.fiber * 10) / 10;
    }
  }

  // Update custom nutrition if provided
  if (customNutrition && dietEntry.isCustomMeal) {
    dietEntry.customNutrition = customNutrition;
    dietEntry.calories = customNutrition.calories || 0;
    dietEntry.protein = customNutrition.protein || 0;
    dietEntry.carbs = customNutrition.carbs || 0;
    dietEntry.fat = customNutrition.fat || 0;
    dietEntry.fiber = customNutrition.fiber || 0;
  }

  const updatedDietEntry = await dietEntry.save();

  // Populate and return
  const populatedEntry = await DietEntry.findById(updatedDietEntry._id)
    .populate('product', 'name image nutrition mealType')
    .populate('collectionId', 'name');

  res.json(populatedEntry);
});

// @desc    Delete diet entry
// @route   DELETE /api/diet/:id
// @access  Private
const deleteDietEntry = asyncHandler(async (req, res) => {
  const dietEntry = await DietEntry.findById(req.params.id);

  if (!dietEntry) {
    res.status(404);
    throw new Error('Diet entry not found');
  }

  // Make sure user owns this diet entry
  if (dietEntry.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  await DietEntry.findByIdAndDelete(req.params.id);
  res.json({ message: 'Diet entry deleted' });
});

// @desc    Get diet analytics/stats
// @route   GET /api/diet/analytics
// @access  Private
const getDietAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const filter = { user: req.user._id };

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const dietEntries = await DietEntry.find(filter);

  // Calculate totals
  const totals = dietEntries.reduce(
    (acc, entry) => {
      acc.calories += entry.calories || 0;
      acc.protein += entry.protein || 0;
      acc.carbs += entry.carbs || 0;
      acc.fat += entry.fat || 0;
      acc.fiber += entry.fiber || 0;
      acc.meals += 1;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, meals: 0 }
  );

  // Calculate averages
  const avgCaloriesPerDay =
    totals.meals > 0
      ? Math.round(
          totals.calories / Math.max(1, getDaysBetween(startDate, endDate))
        )
      : 0;
  const avgMealsPerDay =
    totals.meals > 0
      ? Math.round(
          (totals.meals / Math.max(1, getDaysBetween(startDate, endDate))) * 10
        ) / 10
      : 0;

  // Meal type distribution
  const mealTypeDistribution = dietEntries.reduce((acc, entry) => {
    acc[entry.mealType] = (acc[entry.mealType] || 0) + 1;
    return acc;
  }, {});

  // Feeling distribution
  const feelingDistribution = dietEntries.reduce((acc, entry) => {
    acc[entry.feeling] = (acc[entry.feeling] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totals: {
      ...totals,
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      fiber: Math.round(totals.fiber * 10) / 10,
    },
    averages: {
      caloriesPerDay: avgCaloriesPerDay,
      mealsPerDay: avgMealsPerDay,
    },
    distributions: {
      mealType: mealTypeDistribution,
      feeling: feelingDistribution,
    },
  });
});

// @desc    Get admin user diet entries
// @route   GET /api/diet/admin/:userId
// @access  Private/Admin
const getAdminUserDietEntries = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error('Access denied - Admin only');
  }

  const { userId } = req.params;
  const { page = 1, limit = 50, startDate, endDate, mealType } = req.query;

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const filter = { user: userId };

  // Date filtering
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter.date.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  // Meal type filtering
  if (mealType && mealType !== 'all') {
    filter.mealType = mealType;
  }

  const dietEntries = await DietEntry.find(filter)
    .populate('product', 'name image nutrition mealType dietaryRestrictions')
    .populate('collectionId', 'name')
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await DietEntry.countDocuments(filter);

  res.json({
    dietEntries,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
    },
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
});

// Helper function to calculate days between dates
const getDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
};

export {
  createDietEntry,
  getDietEntries,
  getDietEntryById,
  updateDietEntry,
  deleteDietEntry,
  getDietAnalytics,
  getAdminUserDietEntries,
};
