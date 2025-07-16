// Hero Image Service Worker
// Optimized for hero carousel image caching with multi-tenant support

const CACHE_NAME = 'hero-images-v1';
const API_CACHE_NAME = 'hero-api-v1';
const STATIC_CACHE_NAME = 'static-assets-v1';
const CACHE_VERSION = '1.0.0';

// Cache configuration
const CACHE_CONFIG = {
    heroImages: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        maxEntries: 50
    },
    api: {
        maxAge: 10 * 60 * 1000, // 10 minutes for API responses
        maxEntries: 20
    },
    static: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        maxEntries: 100
    }
};

// URLs to cache
const STATIC_ASSETS = [
    '/static/css/main.css',
    '/static/js/main.js',
    '/favicon.ico',
    '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Hero Service Worker v' + CACHE_VERSION);
    
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE_NAME).then((cache) => {
                return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
            }),
            // Initialize other caches
            caches.open(CACHE_NAME),
            caches.open(API_CACHE_NAME)
        ]).then(() => {
            console.log('[SW] Installation complete');
            self.skipWaiting(); // Activate immediately
        })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Hero Service Worker');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName.startsWith('hero-') && 
                            ![CACHE_NAME, API_CACHE_NAME, STATIC_CACHE_NAME].includes(cacheName)) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all pages
            self.clients.claim()
        ]).then(() => {
            console.log('[SW] Activation complete');
        })
    );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle different types of requests
    if (isHeroImageRequest(request)) {
        event.respondWith(handleHeroImageRequest(request));
    } else if (isHeroAPIRequest(request)) {
        event.respondWith(handleHeroAPIRequest(request));
    } else if (isStaticAssetRequest(request)) {
        event.respondWith(handleStaticAssetRequest(request));
    } else if (isNavigationRequest(request)) {
        event.respondWith(handleNavigationRequest(request));
    }
});

// Check if request is for hero images
function isHeroImageRequest(request) {
    const url = request.url.toLowerCase();
    return (
        request.method === 'GET' &&
        (url.includes('/uploads/') || 
         url.includes('cloudinary.com') ||
         url.includes('imgur.com') ||
         url.includes('/hero-images/')) &&
        (url.includes('.jpg') || url.includes('.jpeg') || 
         url.includes('.png') || url.includes('.webp') || url.includes('.svg'))
    );
}

// Check if request is for hero API
function isHeroAPIRequest(request) {
    const url = request.url;
    return (
        request.method === 'GET' &&
        (url.includes('/api/system-settings/carousel') ||
         url.includes('/api/system-settings/main-hero'))
    );
}

// Check if request is for static assets
function isStaticAssetRequest(request) {
    const url = request.url;
    return (
        request.method === 'GET' &&
        (url.includes('/static/') ||
         url.includes('/favicon') ||
         url.includes('/manifest.json') ||
         url.includes('.css') ||
         url.includes('.js'))
    );
}

// Check if request is navigation
function isNavigationRequest(request) {
    return request.mode === 'navigate';
}

// Handle hero image requests with cache-first strategy
async function handleHeroImageRequest(request) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);

        // Return cached version if available and not expired
        if (cachedResponse) {
            const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date') || 0);
            const isExpired = Date.now() - cacheDate.getTime() > CACHE_CONFIG.heroImages.maxAge;

            if (!isExpired) {
                console.log('[SW] Serving hero image from cache:', request.url);
                return cachedResponse;
            }
        }

        // Fetch from network
        console.log('[SW] Fetching hero image from network:', request.url);
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Clone response for caching
            const responseToCache = networkResponse.clone();
            
            // Add cache date header
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cache-date', new Date().toISOString());
            
            const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });

            // Cache the response
            cache.put(request, cachedResponse);
            
            // Clean up old entries
            await cleanupCache(cache, CACHE_CONFIG.heroImages.maxEntries);
        }

        return networkResponse;
    } catch (error) {
        console.error('[SW] Hero image fetch failed:', error);
        
        // Try to return cached version even if expired
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            console.log('[SW] Serving expired hero image from cache:', request.url);
            return cachedResponse;
        }

        // Return fallback image
        return getFallbackImage();
    }
}

// Handle hero API requests with stale-while-revalidate strategy
async function handleHeroAPIRequest(request) {
    try {
        const cache = await caches.open(API_CACHE_NAME);
        const cachedResponse = await cache.match(request);

        // Return cached version immediately if available
        if (cachedResponse) {
            console.log('[SW] Serving hero API from cache:', request.url);
            
            // Revalidate in background
            fetch(request).then(async (networkResponse) => {
                if (networkResponse.ok) {
                    const responseToCache = networkResponse.clone();
                    const headers = new Headers(responseToCache.headers);
                    headers.set('sw-cache-date', new Date().toISOString());
                    
                    const cachedResponse = new Response(responseToCache.body, {
                        status: responseToCache.status,
                        statusText: responseToCache.statusText,
                        headers: headers
                    });

                    cache.put(request, cachedResponse);
                    await cleanupCache(cache, CACHE_CONFIG.api.maxEntries);
                }
            }).catch(console.error);

            return cachedResponse;
        }

        // No cache, fetch from network
        console.log('[SW] Fetching hero API from network:', request.url);
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cache-date', new Date().toISOString());
            
            const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });

            cache.put(request, cachedResponse);
            await cleanupCache(cache, CACHE_CONFIG.api.maxEntries);
        }

        return networkResponse;
    } catch (error) {
        console.error('[SW] Hero API fetch failed:', error);
        
        // Return cached version if available
        const cache = await caches.open(API_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return fallback API response
        return new Response(JSON.stringify([]), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle static assets with cache-first strategy
async function handleStaticAssetRequest(request) {
    try {
        const cache = await caches.open(STATIC_CACHE_NAME);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            console.log('[SW] Serving static asset from cache:', request.url);
            return cachedResponse;
        }

        console.log('[SW] Fetching static asset from network:', request.url);
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            cache.put(request, responseToCache);
            await cleanupCache(cache, CACHE_CONFIG.static.maxEntries);
        }

        return networkResponse;
    } catch (error) {
        console.error('[SW] Static asset fetch failed:', error);
        
        const cache = await caches.open(STATIC_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        throw error;
    }
}

// Handle navigation requests with network-first strategy
async function handleNavigationRequest(request) {
    try {
        return await fetch(request);
    } catch (error) {
        console.error('[SW] Navigation fetch failed:', error);
        
        // Return cached fallback page if available
        const cache = await caches.open(STATIC_CACHE_NAME);
        const fallback = await cache.match('/');
        if (fallback) {
            return fallback;
        }

        throw error;
    }
}

// Cleanup old cache entries
async function cleanupCache(cache, maxEntries) {
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
        const keysToDelete = keys.slice(0, keys.length - maxEntries);
        await Promise.all(keysToDelete.map(key => cache.delete(key)));
        console.log('[SW] Cleaned up', keysToDelete.length, 'old cache entries');
    }
}

// Get fallback image for failed hero image requests
function getFallbackImage() {
    // Return a simple 1x1 transparent pixel as fallback
    const fallbackImageData = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="rgba(0,0,0,0.1)"/></svg>';
    return new Response(fallbackImageData, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'no-cache'
        }
    });
}

// Message handling for cache management
self.addEventListener('message', (event) => {
    const { type, data } = event.data;

    switch (type) {
        case 'PRELOAD_HERO_IMAGES':
            preloadHeroImages(data.urls);
            break;
        case 'CLEAR_HERO_CACHE':
            clearHeroCache();
            break;
        case 'GET_CACHE_STATUS':
            getCacheStatus().then(status => {
                event.ports[0].postMessage(status);
            });
            break;
        case 'UPDATE_CACHE_CONFIG':
            updateCacheConfig(data);
            break;
    }
});

// Preload hero images
async function preloadHeroImages(urls) {
    if (!Array.isArray(urls)) return;

    console.log('[SW] Preloading', urls.length, 'hero images');
    const cache = await caches.open(CACHE_NAME);

    const preloadPromises = urls.map(async (url) => {
        try {
            const request = new Request(url);
            const cachedResponse = await cache.match(request);
            
            if (!cachedResponse) {
                const response = await fetch(request);
                if (response.ok) {
                    const headers = new Headers(response.headers);
                    headers.set('sw-cache-date', new Date().toISOString());
                    
                    const cachedResponse = new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: headers
                    });

                    await cache.put(request, cachedResponse);
                    console.log('[SW] Preloaded:', url);
                }
            }
        } catch (error) {
            console.error('[SW] Failed to preload:', url, error);
        }
    });

    await Promise.all(preloadPromises);
    console.log('[SW] Hero image preloading complete');
}

// Clear hero cache
async function clearHeroCache() {
    try {
        await caches.delete(CACHE_NAME);
        await caches.delete(API_CACHE_NAME);
        console.log('[SW] Hero cache cleared');
    } catch (error) {
        console.error('[SW] Failed to clear hero cache:', error);
    }
}

// Get cache status
async function getCacheStatus() {
    try {
        const [heroCache, apiCache, staticCache] = await Promise.all([
            caches.open(CACHE_NAME),
            caches.open(API_CACHE_NAME),
            caches.open(STATIC_CACHE_NAME)
        ]);

        const [heroKeys, apiKeys, staticKeys] = await Promise.all([
            heroCache.keys(),
            apiCache.keys(),
            staticCache.keys()
        ]);

        return {
            heroImages: heroKeys.length,
            apiResponses: apiKeys.length,
            staticAssets: staticKeys.length,
            version: CACHE_VERSION,
            timestamp: Date.now()
        };
    } catch (error) {
        console.error('[SW] Failed to get cache status:', error);
        return { error: error.message };
    }
}

// Update cache configuration
function updateCacheConfig(newConfig) {
    Object.assign(CACHE_CONFIG, newConfig);
    console.log('[SW] Cache config updated:', CACHE_CONFIG);
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'hero-image-sync') {
        event.waitUntil(syncHeroImages());
    }
});

// Sync hero images when back online
async function syncHeroImages() {
    try {
        console.log('[SW] Syncing hero images');
        // This could fetch the latest hero API data and preload new images
        const response = await fetch('/api/system-settings/carousel');
        if (response.ok) {
            const data = await response.json();
            const imageUrls = data.map(slide => slide.image).filter(Boolean);
            await preloadHeroImages(imageUrls);
        }
    } catch (error) {
        console.error('[SW] Hero image sync failed:', error);
    }
}

console.log('[SW] Hero Service Worker loaded, version:', CACHE_VERSION);
