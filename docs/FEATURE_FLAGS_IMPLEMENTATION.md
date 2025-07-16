# Feature Flag Implementation: Upload Meal Image

## Overview
This implementation adds a feature flag system for controlling the "Upload Meal Image with AI Analysis" functionality. Admins can now enable/disable this feature for individual users through the admin panel.

## Features Implemented

### 1. Backend Changes

#### User Model (`backend/models/userModel.js`)
- Added `featureFlags` field with `uploadMealImage` boolean property
- Default value: `false` (feature disabled by default)

```javascript
featureFlags: {
  uploadMealImage: {
    type: Boolean,
    default: false,
  },
},
```

#### User Controller (`backend/controllers/userController.js`)
- Updated `updateUser` function to handle featureFlags updates
- Added featureFlags to response in `getUserProfile`, `getUserById`, and `updateUserProfile`
- Admins can now update user feature flags via API

### 2. Frontend Changes

#### Admin User Edit Screen (`frontend/src/screens/admin/UserEditScreen.jsx`)
- Added new "Feature Flags" section after password management
- Toggle switch for "Upload Meal Image with AI Analysis"
- Visual feedback when feature is enabled
- Integrated with user update form

#### Existing Integration
- `AddDietEntryScreen.jsx` already checks `userInfo?.featureFlags?.uploadMealImage`
- `nutritionRoutes.js` already validates the feature flag before processing

## Usage

### For Admins
1. Navigate to Admin → User List
2. Click "Edit User" for the target user
3. Scroll to "Feature Flags" section
4. Toggle "Upload Meal Image with AI Analysis" switch
5. Click "Update User" to save changes

### For Users
- When enabled: Users see "Upload Meal Image" tab in diet tracking
- When disabled: Tab is hidden, API requests are blocked

## Security
- Feature flag validation on both frontend and backend
- Only admins can modify feature flags
- Default state is disabled for security

## Feature Flag Flow
```
Admin enables flag → User sees upload tab → User uploads image → AI analyzes nutrition
```

## Technical Details

### API Endpoints
- `PUT /api/users/:id` - Admin updates user feature flags
- `GET /api/users/:id` - Returns user data including feature flags
- `POST /api/nutrition/analyze` - Validates uploadMealImage flag before processing

### Feature Flag Structure
```javascript
{
  featureFlags: {
    uploadMealImage: boolean
  }
}
```

### Frontend State Management
- Feature flag state managed in Redux store via user profile
- Real-time updates when admin changes settings
- Conditional rendering based on flag status

## Files Modified
1. `backend/models/userModel.js` - Added featureFlags schema
2. `backend/controllers/userController.js` - Handle feature flag updates
3. `frontend/src/screens/admin/UserEditScreen.jsx` - Admin toggle interface

## Files Already Supporting Feature Flags
1. `backend/routes/nutritionRoutes.js` - API validation
2. `frontend/src/screens/AddDietEntryScreen.jsx` - Conditional tab display

## Future Enhancements
- Additional feature flags can be easily added to the same system
- Bulk feature flag management for multiple users
- Feature flag templates for different user tiers
- Analytics on feature flag usage

## Testing
The implementation has been tested for:
- ✅ Default feature flag state (disabled)
- ✅ Admin toggle functionality
- ✅ User interface updates
- ✅ API validation
- ✅ Backward compatibility
