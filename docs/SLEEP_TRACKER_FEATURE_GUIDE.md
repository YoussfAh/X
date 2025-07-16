# Developer Guide: Building the Sleep Tracking Feature

This guide provides a comprehensive walkthrough for integrating a complete sleep tracking feature into the application. It's designed for a developer who is new to the codebase, explaining each step in detail from the backend to the frontend.

## Table of Contents
1.  [Backend Implementation](#1-backend-implementation)
    *   [Step 1.1: The Data Model](#step-11-the-data-model)
    *   [Step 1.2: The Controller Logic](#step-12-the-controller-logic)
    *   [Step 1.3: The API Routes](#step-13-the-api-routes)
    *   [Step 1.4: Integrating Routes into the Server](#step-14-integrating-routes-into-the-server)
2.  [Frontend Implementation](#2-frontend-implementation)
    *   [Step 2.1: Adding API Constants](#step-21-adding-api-constants)
    *   [Step 2.2: Creating the API Slice](#step-22-creating-the-api-slice)
    *   [Step 2.3: Building the User Interface](#step-23-building-the-user-interface)
    *   [Step 2.4: Adding the Page Route](#step-24-adding-the-page-route)
    *   [Step 2.5: Linking in the Header](#step-25-linking-in-the-header)
3.  [Admin Features](#3-admin-features)
    *   [Step 3.1: Admin Dashboard for User Sleep](#step-31-admin-dashboard-for-user-sleep)


---

## 1. Backend Implementation

The backend is responsible for handling the data logic, storage, and providing API endpoints for the frontend to consume.

### Step 1.1: The Data Model

First, we need to define the structure of our sleep data in the database.

**File:** `backend/models/sleepModel.js`

**Action:** Create a new file and add the following Mongoose schema.

**Code:**
```javascript
import mongoose from 'mongoose';

const sleepEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  date: {
    type: Date,
    required: true,
  },
  sleepTime: {
    type: Date,
    required: true,
  },
  wakeUpTime: {
    type: Date, // Made optional to allow for an "in-progress" sleep session
  },
  duration: {
    type: Number, // Duration in minutes
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
sleepEntrySchema.index({ user: 1, date: -1 });

// A "virtual" field that is not stored in the DB but can be queried
sleepEntrySchema.virtual('durationHours').get(function() {
  if (this.duration) {
    return this.duration / 60;
  }
  return null;
});

// A pre-save hook to automatically calculate the duration
sleepEntrySchema.pre('save', function(next) {
  // Only calculate if both times are present
  if (this.sleepTime && this.wakeUpTime && (this.isModified('sleepTime') || this.isModified('wakeUpTime'))) {
    const durationInMillis = this.wakeUpTime.getTime() - this.sleepTime.getTime();
    this.duration = Math.round(durationInMillis / (1000 * 60)); // in minutes
  }
  next();
});

const SleepEntry = mongoose.model('SleepEntry', sleepEntrySchema);

export default SleepEntry;
```

**Explanation:**
- This schema defines the fields for each sleep entry. `user` links the entry to a specific user.
- `wakeUpTime` is not `required`, which is crucial for allowing a user to log that they are going to sleep without knowing the wake-up time yet.
- The `pre('save', ...)` hook is a middleware that runs before any `sleepEntry` document is saved. It automatically calculates the `duration` in minutes if both `sleepTime` and `wakeUpTime` exist, saving us from doing this manually on the frontend.

### Step 1.2: The Controller Logic

The controller contains the functions that execute when an API endpoint is hit.

**File:** `backend/controllers/sleepController.js`

**Action:** Create a new file to handle the business logic for our sleep feature.

**Code:**
```javascript
import asyncHandler from '../middleware/asyncHandler.js';
import SleepEntry from '../models/sleepModel.js';
import User from '../models/userModel.js';

// @desc    Start a new sleep entry (log sleep time)
const startSleep = asyncHandler(async (req, res) => {
  const existingOpenSleep = await SleepEntry.findOne({ user: req.user._id, wakeUpTime: null });
  if (existingOpenSleep) {
    res.status(400);
    throw new Error('You have an open sleep session.');
  }
  const sleepEntry = new SleepEntry({ user: req.user._id, sleepTime: new Date(), date: new Date() });
  const createdSleepEntry = await sleepEntry.save();
  res.status(201).json(createdSleepEntry);
});

// @desc    End a sleep entry (log wake up time)
const endSleep = asyncHandler(async (req, res) => {
  const sleepEntry = await SleepEntry.findOne({ user: req.user._id, wakeUpTime: null }).sort({ sleepTime: -1 });
  if (!sleepEntry) {
    res.status(404);
    throw new Error('No active sleep session found.');
  }
  sleepEntry.wakeUpTime = new Date();
  const updatedSleepEntry = await sleepEntry.save();
  res.json(updatedSleepEntry);
});

// @desc    Get current open sleep entry
const getCurrentSleepEntry = asyncHandler(async (req, res) => {
  const sleepEntry = await SleepEntry.findOne({ user: req.user._id, wakeUpTime: null }).sort({ createdAt: -1 });
  res.json(sleepEntry); // Will send null if not found, which is intended
});

// Standard CRUD and Admin functions below

// @desc    Get user's sleep entries
const getSleepEntries = asyncHandler(async (req, res) => { /* ... logic to find entries for the user ... */ });
// @desc    Update sleep entry
const updateSleepEntry = asyncHandler(async (req, res) => { /* ... logic to find and update an entry ... */ });
// @desc    Delete sleep entry
const deleteSleepEntry = asyncHandler(async (req, res) => { /* ... logic to find and delete an entry ... */ });
// @desc    Get user's sleep entries (for admin)
const getSleepEntriesForUser_Admin = asyncHandler(async (req, res) => { /* ... logic for admin to get entries for a specific user ID ... */ });

// Export all functions
export {
  startSleep,
  endSleep,
  getCurrentSleepEntry,
  getSleepEntries,
  updateSleepEntry,
  deleteSleepEntry,
  getSleepEntriesForUser_Admin
};

```
**Explanation:**
- `startSleep`: Creates a new sleep entry with only the `sleepTime`. It prevents creating a new one if an existing session is already active.
- `endSleep`: Finds the most recent sleep entry that doesn't have a `wakeUpTime` and sets it to the current time.
- `getCurrentSleepEntry`: Checks if there is an active sleep session for the current user.
- The other functions are standard implementations for getting a list of entries, updating a specific one, deleting one, and allowing an admin to view a user's data.

### Step 1.3: The API Routes

Routes define the API endpoints and connect them to the controller functions.

**File:** `backend/routes/sleepRoutes.js`

**Action:** Create a new file to define the API endpoints for sleep.

**Code:**
```javascript
import express from 'express';
import {
  startSleep,
  endSleep,
  getCurrentSleepEntry,
  getSleepEntries,
  updateSleepEntry,
  deleteSleepEntry,
  getSleepEntriesForUser_Admin,
} from '../controllers/sleepController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import checkObjectId from '../middleware/checkObjectId.js';

const router = express.Router();

// Routes for one-click actions
router.route('/start').post(protect, startSleep);
router.route('/end').put(protect, endSleep);
router.route('/current').get(protect, getCurrentSleepEntry);

// Routes for managing all entries
router.route('/').get(protect, getSleepEntries);

// Routes for a specific entry by its ID
router.route('/:id')
  .put(protect, checkObjectId, updateSleepEntry)
  .delete(protect, checkObjectId, deleteSleepEntry);

// Admin-only route
router.route('/user/:userId').get(protect, admin, getSleepEntriesForUser_Admin);

export default router;
```
**Explanation:**
- This file maps HTTP methods (GET, POST, PUT, DELETE) and URL paths to the controller functions.
- `protect` is a middleware that ensures the user is logged in.
- `admin` is a middleware that ensures the user has administrative privileges.
- `checkObjectId` is a middleware that validates the format of the ID in the URL.

### Step 1.4: Integrating Routes into the Server

Finally, we tell our main Express server to use these new routes.

**File:** `backend/server.js`

**Action:** Import and use the `sleepRoutes`.

**Code:**
```javascript
// ... other imports
import waterTrackingRoutes from './routes/waterTrackingRoutes.js';
import sleepRoutes from './routes/sleepRoutes.js'; // 1. Import the new routes
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// ... other app.use() calls
app.use('/api/water-tracking', waterTrackingRoutes);
app.use('/api/sleep', sleepRoutes); // 2. Tell the app to use them

// ... rest of the file
```
**Explanation:**
This makes all routes defined in `sleepRoutes.js` available under the `/api/sleep` prefix. For example, the `start` route becomes `POST /api/sleep/start`.

---

## 2. Frontend Implementation

The frontend provides the user interface for interacting with the sleep tracking feature.

### Step 2.1: Adding API Constants

Centralize API URLs for easy management.

**File:** `frontend/src/constants.js`

**Action:** Add the base URL for the sleep API.

**Code:**
```javascript
// ... other constants
export const DIET_URL = '/api/diet';
export const SLEEP_URL = '/api/sleep';
```

### Step 2.2: Creating the API Slice

We use Redux Toolkit (RTK) Query to handle data fetching, caching, and state management.

**File:** `frontend/src/slices/sleepApiSlice.js`

**Action:** Create a new file to define the sleep feature's API interactions.

**Code:**
```javascript
import { SLEEP_URL } from '../constants';
import { apiSlice } from './apiSlice';

export const sleepApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    startSleep: builder.mutation({
      query: () => ({ url: `${SLEEP_URL}/start`, method: 'POST' }),
      invalidatesTags: ['SleepEntry', 'CurrentSleep'],
    }),
    endSleep: builder.mutation({
      query: () => ({ url: `${SLEEP_URL}/end`, method: 'PUT' }),
      invalidatesTags: ['SleepEntry', 'CurrentSleep'],
    }),
    getCurrentSleep: builder.query({
      query: () => `${SLEEP_URL}/current`,
      providesTags: ['CurrentSleep'],
    }),
    getSleepEntries: builder.query({
      query: () => SLEEP_URL,
      providesTags: ['SleepEntry'],
    }),
    updateSleepEntry: builder.mutation({
      query: (data) => ({ url: `${SLEEP_URL}/${data.id}`, method: 'PUT', body: data }),
      invalidatesTags: ['SleepEntry'],
    }),
    deleteSleepEntry: builder.mutation({
      query: (id) => ({ url: `${SLEEP_URL}/${id}`, method: 'DELETE' }),
      invalidatesTags: ['SleepEntry'],
    }),
  }),
});

// RTK Query automatically generates hooks from these endpoints
export const {
  useStartSleepMutation,
  useEndSleepMutation,
  useGetCurrentSleepQuery,
  useGetSleepEntriesQuery,
  useUpdateSleepEntryMutation,
  useDeleteSleepEntryMutation,
} = sleepApiSlice;
```
**Explanation:**
- This "slice" extends the main `apiSlice`.
- `builder.mutation` is used for actions that change data (POST, PUT, DELETE).
- `builder.query` is used for fetching data (GET).
- `invalidatesTags` and `providesTags` are for automatic caching and re-fetching. For example, after `startSleep` successfully runs, any query with the tag `SleepEntry` or `CurrentSleep` will be automatically re-fetched to get the latest data.
- The exported hooks (`useStartSleepMutation`, etc.) are what we'll use in our React components.

### Step 2.3: Building the User Interface

This is the screen where the user will interact with the feature.

**File:** `frontend/src/screens/SleepTrackerScreen.jsx`

**Action:** Create the main component file. This is a complex component, so it's broken down.

**Code Overview:**
```javascript
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Modal, Dropdown, Form, Row, Col, Spinner } from 'react-bootstrap';
import { use... } from '../slices/sleepApiSlice'; // Import all the hooks
import { FaBed, FaSun, FaClock, FaEdit, FaTrash, FaEllipsisV } from 'react-icons/fa';
import { toast } from 'react-toastify';
// ...

const SleepTrackerScreen = () => {
  // 1. State for the edit modal and theme
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  // ... other state for form inputs ...
  const [isDarkMode, setIsDarkMode] = useState(/* ... */);

  // 2. Call all the hooks from the API slice
  const { data, refetch } = useGetSleepEntriesQuery();
  const [startSleep, { isLoading: isStartingSleep }] = useStartSleepMutation();
  // ... other hooks ...

  // 3. Handlers for all actions
  const handleStartSleep = async () => { /* ... */ };
  const handleEndSleep = async () => { /* ... */ };
  const handleDelete = async (id) => { /* ... */ };
  const handleUpdate = async (e) => { /* ... */ };
  const openEditModal = (entry) => { /* ... */ };
  
  // 4. Styles for AMOLED theme
  const cardStyle = { /* ... */ };

  // 5. A sub-component to render each sleep entry card
  const renderSleepCard = (entry) => (
    <Card className="mb-3" style={cardStyle}>
      <Card.Body>
        {/* ... Card layout with sleep/wake times and dropdown for Edit/Delete ... */}
        <Dropdown>
          {/* ... Dropdown menu items call openEditModal(entry) and handleDelete(entry._id) ... */}
        </Dropdown>
      </Card.Body>
    </Card>
  );

  // 6. Main JSX return
  return (
    <Container>
      {/* "I'm Going to Sleep" / "I Just Woke Up" Card */}
      <Card>
        {/* ... uses conditional rendering based on `currentSleep` data ... */}
      </Card>

      {/* History List */}
      <h2>Sleep History</h2>
      {data.sleepEntries.map((entry) => renderSleepCard(entry))}

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        {/* ... Form inside the modal that calls handleUpdate on submit ... */}
      </Modal>
    </Container>
  );
};
```
**Explanation:**
- The component is structured to be readable and maintainable.
- It fetches all necessary data using the RTK hooks.
- It provides handlers to call the mutation hooks (`startSleep`, `deleteSleepEntry`, etc.).
- It uses conditional rendering to show either the "Start Sleep" button or the "End Sleep" button.
- It maps over the fetched sleep entries to display them using a reusable `renderSleepCard` function.
- The Edit/Delete actions are placed in a dropdown menu (`FaEllipsisV` icon) for a clean UI.
- A `Modal` is used for editing, which is a better user experience than navigating to a separate page.

### Step 2.4: Adding the Page Route

Make the new screen accessible via a URL.

**File:** `frontend/src/index.js`

**Action:** Import the screen and add a new `<Route>`.

**Code:**
```javascript
// ... other screen imports
import AddDietEntryScreen from './screens/AddDietEntryScreen';
import SleepTrackerScreen from './screens/SleepTrackerScreen'; // 1. Import screen

// ... inside createBrowserRouter ...
<Route path='' element={<PrivateRoute />}>
  {/* ... other private routes ... */}
  <Route path='/diet-dashboard' element={<DietDashboardScreen />} />
  <Route path='/add-diet-entry' element={<AddDietEntryScreen />} />
  <Route path='/sleep-tracker' element={<SleepTrackerScreen />} /> {/* 2. Add route */}
</Route>
```
**Explanation:**
Adding the route inside `<PrivateRoute>` ensures that only logged-in users can access the `/sleep-tracker` page.

### Step 2.5: Linking in the Header

Allow users to navigate to the new page.

**File:** `frontend/src/components/Header.jsx`

**Action:** Add a new `Nav.Link` to the user dropdown menu.

**Code:**
```javascript
// ... inside the dropdown-menu div ...
<Nav.Link as={Link} to='/diet-dashboard' /* ... */ >
  <FaUtensils /* ... */ />
  Diet Dashboard
</Nav.Link>

{/* Add this new link */}
<Nav.Link as={Link} to='/sleep-tracker' className="dropdown-item ..." onClick={() => setExpanded(false)}>
    <FaMoon /* ... */ />
    Sleep Tracker
</Nav.Link>

<Nav.Link onClick={toggleTheme} /* ... */ >
```
**Explanation:**
This adds a "Sleep Tracker" item to the user profile dropdown menu, making the feature easily discoverable.

---

## 3. Admin Features

The final step is to give administrators the ability to view a user's sleep data.

### Step 3.1: Admin Dashboard for User Sleep

We follow a similar pattern as the user-facing feature: create a screen, add a route, and link to it.

1.  **Create `AdminUserSleepDashboard.jsx`**: This screen is similar to `SleepTrackerScreen` but takes a `userId` from the URL, fetches data using `useGetAdminUserSleepEntriesQuery`, and displays it in a read-only format.
2.  **Add Admin Route in `index.js`**:
    ```javascript
    // Inside the <AdminRoute> block
    <Route path='/admin/user-sleep-dashboard/:id' element={<AdminUserSleepDashboard />}/>
    ```
3.  **Add Link in `UserListScreen.jsx`**: In the actions column for each user in the admin user list, add a button that links to their sleep dashboard.
    ```jsx
    <Button as={Link} to={`/admin/user-sleep-dashboard/${user._id}`} variant='info' className='admin-btn admin-btn-sm'>
        <FaMoon/>
    </Button>
    ```

By following this guide, a developer can systematically build and integrate the entire sleep tracking feature, understanding the purpose and placement of each piece of code. 