/**
 * Service Worker Manager - Utility for communicating with the enhanced service worker
 * Handles hero image caching, cache management, and performance monitoring
 */

import React from 'react';

class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isSupported = 'serviceWorker' in navigator;
    this.messageChannel = null;
    this.listeners = new Map();
  }

  /**
   * Initialize service worker registration and setup communication
   */
  async init() {
    if (!this.isSupported) {
      console.warn('Service Worker not supported in this browser');
      return false;
    }

    // Check if already registered to prevent duplicates
    if (this.registration) {
      console.log('SW Manager: Service worker already registered');
      return true;
    }

    try {
      // Enhanced error handling for service worker file
      let response;
      try {
        response = await fetch('/service-worker.js', { 
          cache: 'no-cache',
          timeout: 5000 // 5 second timeout
        });
      } catch (fetchError) {
        console.warn('SW Manager: Service worker file fetch failed:', fetchError);
        return false;
      }

      if (!response.ok) {
        console.warn('SW Manager: Service worker file not available:', response.status);
        return false;
      }

      // Validate content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('javascript')) {
        console.warn('SW Manager: Invalid service worker MIME type:', contentType);
        return false;
      }

      // Register service worker with enhanced options
      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        updateViaCache: 'none', // Always fetch fresh service worker
        scope: '/' // Explicit scope
      });
      
      console.log('SW Manager: Service worker registered successfully');

      // Set up message channel for communication
      this.setupMessageChannel();

      // Listen for service worker updates with error handling
      this.setupUpdateListener();

      return true;
    } catch (error) {
      console.error('SW Manager: Registration failed:', error);
      
      // Clear registration on failure
      this.registration = null;
      
      // Try to clear any problematic state
      try {
        const existingRegistration = await navigator.serviceWorker.getRegistration();
        if (existingRegistration) {
          await existingRegistration.unregister();
          console.log('SW Manager: Cleared problematic registration');
        }
      } catch (cleanupError) {
        console.warn('SW Manager: Failed to cleanup registration:', cleanupError);
      }
      
      return false;
    }
  }

  /**
   * Setup message channel for two-way communication with service worker
   */
  setupMessageChannel() {
    this.messageChannel = new MessageChannel();
    
    // Listen for messages from service worker
    this.messageChannel.port1.onmessage = (event) => {
      const { type, data } = event.data || {};
      const listeners = this.listeners.get(type) || [];
      listeners.forEach(callback => callback(data));
    };
  }

  /**
   * Setup listener for service worker updates
   */
  setupUpdateListener() {
    if (!this.registration) return;

    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker is available
          this.notifyListeners('update-available', {
            newWorker,
            registration: this.registration
          });
        }
      });
    });
  }

  /**
   * Send message to service worker and optionally wait for response
   */
  async sendMessage(type, data = null, waitForResponse = false) {
    if (!this.isSupported || !navigator.serviceWorker.controller) {
      console.warn('SW Manager: Service worker not available');
      return null;
    }

    try {
      const message = { type, data };

      if (waitForResponse) {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Service worker response timeout'));
          }, 10000); // 10 second timeout

          this.messageChannel.port1.onmessage = (event) => {
            clearTimeout(timeout);
            resolve(event.data);
          };

          navigator.serviceWorker.controller.postMessage(
            message,
            [this.messageChannel.port2]
          );
        });
      } else {
        navigator.serviceWorker.controller.postMessage(message);
        return true;
      }
    } catch (error) {
      console.error('SW Manager: Failed to send message:', error);
      return null;
    }
  }

  /**
   * Preload hero images immediately with enhanced error handling
   */
  async preloadHeroImages() {
    if (!this.isSupported) {
      console.warn('SW Manager: Service Worker not supported, skipping preload');
      return false;
    }

    if (!navigator.serviceWorker.controller) {
      console.warn('SW Manager: No active service worker, skipping preload');
      return false;
    }

    try {
      console.log('SW Manager: Requesting hero images preload');
      
      // Enhanced timeout and error handling
      const result = await Promise.race([
        this.sendMessage('PRELOAD_HERO_IMAGES', null, true),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Preload timeout')), 15000)
        )
      ]);
      
      console.log('SW Manager: Hero images preload completed:', result);
      return result;
    } catch (error) {
      console.warn('SW Manager: Hero images preload failed:', error);
      // Don't throw error, just return false
      return false;
    }
  }

  /**
   * Clear hero image cache
   */
  async clearHeroCache() {
    console.log('SW Manager: Clearing hero image cache');
    return this.sendMessage('CLEAR_HERO_CACHE', null, true);
  }

  /**
   * Clear all service worker caches
   */
  async clearAllCaches() {
    console.log('SW Manager: Clearing all caches');
    return this.sendMessage('CLEAR_ALL_CACHES', null, true);
  }

  /**
   * Get current cache status for monitoring
   */
  async getCacheStatus() {
    return this.sendMessage('GET_CACHE_STATUS', null, true);
  }

  /**
   * Force service worker to skip waiting and activate
   */
  async skipWaiting() {
    return this.sendMessage('SKIP_WAITING');
  }

  /**
   * Add event listener for service worker events
   */
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(type, callback) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Notify listeners of events
   */
  notifyListeners(type, data) {
    const listeners = this.listeners.get(type) || [];
    listeners.forEach(callback => callback(data));
  }

  /**
   * Check if service worker is controlling the page
   */
  isControlling() {
    return this.isSupported && !!navigator.serviceWorker.controller;
  }

  /**
   * Get service worker registration state
   */
  getRegistrationState() {
    if (!this.registration) return 'unregistered';
    
    if (this.registration.installing) return 'installing';
    if (this.registration.waiting) return 'waiting';
    if (this.registration.active) return 'active';
    
    return 'unknown';
  }

  /**
   * Estimate cache usage (Chrome only)
   */
  async getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage,
          quota: estimate.quota,
          usagePercentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
        };
      } catch (error) {
        console.warn('SW Manager: Storage estimate failed:', error);
      }
    }
    return null;
  }

  /**
   * Monitor hero image loading performance
   */
  monitorHeroImagePerformance(imageUrl) {
    if (!('performance' in window)) return;

    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        console.log(`SW Manager: Hero image loaded in ${loadTime.toFixed(2)}ms:`, imageUrl);
        
        // Check if image was served from cache
        const perfEntries = performance.getEntriesByName(imageUrl);
        const isFromCache = perfEntries.length > 0 && 
          perfEntries[0].transferSize < perfEntries[0].encodedBodySize;
        
        resolve({
          url: imageUrl,
          loadTime,
          fromCache: isFromCache,
          transferSize: perfEntries[0]?.transferSize || 0,
          encodedSize: perfEntries[0]?.encodedBodySize || 0
        });
      };
      
      img.onerror = () => {
        const loadTime = performance.now() - startTime;
        console.warn(`SW Manager: Hero image failed to load after ${loadTime.toFixed(2)}ms:`, imageUrl);
        resolve({
          url: imageUrl,
          loadTime,
          error: true
        });
      };
      
      img.src = imageUrl;
    });
  }

  /**
   * Debug helper - logs cache status and performance info
   */
  async debugCacheInfo() {
    try {
      const cacheStatus = await this.getCacheStatus();
      const storageEstimate = await this.getStorageEstimate();
      const registrationState = this.getRegistrationState();
      
      console.group('SW Manager: Debug Info');
      console.log('Registration State:', registrationState);
      console.log('Is Controlling:', this.isControlling());
      console.log('Cache Status:', cacheStatus);
      console.log('Storage Estimate:', storageEstimate);
      console.groupEnd();
      
      return {
        registrationState,
        isControlling: this.isControlling(),
        cacheStatus,
        storageEstimate
      };
    } catch (error) {
      console.error('SW Manager: Debug info failed:', error);
      return { error: error.message };
    }
  }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

export default serviceWorkerManager;

/**
 * React Hook for using Service Worker Manager
 */
export function useServiceWorker() {
  const [isReady, setIsReady] = React.useState(false);
  const [hasUpdate, setHasUpdate] = React.useState(false);
  const [cacheStatus, setCacheStatus] = React.useState(null);

  React.useEffect(() => {
    const initServiceWorker = async () => {
      const success = await serviceWorkerManager.init();
      setIsReady(success);
      
      if (success) {
        // Listen for updates
        serviceWorkerManager.addEventListener('update-available', () => {
          setHasUpdate(true);
        });
        
        // Get initial cache status
        try {
          const status = await serviceWorkerManager.getCacheStatus();
          setCacheStatus(status);
        } catch (error) {
          console.warn('Failed to get initial cache status:', error);
        }
      }
    };

    initServiceWorker();
  }, []);

  const refreshCacheStatus = React.useCallback(async () => {
    try {
      const status = await serviceWorkerManager.getCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      console.warn('Failed to refresh cache status:', error);
    }
  }, []);

  const applyUpdate = React.useCallback(async () => {
    await serviceWorkerManager.skipWaiting();
    window.location.reload();
  }, []);

  const preloadHeroImages = React.useCallback(async () => {
    return serviceWorkerManager.preloadHeroImages();
  }, []);

  const clearCaches = React.useCallback(async () => {
    const result = await serviceWorkerManager.clearAllCaches();
    await refreshCacheStatus();
    return result;
  }, [refreshCacheStatus]);

  return {
    isReady,
    hasUpdate,
    cacheStatus,
    applyUpdate,
    preloadHeroImages,
    clearCaches,
    refreshCacheStatus,
    manager: serviceWorkerManager
  };
}
