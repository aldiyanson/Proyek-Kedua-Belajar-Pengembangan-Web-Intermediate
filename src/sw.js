const CACHE_NAME = 'dicerita-v1';
const SHELL_CACHE = 'dicerita-shell-v1';
const DATA_CACHE = 'dicerita-data-v1';
const IMAGE_CACHE = 'dicerita-images-v1';

// App Shell resources - essential files for the app to work offline
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  // CSS files will be added by webpack build process
  // JS files will be added by webpack build process
];

// Install event - cache shell assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching shell assets');
        return cache.addAll(SHELL_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== SHELL_CACHE && cacheName !== DATA_CACHE && cacheName !== IMAGE_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.origin === 'https://story-api.dicoding.dev') {
    event.respondWith(networkFirstStrategy(request, DATA_CACHE));
    return;
  }

  // Handle image requests with cache-first strategy
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Handle shell assets with cache-first strategy
  if (isShellAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, SHELL_CACHE));
    return;
  }

  // Default: try cache first, then network
  event.respondWith(cacheFirstStrategy(request, SHELL_CACHE));
});

// Cache-first strategy: check cache first, fallback to network
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[Service Worker] Cache hit:', request.url);
      return cachedResponse;
    }

    console.log('[Service Worker] Cache miss, fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache-first strategy failed:', error);
    
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return getOfflineFallback();
    }
    
    throw error;
  }
}

// Network-first strategy: try network first, fallback to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    console.log('[Service Worker] Network-first for:', request.url);
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache for:', request.url);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    console.error('[Service Worker] Network-first strategy failed:', error);
    throw error;
  }
}

// Check if a path is a shell asset
function isShellAsset(pathname) {
  return SHELL_ASSETS.some(asset => {
    if (asset === '/') return pathname === '/' || pathname === '/index.html';
    return pathname === asset || pathname.startsWith(asset);
  });
}

// Get offline fallback page
async function getOfflineFallback() {
  try {
    const cache = await caches.open(SHELL_CACHE);
    return await cache.match('/') || await cache.match('/index.html');
  } catch (error) {
    console.error('[Service Worker] Failed to get offline fallback:', error);
    return new Response('App is offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Perform background sync operations
async function doBackgroundSync() {
  console.log('[Service Worker] Performing background sync...');
  // This will be expanded in future implementations
  // for syncing offline actions when network is restored
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  const iconData = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iIzE4NzdmMiIvPgo8cGF0aCBkPSJNMTYgMTZoOGw4IDE2LTggMTZIMTZWMTZaTTMyIDI0djE2aDhsOC0xNlYyNGgtMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';

  let notificationTitle = 'DiCerita';
  let notificationOptions = {
    icon: iconData,
    badge: iconData,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: iconData
      },
      {
        action: 'close',
        title: 'Close',
        icon: iconData
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationTitle = data.title || notificationTitle;
      notificationOptions = {
        ...notificationOptions,
        ...(data.options || {}),
      };
      // Ensure icon and badge are always set
      notificationOptions.icon = iconData;
      notificationOptions.badge = iconData;
      if (!notificationOptions.body) {
        notificationOptions.body = 'Notifikasi baru dari DiCerita';
      }
    } catch (e) {
      notificationOptions.body = event.data.text();
    }
  } else {
    notificationOptions.body = 'Notifikasi baru dari DiCerita';
  }

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[Service Worker] Service Worker registered successfully');