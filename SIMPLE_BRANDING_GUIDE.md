# 🎨 Simple App Branding Configuration

## ✅ UPDATED SYSTEM - Now Using .env File

The admin static-config page has been **removed** and replaced with a simple `.env` file system for basic branding.

### 🔧 How to Change App Name & Header Image:

1. **Edit the `.env` file** in `frontend/.env`
2. **Change these values**:
   ```bash
   # Change the app name
   REACT_APP_SITE_NAME=YOUR_APP_NAME
   
   # Set header logo image (or leave empty for text logo)
   REACT_APP_HEADER_IMAGE=/images/your-logo.png
   ```

3. **Restart the frontend** server to see changes:
   ```bash
   npm start
   ```

### 📱 PWA Settings Moved

PWA settings (icons, colors, splash screens) are now in:
**`/admin/system-settings`** → **PWA Tab**

This includes:
- ✅ PWA App Icon 
- ✅ Icon container vs full-space setting
- ✅ Transparent background option
- ✅ Theme colors
- ✅ Splash screen settings

### 🎯 Benefits:
- **Simpler**: Just edit .env file for basic branding
- **Faster**: No need for admin panel for simple changes  
- **Developer-friendly**: Version controlled in git
- **Advanced settings**: Still available in admin panel for PWA

### 📝 Example .env Configuration:
```bash
# Basic App Branding
REACT_APP_SITE_NAME=FITNESS PRO
REACT_APP_HEADER_IMAGE=/images/fitness-pro-logo.png

# Leave empty for text logo
# REACT_APP_HEADER_IMAGE=
```

**Result**: The header will now show "FITNESS PRO" with your logo image (or just "FITNESS PRO" text if no image).
