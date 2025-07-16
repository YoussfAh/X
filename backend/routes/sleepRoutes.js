import express from 'express';
import {
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
} from '../controllers/sleepController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import checkObjectId, {
  checkUserObjectId,
} from '../middleware/checkObjectId.js';

const router = express.Router();

// User routes
router.route('/start').post(protect, startSleep);
router.route('/end').put(protect, endSleep);
router.route('/skip').post(protect, skipSleepPhase);
router.route('/current').get(protect, getCurrentSleepEntry);

router.route('/').get(protect, getSleepEntries).post(protect, createSleepEntry);

router
  .route('/:id')
  .get(protect, checkObjectId, getSleepEntryById)
  .put(protect, checkObjectId, updateSleepEntry)
  .delete(protect, checkObjectId, deleteSleepEntry);

// Admin routes
router
  .route('/user/:userId')
  .get(protect, admin, checkUserObjectId, getSleepEntriesForUser_Admin);

export default router;
