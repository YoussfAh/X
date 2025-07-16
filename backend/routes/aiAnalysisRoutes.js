import express from 'express';
import {
  getUserDataForAnalysis,
  analyzeUserData,
  getAnalysisHistory,
  getAnalysisById,
  updateAnalysis,
  deleteAnalysis,
  getAnalysisStats,
  getServiceStatus,
  testApiKeys,
  testAIService
} from '../controllers/aiAnalysisController.js';
import { protect } from '../middleware/authMiddleware.js';
import { checkAiAnalysisFeature } from '../middleware/featureFlagMiddleware.js';

const router = express.Router();

// Get user data for AI analysis
router.route('/user-data')
  .get(protect, checkAiAnalysisFeature, getUserDataForAnalysis);

// Analyze user data with AI
router.route('/analyze')
  .post(protect, checkAiAnalysisFeature, analyzeUserData);

// Get analysis history and statistics
router.route('/history')
  .get(protect, checkAiAnalysisFeature, getAnalysisHistory);

router.route('/stats')
  .get(protect, checkAiAnalysisFeature, getAnalysisStats);

// AI Service status and diagnostics
router.route('/service-status')
  .get(protect, checkAiAnalysisFeature, getServiceStatus);

router.route('/test-keys')
  .post(protect, checkAiAnalysisFeature, testApiKeys);

router.route('/test-service')
  .post(protect, checkAiAnalysisFeature, testAIService);

// Specific analysis operations
router.route('/:id')
  .get(protect, checkAiAnalysisFeature, getAnalysisById)
  .put(protect, checkAiAnalysisFeature, updateAnalysis)
  .delete(protect, deleteAnalysis);

export default router;
