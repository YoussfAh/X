import asyncHandler from './asyncHandler.js';
import User from '../models/userModel.js';

// Check if user has a specific feature flag enabled
const checkFeatureFlag = (flagName) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('User not authenticated');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!user.featureFlags || !user.featureFlags[flagName]) {
      res.status(403);
      throw new Error(`Feature ${flagName} is not enabled for this user`);
    }

    next();
  });
};

// Check if user has upload meal image feature enabled
const checkUploadMealImageFeature = checkFeatureFlag('uploadMealImage');

// Check if user has AI analysis feature enabled
const checkAiAnalysisFeature = checkFeatureFlag('aiAnalysis');

export { checkFeatureFlag, checkUploadMealImageFeature, checkAiAnalysisFeature }; 