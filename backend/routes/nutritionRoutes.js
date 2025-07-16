import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkUploadMealImageFeature } from '../middleware/featureFlagMiddleware.js';
import { analyzeNutritionFromImage } from '../services/geminiService.js';

const router = express.Router();

// @desc    Analyze nutrition from meal image
// @route   POST /api/nutrition/analyze
// @access  Private
const analyzeNutrition = asyncHandler(async (req, res) => {

  const {
    imageBase64,
    mealName,
    description,
    mealType = 'other',
    quantity = 1,
    userComments = '',
  } = req.body;

  if (!imageBase64) {
    res.status(400);
    throw new Error('Image data is required');
  }

  try {
    const result = await analyzeNutritionFromImage(
      imageBase64,
      mealName,
      description,
      mealType,
      quantity,
      userComments
    );

    res.json({
      success: result.success,
      data: result.data,
      ...(result.error && { error: result.error }),
      ...(result.fallback && { usingFallback: true }),
    });
  } catch (error) {
    console.error('Nutrition analysis error:', error);
    res.status(500);
    throw new Error('Nutrition analysis failed');
  }
});

router.post('/analyze', protect, checkUploadMealImageFeature, analyzeNutrition);

export default router;
