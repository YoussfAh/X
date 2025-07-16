import express from 'express';
import {
  createWeightEntry,
  getWeightEntries,
  getWeightEntryById,
  updateWeightEntry,
  deleteWeightEntry,
  getLatestWeightEntry,
} from '../controllers/weightController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createWeightEntry)
  .get(protect, getWeightEntries);

router.route('/latest')
  .get(protect, getLatestWeightEntry);

router
  .route('/:id')
  .get(protect, getWeightEntryById)
  .put(protect, updateWeightEntry)
  .delete(protect, deleteWeightEntry);

export default router; 