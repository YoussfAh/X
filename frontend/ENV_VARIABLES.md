# Environment Variables

## ⚠️ MAJOR UPDATE - App Branding & Naming System

**All app naming and branding is now managed through a centralized configuration system** instead of environment variables or database settings. This provides better performance, consistency, and easier maintenance.
//
## Frontend Environment Variables

| Variable | Description | Default | Status |
|----------|-------------|---------|---------|
| ~~REACT_APP_NAME~~ | ~~Application name~~ | ~~GRINDX~~ | **REMOVED - Now centralized in appBranding.js** |
| ~~REACT_APP_SITE_NAME~~ | ~~Site name~~ | ~~App~~ | **REMOVED - Now centralized in appBranding.js** |
| ~~REACT_APP_SITE_DESCRIPTION~~ | ~~Site description~~ | ~~-~~ | **REMOVED - Now centralized in appBranding.js** |
| ~~REACT_APP_HEADER_IMAGE~~ | ~~Header image URL~~ | ~~-~~ | **REMOVED - Now centralized in appBranding.js** |
| ~~REACT_APP_PWA_SHORT_NAME~~ | ~~PWA short name~~ | ~~App~~ | **REMOVED - Now centralized in appBranding.js** |
| ~~REACT_APP_PWA_THEME_COLOR~~ | ~~PWA theme color~~ | ~~#000000~~ | **REMOVED - Now centralized in appBranding.js** |
| ~~REACT_APP_PWA_BACKGROUND_COLOR~~ | ~~PWA background color~~ | ~~#ffffff~~ | **REMOVED - Now centralized in appBranding.js** |
| ~~REACT_APP_SHOW_HERO~~ | ~~Show hero section~~ | ~~true~~ | **DEPRECATED - Managed via System Settings** |

## 🎯 NEW CENTRALIZED BRANDING SYSTEM

All app naming, descriptions, PWA settings, and branding are now configured in:

**`frontend/src/config/appBranding.js`**

### Key Benefits:
- ✅ **Faster Performance** - No environment variable lookups or database calls
- ✅ **Single Source of Truth** - All naming in one place
- ✅ **Consistent Branding** - PWA, meta tags, headers all use same config
- ✅ **Easy Customization** - Change app name everywhere with one edit
- ✅ **Better Developer Experience** - Type-safe configuration with helper functions

### How to Customize Your App:

1. **Edit the main configuration** in `frontend/src/config/appBranding.js`:

```javascript
export const APP_BRANDING = {
  // Main App Identity
  name: 'YourApp',                    // Main app name
  shortName: 'YourApp',               // Short name for PWA
  tagline: 'Your App Tagline',        // App tagline
  
  // Descriptions
  description: 'Your app description...',
  
  // Header Configuration
  header: {
    showLogo: false,                  // true = show image, false = show text
    logoUrl: '/your-logo.png',        // Logo image URL
    text: 'YourApp',                  // Text to show if no logo
  },
  
  // PWA Configuration
  pwa: {
    name: 'YourApp - Full Name',
    shortName: 'YourApp',
    themeColor: '#your-color',
    backgroundColor: '#your-bg-color',
  },
  
  // Icons, Footer, Meta tags, etc.
  // ... see file for complete configuration
};
```

2. **All components automatically use the new config** - no changes needed in React components.

3. **PWA manifest, meta tags, titles, and headers** all update automatically.

### For Developers:

```javascript
// Import helper functions for easy access
import { 
  getAppName, 
  getAppShortName, 
  getHeaderContent,
  getPWAConfig 
} from '../config/appBranding';

const MyComponent = () => {
  const appName = getAppName();           // "Grindx"
  const headerConfig = getHeaderContent(); // Header configuration
  const pwaConfig = getPWAConfig();       // PWA settings
  
  // Use in your component...
};
```

### Configuration Hierarchy:

1. **`appBranding.js`** - Primary source for all app naming/branding
2. **System Settings (Admin Panel)** - For content settings (hero section, dynamic content)
3. **Environment Variables** - Only for API URLs and technical configuration

### Migration Notes:

- ✅ Remove all `REACT_APP_NAME`, `REACT_APP_SITE_NAME`, etc. from `.env` files
- ✅ App naming is now handled automatically
- ✅ PWA manifest updates automatically
- ✅ Meta tags and social sharing update automatically
- ✅ No server restart needed for branding changes (edit `appBranding.js` and refresh)

### Still Using Environment Variables:

Only for technical configuration:

```bash
# API Configuration (still needed)
REACT_APP_API_URL=your-api-url

# Google Services (still needed)
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id

# Cloudinary (still needed)
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your-preset
```

This new system ensures consistent branding across your entire application with better performance and easier maintenance.
