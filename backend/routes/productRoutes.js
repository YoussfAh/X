import express from 'express';
const router = express.Router();
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getTopProducts,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import checkObjectId from '../middleware/checkObjectId.js';
import { apiDataRateLimit, trackDataDownloads, limitPageSize } from '../middleware/rateLimitMiddleware.js';

router.route('/').get(apiDataRateLimit, trackDataDownloads, limitPageSize(20), protect, getProducts).post(protect, admin, createProduct);
router.get('/top', apiDataRateLimit, protect, getTopProducts);
router
  .route('/:id')
  .get(protect, checkObjectId, getProductById)
  .put(protect, admin, checkObjectId, updateProduct)
  .delete(protect, admin, checkObjectId, deleteProduct);

export default router;
