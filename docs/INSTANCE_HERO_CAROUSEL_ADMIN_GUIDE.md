# Instance Hero Carousel - Admin Guide

## Overview
The Instance Hero Carousel is a dynamic, admin-managed carousel system that displays promotional images and links to all users on your instance. When you make changes as an admin, they are immediately visible to all users.

## ✅ System Status: FULLY OPERATIONAL

### Current Features
- ✅ **Admin Management**: Full CRUD operations for carousel slides
- ✅ **Database Persistence**: All changes saved to MongoDB
- ✅ **Real-time Updates**: Changes reflect immediately for all users
- ✅ **Mobile Optimization**: Separate mobile images and display modes
- ✅ **Performance Settings**: Configurable autoplay and transition timing
- ✅ **Instance-wide Sharing**: One admin changes, all users see updates
- ✅ **Fallback System**: Static carousel fallback if admin data unavailable

## How to Manage the Carousel

### 1. Access Admin Interface
1. Navigate to `/admin/system-settings`
2. Click on the **"Hero Carousel"** tab
3. You'll see two sections:
   - **Carousel Slides Management**
   - **Carousel Settings**

### 2. Managing Carousel Slides

#### Adding New Slides
1. Click **"Add Slide"** button
2. Upload or enter image URL for desktop
3. (Optional) Upload or enter mobile image URL
4. Set the link (internal or external)
5. Add descriptive alt text for accessibility
6. Choose mobile display mode (crop or fit)
7. Click **"Save Changes"**

#### Editing Existing Slides
1. Modify any field in the slide form
2. Upload new images if needed
3. Update links and alt text
4. Click **"Save Changes"**

#### Removing Slides
1. Click the red **trash icon** next to the slide
2. Confirm deletion
3. Changes are saved automatically

### 3. Carousel Settings

#### Autoplay Interval
- Controls how long each slide displays
- Range: 1-30 seconds
- Default: 5 seconds
- Recommendation: 5-8 seconds for optimal UX

#### Transition Duration
- Controls animation speed between slides
- Range: 50-3000 milliseconds
- Default: 200ms
- Recommendation: 200-500ms for smooth transitions

### 4. Mobile Optimization

#### Mobile Images
- Upload separate optimized images for mobile devices
- Recommended: 400px width for mobile
- Recommended: 1200px width for desktop

#### Mobile Display Modes
- **Crop**: Image fills container, may crop edges
- **Fit**: Image fits entirely within container

### 5. Link Types

#### Internal Links
- Links to pages within your app
- Format: `/collections`, `/workout-dashboard`
- Automatically prefixed with `/` if needed

#### External Links
- Links to external websites
- Format: `https://example.com`
- Automatically prefixed with `https://` if needed
- Opens in new tab with security measures

## Technical Details

### Frontend Integration
- Component: `TopHeroCarousel.jsx`
- API: RTK Query for real-time data
- Fallback: Static configuration if admin data unavailable
- Performance: Optimized loading and transitions

### Backend API
- **GET** `/api/system-settings/carousel` - Fetch slides (public)
- **PUT** `/api/system-settings/carousel` - Update slides (admin only)
- **GET** `/api/system-settings/carousel-settings` - Fetch settings (public)
- **PUT** `/api/system-settings/carousel-settings` - Update settings (admin only)

### Database Storage
- Collection: `systemsettings`
- Keys: `carousel` and `carouselSettings`
- Persistence: All changes automatically saved
- Validation: Required fields enforced

## Troubleshooting

### Common Issues

#### Slides Not Showing
1. Check if slides have required fields (image, link, alt text)
2. Verify images are accessible URLs
3. Check browser console for errors

#### Changes Not Reflecting
1. Hard refresh the page (Ctrl+F5)
2. Check if you saved changes in admin panel
3. Verify you have admin permissions

#### Mobile Issues
1. Ensure mobile images are optimized
2. Check mobile display mode settings
3. Test on actual mobile devices

### Admin Support
If you encounter issues:
1. Check the browser console for errors
2. Verify your admin permissions
3. Ensure images are publicly accessible URLs
4. Contact technical support with specific error messages

## Best Practices

### Image Optimization
- Use WebP format when possible
- Compress images to reduce load times
- Maintain aspect ratios for consistent display
- Test on various screen sizes

### Content Guidelines
- Keep alt text descriptive but concise
- Use clear, actionable link destinations
- Maintain consistent brand messaging
- Test all links before publishing

### Performance
- Limit carousel to 3-5 slides for optimal UX
- Use autoplay intervals of 5-8 seconds
- Optimize image file sizes
- Monitor loading performance

## Instance Management
Remember: As an admin, your carousel changes affect ALL USERS on this instance immediately. Always preview changes and ensure content is appropriate for your entire user base.

Last Updated: ${new Date().toISOString()}
System Version: v2.0.0
