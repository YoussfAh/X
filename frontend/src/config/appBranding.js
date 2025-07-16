/**
 * Centralized App Branding Configuration
 * 
 * This file contains all app branding, naming, and customization variables.
 * All app naming throughout the application should reference these variables
 * instead of using .env files or hardcoded values.
 * 
 * To customize the app branding, modify the values in this file.
 */

export const APP_BRANDING = {
  // Main App Identity
  name: 'Grindx',
  shortName: 'Grindx',
  tagline: 'Your Ultimate Fitness & Nutrition Companion',
  
  // Descriptions
  description: 'Advanced fitness and nutrition tracking application with AI-powered analysis and comprehensive workout management',
  shortDescription: 'Fitness & Nutrition Tracker',
  metaDescription: 'Grindx - Transform your fitness journey with AI-powered nutrition analysis, workout tracking, and personalized fitness plans',
  
  // Header Configuration
  header: {
    // If showLogo is true, logo will be displayed instead of text
    showLogo: false,
    logoUrl: '/logo192.png', // URL or path to header logo image
    text: 'Grindx', // Text to show if no logo or if showLogo is false
    showTagline: true,
    taglineText: 'Fitness & Nutrition'
  },
  
  // PWA Configuration
  pwa: {
    name: 'Grindx - Fitness & Nutrition Tracker',
    shortName: 'Grindx',
    description: 'Advanced fitness and nutrition tracking with AI-powered analysis',
    themeColor: '#7c4dff',
    backgroundColor: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    startUrl: '/',
    categories: ['health', 'fitness', 'lifestyle', 'productivity'],
    lang: 'en-US'
  },
  
  // Icons Configuration
  icons: {
    // App icons for different sizes
    favicon: '/favicon.ico',
    icon192: '/logo192.png',
    icon512: '/logo512.png',
    appleTouchIcon: '/apple-touch-icon.png',
    
    // Custom SVG icons (can be URLs or inline SVG)
    brandIcon: '/logo.svg', // Main brand icon
    headerIcon: '/logo192.png' // Icon for header if needed
  },
  
  // Footer Configuration
  footer: {
    showBrandName: true,
    brandText: 'Grindx',
    copyrightText: 'All rights reserved',
    showYear: true
  },
  
  // Meta Tags
  meta: {
    keywords: 'fitness, nutrition, workout, health, AI analysis, diet tracking, exercise',
    author: 'Grindx Team',
    robots: 'index, follow',
    language: 'en-US'
  },
  
  // Social Media / Open Graph
  social: {
    ogTitle: 'Grindx - Fitness & Nutrition Tracker',
    ogDescription: 'Transform your fitness journey with AI-powered nutrition analysis and comprehensive workout tracking',
    ogImage: '/og-image.png', // 1200x630 image for social sharing
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Grindx - Your Fitness Companion',
    twitterDescription: 'AI-powered fitness and nutrition tracking app'
  },
  
  // Application Specific
  app: {
    version: '1.0.0',
    build: 'production',
    environment: 'production'
  }
};

// Utility functions for easy access
export const getAppName = () => APP_BRANDING.name;
export const getAppShortName = () => APP_BRANDING.shortName;
export const getAppDescription = () => APP_BRANDING.description;
export const getHeaderConfig = () => APP_BRANDING.header;
export const getPWAConfig = () => APP_BRANDING.pwa;
export const getIconsConfig = () => APP_BRANDING.icons;
export const getFooterConfig = () => APP_BRANDING.footer;
export const getMetaConfig = () => APP_BRANDING.meta;
export const getSocialConfig = () => APP_BRANDING.social;

// Helper function to get the appropriate header content
export const getHeaderContent = () => {
  const { showLogo, logoUrl, text } = APP_BRANDING.header;
  return {
    showLogo,
    logoUrl,
    text,
    displayText: text
  };
};

// Helper function for PWA manifest generation
export const generateManifestData = () => {
  const pwa = APP_BRANDING.pwa;
  const icons = APP_BRANDING.icons;
  
  return {
    name: pwa.name,
    short_name: pwa.shortName,
    description: pwa.description,
    start_url: pwa.startUrl,
    display: pwa.display,
    theme_color: pwa.themeColor,
    background_color: pwa.backgroundColor,
    orientation: pwa.orientation,
    scope: pwa.scope,
    lang: pwa.lang,
    categories: pwa.categories,
    icons: [
      {
        src: icons.icon192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: icons.icon512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  };
};

export default APP_BRANDING; 