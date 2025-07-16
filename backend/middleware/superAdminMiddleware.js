import asyncHandler from './asyncHandler.js';

// User must be a super admin
export const superAdmin = asyncHandler(async (req, res, next) => {
  console.log(`[AUTH] superAdmin middleware triggered. User: ${req.user ? req.user.email : 'None'}. IsSuperAdmin: ${req.user ? req.user.isSuperAdmin : 'N/A'}`);
  
  if (req.user && req.user.isSuperAdmin) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized. Super admin privileges required.');
  }
});

// Combined middleware for protect + superAdmin
export const protectSuperAdmin = [
  // This assumes protect middleware is already applied via router
  superAdmin
];

export default {
  superAdmin,
  protectSuperAdmin
}; 