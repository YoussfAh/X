import express from 'express';
import {
  createWorkoutSession,
  getActiveSession,
  getWorkoutSessions,
  autoGroupExercises
} from '../controllers/workoutSessionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createWorkoutSession).get(protect, getWorkoutSessions);
router.route('/active').get(protect, getActiveSession);
router.route('/auto-group').post(protect, autoGroupExercises);

export default router; 