# Main Hero Section System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema](#database-schema)
4. [Backend Components](#backend-components)
5. [Frontend Components](#frontend-components)
6. [API Endpoints](#api-endpoints)
7. [Data Flow](#data-flow)
8. [Template System](#template-system)
9. [Admin Interface](#admin-interface)
10. [Configuration](#configuration)
11. [Troubleshooting](#troubleshooting)

## System Overview

The Main Hero Section system is a dynamic, template-based hero section management system that allows administrators to:
- Switch between different hero templates
- Edit template content through an admin interface
- Enable/disable the hero section globally
- Manage multiple hero designs with real-time preview

### Key Features
- **4 Built-in Templates**: Original, Classic, Minimal, Custom
- **Real-time Editing**: Admin can edit content and see changes immediately
- **Template Switching**: Easy switching between different hero designs
- **Responsive Design**: All templates work on desktop and mobile
- **Performance Optimized**: Lazy loading and code splitting
- **Database Persistence**: All changes saved to MongoDB

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │MainHero     │ │◄──►│ │Controller   │ │◄──►│ │MongoDB      │ │
│ │Section      │ │    │ │             │ │    │ │Collection:  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ │systemsettings│ │
│                 │    │                 │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │Admin        │ │◄──►│ │Routes       │ │    │                 │
│ │Interface    │ │    │ │             │ │    │                 │
│ └─────────────┘ │    │ └─────────────┘ │    │                 │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │Template     │ │    │ │Models       │ │    │                 │
│ │Components   │ │    │ │             │ │    │                 │
│ └─────────────┘ │    │ └─────────────┘ │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Database Schema

### Collection: `systemsettings`
Document with `key: "mainHero"`:

```javascript
{
  "_id": ObjectId("..."),
  "key": "mainHero",
  "mainHeroSettings": {
    "enabled": true,
    "selectedTemplate": "minimal", // "original" | "classic" | "minimal" | "custom"
    "templates": {
      "original": {
        "code": "original",
        "name": "Original Hero",
        "description": "Your beautiful original hero section with all features and animations",
        "content": {
          "title": "TRANSFORM YOUR FITNESS JOURNEY",
          "subtitle": "Join our elite community designed to transform your body and mindset...",
          "buttonText": "Start Workout",
          "buttonLink": "/workout",
          "backgroundImage": "",
          "showStats": false,
          "stats": []
        }
      },
      "classic": { /* Classic template structure */ },
      "minimal": { /* Minimal template structure */ },
      "custom": {
        "code": "custom",
        "name": "Custom Hero",
        "description": "Fully customizable hero with editable content from admin panel",
        "content": {
          "title": "TRANSFORM YOUR FITNESS JOURNEY",
          "subtitle": "Achieve your goals with our personalized fitness programs...",
          "buttonText": "Start Your Journey",
          "buttonLink": "/workout",
          "backgroundImage": "",
          "showStats": false,
          "primaryButton": {
            "text": "Start Your Journey",
            "link": "/workout"
          },
          "secondaryButton": {
            "text": "Learn More",
            "link": "/about"
          },
          "stats": []
        }
      }
    }
  },
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("..."),
  "lastUpdatedBy": ObjectId("...")
}
```

### Schema Validation

```javascript
// Hero Stat Schema
const heroStatSchema = mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
  icon: { type: String, required: true }
}, { _id: false });

// Main Hero Settings Schema
const mainHeroSettingsSchema = mongoose.Schema({
  enabled: { type: Boolean, default: true },
  selectedTemplate: { type: String, default: 'classic' },
  templates: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false, strict: false });
```

## Backend Components

### 1. Model (`backend/models/systemSettingsModel.js`)
```javascript
import mongoose from 'mongoose';

const systemSettingsSchema = mongoose.Schema({
  key: { type: String, required: true, unique: true },
  mainHeroSettings: mainHeroSettingsSchema,
  // ... other settings
}, { timestamps: true });
```

### 2. Controller (`backend/controllers/systemSettingsController.js`)

#### Key Functions:

**`getDefaultTemplates()`**
- Returns the 4 built-in template definitions
- Used when no custom templates exist
- Ensures system always has fallback templates

**`mergeWithDefaultTemplates(savedTemplates)`**
- Merges saved templates with default templates
- Ensures all 4 templates are always available
- Preserves custom edits while filling missing templates

**`getMainHeroSettings()`**
- **Route**: `GET /api/system-settings/main-hero`
- Returns hero settings with full template data
- Always returns all 4 templates (merged with defaults)
- Used by frontend to display hero sections

**`updateMainHeroSettings(enabled, selectedTemplate)`**
- **Route**: `PUT /api/system-settings/main-hero`
- Updates basic settings (enabled/selectedTemplate)
- Preserves existing templates
- Creates default templates if none exist

**`getHeroTemplate(templateCode)`**
- **Route**: `GET /api/system-settings/main-hero/template/:templateCode`
- Returns specific template data
- Used for individual template editing

**`updateHeroTemplate(templateCode, templateData)`**
- **Route**: `PUT /api/system-settings/main-hero/template/:templateCode`
- Updates specific template content
- Preserves other templates
- Uses `markModified()` for MongoDB nested object updates

### 3. Routes (`backend/routes/systemSettingsRoutes.js`)
```javascript
import express from 'express';
import {
  getMainHeroSettings,
  updateMainHeroSettings,
  getHeroTemplate,
  updateHeroTemplate
} from '../controllers/systemSettingsController.js';

const router = express.Router();

// Main hero settings routes
router.get('/main-hero', getMainHeroSettings);
router.put('/main-hero', protect, admin, updateMainHeroSettings);

// Individual template routes
router.get('/main-hero/template/:templateCode', getHeroTemplate);
router.put('/main-hero/template/:templateCode', protect, admin, updateHeroTemplate);
```

## Frontend Components

### 1. API Slice (`frontend/src/slices/systemApiSlice.js`)

**RTK Query Endpoints:**
```javascript
getMainHeroSettings: builder.query({
  query: () => ({ url: `/api/system-settings/main-hero` }),
  keepUnusedDataFor: 300, // 5-minute cache
  providesTags: ['MainHero'],
}),

updateMainHeroSettings: builder.mutation({
  query: (heroSettings) => ({
    url: `/api/system-settings/main-hero`,
    method: 'PUT',
    body: heroSettings,
  }),
  invalidatesTags: ['MainHero', 'HeroTemplate'],
}),

updateHeroTemplate: builder.mutation({
  query: ({ templateCode, ...templateData }) => ({
    url: `/api/system-settings/main-hero/template/${templateCode}`,
    method: 'PUT',
    body: templateData,
  }),
  invalidatesTags: ['MainHero'],
}),
```

### 2. Main Hero Section (`frontend/src/components/hero/MainHeroSection.jsx`)

**Purpose**: Main component that displays the active hero template

**Key Features**:
- Lazy loads template components for performance
- Switches between templates based on `selectedTemplate`
- Handles loading states and errors
- Force re-renders when content changes

**Template Selection Logic**:
```javascript
const TemplateComponent = useMemo(() => {
  if (!isEnabled) return null;
  
  switch (selectedTemplate) {
    case 'original': return OriginalHeroTemplate;
    case 'classic': return ClassicHeroTemplate;
    case 'minimal': return MinimalHeroTemplate;
    case 'custom': return CustomHeroTemplate;
    default: return OriginalHeroTemplate;
  }
}, [selectedTemplate, isEnabled]);
```

### 3. Admin Interface (`frontend/src/components/admin/SystemMainHeroManager.jsx`)

**Purpose**: Admin panel for managing hero templates

**Key Features**:
- Enable/disable hero section globally
- Switch between templates
- Edit template content in modal
- Real-time preview links
- Template cards with descriptions

**State Management**:
```javascript
const [localSettings, setLocalSettings] = useState(null);
const [editingTemplate, setEditingTemplate] = useState(null);
const [showTemplateEditor, setShowTemplateEditor] = useState(false);
```

### 4. Template Components

#### Directory Structure:
```
frontend/src/components/hero/templates/
├── OriginalHeroTemplate.jsx     # Original design with stats and progress
├── ClassicHeroTemplate.jsx      # Traditional hero with background
├── MinimalHeroTemplate.jsx      # Clean, simple design
└── CustomHeroTemplate.jsx       # Modern design with dual buttons
```

Each template receives:
```javascript
{
  templateData: {
    code: "minimal",
    name: "Minimal Hero",
    description: "Clean and simple hero section",
    content: {
      title: "...",
      subtitle: "...",
      buttonText: "...",
      buttonLink: "...",
      // ... other content
    }
  },
  userInfo: { /* user data */ },
  forceRefreshKey: 123 // for force re-renders
}
```

## API Endpoints

### Main Hero Settings

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|---------|
| GET | `/api/system-settings/main-hero` | Get hero settings with all templates | Public |
| PUT | `/api/system-settings/main-hero` | Update basic settings (enabled/selectedTemplate) | Admin |
| GET | `/api/system-settings/main-hero/template/:code` | Get specific template | Public |
| PUT | `/api/system-settings/main-hero/template/:code` | Update specific template | Admin |

### Request/Response Examples

**GET `/api/system-settings/main-hero`**
```javascript
// Response
{
  "enabled": true,
  "selectedTemplate": "minimal",
  "templates": {
    "original": { /* full template data */ },
    "classic": { /* full template data */ },
    "minimal": { /* full template data */ },
    "custom": { /* full template data */ }
  },
  "timestamp": 1640995200000
}
```

**PUT `/api/system-settings/main-hero`**
```javascript
// Request Body
{
  "enabled": true,
  "selectedTemplate": "custom"
}

// Response
{
  "enabled": true,
  "selectedTemplate": "custom",
  "templates": { /* all templates preserved */ }
}
```

**PUT `/api/system-settings/main-hero/template/minimal`**
```javascript
// Request Body
{
  "name": "Minimal Hero",
  "description": "Clean and simple hero section",
  "content": {
    "title": "New Title",
    "subtitle": "New subtitle",
    "buttonText": "New Button",
    "buttonLink": "/new-link"
  }
}

// Response
{
  "name": "Minimal Hero",
  "description": "Clean and simple hero section",
  "content": { /* updated content */ }
}
```

## Data Flow

### 1. Loading Hero Section (Frontend → Backend → Database)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ MainHeroSection │───►│ getMainHero     │───►│ MongoDB Query   │
│ Component       │    │ Settings API    │    │ {key:"mainHero"}│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       │
         │                       │                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │ Merge with      │◄───│ Raw DB Data     │
         │              │ Default         │    │                 │
         │              │ Templates       │    │                 │
         │              └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
         Full Template Data Response
```

### 2. Admin Panel Save (Frontend → Backend → Database)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Admin Interface │───►│ updateMainHero  │───►│ MongoDB Update  │
│ Save Button     │    │ Settings API    │    │ Preserve        │
└─────────────────┘    └─────────────────┘    │ Templates       │
         │                       │             └─────────────────┘
         │              ┌─────────────────┐             │
         │              │ Only Send:      │             ▼
         └──────────────│ - enabled       │    ┌─────────────────┐
                        │ - selectedTemp  │    │ markModified()  │
                        └─────────────────┘    │ Save Document   │
                                               └─────────────────┘
```

### 3. Template Edit (Frontend → Backend → Database)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Template Editor │───►│ updateHero      │───►│ MongoDB Update  │
│ Modal Save      │    │ Template API    │    │ Specific        │
└─────────────────┘    └─────────────────┘    │ Template Only   │
         │                       │             └─────────────────┘
         │              ┌─────────────────┐             │
         │              │ Update Only:    │             ▼
         └──────────────│ templates[code] │    ┌─────────────────┐
                        │ = templateData  │    │ markModified    │
                        └─────────────────┘    │ ('templates')   │
                                               └─────────────────┘
```

## Template System

### Template Structure

Each template must follow this structure:
```javascript
{
  code: "template_code",           // Unique identifier
  name: "Template Name",           // Display name
  description: "Template desc",    // Admin panel description
  content: {
    title: "Main Title",           // Required
    subtitle: "Subtitle text",     // Required
    buttonText: "Button text",     // Required (or primaryButton)
    buttonLink: "/link",           // Required (or primaryButton.link)
    backgroundImage: "url",        // Optional
    showStats: false,              // Optional
    stats: [],                     // Optional array of stat objects
    
    // Custom template fields
    primaryButton: {               // Optional (for custom template)
      text: "Primary",
      link: "/primary"
    },
    secondaryButton: {             // Optional (for custom template)
      text: "Secondary", 
      link: "/secondary"
    }
  }
}
```

### Default Templates

1. **Original Template**
   - **Features**: Progress stats, circular indicators, achievement badges
   - **Best for**: Fitness apps with user progress tracking
   - **Components**: Stats section, floating cards, gradient titles

2. **Classic Template**
   - **Features**: Traditional hero with background image
   - **Best for**: Corporate or professional sites
   - **Components**: Background image, centered content, single CTA

3. **Minimal Template**
   - **Features**: Clean, simple design with minimal elements
   - **Best for**: Modern, minimalist designs
   - **Components**: Centered text, single button, gradient backgrounds

4. **Custom Template**
   - **Features**: Dual buttons, statistics cards, modern layout
   - **Best for**: Complex applications needing multiple CTAs
   - **Components**: Primary/secondary buttons, stats cards, flexible content

## Admin Interface

### Access
- **URL**: `/admin/system-settings`
- **Tab**: "Main Hero" (between General and Carousel tabs)
- **Authentication**: Admin role required

### Features

#### 1. Global Controls
- **Enable/Disable Toggle**: Controls hero section visibility
- **Template Selector**: Dropdown to switch active template
- **Save Button**: Persists settings to database

#### 2. Template Management
- **Template Cards**: Visual display of all available templates
- **Edit Buttons**: Open template editor modal
- **Select Buttons**: Switch active template
- **Active Indicator**: Shows currently selected template

#### 3. Template Editor Modal
- **Basic Info**: Template name and description
- **Content Fields**: Title, subtitle, button text/links
- **Button Configuration**: Support for single or dual buttons
- **Statistics Manager**: Add/edit/remove stat items
- **Background Settings**: Image URL configuration

#### 4. Preview Mode
- **Live Preview Link**: Direct link to home page
- **Real-time Updates**: Changes reflect immediately after save
- **Template Switching**: Preview different templates instantly

### Code Example - Admin Save Function:
```javascript
const handleSaveSettings = async () => {
  const settingsToSave = {
    enabled: localSettings.enabled,
    selectedTemplate: localSettings.selectedTemplate
    // Only essential settings - templates preserved automatically
  };
  
  await updateHeroSettings(settingsToSave).unwrap();
  toast.success('Settings saved!');
  refetchSettings();
};
```

## Configuration

### Environment Variables
```bash
# Backend (.env)
MONGO_URI=mongodb://localhost:27017/your_database
JWT_SECRET=your_jwt_secret
```

### Frontend Configuration
```javascript
// frontend/src/constants.js
export const BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001' 
  : '';
```

### Performance Settings
```javascript
// RTK Query Cache Configuration
getMainHeroSettings: builder.query({
  keepUnusedDataFor: 300, // 5 minutes
  providesTags: ['MainHero'],
})
```

## Troubleshooting

### Common Issues

#### 1. "Cannot convert undefined or null to object"
**Cause**: Frontend trying to access template data before it's loaded
**Solution**: 
- Ensure proper loading states
- Add null checks: `heroSettings?.templates?.[templateCode]`
- Verify backend returns full template data

#### 2. Templates not saving
**Cause**: MongoDB not detecting nested object changes
**Solution**:
```javascript
systemSettings.markModified('mainHeroSettings.templates');
await systemSettings.save();
```

#### 3. Only one template showing
**Cause**: Backend returning incomplete data or frontend not handling all templates
**Solution**:
- Check `mergeWithDefaultTemplates()` function
- Ensure API returns all 4 templates
- Verify frontend maps all templates correctly

#### 4. Admin panel crashes
**Cause**: Missing template data or API errors
**Solution**:
- Add proper error boundaries
- Implement loading states
- Validate data structure before rendering

#### 5. Hero section not displaying
**Cause**: Template disabled or data missing
**Debug Steps**:
```javascript
console.log('Hero Debug:', {
  enabled: heroSettings?.enabled,
  selectedTemplate: heroSettings?.selectedTemplate,
  hasTemplateData: !!heroSettings?.templates?.[selectedTemplate],
  templateKeys: Object.keys(heroSettings?.templates || {})
});
```

### Database Debugging

```javascript
// Check hero document in MongoDB
db.systemsettings.findOne({key: "mainHero"})

// Check template keys
db.systemsettings.findOne(
  {key: "mainHero"}, 
  {"mainHeroSettings.templates": 1}
)

// Delete document to reset
db.systemsettings.deleteOne({key: "mainHero"})
```

### Frontend Debugging

```javascript
// Check Redux state
import { store } from './store';
console.log('Hero State:', store.getState().api.queries);

// Force refetch
const { refetch } = useGetMainHeroSettingsQuery();
refetch();

// Clear cache
import { systemApiSlice } from './slices/systemApiSlice';
dispatch(systemApiSlice.util.invalidateTags(['MainHero']));
```

---

## Quick Reference

### File Locations
```
Backend:
├── models/systemSettingsModel.js           # Database schema
├── controllers/systemSettingsController.js # Business logic
└── routes/systemSettingsRoutes.js          # API routes

Frontend:
├── src/components/hero/MainHeroSection.jsx           # Main display component
├── src/components/admin/SystemMainHeroManager.jsx    # Admin interface
├── src/components/hero/templates/                    # Template components
│   ├── OriginalHeroTemplate.jsx
│   ├── ClassicHeroTemplate.jsx
│   ├── MinimalHeroTemplate.jsx
│   └── CustomHeroTemplate.jsx
└── src/slices/systemApiSlice.js                     # API layer
```

### Key URLs
- **Home Page**: `http://localhost:3000/home`
- **Admin Panel**: `http://localhost:3000/admin/system-settings`
- **API Base**: `http://localhost:3001/api/system-settings/main-hero`

This documentation provides a complete overview of the Main Hero Section system architecture, implementation, and usage patterns. 