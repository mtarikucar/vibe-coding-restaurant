// Service Worker for Restaurant Management System

// Cache name
const CACHE_NAME = "restaurant-ms-cache-v2";

// Assets to cache
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/restaurant-icon-192.png",
  "/restaurant-icon-512.png",
];

// API cache name
const API_CACHE_NAME = "restaurant-ms-api-cache-v1";

// API routes to cache
const API_ROUTES = ["/api/menu/categories", "/api/menu/items", "/api/tables"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== CACHE_NAME;
            })
            .map((name) => {
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests with a network-first strategy
  if (event.request.url.includes("/api/")) {
    // Check if this is an API route we want to cache
    const shouldCacheAPI = API_ROUTES.some((route) =>
      event.request.url.includes(route)
    );

    if (shouldCacheAPI) {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            // Clone the response
            const responseToCache = response.clone();

            // Open the API cache and store the response
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // If network request fails, try to get from cache
            return caches.match(event.request);
          })
      );
      return;
    }

    // For other API requests, just pass through
    return;
  }

  // For mobile app routes, use a cache-first strategy
  if (event.request.url.includes("/mobile")) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        // If in cache, return the cached version
        if (response) {
          // Still fetch from network in the background to update cache
          fetch(event.request)
            .then((networkResponse) => {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            })
            .catch(() => {
              // Silently fail if network fetch fails
            });

          return response;
        }

        // If not in cache, fetch from network
        return fetch(event.request).then((networkResponse) => {
          // Clone the response
          const responseToCache = networkResponse.clone();

          // Cache the response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });
      })
    );
    return;
  }

  // For all other requests, use a cache-first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response as it can only be consumed once
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.message || "New notification",
      icon: "/restaurant-icon-192.png",
      badge: "/restaurant-icon-192.png",
      data: {
        url: data.link || "/",
        notificationId: data.id,
      },
      actions: [
        {
          action: "view",
          title: "View",
        },
      ],
      vibrate: [100, 50, 100],
      timestamp: data.timestamp || Date.now(),
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || "Restaurant Management System",
        options
      )
    );
  } catch (error) {
    console.error("Error showing notification:", error);
  }
});

// Notification click event - handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "view" || !event.action) {
    const urlToOpen = event.notification.data.url || "/";

    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});
