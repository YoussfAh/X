import { useEffect, useRef } from 'react';
import { useStaticAppSettings } from '../hooks/useStaticAppSettings';
import { updateFavicon, getImageMimeType, generatePWAIcons, getEffectiveIconUrl } from '../utils/iconUtils';
import { updatePWASettings } from '../utils/pwaUtils';
import { getAppName, getAppShortName, getAppDescription, getPWAConfig } from '../config/appBranding';

/**
 * Global PWA Manager Component
 * Updates PWA manifest properties dynamically based on system settings
 */
const GlobalPWAManager = () => {
  const { 
    siteName, 
    siteDescription, 
    siteKeywords,
    faviconImage, 
    faviconSvgCode,
    preserveIconRatio,
    pwaIcon,
    pwaShortName,
    pwaThemeColor,
    pwaBackgroundColor,
    pwaSplashScreenImage,
    ogImage,
    isLoading 
  } = useStaticAppSettings();

  // Keep track of the current manifest blob URL
  const manifestUrlRef = useRef(null);

  useEffect(() => {
    // Only update after settings have loaded and if there are actual changes
    if (!isLoading) {
      // Explicitly set document title using centralized branding
      document.title = getAppName();

      updatePWAManifest();
      updateAppFavicons();
      
      // Update all PWA settings including splash screen
      const pwaSettings = {
        pwaIcon: pwaIcon || faviconImage,
        pwaShortName,
        pwaThemeColor,
        pwaBackgroundColor,
        pwaSplashScreenImage,
        siteDescription
      };
      updatePWASettings(pwaSettings);
    }

    // Cleanup function to revoke blob URLs
    return () => {
      if (manifestUrlRef.current) {
        URL.revokeObjectURL(manifestUrlRef.current);
      }
    };
  }, [siteName, siteDescription, siteKeywords, faviconImage, faviconSvgCode, preserveIconRatio, pwaIcon, pwaShortName, pwaThemeColor, pwaBackgroundColor, pwaSplashScreenImage, ogImage, isLoading]);

  const updateAppFavicons = () => {
    const iconUrl = getEffectiveIconUrl(faviconImage, faviconSvgCode);
    if (iconUrl) {
      // Update favicon with proper centering and aspect ratio
      updateFavicon(iconUrl, preserveIconRatio);
    }
  };

  // Helper function to get the icon URL (either from URL or SVG blob)
  const getIconUrl = () => {
    return getEffectiveIconUrl(faviconImage, faviconSvgCode);
  };

  const updatePWAManifest = () => {
    try {
      // Get centralized PWA configuration
      const pwaConfig = getPWAConfig();
      
      // Create a dynamic manifest object
      const iconUrl = getIconUrl() || '/favicon.ico';
      const finalOgImage = ogImage || getIconUrl() || '/favicon.ico';
      
      // Determine icon type
      const iconType = getImageMimeType(iconUrl);
      const iconPurpose = preserveIconRatio ? 'any' : 'any maskable';
      
      const dynamicManifest = {
        name: pwaConfig.name,
        short_name: pwaConfig.shortName,
        description: pwaConfig.description,
        start_url: pwaConfig.startUrl,
        display: pwaConfig.display,
        orientation: pwaConfig.orientation,
        background_color: pwaConfig.backgroundColor,
        theme_color: pwaConfig.themeColor,
        categories: pwaConfig.categories,
        icons: [
          // Favicon sizes
          {
            src: iconUrl,
            sizes: '16x16',
            type: iconType,
            purpose: 'any'
          },
          {
            src: iconUrl,
            sizes: '32x32',
            type: iconType,
            purpose: 'any'
          },
          {
            src: iconUrl,
            sizes: '48x48',
            type: iconType,
            purpose: iconPurpose
          },
          // Standard PWA sizes
          {
            src: iconUrl,
            sizes: '72x72',
            type: iconType,
            purpose: iconPurpose
          },
          {
            src: iconUrl,
            sizes: '96x96',
            type: iconType,
            purpose: iconPurpose
          },
          {
            src: iconUrl,
            sizes: '128x128',
            type: iconType,
            purpose: iconPurpose
          },
          {
            src: iconUrl,
            sizes: '144x144',
            type: iconType,
            purpose: iconPurpose
          },
          {
            src: iconUrl,
            sizes: '152x152',
            type: iconType,
            purpose: iconPurpose
          },
          {
            src: iconUrl,
            sizes: '192x192',
            type: iconType,
            purpose: iconPurpose
          },
          {
            src: iconUrl,
            sizes: '384x384',
            type: iconType,
            purpose: iconPurpose
          },
          {
            src: iconUrl,
            sizes: '512x512',
            type: iconType,
            purpose: iconPurpose
          }
        ],
        screenshots: [
          {
            src: finalOgImage,
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: finalOgImage,
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ],
        scope: pwaConfig.scope,
        lang: pwaConfig.lang,
        related_applications: [],
        prefer_related_applications: false
      };

      // Update the manifest link in the head
      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        // Create a blob URL for the dynamic manifest
        const manifestBlob = new Blob([JSON.stringify(dynamicManifest, null, 2)], {
          type: 'application/json'
        });
        
        // Only create a new blob URL if the manifest content has changed
        const newManifestUrl = URL.createObjectURL(manifestBlob);
        
        // Update the manifest href and store the new URL
        manifestLink.href = newManifestUrl;
        
        // Revoke the old URL if it exists
        if (manifestUrlRef.current) {
          URL.revokeObjectURL(manifestUrlRef.current);
        }
        manifestUrlRef.current = newManifestUrl;
        
        console.log('PWA Manifest updated with dynamic settings:', {
          name: dynamicManifest.name,
          short_name: dynamicManifest.short_name,
          theme_color: dynamicManifest.theme_color,
          background_color: dynamicManifest.background_color,
          icons: dynamicManifest.icons.length + ' icons',
          preserveIconRatio
        });
      } else {
        console.warn('Manifest link not found in document head');
      }

      // Also update meta tags for better PWA support
      updatePWAMetaTags();
      updateThemeColors();
      
    } catch (error) {
      console.warn('Failed to update PWA manifest:', error);
    }
  };

  const updateThemeColors = () => {
    // Update theme color meta tag using ID for better performance
    const themeColorMeta = document.getElementById('theme-color-meta') || document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.content = pwaThemeColor || '#000000';
    }

    // Update Apple status bar style based on theme color using ID
    const statusBarMeta = document.getElementById('status-bar-style-meta') || document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBarMeta) {
      // Determine if theme color is light or dark
      const isLightTheme = isLightColor(pwaThemeColor || '#000000');
      statusBarMeta.content = isLightTheme ? 'default' : 'black-translucent';
    }
  };

  const isLightColor = (color) => {
    // Simple check for light/dark color
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155;
  };

  const updatePWAMetaTags = () => {
    // Update app name meta tags using IDs where available for better performance
    const updateOrCreateMeta = (name, content, isProperty = false, id = null) => {
      let meta = id ? document.getElementById(id) : null;
      
      if (!meta) {
        const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
        meta = document.querySelector(selector);
      }
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        if (id) meta.id = id;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Get centralized branding configuration
    const appName = getAppName();
    const appShortName = getAppShortName();
    const appDescription = getAppDescription();
    
    // Standard meta tags with IDs for better performance
    updateOrCreateMeta('application-name', appName, false, 'application-name-meta');
    updateOrCreateMeta('apple-mobile-web-app-title', appShortName, false, 'apple-app-title-meta');
    updateOrCreateMeta('description', appDescription, false, 'description-meta');
    updateOrCreateMeta('keywords', 'fitness, nutrition, workout, health, AI analysis, diet tracking, exercise');
    
    // Open Graph tags (use property attribute)
    updateOrCreateMeta('og:title', appName, true, 'og-title-meta');
    updateOrCreateMeta('og:description', appDescription, true, 'og-description-meta');
    updateOrCreateMeta('og:site_name', appName, true, 'og-site-name-meta');
    updateOrCreateMeta('og:type', 'website', true);
    if (ogImage || faviconImage) {
      updateOrCreateMeta('og:image', ogImage || faviconImage, true);
    }
    
    // Twitter Card tags
    updateOrCreateMeta('twitter:card', 'summary_large_image');
    updateOrCreateMeta('twitter:title', appName, false, 'twitter-title-meta');
    updateOrCreateMeta('twitter:description', appDescription, false, 'twitter-description-meta');
    if (ogImage || faviconImage) {
      updateOrCreateMeta('twitter:image', ogImage || faviconImage);
    }

    // PWA specific meta tags
    updateOrCreateMeta('mobile-web-app-capable', 'yes');
    updateOrCreateMeta('apple-mobile-web-app-capable', 'yes');
    updateOrCreateMeta('msapplication-TileColor', pwaThemeColor || '#000000');
    
    // Update page title as well
    document.title = appName;
  };

  // This component doesn't render anything
  return null;
};

export default GlobalPWAManager;
