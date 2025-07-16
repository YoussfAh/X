import express from 'express';
import {
  addWorkoutEntry,
  getMyWorkoutEntries,
  getWorkoutEntriesByProduct,
  getWorkoutEntryById,
  updateWorkoutEntry,
  deleteWorkoutEntry,
  getUserWorkoutEntries,
  getAllWorkoutEntries,
} from '../controllers/workoutController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import checkObjectId, { checkUserObjectId } from '../middleware/checkObjectId.js';

const router = express.Router();


router.route('/')
  .post(protect, addWorkoutEntry)
  .get(protect, getMyWorkoutEntries);

router.route('/product/:productId')
  .get(protect, checkObjectId, getWorkoutEntriesByProduct);

router.route('/user/:userId')
  .get(protect, checkUserObjectId, getUserWorkoutEntries);

router.route('/admin/all')
  .get(protect, admin, getAllWorkoutEntries);

router.route('/admin/user/:userId')
  .get(protect, admin, checkUserObjectId, getUserWorkoutEntries);

router.route('/:id')
  .get(protect, checkObjectId, getWorkoutEntryById)
  .put(protect, checkObjectId, updateWorkoutEntry)
  .delete(protect, checkObjectId, deleteWorkoutEntry);

export default router;
