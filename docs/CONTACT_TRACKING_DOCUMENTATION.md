# User Contact Tracking & Contact Notes Feature Documentation

## Overview

This document details the implementation of the User Contact Tracking and Contact Notes features in the PRO Fitness App. These features allow administrators to record when they contact users, add notes about their interactions, and display contact history with a time tracking system.

## Table of Contents

1. [Feature Description](#feature-description)
2. [Database Schema Changes](#database-schema-changes)
3. [Backend Implementation](#backend-implementation)
   - [Controller Functions](#controller-functions)
   - [Routes Configuration](#routes-configuration)
4. [Frontend Implementation](#frontend-implementation)
   - [API Integration](#api-integration)
   - [User Interface Components](#user-interface-components)
5. [User Experience](#user-experience)
6. [Implementation Details](#implementation-details)

## Feature Description

The User Contact Tracking system consists of two main components:

1. **Contact Tracking**: Records when an administrator contacts a user and displays a timer showing how long it's been since the last contact.
2. **Contact Notes**: Allows administrators to add and save notes about their interactions with users.

These features help administrators maintain better communication with users, keep track of important discussions, and ensure timely follow-ups.

## Database Schema Changes

The feature implementation required adding new fields to the User model:

### User Model Updates

**File Location**: `d:\THE Practice CODE\Section Two\m-king\pro-g\PRO\backend\models\userModel.js`

The following fields were added to the `userSchema`:

```javascript
// Admin Contact Tracking
lastContactedAt: {
  type: Date,
  default: null,
},
lastContactedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null,
},
contactNotes: {
  type: String,
  default: '',
},
```

These fields store:
- When the user was last contacted (`lastContactedAt`)
- Which admin contacted the user (`lastContactedBy`)
- Notes about the contact or communication (`contactNotes`)

## Backend Implementation

### Controller Functions

**File Location**: `d:\THE Practice CODE\Section Two\m-king\pro-g\PRO\backend\controllers\userController.js`

A new controller function was added to handle tracking user contacts:

```javascript
// @desc   Track when admin contacts a user
// @route   POST /api/users/:id/contact
// @access  Private/Admin
const trackUserContact = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Update the last contacted timestamp and admin who made contact
  user.lastContactedAt = new Date();
  user.lastContactedBy = req.user._id;
  
  // Save contact notes if provided
  if (req.body.contactNotes) {
    user.contactNotes = req.body.contactNotes;
  }
  
  await user.save();

  res.status(200).json({
    success: true,
    lastContactedAt: user.lastContactedAt,
    contactNotes: user.contactNotes,
    message: 'User contact recorded successfully'
  });
});
```

Additionally, the `getUserById` controller was updated to return the contact tracking fields:

```javascript
// In getUserById function
res.json({
  // ...existing fields
  lastContactedAt: user.lastContactedAt,
  lastContactedBy: user.lastContactedBy,
  contactNotes: user.contactNotes,
  // ...other fields
});
```

### Routes Configuration

**File Location**: `d:\THE Practice CODE\Section Two\m-king\pro-g\PRO\backend\routes\userRoutes.js`

A new route was added to handle contact tracking:

```javascript
// Route for tracking admin contact with user
router.post('/:id/contact', protect, admin, trackUserContact);
```

This route is protected and requires admin privileges to access.

## Frontend Implementation

### API Integration

**File Location**: `d:\THE Practice CODE\Section Two\m-king\pro-g\PRO\frontend\src\slices\usersApiSlice.js`

A new mutation was added to the users API slice to handle tracking contacts:

```javascript
trackUserContact: builder.mutation({
  query: (data) => ({
    url: `${BASE_URL}/api/users/${data.userId}/contact`,
    method: 'POST',
    body: { contactNotes: data.contactNotes },
    credentials: 'include',
  }),
  invalidatesTags: (result, error, arg) => [
    'User',
    { type: 'User', id: arg.userId },
  ],
}),
```

The mutation is exported for use in components:

```javascript
export const {
  // ...other exports
  useTrackUserContactMutation,
} = usersApiSlice;
```

### User Interface Components

**File Location**: `d:\THE Practice CODE\Section Two\m-king\pro-g\PRO\frontend\src\screens\admin\UserEditScreen.jsx`

The following changes were made to implement the UI:

1. **State Management**:
   ```javascript
   const [contactNotes, setContactNotes] = useState('');
   const [trackUserContact] = useTrackUserContactMutation();
   ```

2. **Data Loading**:
   ```javascript
   useEffect(() => {
     if (user) {
       // ...existing code
       setContactNotes(user.contactNotes || '');
     }
   }, [user]);
   ```

3. **Contact Recording Function**:
   ```javascript
   const handleRecordContact = async () => {
     try {
       await trackUserContact({ 
         userId, 
         contactNotes 
       }).unwrap();
       toast.success('Contact with user recorded successfully');
       refetch(); // Refresh the user details to update the lastContactedAt field
     } catch (err) {
       toast.error(err?.data?.message || 'Failed to record contact');
       console.error('Error recording contact:', err);
     }
   };
   ```

4. **Time Formatting Function**:
   ```javascript
   const formatTimeSince = (date) => {
     if (!date) return 'Never contacted';
     
     const now = new Date();
     const contactDate = new Date(date);
     const diffMs = now - contactDate;
     const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
     
     if (diffDays > 0) {
       return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
     }
     
     const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
     if (diffHours > 0) {
       return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
     }
     
     const diffMinutes = Math.floor(diffMs / (1000 * 60));
     const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
     
     const interval = Math.floor(diffMinutes);
     if (interval >= 1) {
       return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
     }
     
     return seconds <= 10 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
   };
   ```

5. **UI Components**:
   - Contact tracking card with last contact information
   - Timer showing time since last contact
   - Text area for contact notes
   - "Record Contact with User" button
   - "Save Notes" button

## User Experience

The Contact Tracking feature enhances the admin experience in several ways:

1. **Contact Recording**: Admins can easily record when they contact a user by clicking the "Record Contact with User" button.

2. **Time Tracking**: The interface displays how long it's been since the last contact (e.g., "2 days ago", "5 hours ago", "just now").

3. **Note Taking**: Admins can add detailed notes about the interaction, which are saved to the database.

4. **Time Format**: The contact time is displayed in 12-hour format (e.g., 6:27:10 PM instead of 18:27:10).

5. **Persistent Notes**: Contact notes are saved between sessions and are visible to all administrators.

## Implementation Details

### Converting 24-hour to 12-hour Time Format

The time conversion is handled by specifying the format options in the `toLocaleTimeString()` method:

```javascript
new Date(user.lastContactedAt).toLocaleTimeString([], {
  hour: '2-digit', 
  minute: '2-digit', 
  second: '2-digit', 
  hour12: true
})
```

This converts times like "18:27:10" to "6:27:10 PM".

### Contact Notes Storage and Retrieval

1. When an admin adds notes and clicks the "Save Notes" button, the notes are sent to the backend via the `trackUserContact` mutation.
2. The backend saves these notes in the user's `contactNotes` field.
3. When the admin views the user profile again, the notes are loaded from the database and displayed in the contact notes text area.

### Time Since Last Contact Calculation

The `formatTimeSince` function calculates the time elapsed since the last contact in a human-readable format:
- For recent contacts (less than 10 seconds): "just now"
- For contacts within a minute: "X seconds ago"
- For contacts within an hour: "X minutes ago"
- For contacts within a day: "X hours ago"
- For older contacts: "X days ago"

This provides admins with an intuitive sense of when the last contact occurred.

---

By implementing these features, administrators can now effectively track and manage their communications with users, ensuring better follow-up and customer service.
