/**
 * Hero Image Cache Utility - Enhanced with Service Worker Integration
 * Provides browser-level caching with Service Worker optimization
 */

import React from 'react';
import serviceWorkerManager from './serviceWorkerManager';

class HeroImageCache {
  constructor() {
    this.browserCache = new Map();
    this.preloadedImages = new Set();
    this.loadingPromises = new Map();
    this.performanceMetrics = new Map();
    
    // Cache configuration
    this.config = {
      maxBrowserCacheSize: 50, // Maximum images in browser memory cache
      preloadTimeout: 30000,   // 30 seconds timeout for preloading
      retryAttempts: 3,        // Number of retry attempts for failed loads
      retryDelay: 1000         // Delay between retries (ms)
    };
  }

  /**
   * Initialize cache and preload hero images
   */
  async init() {
    try {
      // Wait for service worker to be ready
      if (serviceWorkerManager.isSupported) {
        const swReady = await serviceWorkerManager.init();
        if (swReady) {
          console.log('Hero Cache: Service Worker ready for caching');
          // Trigger hero image preloading in service worker
          await serviceWorkerManager.preloadHeroImages();
        }
      }
      
      console.log('Hero Cache: Browser cache initialized');
      return true;
    } catch (error) {
      console.warn('Hero Cache: Initialization failed:', error);
      return false;
    }
  }

  /**
   * Preload multiple hero images
   */
  async preloadImages(imageUrls) {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.warn('Hero Cache: No image URLs provided for preloading');
      return [];
    }

    console.log(`Hero Cache: Preloading ${imageUrls.length} hero images`);
    
    const results = await Promise.allSettled(
      imageUrls.map(url => this.preloadSingleImage(url))
    );

    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
    
    const failed = results
      .filter(result => result.status === 'rejected')
      .map(result => result.reason);

    console.log(`Hero Cache: Preloaded ${successful.length}/${imageUrls.length} images`);
    
    if (failed.length > 0) {
      console.warn('Hero Cache: Failed to preload some images:', failed);
    }

    return successful;
  }

  /**
   * Preload a single image with retry logic
   */
  async preloadSingleImage(imageUrl, attempt = 1) {
    if (this.preloadedImages.has(imageUrl)) {
      console.log(`Hero Cache: Image already preloaded: ${imageUrl}`);
      return imageUrl;
    }

    // Check if already loading
    if (this.loadingPromises.has(imageUrl)) {
      return this.loadingPromises.get(imageUrl);
    }

    const loadPromise = this.loadImageWithTimeout(imageUrl, attempt);
    this.loadingPromises.set(imageUrl, loadPromise);

    try {
      const result = await loadPromise;
      this.preloadedImages.add(imageUrl);
      this.loadingPromises.delete(imageUrl);
      
      // Monitor performance if service worker manager is available
      if (serviceWorkerManager.isSupported) {
        const perfData = await serviceWorkerManager.monitorHeroImagePerformance(imageUrl);
        this.performanceMetrics.set(imageUrl, perfData);
      }
      
      return result;
    } catch (error) {
      this.loadingPromises.delete(imageUrl);
      
      // Retry logic
      if (attempt < this.config.retryAttempts) {
        console.warn(`Hero Cache: Retrying image load (${attempt}/${this.config.retryAttempts}): ${imageUrl}`);
        await this.delay(this.config.retryDelay * attempt);
        return this.preloadSingleImage(imageUrl, attempt + 1);
      }
      
      console.error(`Hero Cache: Failed to preload image after ${attempt} attempts: ${imageUrl}`, error);
      throw error;
    }
  }

  /**
   * Load image with timeout
   */
  loadImageWithTimeout(imageUrl, attempt = 1) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const startTime = performance.now();
      
      // Setup timeout
      const timeout = setTimeout(() => {
        img.src = ''; // Cancel loading
        reject(new Error(`Image load timeout after ${this.config.preloadTimeout}ms: ${imageUrl}`));
      }, this.config.preloadTimeout);

      img.onload = () => {
        clearTimeout(timeout);
        const loadTime = performance.now() - startTime;
        
        // Cache in browser memory
        this.cacheImageInBrowser(imageUrl, img);
        
        console.log(`Hero Cache: Image loaded in ${loadTime.toFixed(2)}ms (attempt ${attempt}): ${imageUrl}`);
        resolve(imageUrl);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Image load failed: ${imageUrl}`));
      };

      // Start loading
      img.crossOrigin = 'anonymous'; // Enable CORS for better caching
      img.src = imageUrl;
    });
  }

  /**
   * Cache image in browser memory with size management
   */
  cacheImageInBrowser(imageUrl, imageElement) {
    // Remove oldest entries if cache is full
    if (this.browserCache.size >= this.config.maxBrowserCacheSize) {
      const firstKey = this.browserCache.keys().next().value;
      this.browserCache.delete(firstKey);
    }

    this.browserCache.set(imageUrl, {
      element: imageElement,
      timestamp: Date.now(),
      url: imageUrl
    });
  }

  /**
   * Get cached image from browser memory
   */
  getCachedImage(imageUrl) {
    return this.browserCache.get(imageUrl);
  }

  /**
   * Check if image is preloaded and ready
   */
  isPreloaded(imageUrl) {
    return this.preloadedImages.has(imageUrl) || this.browserCache.has(imageUrl);
  }

  /**
   * Get performance metrics for an image
   */
  getPerformanceMetrics(imageUrl) {
    return this.performanceMetrics.get(imageUrl);
  }

  /**
   * Get all performance metrics
   */
  getAllPerformanceMetrics() {
    return Object.fromEntries(this.performanceMetrics);
  }

  /**
   * Clear browser cache
   */
  clearBrowserCache() {
    this.browserCache.clear();
    this.preloadedImages.clear();
    this.performanceMetrics.clear();
    console.log('Hero Cache: Browser cache cleared');
  }

  /**
   * Clear all caches including Service Worker
   */
  async clearAllCaches() {
    this.clearBrowserCache();
    
    if (serviceWorkerManager.isSupported) {
      try {
        await serviceWorkerManager.clearHeroCache();
        console.log('Hero Cache: Service Worker cache cleared');
      } catch (error) {
        console.warn('Hero Cache: Failed to clear Service Worker cache:', error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      browserCacheSize: this.browserCache.size,
      preloadedCount: this.preloadedImages.size,
      loadingCount: this.loadingPromises.size,
      performanceMetricsCount: this.performanceMetrics.size,
      serviceWorkerAvailable: serviceWorkerManager.isSupported,
      serviceWorkerControlling: serviceWorkerManager.isControlling()
    };
  }

  /**
   * Optimize image URL for better caching (add cache-busting or optimization params)
   */
  optimizeImageUrl(imageUrl, options = {}) {
    if (!imageUrl) return imageUrl;

    try {
      const url = new URL(imageUrl, window.location.origin);
      
      // Add optimization parameters for supported services (like Cloudinary)
      if (options.width) url.searchParams.set('w', options.width);
      if (options.height) url.searchParams.set('h', options.height);
      if (options.quality) url.searchParams.set('q', options.quality);
      if (options.format) url.searchParams.set('f', options.format);
      
      // Add cache versioning if specified
      if (options.version) url.searchParams.set('v', options.version);
      
      return url.toString();
    } catch (error) {
      console.warn('Hero Cache: Failed to optimize image URL:', error);
      return imageUrl;
    }
  }

  /**
   * Prefetch hero images based on current system settings
   */
  async prefetchFromAPI() {
    try {
      console.log('Hero Cache: Fetching hero images from API');
      
      const response = await fetch('/api/system/hero-images');
      if (!response.ok) {
        throw new Error(`API response not ok: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.heroImages && Array.isArray(data.heroImages)) {
        console.log(`Hero Cache: Found ${data.heroImages.length} hero images from API`);
        return this.preloadImages(data.heroImages);
      } else {
        console.warn('Hero Cache: No hero images found in API response');
        return [];
      }
    } catch (error) {
      console.error('Hero Cache: Failed to fetch hero images from API:', error);
      throw error;
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create optimized image element with lazy loading
   */
  createOptimizedImage(imageUrl, options = {}) {
    const img = new Image();
    
    // Set optimization attributes
    if (options.loading !== false) {
      img.loading = options.loading || 'lazy';
    }
    
    img.decoding = options.decoding || 'async';
    
    // Set dimensions if provided
    if (options.width) img.width = options.width;
    if (options.height) img.height = options.height;
    
    // Set alt text
    img.alt = options.alt || 'Hero image';
    
    // Set optimized URL
    img.src = this.optimizeImageUrl(imageUrl, options);
    
    return img;
  }

  /**
   * Watch for hero image updates and refresh cache
   */
  async watchForUpdates(callback) {
    if (!serviceWorkerManager.isSupported) {
      console.warn('Hero Cache: Service Worker not available for update watching');
      return;
    }

    // Listen for cache updates from service worker
    serviceWorkerManager.addEventListener('cache-updated', (data) => {
      if (data.cacheType === 'hero') {
        console.log('Hero Cache: Hero images updated by Service Worker');
        this.clearBrowserCache(); // Clear browser cache to force reload
        if (callback) callback(data);
      }
    });
  }
}

// Create singleton instance
const heroImageCache = new HeroImageCache();

export default heroImageCache;

/**
 * React Hook for Hero Image Cache
 */
export function useHeroImageCache() {
  const [isReady, setIsReady] = React.useState(false);
  const [cacheStats, setCacheStats] = React.useState(null);
  const [isPreloading, setIsPreloading] = React.useState(false);

  React.useEffect(() => {
    const initCache = async () => {
      const success = await heroImageCache.init();
      setIsReady(success);
      
      if (success) {
        // Get initial cache stats
        setCacheStats(heroImageCache.getCacheStats());
        
        // Auto-prefetch hero images
        try {
          setIsPreloading(true);
          await heroImageCache.prefetchFromAPI();
        } catch (error) {
          console.warn('Initial hero image prefetch failed:', error);
        } finally {
          setIsPreloading(false);
          setCacheStats(heroImageCache.getCacheStats());
        }
      }
    };

    initCache();
  }, []);

  const preloadImages = React.useCallback(async (imageUrls) => {
    setIsPreloading(true);
    try {
      const result = await heroImageCache.preloadImages(imageUrls);
      setCacheStats(heroImageCache.getCacheStats());
      return result;
    } finally {
      setIsPreloading(false);
    }
  }, []);

  const clearCache = React.useCallback(async () => {
    await heroImageCache.clearAllCaches();
    setCacheStats(heroImageCache.getCacheStats());
  }, []);

  const isPreloaded = React.useCallback((imageUrl) => {
    return heroImageCache.isPreloaded(imageUrl);
  }, []);

  const refreshStats = React.useCallback(() => {
    setCacheStats(heroImageCache.getCacheStats());
  }, []);

  return {
    isReady,
    cacheStats,
    isPreloading,
    preloadImages,
    clearCache,
    isPreloaded,
    refreshStats,
    cache: heroImageCache
  };
}