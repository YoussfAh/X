# Rate Limiting Configuration Guide

## Overview

The application now has a flexible, multi-layered rate limiting system to prevent abuse while allowing legitimate users to create multiple accounts when needed.

## Rate Limiting Layers

### 1. Express Middleware Rate Limiting
- **Registration attempts**: 8 attempts per 15 minutes per IP
- **Login attempts**: 20 attempts per 15 minutes per IP
- Applied at the route level before reaching the controller

### 2. Database-Level Rate Limiting
Applied in the user controller with configurable limits:

#### Current Registration Limits:
- **Hourly limit**: 10 successful registrations per hour per IP
- **Daily limit**: 50 successful registrations per day per IP  
- **Rapid limit**: 5 registrations within 5 minutes per IP

## Configuration

### Configuration File
All limits are defined in `backend/config/rateLimitConfig.js`:

```javascript
export const RATE_LIMIT_CONFIG = {
  registration: {
    maxAttempts: 8,        // Express middleware limit
    hourlyLimit: 10,       // Database limit - hourly
    dailyLimit: 50,        // Database limit - daily
    rapidLimit: 5,         // Database limit - rapid succession
    rapidWindowMs: 300000, // 5 minutes
  },
  // ... other configurations
}
```

### Admin Management
Admins can view and update rate limits via API endpoints:

- **GET** `/api/users/admin/rate-limits` - View current configuration
- **PUT** `/api/users/admin/rate-limits` - Update limits

#### Example Update Request:
```json
{
  "registration": {
    "hourlyLimit": 15,
    "dailyLimit": 75,
    "rapidLimit": 8,
    "maxAttempts": 10
  }
}
```

## Error Messages

The system provides clear, specific error messages:

1. **Express rate limit exceeded**: 
   - "Too many registration attempts from this IP. Please try again in 15 minutes."

2. **Hourly limit exceeded**: 
   - "Hourly registration limit exceeded. Please try again in an hour."

3. **Daily limit exceeded**: 
   - "Daily registration limit exceeded. Please contact support if this is legitimate."

4. **Rapid succession limit**: 
   - "Too many rapid registrations. Please wait 5 minutes before creating another account."

## How It Protects Against Attacks

### Automated Bot Protection
- Express middleware blocks rapid-fire requests
- Database limits prevent successful spam registrations
- Progressive restrictions make automation less effective

### Legitimate Use Cases Supported
- Higher limits allow for classroom/workshop scenarios
- Time-based windows reset automatically
- Admin override capabilities for special situations

## Monitoring & Adjustments

### Current Baseline Settings
The system starts with generous but safe limits:
- **Previous limit**: 3 registrations per hour per IP
- **New limit**: 10 registrations per hour per IP (333% increase)
- **Added daily limit**: 50 registrations per day per IP
- **Added rapid protection**: 5 registrations per 5 minutes

### Recommended Adjustments
Based on usage patterns, admins can:

1. **Increase limits** for events/workshops
2. **Decrease limits** if experiencing abuse
3. **Monitor logs** to identify patterns
4. **Use contact support message** for legitimate high-volume needs

## Implementation Details

### Files Modified
- `backend/controllers/userController.js` - Updated registration logic
- `backend/middleware/rateLimitMiddleware.js` - Added registration-specific middleware
- `backend/routes/userRoutes.js` - Applied middleware and added admin routes
- `backend/config/rateLimitConfig.js` - Centralized configuration

### Key Features
1. **Configurable limits** - Easy to adjust without code changes
2. **Multiple time windows** - Prevents different types of abuse
3. **Admin management** - Real-time limit adjustments
4. **Clear error messages** - Better user experience
5. **Backward compatible** - Existing functionality preserved

## Testing the Changes

To verify the new system works:

1. **Test normal registration** - Should work without issues
2. **Test rapid registration** - Should allow up to new limits
3. **Test abuse scenarios** - Should block after limits reached
4. **Test admin endpoints** - Should allow viewing/updating limits

## Future Enhancements

Potential improvements:
- User-specific override capabilities
- Whitelist for trusted IPs
- Integration with CAPTCHA for borderline cases
- Automated alerting for unusual patterns
- Analytics dashboard for registration patterns 