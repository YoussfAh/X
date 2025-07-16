import express from 'express';
import {
  generateOneTimeCode,
  generateBatchCodes,
  generateUniversalCode,
  generateBatchUniversalCodes,
  validateOneTimeCode,
  getOneTimeCodesByCollection,
  getAllOneTimeCodes,
  getUniversalCodes,
  deleteOneTimeCode,
} from '../controllers/oneTimeCodeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes
router.route('/').get(protect, admin, getAllOneTimeCodes);
router.route('/generate').post(protect, admin, generateOneTimeCode);
router.route('/batch-generate').post(protect, admin, generateBatchCodes);
router.route('/generate-universal').post(protect, admin, generateUniversalCode);
router.route('/batch-generate-universal').post(protect, admin, generateBatchUniversalCodes);
router.route('/universal').get(protect, admin, getUniversalCodes);
router
  .route('/collection/:collectionId')
  .get(protect, admin, getOneTimeCodesByCollection);
router.route('/:id').delete(protect, admin, deleteOneTimeCode);

// User routes
router.route('/validate').post(protect, validateOneTimeCode);

export default router;
