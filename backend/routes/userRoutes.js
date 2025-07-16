import express from 'express';
import {
  authUser,
  authGoogleUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  updateQuizBannerPreference,
  getUsers,
  deleteUser,
  getUserById,
  getUserFeatureFlags,
  updateUser,
  getUserLockedCollections,
  addLockedCollection,
  adminAddLockedCollection,
  removeLockedCollection,
  updateAccessedCollections,
  adminUpdateUserPassword,
  adminAssignCollection,
  adminRemoveAssignedCollection,
  getUserAssignedCollections,
  batchAssignCollections,
  updateAssignedCollection,
  trackCollectionAccess,
  refreshUserData,
  getUserStats,
  updateExistingAssignedCollections,
  trackUserContact,
  getUserContactHistory,
  updateContactEntry,
  deleteContactEntry,
  clearContactNotes,
  getContactFollowUps,
  validateSession,
  saveTimeFrameSettings,
  getTimeFrameHistory,
  getTimeFrameManagement,
  sendWhatsAppContact,
  processMessageTemplate,
  cleanupRegularUsers,
  addAdminNote,
  deleteAdminNote,
  getRateLimitConfig,
  updateRateLimitConfig,
  removeAllAssignedCollections,
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import checkObjectId from '../middleware/checkObjectId.js';
import { registrationRateLimit, loginRateLimit, googleLoginRateLimit } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.route('/').post(registrationRateLimit, registerUser).get(protect, admin, getUsers);
router.post('/auth', loginRateLimit, authUser);
router.post('/auth/google', googleLoginRateLimit, authGoogleUser);
router.post('/logout', logoutUser);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Route for quiz banner preferences
router.put('/quiz-banner-preference', protect, updateQuizBannerPreference);

// Route for refreshing user data
router.get('/refresh-data', protect, refreshUserData);

// Route for validating session - specifically for mobile devices
router.get('/validate-session', protect, validateSession);

// User statistics for admin dashboard
router.get('/stats', protect, admin, getUserStats);

// Locked collections routes
router
  .route('/locked-collections')
  .get(protect, getUserLockedCollections)
  .post(protect, addLockedCollection);

// Accessed collections routes - for tracking collection access
router.post('/accessed-collections', protect, updateAccessedCollections);

// Admin routes for managing user locked collections
router
  .route('/:id/locked-collections')
  .post(protect, admin, checkObjectId, adminAddLockedCollection);

router
  .route('/:userId/locked-collections/:collectionId')
  .delete(protect, admin, removeLockedCollection);

router
  .route('/:id')
  .delete(protect, admin, checkObjectId, deleteUser)
  .get(protect, admin, checkObjectId, getUserById)
  .put(protect, admin, checkObjectId, updateUser);

// Feature flags debugging route
router.get('/:id/feature-flags', protect, admin, checkObjectId, getUserFeatureFlags);

// Route for admin to update user password
router
  .route('/:id/update-password')
  .put(protect, admin, checkObjectId, adminUpdateUserPassword);

// Routes for assigned collections
router
  .route('/:id/assigned-collections')
  .get(protect, admin, checkObjectId, getUserAssignedCollections)
  .post(protect, admin, checkObjectId, adminAssignCollection);

router
  .route('/:id/assigned-collections/all')
  .delete(protect, admin, checkObjectId, removeAllAssignedCollections);

router
  .route('/:id/assigned-collections/batch')
  .post(protect, admin, checkObjectId, batchAssignCollections);

// New route for updating existing assigned collections with descriptions
router
  .route('/:id/update-assigned-collections')
  .put(protect, admin, checkObjectId, updateExistingAssignedCollections);

router
  .route('/:id/assigned-collections/:collectionId')
  .delete(protect, admin, checkObjectId, adminRemoveAssignedCollection)
  .put(protect, admin, checkObjectId, updateAssignedCollection);

router
  .route('/:id/assigned-collections/:collectionId/access')
  .post(protect, checkObjectId, trackCollectionAccess);

// Contact tracking routes
router.post('/:id/contact', protect, admin, checkObjectId, trackUserContact);
router.post('/:id/admin-notes', protect, admin, checkObjectId, addAdminNote);
router.delete('/:id/admin-notes/:noteId', protect, admin, checkObjectId, deleteAdminNote);
router.get('/:id/contact-history', protect, admin, checkObjectId, getUserContactHistory);
router.put('/:id/contact-history/:contactId', protect, admin, checkObjectId, updateContactEntry);
router.delete('/:id/contact-history/:contactId', protect, admin, checkObjectId, deleteContactEntry);
router.post('/:id/contact/clear-notes', protect, admin, checkObjectId, clearContactNotes);

// Global contact follow-ups
router.get('/contact-follow-ups', protect, admin, getContactFollowUps);

// Routes for time frame management
router.post('/:id/timeframe', protect, admin, checkObjectId, saveTimeFrameSettings);
router.get('/:id/timeframe/history', protect, admin, checkObjectId, getTimeFrameHistory);
router.get('/timeframe/management', protect, admin, getTimeFrameManagement);
router.post('/timeframe/process-template', protect, admin, processMessageTemplate);

// WhatsApp contact routes
router.post('/:id/whatsapp-contact', protect, admin, checkObjectId, sendWhatsAppContact);

// Cleanup routes
router.delete('/cleanup-regular-users', protect, admin, cleanupRegularUsers);

// Rate limit management routes
router.get('/admin/rate-limits', protect, admin, getRateLimitConfig);
router.put('/admin/rate-limits', protect, admin, updateRateLimitConfig);

// Feature flags are synced through the regular updateUser route

export default router;
