import express from 'express';
const router = express.Router();
import {
  getCollections,
  getAdminCollections,
  getCollectionById,
  getAdminCollectionById,
  getSubCollections,
  getAdminSubCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addProductToCollection,
  removeProductFromCollection,
  updateProductsOrder,
  trackAccessedCollection,
  moveCollectionUp,
  moveCollectionDown,
  updateCollectionOrder,
  fixAllCollectionOrders,
  duplicateCollection,
} from '../controllers/collectionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import checkObjectId from '../middleware/checkObjectId.js';
import { apiDataRateLimit, trackDataDownloads } from '../middleware/rateLimitMiddleware.js';

router.route('/').get(apiDataRateLimit, trackDataDownloads, protect, getCollections).post(protect, admin, createCollection);

// Admin-specific route to get ALL collections (including non-public ones)
router.route('/admin').get(protect, admin, getAdminCollections);

// Route for fixing all collection orders system-wide - must be before /:id routes to avoid conflicts
router.route('/fix-all-orders').put(protect, admin, fixAllCollectionOrders);

// Route for tracking accessed collections - must be before /:id routes to avoid conflicts
router.route('/accessed').post(protect, trackAccessedCollection);

router
  .route('/:id')
  .get(protect, checkObjectId, getCollectionById)
  .put(protect, admin, checkObjectId, updateCollection)
  .delete(protect, admin, checkObjectId, deleteCollection);

// Admin-specific route to get a specific collection regardless of visibility
router
  .route('/:id/admin')
  .get(protect, admin, checkObjectId, getAdminCollectionById);

// Route for updating a collection's order number
router
  .route('/:id/order')
  .put(protect, admin, checkObjectId, updateCollectionOrder);

// Route for duplicating a collection
router
  .route('/:id/duplicate')
  .post(protect, admin, checkObjectId, duplicateCollection);

router.route('/:id/subcollections').get(protect, checkObjectId, getSubCollections);

// Admin-specific route to get ALL sub-collections (including non-public ones)
router
  .route('/:id/admin-subcollections')
  .get(protect, admin, checkObjectId, getAdminSubCollections);

router
  .route('/:id/products')
  .post(protect, admin, checkObjectId, addProductToCollection);

router
  .route('/:id/products/:productId')
  .delete(protect, admin, checkObjectId, removeProductFromCollection);

router
  .route('/:id/products/reorder')
  .put(protect, admin, checkObjectId, updateProductsOrder);

// Add routes for collection reordering
router
  .route('/:id/move-up')
  .put(protect, admin, checkObjectId, moveCollectionUp);

router
  .route('/:id/move-down')
  .put(protect, admin, checkObjectId, moveCollectionDown);

export default router;
