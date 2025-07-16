// Dynamic PWA Manifest Utility
// Handles real-time PWA manifest updates when admin changes settings

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://pro-g.vercel.app'
  : 'http://localhost:5000';

/**
 * Upda/**
 * Updates all PWA-related settings dynamically
 * Also triggers PWA installation prompt refresh
 */
export const updatePWASettings = (settings) => {
  try {
    // Prevent multiple simultaneous updates
    if (window.pwaUpdateInProgress) {
      console.log('PWA update already in progress, skipping...');
      return;
    }
    
    window.pwaUpdateInProgress = true;
    
    updateDynamicManifest();
    updatePWAMetaTags(settings);
    updatePWAIcons(settings);
    updatePWASplashScreen(settings);
    
    // Force refresh of PWA installation prompt with error handling
    try {
      refreshPWAInstallPrompt();
    } catch (error) {
      console.warn('Failed to refresh PWA install prompt:', error);
    }
    
    console.log('🚀 Complete PWA settings update applied!');
    
    // Clear the lock after a delay
    setTimeout(() => {
      window.pwaUpdateInProgress = false;
    }, 2000);
    
  } catch (error) {
    console.error('Error updating PWA settings:', error);
    window.pwaUpdateInProgress = false;
  }
};

/**
 * Updates the manifest link to use dynamic settings
 * This ensures the manifest always reflects the latest admin settings
 */
export const updateDynamicManifest = () => {
  try {
    const manifestLink = document.getElementById('manifest-link') || 
                        document.querySelector('link[rel="manifest"]');
    
    if (manifestLink) {
      const dynamicManifestUrl = `${BASE_URL}/api/system-settings/manifest`;
      
      // Add timestamp to prevent caching and force refresh
      const urlWithTimestamp = `${dynamicManifestUrl}?t=${Date.now()}`;
      
      manifestLink.href = urlWithTimestamp;
      
      // Force browser to re-evaluate PWA installability
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'MANIFEST_UPDATED',
          manifestUrl: urlWithTimestamp
        });
      }
      
      console.log('📱 Updated PWA manifest link:', urlWithTimestamp);
      
      // Note: Removed custom event dispatch to prevent diagnostic script conflicts
      // The manifest update will be picked up by the browser automatically
      
    } else {
      console.warn('⚠️ Manifest link not found in DOM');
    }
  } catch (error) {
    console.error('❌ Failed to update dynamic manifest:', error);
  }
};

/**
 * Updates specific meta tags with PWA settings
 */
export const updatePWAMetaTags = (settings) => {
  try {
    // Update theme color with fallback to black
    const themeColor = settings.pwaThemeColor || '#000000';
    const backgroundColorr = settings.pwaBackgroundColor || '#000000';
    
    const themeColorMeta = document.getElementById('theme-color-meta') ||
                          document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', themeColor);
    }

    // Update CSS variables for consistent theming
    document.documentElement.style.setProperty('--pwa-theme-color', themeColor);
    document.documentElement.style.setProperty('--pwa-background-color', backgroundColorr);

    // Update Apple status bar style based on theme color
    const statusBarMeta = document.getElementById('status-bar-style-meta') ||
                         document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBarMeta) {
      // Use black-translucent for dark themes, default for light themes
      const isDarkTheme = themeColor === '#000000' || themeColor.toLowerCase() === '#000' || 
                         (themeColor.startsWith('#') && parseInt(themeColor.slice(1, 3), 16) < 128);
      statusBarMeta.setAttribute('content', isDarkTheme ? 'black-translucent' : 'default');
    }

    // Add additional theme color meta for better browser support
    let msThemeColor = document.querySelector('meta[name="msapplication-TileColor"]');
    if (!msThemeColor) {
      msThemeColor = document.createElement('meta');
      msThemeColor.name = 'msapplication-TileColor';
      document.head.appendChild(msThemeColor);
    }
    msThemeColor.content = themeColor;

    // Update app titles
    if (settings.pwaShortName) {
      const appleAppTitle = document.getElementById('apple-app-title-meta') ||
                           document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appleAppTitle) {
        appleAppTitle.setAttribute('content', settings.pwaShortName);
      }

      const applicationName = document.getElementById('application-name-meta') ||
                             document.querySelector('meta[name="application-name"]');
      if (applicationName) {
        applicationName.setAttribute('content', settings.pwaShortName);
      }

      // Update page title
      document.title = `${settings.pwaShortName} - Fitness & Nutrition Tracker`;
    }

    // Update description
    if (settings.siteDescription) {
      const descriptionMeta = document.getElementById('description-meta') ||
                             document.querySelector('meta[name="description"]');
      if (descriptionMeta) {
        descriptionMeta.setAttribute('content', settings.siteDescription);
      }
    }

    console.log('📱 Updated PWA meta tags with theme color:', themeColor);
  } catch (error) {
    console.error('❌ Failed to update PWA meta tags:', error);
  }
};

/**
 * Updates PWA icon links
 */
export const updatePWAIcons = (settings) => {
  try {
    // 1. Always remove EVERY existing favicon / icon link first
    const existingIcons = document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"], link[rel="mask-icon"]');
    existingIcons.forEach(link => link.remove());

    // Guard clause – if no icon is provided, we just removed all, so return
    if (!settings || !settings.pwaIcon) {
      console.warn('📱 updatePWAIcons: No pwaIcon provided in settings, cleared existing.');
      return;
    }

    const iconUrl = `${settings.pwaIcon}?v=${Date.now()}`; // Add timestamp to bust cache

    // Helper to append link
    const appendIcon = (rel, sizes = '', type = '') => {
      const link = document.createElement('link');
      link.rel = rel;
      if (sizes) link.sizes = sizes;
      if (type) link.type = type;
      link.href = iconUrl; // Use the timestamped URL
      document.head.appendChild(link);
    };

    // 2. Standard favicons (assuming pwaIcon is not an SVG if the user wants to remove all SVGs)
    // We will only append if pwaIcon is provided and not specifically an SVG that should be ignored as a favicon
    if (settings.pwaIcon && !settings.pwaIcon.endsWith('.svg')) {
        appendIcon('icon', '32x32', 'image/png'); // Assuming PNG for general favicon
        appendIcon('shortcut icon', '', 'image/x-icon');  // legacy IE / Edge, default ico type
    } else if (settings.pwaIcon && settings.pwaIcon.endsWith('.svg')) {
        // If pwaIcon is an SVG, but we want to avoid it as a general favicon, we skip appending generic icon types.
        // However, it might still be used for mask-icon, so we'll let that pass.
        console.log('Skipping general favicon for SVG pwaIcon as per user request.');
    } else {
        // Fallback or no pwaIcon, ensure no old favicons are re-added
        console.log('No pwaIcon provided or not a valid type, ensuring no favicons are set.');
    }

    // 3. Apple touch icon
    if (settings.pwaIcon) {
        appendIcon('apple-touch-icon', '180x180');
    }

    // 4. Mask icon for Safari pinned tabs, use theme color for stroke
    // Mask icon can be SVG, so we keep this if pwaIcon is present
    if (settings.pwaIcon) {
        const maskIcon = document.createElement('link');
        maskIcon.rel = 'mask-icon';
        maskIcon.href = iconUrl; // Use the timestamped URL
        maskIcon.color = settings.pwaThemeColor || '#000000';
        document.head.appendChild(maskIcon);
    }

    // Force browser to re-evaluate head elements (potential cache bust)
    const head = document.head;
    const parent = head.parentNode;
    parent.removeChild(head);
    parent.appendChild(head);

    console.log('📱 updatePWAIcons: Favicon & PWA icons updated to ', iconUrl);
  } catch (error) {
    console.error('❌ Failed to update PWA icons:', error);
  }
};

/**
 * Updates PWA splash screen
 */
export const updatePWASplashScreen = (settings) => {
  try {
    // Remove existing splash screen links
    const existingSplashScreens = document.querySelectorAll('link[rel="apple-touch-startup-image"]');
    existingSplashScreens.forEach(link => link.remove());

    if (settings.pwaSplashScreenImage) {
      // Comprehensive Apple splash screens for different device sizes
      const splashScreenSizes = [
        // iPhone X, iPhone XS, iPhone 11 Pro
        { width: 1125, height: 2436, media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
        { width: 2436, height: 1125, media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
        
        // iPhone XR, iPhone 11
        { width: 828, height: 1792, media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
        { width: 1792, height: 828, media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
        
        // iPhone XS Max, iPhone 11 Pro Max
        { width: 1242, height: 2688, media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
        { width: 2688, height: 1242, media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
        
        // iPhone 6, iPhone 7, iPhone 8
        { width: 750, height: 1334, media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
        { width: 1334, height: 750, media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
        
        // iPhone 6 Plus, iPhone 7 Plus, iPhone 8 Plus
        { width: 1242, height: 2208, media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
        { width: 2208, height: 1242, media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
        
        // iPad Pro 12.9"
        { width: 2048, height: 2732, media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
        { width: 2732, height: 2048, media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
        
        // iPad Pro 11"
        { width: 1668, height: 2388, media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
        { width: 2388, height: 1668, media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
        
        // iPad Pro 10.5"
        { width: 1668, height: 2224, media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
        { width: 2224, height: 1668, media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
        
        // iPad Air, iPad
        { width: 1536, height: 2048, media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
        { width: 2048, height: 1536, media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
        
        // General fallback
        { width: 1024, height: 1024, media: "screen" }
      ];

      // Add new splash screen links
      splashScreenSizes.forEach(screen => {
        const link = document.createElement('link');
        link.rel = 'apple-touch-startup-image';
        link.href = settings.pwaSplashScreenImage;
        link.media = screen.media;
        document.head.appendChild(link);
      });

      // Also add meta tag for web app capable
      let webAppCapableMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
      if (!webAppCapableMeta) {
        webAppCapableMeta = document.createElement('meta');
        webAppCapableMeta.name = 'apple-mobile-web-app-capable';
        document.head.appendChild(webAppCapableMeta);
      }
      webAppCapableMeta.content = 'yes';

      // Add status bar style meta tag
      let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!statusBarMeta) {
        statusBarMeta = document.createElement('meta');
        statusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
        document.head.appendChild(statusBarMeta);
      }
      statusBarMeta.content = 'black-translucent';

      console.log('📱 Updated PWA splash screen with', splashScreenSizes.length, 'device sizes');
    } else {
      console.log('📱 No splash screen image provided, using default behavior');
    }
  } catch (error) {
    console.error('❌ Failed to update PWA splash screen:', error);
  }
};

/**
 * Forces the browser to refresh PWA installability check
 * This ensures the installation popup shows the updated icon and name
 */
export const refreshPWAInstallPrompt = () => {
  try {
    // Prevent multiple simultaneous calls
    if (window.pwaRefreshInProgress) {
      console.log('PWA refresh already in progress, skipping...');
      return;
    }
    
    window.pwaRefreshInProgress = true;
    
    // Clear any existing install prompt
    if (window.deferredPrompt) {
      window.deferredPrompt = null;
    }
    
    // Force complete refresh of PWA evaluation
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      // Remove and re-add manifest link to force browser refresh
      const newManifestLink = manifestLink.cloneNode(true);
      const timestamp = Date.now();
      newManifestLink.href = `http://localhost:5000/api/system-settings/manifest?v=${timestamp}`;
      
      manifestLink.remove();
      document.head.appendChild(newManifestLink);
      
      console.log('🔄 Manifest link refreshed with timestamp:', timestamp);
    }
    
    // Clear the lock after a delay
    setTimeout(() => {
      window.pwaRefreshInProgress = false;
    }, 1000);
    
    // Clear service worker cache if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Clear cache to force fresh manifest fetch
        if ('caches' in window) {
          caches.keys().then((cacheNames) => {
            cacheNames.forEach((cacheName) => {
              if (cacheName.includes('manifest') || cacheName.includes('precache')) {
                caches.delete(cacheName);
                console.log('🔄 Cleared cache:', cacheName);
              }
            });
          });
        }
        
        // Force service worker to update
        registration.update();
        console.log('🔄 Service worker updated');
      });
    }
    
    // Force meta tag updates with current settings
    fetch('/api/system-settings/general')
      .then(response => response.json())
      .then(settings => {
        updatePWAMetaTags(settings);
        updatePWAIcons(settings);
        
        // Force page title update
        document.title = `${settings.pwaShortName || 'GRINDP'} - Fitness & Nutrition Tracker`;
        
        console.log('✅ PWA settings force-updated with:', {
          name: settings.pwaShortName,
          icon: settings.pwaIcon ? 'Set' : 'Not set',
          transparent: settings.pwaIconWithoutBackground
        });
      });
    
    // Trigger browser PWA evaluation after a delay
    setTimeout(() => {
      // Note: Removed custom event dispatch to prevent diagnostic script conflicts
      // PWA settings update is complete
      console.log('🔄 PWA settings updated');
    }, 1000);
    
  } catch (error) {
    console.error('❌ Failed to refresh PWA install prompt:', error);
  }
};

/**
 * Updates the manifest file with dynamic settings
 * This allows for real-time updates of the manifest without full page reloads
 */
export const updateManifest = async (updates = {}) => {
  try {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      console.error('No manifest link found');
      return;
    }

    // Get current manifest
    const manifestResponse = await fetch(manifestLink.href);
    const currentManifest = await manifestResponse.json();

    // Create new manifest with updates
    const newManifest = {
      ...currentManifest,
      ...updates,
      icons: updates.icons || currentManifest.icons
    };

    // Create a blob of the new manifest
    const manifestBlob = new Blob(
      [JSON.stringify(newManifest)],
      { type: 'application/json' }
    );

    // Update manifest link
    const newManifestUrl = URL.createObjectURL(manifestBlob);
    manifestLink.href = newManifestUrl;

    // Clean up old blob URL after a delay
    setTimeout(() => URL.revokeObjectURL(newManifestUrl), 1000);

    return true;
  } catch (err) {
    console.error('Error updating manifest:', err);
    return false;
  }
};

export default {
  updateDynamicManifest,
  updatePWAMetaTags,
  updatePWAIcons,
  updatePWASplashScreen,
  updatePWASettings,
  refreshPWAInstallPrompt,
  updateManifest
};
