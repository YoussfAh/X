/**
 * SIMPLIFIED FAVICON UTILITIES
 * Basic favicon functionality with no custom options
 */

/**
 * Clear all favicons and reset to default
 */
export const clearAllCustomFavicons = () => {
  // Remove all existing favicon links
  const existingIcons = document.querySelectorAll('link[rel*="icon"]');
  existingIcons.forEach(icon => icon.remove());
  
  // Clear localStorage
  localStorage.removeItem('ACTIVE_CUSTOM_FAVICON');
  localStorage.removeItem('ACTIVE_CUSTOM_SVG_FAVICON');
  
  // No favicon will be set, letting the browser use its default
  return true;
};

/**
 * Update tab title to default
 */
export const updateTabTitle = () => {
  document.title = 'App';
};

// Export empty functions to prevent errors in existing code
export const updateDynamicFavicon = () => {};
export const forceApplyCustomSvgFavicon = () => {};
export const forceApplyCustomTabFavicon = () => {};
export const getPersistedCustomSvgFavicon = () => null;
export const getPersistedCustomFavicon = () => null;
export const getCurrentFaviconState = () => ({});
export const updateBrowserTab = () => {};
