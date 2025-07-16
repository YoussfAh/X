import express from 'express';
import {
  getTodaysWaterTracking,
  getWaterTrackingHistory,
  addWaterIntake,
  removeWaterIntake,
  resetWaterIntake,
  updateWaterGoal,
  getWaterTrackingAnalytics
} from '../controllers/waterTrackingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Water tracking routes
router.get('/today', getTodaysWaterTracking);
router.get('/history', getWaterTrackingHistory);
router.get('/analytics', getWaterTrackingAnalytics);
router.post('/add', addWaterIntake);
router.post('/remove', removeWaterIntake);
router.post('/reset', resetWaterIntake);
router.put('/goal', updateWaterGoal);

export default router; 