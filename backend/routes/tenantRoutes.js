import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { superAdmin } from '../middleware/superAdminMiddleware.js';
import {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  getTenantStatistics,
  updateTenantBranding,
  updateTenantLimits,
  toggleTenantStatus,
  getTenantUsers,
  generateTenantAccessUrl,
  resetTenantData,
  exportTenantData,
  switchToTenant
} from '../controllers/tenantController.js';

const router = express.Router();

// All routes require super admin authentication
router.use(protect);
router.use(superAdmin);

// Tenant CRUD operations
router.route('/')
  .get(getTenants)          // Get all tenants with pagination and filters
  .post(createTenant);      // Create new tenant

router.route('/:id')
  .get(getTenantById)       // Get specific tenant details
  .put(updateTenant)        // Update tenant basic info
  .delete(deleteTenant);    // Delete tenant (soft delete)

// Tenant statistics and analytics
router.get('/:id/statistics', getTenantStatistics);

// Tenant configuration
router.put('/:id/branding', updateTenantBranding);
router.put('/:id/limits', updateTenantLimits);

// Tenant status management
router.put('/:id/status', toggleTenantStatus);

// Tenant users management
router.get('/:id/users', getTenantUsers);

// Generate tenant access URL
router.get('/:id/access-url', generateTenantAccessUrl);

// Tenant data management
router.post('/:id/reset', resetTenantData);
router.get('/:id/export', exportTenantData);

// Switch to tenant (for super admin to access tenant as admin)
router.post('/:id/switch', switchToTenant);

export default router; 