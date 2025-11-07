// Service Worker for offline functionality
const CACHE_NAME = 'biblia-digital-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/bible-data.js',
    '/js/bible-converter.js',
    '/js/ui.js',
    '/data/versions.json',
    '/assets/icon-192.svg',
    '/assets/icon-512.svg',
    '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache.map(url => {
                    // Make URLs relative to service worker location
                    return url.startsWith('/') ? '/biblia-json' + url : url;
                }));
            })
            .catch((error) => {
                console.error('Failed to cache resources:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Clone the request because it's a one-time use stream
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then((response) => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response because it's a one-time use stream
                    const responseToCache = response.clone();

                    // Cache the fetched response
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch(() => {
                    // If network fails and no cache, return offline page
                    if (event.request.mode === 'navigate') {
                        return caches.match('/biblia-json/index.html');
                    }
                    
                    // For other requests, you might want to return a default response
                    return new Response(JSON.stringify({
                        error: 'Offline - content not available'
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                });
            })
    );
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Update cache with latest data when online
        const cache = await caches.open(CACHE_NAME);
        const response = await fetch('/biblia-json/data/versions.json');
        if (response.ok) {
            await cache.put('/biblia-json/data/versions.json', response.clone());
        }
    } catch (error) {
        console.log('Background sync failed:', error);
    }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_STATUS') {
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                caches.keys().then(cacheNames => {
                    client.postMessage({
                        type: 'CACHE_STATUS',
                        caches: cacheNames,
                        current: CACHE_NAME
                    });
                });
            });
        });
    }
});

// Notification handling (for future features)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/biblia-json/')
    );
});

// Push message handling (for future features)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Nueva actualización disponible',
        icon: '/biblia-json/assets/icon-192.png',
        badge: '/biblia-json/assets/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver actualización',
                icon: '/biblia-json/assets/icon-192.png'
            },
            {
                action: 'close',
                title: 'Cerrar'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Biblia Digital', options)
    );
});