// Static App Configuration - Everything loads instantly!
// This replaces API calls with hardcoded values for maximum performance

// Import centralized branding configuration
import { getAppName, getAppShortName, getAppDescription, getMetaConfig, getPWAConfig, getHeaderContent, getIconsConfig } from './appBranding';

// Import the BASE_URL for API calls
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://pro-g.vercel.app'
  : 'http://localhost:5000';

// Get centralized configuration
const pwaConfig = getPWAConfig();
const metaConfig = getMetaConfig();
const headerConfig = getHeaderContent();
const iconsConfig = getIconsConfig();

export const STATIC_APP_CONFIG = {
  // Basic App Info from centralized branding
  siteName: getAppName(),
  siteDescription: getAppDescription(),
  siteKeywords: metaConfig.keywords,
  
  // Color Scheme - Using PWA theme colors
  colorScheme: {
    primaryColor: pwaConfig.themeColor,
    secondaryColor: '#7C3AED'
  },
  
  // Images - Using centralized icons configuration
  headerImage: headerConfig.showLogo ? headerConfig.logoUrl : '', // Empty = show text logo
  pwaIcon: iconsConfig.icon192,
  ogImage: '',
  pwaShortName: getAppShortName(),
  pwaThemeColor: pwaConfig.themeColor,
  pwaBackgroundColor: pwaConfig.backgroundColor,
  
  // Performance flags
  isStatic: true,
  loadInstantly: true
};

// Hero Section Static Data - No API calls needed
export const STATIC_HERO_CONFIG = {
  backgroundImage: '/images/hero-bg.jpg',
  title: 'Transform Your Fitness Journey',
  subtitle: 'Professional workout plans and nutrition guidance',
  showHeroSection: true,
  heroStyle: 'modern',
  overlayOpacity: 0.6
};

// Quick access functions
export const getStaticSiteName = () => STATIC_APP_CONFIG.siteName;
export const getStaticColorScheme = () => STATIC_APP_CONFIG.colorScheme;
export const getStaticHeaderImage = () => STATIC_APP_CONFIG.headerImage;

// Override function - for admin changes (syncs with API for ALL users)
export const updateStaticConfig = async (newConfig) => {
  console.log('📝 Admin updating static config:', newConfig.siteName);
  
  // Update localStorage for immediate local changes
  localStorage.setItem('STATIC_CONFIG_OVERRIDE', JSON.stringify(newConfig));
  
  // Trigger custom event to update all components immediately
  window.dispatchEvent(new CustomEvent('staticConfigUpdate', { detail: newConfig }));
  
  // Also save to API so ALL users get the changes
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo?.token) {
      console.log('🌐 Syncing config to API for all users...');
      const response = await fetch(`${BASE_URL}/api/system-settings/general`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({
          siteName: newConfig.siteName,
          headerImage: newConfig.headerImage,
          colorScheme: newConfig.colorScheme,
          siteDescription: newConfig.siteDescription,
          siteKeywords: newConfig.siteKeywords
        })
      });
      
      if (response.ok) {
        console.log('✅ Config successfully synced to API for all users');
      } else {
        console.error('❌ Failed to sync config to API:', response.status);
      }
    } else {
      console.warn('⚠️ No user token found, skipping API sync');
    }
  } catch (error) {
    console.warn('Could not sync config to API:', error);
  }
  
  // Mark timestamp for change detection
  localStorage.setItem('LAST_STATIC_CONFIG_UPDATE', Date.now().toString());
  console.log('🔄 Static config update complete');
};

// Get config with potential localStorage overrides AND API fallback
export const getActiveConfig = async () => {
  console.log('🔍 getActiveConfig called - checking for latest settings...');
  
  // Check if this is a new user (no config cache at all)
  const isNewUser = !localStorage.getItem('STATIC_CONFIG_OVERRIDE') && 
                    !localStorage.getItem('STATIC_CONFIG_API_CACHE');
  
  if (isNewUser) {
    console.log('👤 NEW USER detected - prioritizing API fetch for latest settings');
  }
  
  // First try localStorage override (for immediate admin changes)
  const override = localStorage.getItem('STATIC_CONFIG_OVERRIDE');
  if (override && !isNewUser) {
    try {
      console.log('📦 Found localStorage override, using admin settings');
      return { ...STATIC_APP_CONFIG, ...JSON.parse(override) };
    } catch (e) {
      console.warn('Invalid config override, using default');
    }
  }

  // If no override OR new user, try to fetch from API for latest changes
  try {
    console.log(isNewUser ? '🆕 NEW USER: Fetching latest admin config from API...' : '🌐 Fetching latest config from API...');
    const response = await fetch(`${BASE_URL}/api/system-settings/general`);
    console.log('📡 API response status:', response.status);
    
    if (response.ok) {
      const apiData = await response.json();
      console.log('📦 API data received:', {
        siteName: apiData?.siteName,
        hasHeaderImage: !!apiData?.headerImage,
        hasColorScheme: !!apiData?.colorScheme
      });
      
      if (apiData) {
        // Merge API data with static config
        const mergedConfig = {
          ...STATIC_APP_CONFIG,
          siteName: apiData.siteName || STATIC_APP_CONFIG.siteName,
          headerImage: apiData.headerImage || STATIC_APP_CONFIG.headerImage,
          colorScheme: apiData.colorScheme || STATIC_APP_CONFIG.colorScheme,
          siteDescription: apiData.siteDescription || STATIC_APP_CONFIG.siteDescription,
          siteKeywords: apiData.siteKeywords || STATIC_APP_CONFIG.siteKeywords
        };
        
        // Cache this for instant loading next time (especially important for new users)
        localStorage.setItem('STATIC_CONFIG_API_CACHE', JSON.stringify({
          config: mergedConfig,
          timestamp: Date.now()
        }));
        
        console.log(isNewUser ? '🎉 NEW USER: Latest admin config cached for instant loading!' : '💾 Cached latest config for instant loading');
        console.log('✅ Returning merged config with siteName:', mergedConfig.siteName);
        return mergedConfig;
      } else {
        console.log('⚠️ API returned empty data');
      }
    } else {
      console.log('❌ API request failed with status:', response.status);
    }
  } catch (error) {
    console.warn('❌ API request error:', error);
  }
  
  console.log('🔄 Falling back to static config');
  return STATIC_APP_CONFIG;
};

// Synchronous version for instant loading (uses cache)
export const getActiveConfigSync = () => {
  // Check if this is a new user (no config cache at all)
  const isNewUser = !localStorage.getItem('STATIC_CONFIG_OVERRIDE') && 
                    !localStorage.getItem('STATIC_CONFIG_API_CACHE');
  
  if (isNewUser) {
    console.log('👤 NEW USER (sync): No cached config, will return static defaults and trigger API fetch');
  }
  
  // First check for admin override (highest priority)
  const override = localStorage.getItem('STATIC_CONFIG_OVERRIDE');
  if (override && !isNewUser) {
    try {
      const parsed = JSON.parse(override);
      const merged = { ...STATIC_APP_CONFIG, ...parsed };
      // Ensure colorScheme is never null or missing
      merged.colorScheme = merged.colorScheme || STATIC_APP_CONFIG.colorScheme;
      console.log('📦 Using admin override config');
      return merged;
    } catch (e) {
      console.warn('Invalid config override, using default');
    }
  }
  
  // Check for API cache (for new users to get latest settings immediately)
  const apiCache = localStorage.getItem('STATIC_CONFIG_API_CACHE');
  if (apiCache) {
    try {
      const cached = JSON.parse(apiCache);
      // For new users, use even older cache to show admin changes immediately
      // For existing users, use 30-second cache
      const cacheTimeout = isNewUser ? 300000 : 30000; // 5 minutes for new users, 30 seconds for existing
      
      if (Date.now() - cached.timestamp < cacheTimeout) {
        const merged = { ...STATIC_APP_CONFIG, ...cached.config };
        merged.colorScheme = merged.colorScheme || STATIC_APP_CONFIG.colorScheme;
        console.log(isNewUser ? '🆕 NEW USER: Using cached admin config for instant load!' : '⚡ Using fresh API cache for instant load');
        return merged;
      } else {
        console.log('🕒 API cache expired, will fetch new data');
      }
    } catch (e) {
      console.warn('Invalid API cache, using default');
    }
  }
  
  if (isNewUser) {
    console.log('👤 NEW USER: Returning static defaults, API fetch will update shortly');
  }
  
  return { ...STATIC_APP_CONFIG };
};

// Debug function to simulate new user (clear all cached config)
export const clearAllConfigCache = () => {
  localStorage.removeItem('STATIC_CONFIG_OVERRIDE');
  localStorage.removeItem('STATIC_CONFIG_API_CACHE');
  localStorage.removeItem('LAST_CONFIG_UPDATE');
  localStorage.removeItem('LAST_STATIC_CONFIG_UPDATE');
  console.log('🧹 All config cache cleared - simulating new user');
  console.log('🔄 Reloading page to test new user experience...');
  window.location.reload();
};

// Simulate new user in new tab (better for testing)
export const simulateNewUserInNewTab = () => {
  const newWindow = window.open(window.location.href, '_blank');
  if (newWindow) {
    // Clear storage in the new window after it loads
    newWindow.addEventListener('load', () => {
      newWindow.localStorage.removeItem('STATIC_CONFIG_OVERRIDE');
      newWindow.localStorage.removeItem('STATIC_CONFIG_API_CACHE');
      newWindow.localStorage.removeItem('LAST_CONFIG_UPDATE');
      newWindow.localStorage.removeItem('LAST_STATIC_CONFIG_UPDATE');
      console.log('🆕 New tab opened simulating new user (no cached config)');
    });
  }
};

// Debug function to check current config state
export const debugConfigState = () => {
  const override = localStorage.getItem('STATIC_CONFIG_OVERRIDE');
  const apiCache = localStorage.getItem('STATIC_CONFIG_API_CACHE');
  const isNewUser = !override && !apiCache;
  
  console.log('🔍 CONFIG DEBUG STATE:');
  console.log('Is New User:', isNewUser);
  console.log('Override exists:', !!override);
  console.log('API Cache exists:', !!apiCache);
  if (apiCache) {
    try {
      const cache = JSON.parse(apiCache);
      const ageSeconds = (Date.now() - cache.timestamp) / 1000;
      console.log('API Cache age:', ageSeconds, 'seconds');
      console.log('API Cache config:', cache.config?.siteName);
    } catch (e) {
      console.log('API Cache invalid');
    }
  }
  console.log('Current config:', getActiveConfigSync());
  
  // Return useful info for admin testing
  return {
    isNewUser,
    hasOverride: !!override,
    hasApiCache: !!apiCache,
    currentConfig: getActiveConfigSync()
  };
};

// Auto-expose debug functions to window for testing
if (typeof window !== 'undefined') {
  window.clearAllConfigCache = clearAllConfigCache;
  window.simulateNewUserInNewTab = simulateNewUserInNewTab;
  window.debugConfigState = debugConfigState;
  
  // Also expose for admin panel testing
  window.testNewUserExperience = () => {
    console.log('🧪 TESTING NEW USER EXPERIENCE:');
    const state = debugConfigState();
    if (!state.isNewUser) {
      console.log('⚠️ Not a new user - clearing cache to simulate...');
      clearAllConfigCache();
    } else {
      console.log('✅ Already simulating new user experience');
    }
  };
}