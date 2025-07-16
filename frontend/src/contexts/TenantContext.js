import React, { createContext, useContext, useState, useEffect } from 'react';
import { APP_BRANDING } from '../config/appBranding';

const TenantContext = createContext();

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export const TenantProvider = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get effective branding (tenant branding overrides default)
  const getEffectiveBranding = () => {
    // Fallback colors in case APP_BRANDING doesn't have pwa config
    const fallbackColors = {
      primary: '#4F46E5',
      secondary: '#7C3AED',
      theme: '#4F46E5',
      background: '#ffffff'
    };

    if (!currentTenant?.branding) {
      return {
        ...APP_BRANDING,
        // Ensure colors object always exists with safe fallbacks
        colors: {
          primary: fallbackColors.primary,
          secondary: fallbackColors.secondary,
          theme: APP_BRANDING.pwa?.themeColor || fallbackColors.theme,
          background: APP_BRANDING.pwa?.backgroundColor || fallbackColors.background
        }
      };
    }

    // Merge tenant branding with default branding
    const effectiveBranding = {
      name: currentTenant.branding.appName || APP_BRANDING.name || 'Grindx',
      shortName: currentTenant.branding.pwaShortName || APP_BRANDING.shortName || 'Grindx',
      tagline: currentTenant.branding.tagline || APP_BRANDING.tagline || 'Fitness & Nutrition',
      description: currentTenant.branding.pwaDescription || APP_BRANDING.description || 'Fitness & Nutrition Tracker',
      shortDescription: APP_BRANDING.shortDescription || 'Fitness Tracker',
      metaDescription: currentTenant.branding.pwaDescription || APP_BRANDING.metaDescription || 'Fitness & Nutrition Tracker',
      
      header: {
        showLogo: APP_BRANDING.header?.showLogo || false,
        logoUrl: currentTenant.branding.logo || APP_BRANDING.header?.logoUrl || '/logo192.png',
        text: currentTenant.branding.appName || APP_BRANDING.header?.text || 'Grindx',
        showTagline: APP_BRANDING.header?.showTagline || false,
        taglineText: currentTenant.branding.tagline || APP_BRANDING.header?.taglineText || 'Fitness & Nutrition'
      },
      
      pwa: {
        name: currentTenant.branding.pwaName || APP_BRANDING.pwa?.name || 'Grindx',
        shortName: currentTenant.branding.pwaShortName || APP_BRANDING.pwa?.shortName || 'Grindx',
        description: currentTenant.branding.pwaDescription || APP_BRANDING.pwa?.description || 'Fitness & Nutrition Tracker',
        themeColor: currentTenant.branding.pwaThemeColor || APP_BRANDING.pwa?.themeColor || fallbackColors.theme,
        backgroundColor: currentTenant.branding.pwaBackgroundColor || APP_BRANDING.pwa?.backgroundColor || fallbackColors.background,
        display: APP_BRANDING.pwa?.display || 'standalone',
        orientation: APP_BRANDING.pwa?.orientation || 'portrait',
        scope: APP_BRANDING.pwa?.scope || '/',
        startUrl: APP_BRANDING.pwa?.startUrl || '/',
        categories: APP_BRANDING.pwa?.categories || ['health', 'fitness'],
        lang: APP_BRANDING.pwa?.lang || 'en-US'
      },
      
      icons: {
        favicon: currentTenant.branding.favicon || APP_BRANDING.icons?.favicon || '/favicon.ico',
        icon192: currentTenant.branding.pwaIcon192 || APP_BRANDING.icons?.icon192 || '/logo192.png',
        icon512: currentTenant.branding.pwaIcon512 || APP_BRANDING.icons?.icon512 || '/logo512.png',
        appleTouchIcon: APP_BRANDING.icons?.appleTouchIcon || '/apple-touch-icon.png',
        brandIcon: currentTenant.branding.logo || APP_BRANDING.icons?.brandIcon || '/logo192.png',
        headerIcon: currentTenant.branding.logo || APP_BRANDING.icons?.headerIcon || '/logo192.png'
      },
      
      footer: {
        showBrandName: APP_BRANDING.footer?.showBrandName || true,
        brandText: currentTenant.branding.appName || APP_BRANDING.footer?.brandText || 'Grindx',
        copyrightText: APP_BRANDING.footer?.copyrightText || 'All rights reserved',
        showYear: APP_BRANDING.footer?.showYear || true
      },
      
      meta: APP_BRANDING.meta || {
        keywords: 'fitness, nutrition, workout, health',
        author: 'Grindx Team',
        robots: 'index, follow',
        language: 'en-US'
      },
      
      social: {
        ogTitle: currentTenant.branding.pwaName || APP_BRANDING.social?.ogTitle || 'Grindx',
        ogDescription: currentTenant.branding.pwaDescription || APP_BRANDING.social?.ogDescription || 'Fitness & Nutrition Tracker',
        ogImage: APP_BRANDING.social?.ogImage || '/og-image.png',
        ogType: APP_BRANDING.social?.ogType || 'website',
        twitterCard: APP_BRANDING.social?.twitterCard || 'summary_large_image',
        twitterTitle: currentTenant.branding.pwaName || APP_BRANDING.social?.twitterTitle || 'Grindx',
        twitterDescription: currentTenant.branding.pwaDescription || APP_BRANDING.social?.twitterDescription || 'Fitness & Nutrition Tracker'
      },
      
      app: APP_BRANDING.app || {
        version: '1.0.0',
        build: 'production',
        environment: 'production'
      },
      
      // Tenant-specific colors - ALWAYS ensure this object exists
      colors: {
        primary: currentTenant.branding.primaryColor || fallbackColors.primary,
        secondary: currentTenant.branding.secondaryColor || fallbackColors.secondary,
        theme: currentTenant.branding.pwaThemeColor || APP_BRANDING.pwa?.themeColor || fallbackColors.theme,
        background: currentTenant.branding.pwaBackgroundColor || APP_BRANDING.pwa?.backgroundColor || fallbackColors.background
      }
    };

    return effectiveBranding;
  };

  // Load tenant from subdomain or localStorage
  const loadTenant = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      
      // Enhanced subdomain detection for Vercel
      const extractSubdomain = () => {
        // For Vercel deployment: subdomain.grindx.vercel.app
        if (hostname.includes('vercel.app')) {
          return parts.length > 2 ? parts[0] : null;
        }
        
        // For localhost: localhost or subdomain.localhost
        if (hostname.includes('localhost')) {
          return parts.length > 1 ? parts[0] : null;
        }
        
        // For other domains
        return parts.length > 2 ? parts[0] : null;
      };
      
      const subdomain = extractSubdomain();
      
      // Validate subdomain
      const isValidSubdomain = (sub) => {
        const validSubdomainRegex = /^[a-zA-Z0-9-]+$/;
        return sub && 
               sub !== 'www' && 
               sub !== 'localhost' && 
               validSubdomainRegex.test(sub);
      };

      // Determine environment
      const isLocalhost = hostname.includes('localhost');
      const isVercel = hostname.includes('vercel.app');
      
      // Enhanced mock tenant data generation
      const generateMockTenant = (sub) => {
        // Sanitize subdomain for display
        const sanitizedSub = sub.replace(/[^a-zA-Z0-9]/g, '');
        
        return {
          _id: `tenant-${sanitizedSub}`,
          name: `${sanitizedSub.charAt(0).toUpperCase() + sanitizedSub.slice(1)} Fitness`,
          subdomain: sanitizedSub,
          branding: {
            appName: `${sanitizedSub.charAt(0).toUpperCase() + sanitizedSub.slice(1)} Fitness App`,
            tagline: 'Your Custom Fitness Journey',
            primaryColor: isLocalhost ? '#6366f1' : 
                          isVercel ? '#8b5cf6' : '#4F46E5',
            secondaryColor: isLocalhost ? '#8b5cf6' : 
                            isVercel ? '#6366f1' : '#7C3AED',
            pwaName: `${sanitizedSub.charAt(0).toUpperCase() + sanitizedSub.slice(1)} Fitness`,
            pwaShortName: sanitizedSub.slice(0, 12),
            pwaDescription: `Custom fitness tracking for ${sanitizedSub}`,
            pwaThemeColor: isLocalhost ? '#6366f1' : 
                           isVercel ? '#8b5cf6' : '#4F46E5',
            pwaBackgroundColor: '#ffffff',
            logo: `/logos/${sanitizedSub}-logo.png` // Dynamic logo generation
          }
        };
      };

      // Tenant detection logic
      if (isValidSubdomain(subdomain)) {
        const mockTenant = generateMockTenant(subdomain);
        setCurrentTenant(mockTenant);
        
        // Optional: Log tenant detection for debugging
        console.log('Detected Tenant:', {
          subdomain,
          hostname,
          isVercel,
          isLocalhost
        });
      } else if (isLocalhost || isVercel) {
        // Fallback for localhost or Vercel main domain
        const fallbackTenant = generateMockTenant('grindx');
        setCurrentTenant(fallbackTenant);
      } else {
        // No tenant detected
        setCurrentTenant(null);
      }
    } catch (err) {
      console.error('Error loading tenant:', err);
      setError(err.message);
      setCurrentTenant(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Update document title and meta tags
  const updateDocumentMeta = () => {
    try {
      const branding = getEffectiveBranding();
      
      // Update title
      document.title = branding.name || 'Grindx';
      
      // Update meta theme-color
      let themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (!themeColorMeta) {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        document.head.appendChild(themeColorMeta);
      }
      themeColorMeta.content = branding.colors?.theme || branding.pwa?.themeColor || '#4F46E5';
      
      // Update meta description
      let descriptionMeta = document.querySelector('meta[name="description"]');
      if (!descriptionMeta) {
        descriptionMeta = document.createElement('meta');
        descriptionMeta.name = 'description';
        document.head.appendChild(descriptionMeta);
      }
      descriptionMeta.content = branding.description || 'Fitness & Nutrition Tracker';
      
      // Update status bar style for mobile
      let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!statusBarMeta) {
        statusBarMeta = document.createElement('meta');
        statusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
        document.head.appendChild(statusBarMeta);
      }
      
      // Set status bar to black for light backgrounds, black-translucent for dark
      const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
      statusBarMeta.content = isDarkMode ? 'black-translucent' : 'black';
    } catch (error) {
      console.error('Error updating document meta:', error);
    }
  };

  // Update PWA manifest dynamically
  const updatePWAManifest = () => {
    try {
      const branding = getEffectiveBranding();
      
      const manifestData = {
        name: branding.pwa?.name || 'Grindx',
        short_name: branding.pwa?.shortName || 'Grindx',
        description: branding.pwa?.description || 'Fitness & Nutrition Tracker',
        start_url: branding.pwa?.startUrl || '/',
        display: branding.pwa?.display || 'standalone',
        theme_color: branding.pwa?.themeColor || '#4F46E5',
        background_color: branding.pwa?.backgroundColor || '#ffffff',
        orientation: branding.pwa?.orientation || 'portrait',
        scope: branding.pwa?.scope || '/',
        lang: branding.pwa?.lang || 'en-US',
        categories: branding.pwa?.categories || ['health', 'fitness'],
        icons: [
          {
            src: branding.icons?.icon192 || '/logo192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: branding.icons?.icon512 || '/logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      };
      
      // Create blob URL for the manifest
      const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(manifestBlob);
      
      // Update or create manifest link
      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      
      // Revoke old URL if it exists
      if (manifestLink.href && manifestLink.href.startsWith('blob:')) {
        URL.revokeObjectURL(manifestLink.href);
      }
      
      manifestLink.href = manifestUrl;
    } catch (error) {
      console.error('Error updating PWA manifest:', error);
    }
  };

  // Apply CSS custom properties for theming
  const applyCSSVariables = () => {
    try {
      const branding = getEffectiveBranding();
      const root = document.documentElement;
      
      root.style.setProperty('--tenant-primary-color', branding.colors?.primary || '#4F46E5');
      root.style.setProperty('--tenant-secondary-color', branding.colors?.secondary || '#7C3AED');
      root.style.setProperty('--tenant-theme-color', branding.colors?.theme || '#4F46E5');
      root.style.setProperty('--tenant-background-color', branding.colors?.background || '#ffffff');
    } catch (error) {
      console.error('Error applying CSS variables:', error);
    }
  };

  // Initialize tenant on mount
  useEffect(() => {
    loadTenant();
  }, []);

  // Update meta tags and manifest when tenant changes
  useEffect(() => {
    // Only run when not loading and ensure branding is properly initialized
    if (!isLoading) {
      try {
        const branding = getEffectiveBranding();
        // Double check that branding has required properties before proceeding
        if (branding && typeof branding === 'object' && branding.colors && branding.pwa) {
          updateDocumentMeta();
          updatePWAManifest();
          applyCSSVariables();
        } else {
          console.warn('Branding object is not properly initialized, skipping updates');
        }
      } catch (error) {
        console.error('Error in tenant context effect:', error);
      }
    }
  }, [currentTenant, isLoading]);

  // Listen for theme changes to update status bar
  useEffect(() => {
    const observer = new MutationObserver(() => {
      try {
        const branding = getEffectiveBranding();
        if (branding && branding.colors) {
          updateDocumentMeta();
        }
      } catch (error) {
        console.error('Error updating document meta on theme change:', error);
      }
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    
    return () => observer.disconnect();
  }, [currentTenant]);

  const value = {
    currentTenant,
    setCurrentTenant,
    isLoading,
    error,
    branding: getEffectiveBranding(),
    loadTenant
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export default TenantContext; 