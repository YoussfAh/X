// Enhanced Service Worker for PWA with Ultra-Robust Hero Image Optimization
const CACHE_VERSION = 'v4'; // Increment version for better cache management
const HERO_CACHE_NAME = `pro-g-hero-${CACHE_VERSION}`;
const API_CACHE_NAME = `pro-g-api-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `pro-g-static-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `pro-g-runtime-${CACHE_VERSION}`;

// Enhanced cache duration settings (in milliseconds)
const CACHE_DURATIONS = {
  HERO_IMAGES: 24 * 60 * 60 * 1000, // 24 hours
  API_RESPONSES: 10 * 60 * 1000,      // 10 minutes (increased for stability)
  STATIC_ASSETS: 7 * 24 * 60 * 60 * 1000, // 7 days
  RUNTIME: 2 * 60 * 60 * 1000        // 2 hours (increased for stability)
};

// Essential static resources to cache on install
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Hero image patterns to cache aggressively
const HERO_IMAGE_PATTERNS = [
  /\/uploads\/hero-images\//,
  /\/hero-images\//,
  /hero.*\.(jpg|jpeg|png|webp|avif)$/i
];

// API patterns for stale-while-revalidate
const API_PATTERNS = [
  /\/api\/system\/hero-images/,
  /\/api\/system\/settings/
];

// Enhanced utility functions with error handling
function isHeroImage(url) {
  try {
    return HERO_IMAGE_PATTERNS.some(pattern => pattern.test(url));
  } catch (error) {
    console.warn('SW: Error checking hero image pattern:', error);
    return false;
  }
}

function isApiRequest(url) {
  try {
    return url.includes('/api/') && API_PATTERNS.some(pattern => pattern.test(url));
  } catch (error) {
    console.warn('SW: Error checking API pattern:', error);
    return false;
  }
}

function isStaticAsset(url) {
  try {
    return /\.(css|js|woff2?|ttf|eot|ico|png|jpg|jpeg|svg|gif|webp|avif)$/i.test(url);
  } catch (error) {
    console.warn('SW: Error checking static asset pattern:', error);
    return false;
  }
}

function createCacheKey(request) {
  return `${request.url}|${Date.now()}`;
}

function isCacheExpired(timestamp, duration) {
  return Date.now() - timestamp > duration;
}

// Enhanced cache management
async function cleanExpiredCache(cacheName, duration) {
  try {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cachedTime = response.headers.get('sw-cached-time');
        if (cachedTime && isCacheExpired(parseInt(cachedTime), duration)) {
          await cache.delete(request);
          console.log(`SW: Expired cache cleaned for ${request.url}`);
        }
      }
    }
  } catch (error) {
    console.warn(`SW: Cache cleanup failed for ${cacheName}:`, error);
  }
}

// Add custom headers to cached responses
function addCacheHeaders(response, cacheTime = Date.now()) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-time', cacheTime.toString());
  headers.set('sw-cache-version', CACHE_VERSION);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

// Install event - cache essential resources with enhanced error handling
self.addEventListener('install', event => {
  console.log('SW: Installing enhanced service worker v4');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources with individual error handling
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('SW: Caching static resources');
        return Promise.allSettled(
          STATIC_RESOURCES.map(url => 
            cache.add(url).catch(err => {
              console.warn(`SW: Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      }),
      // Preload current hero images if available (non-blocking)
      preloadHeroImages().catch(error => {
        console.warn('SW: Hero image preloading failed during install:', error);
        // Don't fail installation due to hero image preload failure
        return null;
      })
    ])
    .then(() => {
      console.log('SW: Installation complete, skipping waiting');
      return self.skipWaiting();
    })
    .catch(error => {
      console.error('SW: Installation failed:', error);
      // Still try to skip waiting even if installation partially failed
      return self.skipWaiting();
    })
  );
});

// Preload hero images from API
async function preloadHeroImages() {
  try {
    console.log('SW: Preloading hero images');
    
    // Try to fetch current hero images from API
    const response = await fetch('/api/system/hero-images');
    if (response.ok) {
      const data = await response.json();
      const heroCache = await caches.open(HERO_CACHE_NAME);
      
      if (data.heroImages && Array.isArray(data.heroImages)) {
        const preloadPromises = data.heroImages.map(async (imageUrl) => {
          try {
            const imageResponse = await fetch(imageUrl);
            if (imageResponse.ok) {
              const cachedResponse = addCacheHeaders(imageResponse.clone());
              await heroCache.put(imageUrl, cachedResponse);
              console.log(`SW: Preloaded hero image: ${imageUrl}`);
            }
          } catch (error) {
            console.warn(`SW: Failed to preload hero image ${imageUrl}:`, error);
          }
        });
        
        await Promise.allSettled(preloadPromises);
      }
    }
  } catch (error) {
    console.warn('SW: Hero images preload failed:', error);
  }
}

// Activate event - clean up old caches and expired entries
self.addEventListener('activate', event => {
  console.log('SW: Activating enhanced service worker v3');
  
  event.waitUntil(
    Promise.all([
      // Clean up old cache versions
      caches.keys().then(cacheNames => {
        const currentCaches = [HERO_CACHE_NAME, API_CACHE_NAME, STATIC_CACHE_NAME, RUNTIME_CACHE_NAME];
        return Promise.all(
          cacheNames
            .filter(cacheName => !currentCaches.includes(cacheName))
            .map(cacheName => {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Clean expired entries from current caches
      cleanExpiredCache(HERO_CACHE_NAME, CACHE_DURATIONS.HERO_IMAGES),
      cleanExpiredCache(API_CACHE_NAME, CACHE_DURATIONS.API_RESPONSES),
      cleanExpiredCache(RUNTIME_CACHE_NAME, CACHE_DURATIONS.RUNTIME)
    ])
    .then(() => {
      console.log('SW: Activation complete, claiming clients');
      return self.clients.claim();
    })
  );
});

// Enhanced fetch event with specialized caching strategies
self.addEventListener('fetch', event => {
  // Skip non-GET requests and different origins
  if (event.request.method !== 'GET' || 
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip hot reload and sockjs requests
  if (event.request.url.includes('sockjs-node') ||
      event.request.url.includes('hot-update') ||
      event.request.url.includes('webpack-dev-server')) {
    return;
  }

  const requestUrl = event.request.url;

  // Hero Images: Cache-first strategy with long duration
  if (isHeroImage(requestUrl)) {
    event.respondWith(handleHeroImageRequest(event.request));
    return;
  }

  // API Requests: Stale-while-revalidate for hero/settings API
  if (isApiRequest(requestUrl)) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Static Assets: Cache-first with long duration
  if (isStaticAsset(requestUrl)) {
    event.respondWith(handleStaticAssetRequest(event.request));
    return;
  }

  // Navigation requests: Network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }

  // Default: Runtime cache with network-first
  event.respondWith(handleRuntimeRequest(event.request));
});

// Hero Image Request Handler - Cache-first with background update
async function handleHeroImageRequest(request) {
  try {
    const cache = await caches.open(HERO_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      const cachedTime = cachedResponse.headers.get('sw-cached-time');
      
      // Return cached version immediately
      if (cachedTime && !isCacheExpired(parseInt(cachedTime), CACHE_DURATIONS.HERO_IMAGES)) {
        console.log(`SW: Serving cached hero image: ${request.url}`);
        
        // Background update if cache is getting old (more than 12 hours)
        if (isCacheExpired(parseInt(cachedTime), CACHE_DURATIONS.HERO_IMAGES / 2)) {
          backgroundUpdateCache(request, cache);
        }
        
        return cachedResponse;
      }
    }

    // Fetch from network if not cached or expired
    console.log(`SW: Fetching hero image from network: ${request.url}`);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cachedResponse = addCacheHeaders(networkResponse.clone());
      await cache.put(request, cachedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    console.warn(`SW: Hero image fetch failed: ${request.url}`, error);
    
    // Return stale cache if available
    const cache = await caches.open(HERO_CACHE_NAME);
    const staleResponse = await cache.match(request);
    if (staleResponse) {
      return staleResponse;
    }
    
    throw error;
  }
}

// API Request Handler - Stale-while-revalidate
async function handleApiRequest(request) {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    // Always try network first for fresh data
    const networkPromise = fetch(request).then(response => {
      if (response.ok) {
        const cachedResponse = addCacheHeaders(response.clone());
        cache.put(request, cachedResponse);
      }
      return response;
    });

    // If we have cached data, return it immediately while updating in background
    if (cachedResponse) {
      const cachedTime = cachedResponse.headers.get('sw-cached-time');
      if (cachedTime && !isCacheExpired(parseInt(cachedTime), CACHE_DURATIONS.API_RESPONSES)) {
        console.log(`SW: Serving cached API response: ${request.url}`);
        networkPromise.catch(() => {}); // Update in background, ignore errors
        return cachedResponse;
      }
    }

    // Wait for network response
    return await networkPromise;
  } catch (error) {
    // Fallback to cache if network fails
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log(`SW: Network failed, serving stale API cache: ${request.url}`);
      return cachedResponse;
    }
    
    throw error;
  }
}

// Static Asset Request Handler - Cache-first
async function handleStaticAssetRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      const cachedTime = cachedResponse.headers.get('sw-cached-time');
      if (cachedTime && !isCacheExpired(parseInt(cachedTime), CACHE_DURATIONS.STATIC_ASSETS)) {
        return cachedResponse;
      }
    }

    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cachedResponse = addCacheHeaders(networkResponse.clone());
      await cache.put(request, cachedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Navigation Request Handler - Network-first with offline fallback
async function handleNavigationRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Fallback to cached index.html for offline support
    const cache = await caches.open(STATIC_CACHE_NAME);
    const fallback = await cache.match('/index.html');
    
    if (fallback) {
      return fallback;
    }
    
    return new Response('Offline - Please check your connection', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Runtime Request Handler - Network-first with runtime cache
async function handleRuntimeRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      const cachedResponse = addCacheHeaders(networkResponse.clone());
      cache.put(request, cachedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(RUNTIME_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background cache update
async function backgroundUpdateCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cachedResponse = addCacheHeaders(response.clone());
      await cache.put(request, cachedResponse);
      console.log(`SW: Background updated cache for: ${request.url}`);
    }
  } catch (error) {
    console.warn(`SW: Background update failed for: ${request.url}`, error);
  }
}

// Message handling for cache management
self.addEventListener('message', event => {
  const { type, data } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'PRELOAD_HERO_IMAGES':
      event.waitUntil(preloadHeroImages());
      event.ports[0]?.postMessage({ success: true });
      break;

    case 'CLEAR_HERO_CACHE':
      event.waitUntil(
        caches.delete(HERO_CACHE_NAME).then(() => {
          console.log('SW: Hero cache cleared');
          event.ports[0]?.postMessage({ success: true });
        })
      );
      break;

    case 'CLEAR_ALL_CACHES':
      event.waitUntil(
        Promise.all([
          caches.delete(HERO_CACHE_NAME),
          caches.delete(API_CACHE_NAME),
          caches.delete(RUNTIME_CACHE_NAME)
        ]).then(() => {
          console.log('SW: All caches cleared');
          event.ports[0]?.postMessage({ success: true });
        })
      );
      break;

    case 'GET_CACHE_STATUS':
      event.waitUntil(
        getCacheStatus().then(status => {
          event.ports[0]?.postMessage(status);
        })
      );
      break;
  }
});

// Get cache status for debugging/monitoring
async function getCacheStatus() {
  try {
    const cacheNames = [HERO_CACHE_NAME, API_CACHE_NAME, STATIC_CACHE_NAME, RUNTIME_CACHE_NAME];
    const status = {};

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = {
        count: keys.length,
        urls: keys.map(key => key.url)
      };
    }

    return status;
  } catch (error) {
    console.warn('SW: Failed to get cache status:', error);
    return { error: error.message };
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'hero-images-sync') {
    event.waitUntil(preloadHeroImages());
  }
});

console.log('SW: Enhanced service worker v3 loaded with hero image optimization');