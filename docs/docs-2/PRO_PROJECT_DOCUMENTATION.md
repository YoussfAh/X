# PRO Project: Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Frontend Structure](#frontend-structure)
4. [Backend Structure](#backend-structure)
5. [Authentication System](#authentication-system)
6. [Data Models](#data-models)
7. [API Endpoints](#api-endpoints)
8. [Core Features](#core-features)
9. [Key Components](#key-components)
10. [Deployment Instructions](#deployment-instructions)
11. [Common Issues & Solutions](#common-issues--solutions)

## Project Overview

PRO is a full-stack e-commerce and fitness tracking application built with the MERN stack (MongoDB, Express.js, React.js, Node.js). It combines traditional e-commerce functionality with specialized features for fitness products, allowing users to track workouts and organize products into collections.

**Key Features:**
- E-commerce product browsing and purchasing
- User authentication and profile management
- Admin dashboard for product and collection management
- Workout tracking system for fitness products
- Collections system with access control
- Payment processing integration
- Responsive design for all devices

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────┐       ┌─────────────────────┐       ┌─────────────────┐
│                 │       │                     │       │                 │
│  React          │       │  Redux Store        │       │  Express        │
│  Components     │◄─────►│  w/ RTK Query       │◄─────►│  API Server     │
│  (UI Layer)     │       │  (State & API Layer)│       │  (Backend)      │
│                 │       │                     │       │                 │
└─────────────────┘       └─────────────────────┘       └────────┬────────┘
                                                                 │
                                                        ┌────────▼────────┐
                                                        │                 │
                                                        │  MongoDB        │
                                                        │  Database       │
                                                        │                 │
                                                        └─────────────────┘
```

### Technologies Used

**Frontend:**
- React.js for UI components
- Redux Toolkit for state management
- RTK Query for API integration
- React Router for navigation
- React Bootstrap for UI components
- React Icons for iconography

**Backend:**
- Node.js runtime
- Express.js framework
- MongoDB database
- Mongoose ODM for data modeling
- JSON Web Tokens (JWT) for authentication
- Middleware for request validation and error handling

**Development & Deployment:**
- Vercel for hosting (both frontend and backend)
- Git for version control
- ESLint for code quality
- Postman for API testing

## Frontend Structure

### Directory Organization

The frontend follows a modular organization with clear separation of concerns:

- **/src/components/**: Reusable UI components
- **/src/screens/**: Main application screens/pages
- **/src/screens/admin/**: Admin-specific screens
- **/src/slices/**: Redux Toolkit slices and RTK Query API definitions
- **/src/utils/**: Utility functions
- **/src/assets/**: Static assets like images and styles
- **/src/constants.js**: Application-wide constants and API URLs

### State Management

State management is centralized using Redux Toolkit in `store.js`:

```javascript
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './slices/apiSlice';
import authReducer from './slices/authSlice';

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: true,
});
```

### API Integration

RTK Query is used for API integration, with the base configuration in `apiSlice.js`:

```javascript
// Excerpt from apiSlice.js
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
});

async function baseQueryWithAuth(args, api, extra) {
  const result = await baseQuery(args, api, extra);
  // Auto-logout on 401 unauthorized responses
  if (result.error && result.error.status === 401) {
    api.dispatch(logout());
  }
  return result;
}

export const apiSlice = createApi({
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Product', 'Order', 'User', 'Collection', 'Workout'],
  endpoints: (builder) => ({}),
});
```

Separate API slice files extend this base slice for different resource types (products, users, orders, collections, etc.)

### Routing

The application uses React Router for navigation, with routes defined in `App.js`. There are several route wrapper components:
- **PrivateRoute**: For authenticated users only
- **PublicRoute**: For unauthenticated users only
- **AdminRoute**: For admin users only

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| Header | Main navigation | `/src/components/Header.jsx` |
| Footer | Site footer | `/src/components/Footer.jsx` |
| Product | Product card display | `/src/components/Product.jsx` |
| QuickWorkoutTracker | Mini workout tracker | `/src/components/QuickWorkoutTracker.jsx` |
| WorkoutEntryForm | Form to log workouts | `/src/components/WorkoutEntryForm.jsx` |
| Rating | Star rating display | `/src/components/Rating.jsx` |
| Message | Alert/notification display | `/src/components/Message.jsx` |
| Loader | Loading spinner | `/src/components/Loader.jsx` |

## Backend Structure

### Directory Organization

The backend follows a modular structure:

- **/config/**: Database configuration
- **/controllers/**: Request handlers for different resources
- **/middleware/**: Custom middleware functions
- **/models/**: MongoDB/Mongoose data models
- **/routes/**: API route definitions
- **/utils/**: Utility functions
- **/data/**: Seed data for development
- **/server.js**: Main application entry point

### API Routes

All API routes are prefixed with `/api/`:

- **/api/products/**: Product management
- **/api/users/**: User authentication and profile management
- **/api/orders/**: Order processing and payment
- **/api/collections/**: Collection management
- **/api/workouts/**: Workout tracking
- **/api/one-time-codes/**: One-time access code management
- **/api/upload/**: File upload handling

### Middleware

Several middleware functions are used:

- **authMiddleware.js**: JWT authentication
- **checkObjectId.js**: MongoDB ObjectId validation
- **errorMiddleware.js**: Error handling
- **asyncHandler.js**: Async/await error handling wrapper

## Authentication System

The application uses JWT (JSON Web Tokens) for authentication:

1. **Login Flow**:
   - User submits credentials to `/api/users/login`
   - Server validates credentials and generates JWT token
   - Token is returned to client and stored in localStorage
   - Redux state is updated with user info and token

2. **Authentication Check**:
   - Protected routes use `authMiddleware.js` to verify token
   - Frontend components use private route wrappers to check auth state
   - Token is included in API requests via RTK Query configuration

3. **User Roles**:
   - Regular users can browse products, make purchases, and track workouts
   - Admin users have additional access to admin routes and CRUD operations

4. **Auto-Logout**:
   - When token expires, 401 responses trigger automatic logout
   - Custom `baseQueryWithAuth` function in `apiSlice.js` handles this

## Data Models

### Product Model

```javascript
const productSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    image: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    countInStock: { type: Number, required: true, default: 0 },
    youtubeVideo: { type: String }
  },
  { timestamps: true }
);
```

### User Model

```javascript
const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);
```

### Order Model

```javascript
const orderSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: { type: String, required: true },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);
```

### Collection Model

```javascript
const collectionSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
        displayOrder: { type: Number, default: 0 }
      },
    ],
    isPublic: { type: Boolean, default: true },
    requiresCode: { type: Boolean, default: false },
    accessCode: { type: String },
    parentCollection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
    },
  },
  { timestamps: true }
);
```

### Workout Entry Model

```javascript
const workoutEntrySchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    collection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
    },
    date: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    reps: {
      type: Number,
    },
    sets: {
      type: Number,
    },
    weight: {
      type: Number,
    },
    distance: {
      type: Number,
    },
    notes: {
      type: String,
    },
    feeling: {
      type: String,
      enum: ['easy', 'moderate', 'hard', 'extreme'],
    },
  },
  { timestamps: true }
);
```

### One-Time Code Model

```javascript
const oneTimeCodeSchema = mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    collection: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Collection',
    },
    isRedeemed: {
      type: Boolean,
      default: false,
    },
    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);
```

## API Endpoints

### Product Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|--------------|
| GET | /api/products | Get all products | No |
| GET | /api/products/:id | Get product detail | No |
| POST | /api/products | Create new product | Admin |
| PUT | /api/products/:id | Update product | Admin |
| DELETE | /api/products/:id | Delete product | Admin |
| GET | /api/products/top | Get top-rated products | No |

### User Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|--------------|
| POST | /api/users | Register a new user | No |
| POST | /api/users/login | Authenticate user & get token | No |
| GET | /api/users/profile | Get user profile | Yes |
| PUT | /api/users/profile | Update user profile | Yes |
| GET | /api/users | Get all users | Admin |
| GET | /api/users/:id | Get user by ID | Admin |
| DELETE | /api/users/:id | Delete user | Admin |
| PUT | /api/users/:id | Update user | Admin |

### Order Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|--------------|
| POST | /api/orders | Create new order | Yes |
| GET | /api/orders/myorders | Get logged in user orders | Yes |
| GET | /api/orders/:id | Get order by ID | Yes |
| PUT | /api/orders/:id/pay | Update order to paid | Yes |
| PUT | /api/orders/:id/deliver | Update order to delivered | Admin |
| GET | /api/orders | Get all orders | Admin |

### Collection Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|--------------|
| GET | /api/collections | Get all collections | No |
| GET | /api/collections/:id | Get collection by ID | No |
| POST | /api/collections | Create new collection | Admin |
| PUT | /api/collections/:id | Update collection | Admin |
| DELETE | /api/collections/:id | Delete collection | Admin |
| POST | /api/collections/:id/products | Add product to collection | Admin |
| DELETE | /api/collections/:id/products/:productId | Remove product from collection | Admin |

### Workout Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|--------------|
| GET | /api/workouts/user | Get all workouts for current user | Yes |
| GET | /api/workouts/product/:productId | Get workouts by product | Yes |
| POST | /api/workouts | Create new workout entry | Yes |
| PUT | /api/workouts/:id | Update workout entry | Yes |
| DELETE | /api/workouts/:id | Delete workout entry | Yes |

### One-Time Code Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|--------------|
| POST | /api/one-time-codes | Generate new code | Admin |
| POST | /api/one-time-codes/redeem | Redeem a code | Yes |
| GET | /api/one-time-codes/collection/:collectionId | Get codes for collection | Admin |

## Core Features

### E-commerce Functionality

The application provides a complete e-commerce experience:

1. **Product Browsing**:
   - Homepage with featured products
   - Product search functionality
   - Category filtering
   - Pagination for large product catalogs

2. **Shopping Cart**:
   - Add/remove products
   - Update quantities
   - Cart persistence using localStorage

3. **Checkout Process**:
   - Shipping address collection
   - Payment method selection
   - Order summary and confirmation
   - Payment processing

4. **Order Management**:
   - Order history for users
   - Complete order management for admins

### Workout Tracking System

A unique feature of the application is the workout tracking for fitness products:

1. **Workout Entry**:
   - Log workouts associated with specific products
   - Record details like sets, reps, weight, duration
   - Add notes and rate workout intensity

2. **Workout History**:
   - View past workouts for each product
   - Filter and sort workout history
   - Track progress over time

3. **Quick Workout Tracker**:
   - Streamlined mini-widget for logging workouts
   - Available directly from product card for fitness category products

### Collections System

The application allows organizing products into collections:

1. **Collection Management**:
   - Create and customize collections (admin)
   - Add/remove products from collections
   - Arrange product order within collections
   - Nested collections with parent/child relationships

2. **Access Control**:
   - Public and private collections
   - One-time access codes for restricted collections
   - Code generation and redemption system

### Admin Dashboard

Comprehensive administration features are available:

1. **Product Management**:
   - Create, read, update, delete products
   - Upload product images
   - Manage product stock and details

2. **User Management**:
   - View all users
   - Change user roles
   - Delete users if necessary

3. **Order Processing**:
   - View all orders
   - Mark orders as delivered
   - Process refunds

4. **Collection & Access Control**:
   - Manage collections
   - Create access codes
   - Monitor code usage

## Key Components

### WorkoutEntryForm

This component allows users to log workouts for fitness products:

```jsx
// Key functionality in WorkoutEntryForm
const submitHandler = async (e) => {
  e.preventDefault();
  
  try {
    // Prepare workout data
    const workoutData = {
      product: productId,
      collection: collectionId,
      date,
      duration,
      sets,
      reps,
      weight,
      distance,
      feeling,
      notes,
    };
    
    // Submit to API
    await createWorkoutEntry(workoutData).unwrap();
    toast.success('Workout logged successfully!');
    
    // Reset form
    resetForm();
    
    // Notify parent component
    if (onEntryAdded) {
      onEntryAdded();
    }
  } catch (err) {
    toast.error(err?.data?.message || err.error);
  }
};
```

### QuickWorkoutTracker

A compact widget for logging workouts directly from product cards:

```jsx
// Key functionality in QuickWorkoutTracker
return (
  <div className="quick-workout-tracker mt-3" style={{
    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
    borderRadius: '8px',
    overflow: 'hidden'
  }}>
    <div 
      className="tracker-header d-flex justify-content-between align-items-center p-2"
      style={{
        backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
        borderBottom: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
        cursor: 'pointer'
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="d-flex align-items-center">
        <FaDumbbell style={{ color: accentColor, marginRight: '8px' }} />
        <span style={{ fontWeight: '500' }}>Workout Tracker</span>
      </div>
    </div>
    
    <Collapse in={expanded}>
      <div>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mt-2 px-2"
        >
          <Tab eventKey="history" title="History">
            {/* History tab content */}
          </Tab>
          <Tab eventKey="log" title="Log Workout">
            <WorkoutEntryForm 
              productId={productId}
              collectionId={collectionId}
              onEntryAdded={() => {
                // Switch back to history tab after adding entry
                setActiveTab('history');
              }}
              compact={true}
            />
          </Tab>
        </Tabs>
      </div>
    </Collapse>
  </div>
);
```

### ProductContent

Main component for displaying product details and related functionality:

```jsx
// Key functionality in ProductContent
return (
  <>
    <div className='product-main mb-5' style={cardStyle}>
      <div className='row g-4'>
        <div className='col-lg-5 mb-4 mb-lg-0'>
          {/* Product image */}
        </div>
        <div className='col-lg-7'>
          <div className='product-details h-100 d-flex flex-column'>
            <h2>{product.name}</h2>
            <div className='product-description mb-4 flex-grow-1'>
              {/* Product description */}
            </div>
            <div className='product-meta pt-3 mt-auto'>
              {/* Product metadata */}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Video section if product has YouTube video */}
    {product.youtubeVideo && (
      <VideoSection
        product={product}
        isDarkMode={isDarkMode}
        inCollection={inCollection}
        productId={productId}
      />
    )}
    
    {/* Workout tracking section */}
    {true && (
      <div className="workout-tracking-section my-5" style={cardStyle}>
        <Tabs
          activeKey={workoutTracking}
          onSelect={(k) => setWorkoutTracking(k)}
          className="mb-4"
        >
          <Tab eventKey="history" title="History">
            <p>Workout history has been removed.</p>
          </Tab>
          <Tab eventKey="logWorkout" title="Log Workout">
            <WorkoutEntryForm 
              productId={productId}
              collectionId={collectionId}
              entryToEdit={entryToEdit}
              onEntryAdded={() => {
                setWorkoutTracking('history');
                setEntryToEdit(null);
              }}
            />
          </Tab>
        </Tabs>
      </div>
    )}
  </>
);
```

## Deployment Instructions

### Prerequisites

- Node.js (v14+)
- MongoDB account (Atlas or local installation)
- Vercel account (for deployment)
- PayPal developer account (for payment processing)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd PRO
   ```

2. **Install dependencies**:
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory with:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PAYPAL_CLIENT_ID=your_paypal_client_id
   ```

4. **Initialize the database**:
   ```bash
   npm run data:import
   ```

5. **Start the development server**:
   ```bash
   # Run backend & frontend concurrently
   npm run dev
   
   # Or run separately:
   npm run server  # Backend only
   cd frontend && npm start  # Frontend only
   ```

### Production Deployment

The application is configured for deployment on Vercel:

1. **Backend deployment**:
   - Push code to your GitHub repository
   - Create a new project in Vercel
   - Link to your repository
   - Set environment variables
   - Deploy

2. **Frontend deployment**:
   - Update `BASE_URL` in `frontend/src/constants.js` to point to your backend URL
   - Deploy frontend to Vercel as a separate project

## Common Issues & Solutions

### Authentication Issues

**Problem**: User gets logged out unexpectedly or can't access protected routes.

**Solution**: 
- Check that JWT token is being stored correctly in localStorage
- Verify token expiration time (default 30 days)
- Check for 401 errors in the Network tab of browser dev tools

### API Connection Errors

**Problem**: Frontend can't connect to backend API.

**Solution**:
- Check that `BASE_URL` in `frontend/src/constants.js` points to correct API URL
- Ensure CORS is properly configured on backend
- Verify that backend server is running and accessible

### Collection View & Access System

#### How Collection Viewing Works

When a user navigates to a URL like `http://localhost:3000/collections/67edb8a0c7688bf54c945fcf`, the following process occurs:

1. **Initial Data Fetching**:
   - The `CollectionScreen` component extracts the collection ID (`67edb8a0c7688bf54c945fcf`) from the URL parameters
   - The component uses RTK Query's `useGetCollectionDetailsQuery` hook to fetch collection data from `/api/collections/:id` endpoint
   - The backend controller (`getCollectionById` in `collectionController.js`) retrieves the collection and its products from MongoDB

2. **Access Control Validation**:
   - The system checks if the collection requires an access code by examining `collection.requiresCode`
   - For collections that don't require a code, access is granted immediately
   - For protected collections, the system checks:
     a. If user is logged in and collection is in their `lockedCollections` with 'active' status
     b. If there's valid access data in localStorage (`collection_access_${collectionId}`)
     c. If the stored access timestamp is newer than the collection's `codeUpdatedAt` (prevents access with outdated codes)

3. **Collection Content Display**:
   - Once access is granted, the collection's products are displayed in grid format
   - Products are populated from the `collection.products` array using the relationship defined in the `collectionModel.js`
   - The backend populates all relevant product details (`name`, `image`, `price`, `rating`, etc.) by using Mongoose's populate feature

4. **Subcollections Handling**:
   - If the collection has subcollections, they are fetched using the `useGetSubCollectionsQuery` hook
   - Subcollections are only fetched if access to the parent collection is granted
   - Each subcollection card shows metadata (name, description, image) and indicates if it requires an access code

5. **User Activity Tracking**:
   - If the user is logged in, their collection access is tracked in their profile
   - The `updateAccessedCollections` API is called to add the collection to user's `accessedCollections` array
   - This allows the system to show recently accessed collections on the user's profile page

6. **Navigation Structure**:
   - A breadcrumb navigation system shows the hierarchy of collections
   - For subcollections, a back button allows navigation to the parent collection
   - For root collections, the back button takes the user to the home page

#### API Flow for Collection Viewing

When a user accesses `http://localhost:3000/collections/67edb8a0c7688bf54c945fcf`:

1. **Frontend API Call**:
   ```javascript
   // Using RTK Query hook in CollectionScreen.jsx
   const {
     data: collection,
     isLoading,
     error,
     refetch,
   } = useGetCollectionDetailsQuery(collectionId);
   ```

2. **Backend Controller Processing**:
   ```javascript
   // In collectionController.js
   const getCollectionById = asyncHandler(async (req, res) => {
     const collection = await Collection.findById(req.params.id)
       .populate({
         path: 'products.product',
         select: 'name image price rating numReviews'
       });
     
     // Additional processing for accessibility and subcollections
     
     return res.json({
       ...collection.toObject(),
       subCollections,
     });
   });
   ```

3. **Response Structure**:
   ```javascript
   {
     _id: "67edb8a0c7688bf54c945fcf",
     name: "Collection Name",
     description: "Collection description text",
     image: "/images/collection-image.jpg",
     products: [
       {
         product: {
           _id: "67edb8a0c7688bf54c945fd0",
           name: "Product Name",
           image: "/images/product-image.jpg",
           price: 29.99,
           rating: 4.5,
           numReviews: 12
         },
         displayOrder: 0
       },
       // Additional products...
     ],
     isPublic: true,
     requiresCode: false,
     subCollections: [
       {
         _id: "67edb8a0c7688bf54c945fd1",
         name: "Subcollection Name",
         description: "Subcollection description",
         image: "/images/subcollection-image.jpg",
         requiresCode: true,
         isPublic: true
       },
       // Additional subcollections...
     ]
   }
   ```

#### Access Code System

For collections that require an access code:

1. **Code Verification Process**:
   - When a user attempts to access a protected collection, a modal prompts for an access code
   - The entered code is validated using the `/api/one-time-codes/redeem` endpoint
   - The backend checks if the code exists, is valid for the specific collection, and hasn't expired

2. **Code Storage & Verification**:
   ```javascript
   // In CollectionScreen.jsx
   const handleCodeSubmit = async (e) => {
     e.preventDefault();
     
     try {
       // Validate code with backend
       const result = await validateOneTimeCode({
         code: accessCode,
         collectionId: collectionId,
       }).unwrap();
       
       // If valid, save access token to localStorage
       if (result.success) {
         localStorage.setItem(
           `collection_access_${collectionId}`,
           JSON.stringify({
             granted: true,
             timestamp: new Date().toISOString(),
             // Additional metadata...
           })
         );
       }
     } catch (err) {
       // Handle error...
     }
   };
   ```

3. **Access Persistence**:
   - Once access is granted, it persists through localStorage
   - The system checks the stored access timestamp against the collection's `codeUpdatedAt`
   - If a collection's access code is changed by an admin, all previous accesses are invalidated

#### Collection Creation & Management

Administrators can create collections through:

1. **Admin Interface**:
   - Create collection with basic details (name, description, image)
   - Set access control (public/private, access code requirement)
   - Add products to the collection with specific display order

2. **API Endpoints**:
   ```javascript
   // Creating a collection (Admin only)
   POST /api/collections
   {
     "name": "New Collection",
     "description": "Collection description",
     "image": "/images/collection-image.jpg",
     "isPublic": true,
     "requiresCode": false
   }
   
   // Adding products to a collection (Admin only)
   POST /api/collections/:id/products
   {
     "productId": "67edb8a0c7688bf54c945fd0",
     "displayOrder": 0
   }
   ```

#### User Experience Benefits

The collection system provides several key benefits:

1. **Organized Product Discovery**: Collections group related products, improving user navigation
2. **Restricted Access Content**: Premium or specialized collections can be protected with access codes
3. **Hierarchical Organization**: Parent-child relationships between collections create intuitive navigation
4. **User Activity Tracking**: Recently accessed collections are tracked for user convenience
5. **Visual Browsing Experience**: Collections provide a visually appealing way to browse products

### Workout Tracking Not Working

**Problem**: Unable to log workouts or view workout history.

**Solution**:
- Check that user is logged in (workout features require authentication)
- Verify productId and collectionId are being passed correctly
- Check browser console for any errors in API requests

### Collection Access Issues

**Problem**: Can't access a private collection even with access code.

**Solution**:
- Verify the access code is valid and not expired
- Check that user is logged in
- Ensure the collection exists and is configured correctly with access control

### Image Upload Failures

**Problem**: Product or collection images fail to upload.

**Solution**:
- Check file size (limit is typically 5MB)
- Verify supported file types (JPG, PNG, GIF)
- Check backend storage configuration and permissions

### Payment Processing Issues

**Problem**: Payment processing fails or gets stuck.

**Solution**:
- Verify PayPal API credentials are correct
- Check that your PayPal developer account is properly set up
- Test in PayPal sandbox environment before going live

## Conclusion

The PRO project combines modern e-commerce functionality with innovative fitness tracking features, all built on a solid MERN stack foundation. Its modular architecture makes it easy to understand and extend, while features like collections and access control provide flexibility for various business models.

This document should provide a comprehensive overview for anyone looking to understand the project structure and functionality without diving into every code file. For specific implementation details, refer to the individual code files in their respective directories.
