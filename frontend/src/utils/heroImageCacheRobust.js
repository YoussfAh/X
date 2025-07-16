/**
 * Ultra-robust Hero Image Cache Manager
 * Handles hero image caching with comprehensive error handling and fallback strategies
 */

import React, { useEffect, useState, useCallback } from 'react';
import serviceWorkerManager from './serviceWorkerManager';

class HeroImageCache {
  constructor() {
    this.preloadedImages = new Set();
    this.failedImages = new Set();
    this.retryAttempts = new Map();
    this.maxRetries = 2;
    this.ready = false;
    this.config = {
      maxCacheSize: 50,
      maxRetries: 2,
      retryDelay: 1000,
      preloadTimeout: 20000,   // Reduced timeout
      fallbackEnabled: true
    };
  }

  /**
   * Initialize cache with enhanced error handling
   */
  async init() {
    try {
      this.ready = true;
      console.log('Hero Cache: Initialized successfully');
      
      // Try to trigger service worker preloading (non-blocking)
      if (serviceWorkerManager.isSupported) {
        serviceWorkerManager.preloadHeroImages().catch(error => {
          console.warn('Hero Cache: Service worker preload failed:', error);
          // Continue without service worker
        });
      }
      
      return true;
    } catch (error) {
      console.warn('Hero Cache: Initialization failed:', error);
      this.ready = false;
      return false;
    }
  }

  /**
   * Robust image preloading with multiple fallback strategies
   */
  async preloadImages(imageUrls) {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.warn('Hero Cache: No valid image URLs provided for preloading');
      return { successful: [], failed: [] };
    }

    // Filter out invalid URLs
    const validUrls = imageUrls.filter(url => {
      if (typeof url !== 'string' || !url.trim()) return false;
      
      // Check if it's a valid URL
      try {
        new URL(url, window.location.origin);
        return true;
      } catch {
        console.warn('Hero Cache: Invalid URL skipped:', url);
        return false;
      }
    });

    if (validUrls.length === 0) {
      console.warn('Hero Cache: No valid URLs after filtering');
      return { successful: [], failed: [] };
    }

    console.log(`Hero Cache: Preloading ${validUrls.length} hero images`);
    
    // Use Promise.allSettled for better error handling
    const results = await Promise.allSettled(
      validUrls.map(url => this.preloadSingleImageRobust(url))
    );

    const successful = [];
    const failed = [];

    results.forEach((result, index) => {
      const url = validUrls[index];
      if (result.status === 'fulfilled' && result.value) {
        successful.push(url);
      } else {
        failed.push(url);
        console.warn(`Hero Cache: Failed to preload: ${url}`, result.reason);
      }
    });

    console.log(`Hero Cache: Preloaded ${successful.length}/${validUrls.length} images`);
    
    if (failed.length > 0) {
      console.warn('Hero Cache: Failed to preload some images:', failed);
    }

    return { successful, failed };
  }

  /**
   * Ultra-robust single image preloading with multiple fallback strategies
   */
  async preloadSingleImageRobust(imageUrl, attempt = 1) {
    // Check if already preloaded
    if (this.preloadedImages.has(imageUrl)) {
      return true;
    }

    // Check if permanently failed
    if (this.failedImages.has(imageUrl)) {
      console.warn(`Hero Cache: Image permanently failed: ${imageUrl}`);
      return false;
    }

    try {
      // Multiple strategies for image preloading
      const success = await this.tryMultiplePreloadStrategies(imageUrl);
      
      if (success) {
        this.preloadedImages.add(imageUrl);
        this.retryAttempts.delete(imageUrl);
        return true;
      } else {
        throw new Error('All preload strategies failed');
      }
    } catch (error) {
      console.warn(`Hero Cache: Preload attempt ${attempt} failed for ${imageUrl}:`, error);
      
      // Retry logic with exponential backoff
      if (attempt < this.config.maxRetries) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.preloadSingleImageRobust(imageUrl, attempt + 1);
      } else {
        // Mark as permanently failed
        this.failedImages.add(imageUrl);
        console.error(`Hero Cache: Image permanently failed after ${attempt} attempts: ${imageUrl}`);
        return false;
      }
    }
  }

  /**
   * Multiple preload strategies for maximum compatibility
   */
  async tryMultiplePreloadStrategies(imageUrl) {
    const strategies = [
      () => this.preloadWithImage(imageUrl),
      () => this.preloadWithFetch(imageUrl),
      () => this.preloadWithLink(imageUrl)
    ];

    for (const strategy of strategies) {
      try {
        await strategy();
        return true;
      } catch (error) {
        console.warn(`Hero Cache: Strategy failed for ${imageUrl}:`, error);
        continue;
      }
    }

    return false;
  }

  /**
   * Preload using Image constructor (most reliable)
   */
  async preloadWithImage(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      const timeout = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        reject(new Error(`Image load timeout: ${imageUrl}`));
      }, this.config.preloadTimeout);

      img.onload = () => {
        clearTimeout(timeout);
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Image load error: ${imageUrl}`));
      };

      img.src = imageUrl;
    });
  }

  /**
   * Preload using fetch API
   */
  async preloadWithFetch(imageUrl) {
    const response = await fetch(imageUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'force-cache',
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }

    return response;
  }

  /**
   * Preload using link prefetch
   */
  async preloadWithLink(imageUrl) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = imageUrl;
      
      link.onload = () => {
        document.head.removeChild(link);
        resolve();
      };
      
      link.onerror = () => {
        document.head.removeChild(link);
        reject(new Error(`Link prefetch failed: ${imageUrl}`));
      };
      
      document.head.appendChild(link);
      
      // Timeout for link prefetch
      setTimeout(() => {
        if (link.parentNode) {
          document.head.removeChild(link);
          reject(new Error(`Link prefetch timeout: ${imageUrl}`));
        }
      }, this.config.preloadTimeout);
    });
  }

  /**
   * Clear cache and reset state
   */
  clearCache() {
    this.preloadedImages.clear();
    this.failedImages.clear();
    this.retryAttempts.clear();
    console.log('Hero Cache: Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      ready: this.ready,
      preloaded: this.preloadedImages.size,
      failed: this.failedImages.size,
      retrying: this.retryAttempts.size
    };
  }
}

// Create singleton instance
const heroImageCache = new HeroImageCache();

/**
 * React hook for hero image caching
 */
export const useHeroImageCache = () => {
  const [isReady, setIsReady] = useState(false);
  const [cacheStats, setCacheStats] = useState(heroImageCache.getCacheStats());

  useEffect(() => {
    const initCache = async () => {
      try {
        const ready = await heroImageCache.init();
        setIsReady(ready);
        setCacheStats(heroImageCache.getCacheStats());
      } catch (error) {
        console.error('Hero Cache: Hook initialization failed:', error);
        setIsReady(false);
      }
    };

    initCache();
  }, []);

  const preloadImages = useCallback(async (imageUrls) => {
    try {
      const result = await heroImageCache.preloadImages(imageUrls);
      setCacheStats(heroImageCache.getCacheStats());
      return result;
    } catch (error) {
      console.error('Hero Cache: Preload failed:', error);
      return { successful: [], failed: imageUrls || [] };
    }
  }, []);

  const clearCache = useCallback(() => {
    heroImageCache.clearCache();
    setCacheStats(heroImageCache.getCacheStats());
  }, []);

  return {
    isReady,
    cacheStats,
    preloadImages,
    clearCache,
    isPreloaded: useCallback((url) => heroImageCache.preloadedImages.has(url), [])
  };
};

export default heroImageCache;
