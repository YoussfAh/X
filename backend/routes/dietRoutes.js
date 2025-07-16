import express from 'express';
import {
  createDietEntry,
  getDietEntries,
  getDietEntryById,
  updateDietEntry,
  deleteDietEntry,
  getDietAnalytics,
  getAdminUserDietEntries
} from '../controllers/dietController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import checkObjectId, { checkUserObjectId } from '../middleware/checkObjectId.js';

const router = express.Router();

// User routes
router.route('/')
  .get(protect, getDietEntries)
  .post(protect, createDietEntry);

router.route('/analytics')
  .get(protect, getDietAnalytics);

router.route('/:id')
  .get(protect, checkObjectId, getDietEntryById)
  .put(protect, checkObjectId, updateDietEntry)
  .delete(protect, checkObjectId, deleteDietEntry);

// Admin routes
router.route('/admin/:userId')
  .get(protect, admin, checkUserObjectId, getAdminUserDietEntries);

export default router; 