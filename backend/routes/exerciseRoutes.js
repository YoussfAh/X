import express from 'express';
const router = express.Router();
import {
    getExercises,
    getExerciseById,
    createExercise,
    updateExercise,
    deleteExercise,
    getTopExercises,
} from '../controllers/exerciseController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import checkObjectId from '../middleware/checkObjectId.js';
import { apiDataRateLimit, trackDataDownloads, limitPageSize } from '../middleware/rateLimitMiddleware.js';

router.route('/').get(apiDataRateLimit, trackDataDownloads, limitPageSize(20), protect, getExercises).post(protect, admin, createExercise);
router.get('/top', apiDataRateLimit, protect, getTopExercises);
router
    .route('/:id')
    .get(protect, checkObjectId, getExerciseById)
    .put(protect, admin, checkObjectId, updateExercise)
    .delete(protect, admin, checkObjectId, deleteExercise);

export default router; 