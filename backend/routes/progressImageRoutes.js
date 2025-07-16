import express from 'express';
const router = express.Router();
import {
  saveProgressImages,
  getUserProgressImages,
  deleteProgressImageGroup,
} from '../controllers/progressImageController.js';
import { protect } from '../middleware/authMiddleware.js';

router
  .route('/')
  .post(protect, saveProgressImages) // No longer needs upload middleware
  .get(protect, getUserProgressImages);

router
  .route('/:id')
  .delete(protect, deleteProgressImageGroup);

export default router; 