/**
 * Scroll position utilities for reliable cross-page navigation
 * Specifically optimized for mobile devices
 */

// Check if device is mobile
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Save scroll position with device-specific storage
export const saveScrollPosition = (key, position) => {
  try {
    const scrollData = {
      position,
      timestamp: Date.now(),
      path: window.location.pathname,
      isMobile: isMobileDevice()
    };
    
    // Store in both localStorage and sessionStorage for redundancy
    localStorage.setItem(key, JSON.stringify(scrollData));
    sessionStorage.setItem(key, JSON.stringify(scrollData));
    
    // For debugging
    console.log(`Saved scroll position: ${position} for ${key}`);
    return true;
  } catch (error) {
    console.error('Error saving scroll position:', error);
    return false;
  }
};

// Get saved scroll position with validation
export const getSavedScrollPosition = (key, maxAgeMs = 3600000) => { // Default 1 hour max age
  try {
    // Try sessionStorage first (more reliable during session)
    let savedData = sessionStorage.getItem(key);
    
    // Fall back to localStorage if not in sessionStorage
    if (!savedData) {
      savedData = localStorage.getItem(key);
    }
    
    if (!savedData) return null;
    
    const data = JSON.parse(savedData);
    const now = Date.now();
    
    // Check if the saved position is still valid (not expired)
    if (now - data.timestamp > maxAgeMs) {
      // Position is too old, clear it and return null
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      return null;
    }
    
    return data.position;
  } catch (error) {
    console.error('Error getting scroll position:', error);
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    return null;
  }
};

// Enhanced scroll restoration - immediate with no animations
export const restoreScrollPosition = (key, maxAgeMs = 3600000) => {
  const savedPosition = getSavedScrollPosition(key, maxAgeMs);
  if (savedPosition === null) return false;
  
  const targetPosition = parseInt(savedPosition);
  
  // Disable smooth scrolling temporarily for immediate positioning
  const htmlStyle = document.documentElement.style;
  const originalScrollBehavior = htmlStyle.scrollBehavior;
  htmlStyle.scrollBehavior = 'auto';
  
  // Apply position immediately
  window.scrollTo(0, targetPosition);
  
  // Restore original scroll behavior after a short delay
  setTimeout(() => {
    htmlStyle.scrollBehavior = originalScrollBehavior;
  }, 50);
  
  return true;
};

// Aggressively save scroll position during scroll (with throttling)
let scrollThrottleTimer = null;
export const setupScrollPositionTracking = (key, throttleMs = 200) => {
  const handleScroll = () => {
    if (scrollThrottleTimer !== null) {
      clearTimeout(scrollThrottleTimer);
    }
    
    scrollThrottleTimer = setTimeout(() => {
      const currentPosition = window.scrollY;
      saveScrollPosition(key, currentPosition);
    }, throttleMs);
  };
  
  // Add passive scroll listener for better performance
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Return function to remove listener
  return () => {
    window.removeEventListener('scroll', handleScroll);
    if (scrollThrottleTimer !== null) {
      clearTimeout(scrollThrottleTimer);
    }
  };
};

// Setup persistent collection navigation tracking
export const setupCollectionLinkTracking = () => {
  const trackCollectionNavigation = (e) => {
    const currentPosition = window.scrollY;
    saveScrollPosition('home_scroll_position', currentPosition);
    
    if (isMobileDevice()) {
      // Save redundant copies with different keys for mobile
      saveScrollPosition('home_scroll_position_mobile', currentPosition);
      saveScrollPosition('home_scroll_backup', currentPosition);
    }
  };
  
  const attachListeners = () => {
    const collectionLinks = document.querySelectorAll('a[href^="/collections/"]');
    collectionLinks.forEach(link => {
      // Remove any existing listeners to prevent duplicates
      link.removeEventListener('click', trackCollectionNavigation);
      // Add the listener
      link.addEventListener('click', trackCollectionNavigation);
    });
    return collectionLinks;
  };
  
  // Initial listener attachment
  const links = attachListeners();
  
  // Setup observer to catch dynamically added collection links
  const observer = new MutationObserver(() => {
    attachListeners();
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  // Return cleanup function
  return () => {
    observer.disconnect();
    links.forEach(link => {
      link.removeEventListener('click', trackCollectionNavigation);
    });
  };
};