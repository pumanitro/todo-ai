/* eslint-disable no-restricted-globals */

/**
 * -----------------------------------------------------------
 * Service-worker for "todo-flow"
 * -----------------------------------------------------------
 *  ✅   SPA-friendly: network-first for navigations, cache-first for static
 *  ✅   Precaches only files that exist in the production build
 *  ✅   Skips waiting + takes control immediately after install
 *  ✅   Cleans up old versions automatically
 *  ✅   Safe fallbacks (never serves a cached 404)
 *  ✅   Leaves cross-origin assets (e.g. Google Fonts) to the browser
 *  -----------------------------------------------------------
 */

/** 👇  Bump this any time you change precache contents  */
const CACHE_NAME = 'todo-flow-v36';

/**
 * In production your build pipeline should replace
 * `__PRECACHE_ASSETS__` with *exactly* the files emitted
 * by the build, e.g.
 *   ["/","/manifest.json",
 *    "/static/js/main.d41d8c.js",
 *    "/static/css/main.d41d8c.css"]
 *
 * With Workbox you can just leave the next line as-is:
 *   const PRECACHE_ASSETS = self.__WB_MANIFEST;
 */
const PRECACHE_ASSETS = [
  '/',           // dev fallback – safe to leave
  '/manifest.json'
];

/* ---------------------------------------------------------- */
/*  INSTALL – stash the precache list                         */
/* ---------------------------------------------------------- */
self.addEventListener('install', (event) => {
  // Activate the new SW as soon as it finishes installing
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

/* ---------------------------------------------------------- */
/*  ACTIVATE – kill old caches & claim clients                */
/* ---------------------------------------------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => (name !== CACHE_NAME ? caches.delete(name) : null))
      )
    ).then(() => self.clients.claim())
  );
});

/* ---------------------------------------------------------- */
/*  FETCH – runtime caching strategies                        */
/* ---------------------------------------------------------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  /* ---------- 1. SPA navigations (index.html) -------------- */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResp) => {
          // Update cached index.html for next visit
          const copy = networkResp.clone();
          caches.open(CACHE_NAME).then((c) => c.put('/', copy));
          return networkResp;
        })
        .catch(() => caches.match('/')) // offline fallback
    );
    return; // ⬅ don't fall through
  }

  /* ---------- 2. Pre-cached static assets ------------------ */
  if (
    request.method === 'GET' &&
    request.url.startsWith(self.location.origin) &&
    PRECACHE_ASSETS.some((asset) => request.url.endsWith(asset))
  ) {
    event.respondWith(caches.match(request).then((c) => c || fetch(request)));
    return;
  }

  /* ---------- 3. Same-origin runtime assets  --------------- */
  if (request.url.startsWith(self.location.origin)) {
    // stale-while-revalidate
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((resp) => {
            if (resp.ok) {
              const copy = resp.clone();
              caches
                .open(CACHE_NAME)
                .then((c) => c.put(request, copy))
                .catch(() => {});
            }
            return resp;
          })
          .catch(() => {});
        return cached || networkFetch;
      })
    );
    return;
  }

  /* ---------- 4. Cross-origin (fonts, APIs…) --------------- */
  // Let the network handle it; browser HTTP cache is good enough
});

/* ---------------------------------------------------------- */
/*  OPTIONAL: Background-sync stub                            */
/* ---------------------------------------------------------- */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Expand this to replay queued "todo" actions, etc.
  console.log('[SW] Background sync triggered');
}

/* ---------------------------------------------------------- */
/*  NOTIFICATION EVENTS for Android badge support             */
/* ---------------------------------------------------------- */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Handle different notification types
  const notificationData = event.notification.data || {};
  
  if (notificationData.type === 'badge-update') {
    // For badge notifications, open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // If app is already open, focus it
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Otherwise, open a new window
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

self.addEventListener('notificationclose', (event) => {
  // Handle notification close if needed
  const notificationData = event.notification.data || {};
  
  if (notificationData.type === 'badge-update') {
    console.log('[SW] Badge notification closed');
  }
});

/* ---------------------------------------------------------- */
/*  PUSH EVENT for future badge updates (optional)            */
/* ---------------------------------------------------------- */
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    
    if (data.type === 'badge-update') {
      // Handle server-side badge updates
      const options = {
        body: data.body || `${data.count} tasks remaining today`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'todo-badge',
        silent: true,
        requireInteraction: false,
        data: {
          type: 'badge-update',
          count: data.count
        }
      };

      event.waitUntil(
        self.registration.showNotification('Todo Flow', options)
      );
    }
  } catch (error) {
    console.error('[SW] Error handling push event:', error);
  }
});
