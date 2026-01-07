// Push notification received
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push notification received');
    
    let notificationData = {
        title: 'New Notification',
        body: 'You have a new notification',
        icon: '/PRO1logo.png',
        badge: '/PRO1logo.png',
        url: '/'
    };

    try {
        if (event.data) {
            notificationData = event.data.json();
            console.log('[Service Worker] Notification data:', notificationData);
        }
    } catch (error) {
        console.error('[Service Worker] Error parsing notification data:', error);
    }

    const options = {
        body: notificationData.body,
        icon: notificationData.icon || '/PRO1logo.png',
        badge: notificationData.badge || '/PRO1logo.png',
        data: {
            url: notificationData.url || '/',
            dateOfArrival: Date.now()
        },
        requireInteraction: false, // Auto-dismiss after some time
        tag: 'form-notification', // Group similar notifications
        renotify: true, // Show even if a notification with same tag exists
        vibrate: [200, 100, 200], // Vibration pattern on mobile
        actions: [
            {
                action: 'open',
                title: 'Open Form',
                icon: '/PRO1logo.png'
            },
            {
                action: 'close',
                title: 'Dismiss',
                icon: '/PRO1logo.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});

// Notification clicked
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event.action);
    
    event.notification.close();

    // Handle action buttons
    if (event.action === 'close') {
        return; // Just close the notification
    }

    // Get URL from notification data
    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // Check if there's already a window/tab open
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                // If a window is already open, focus it and navigate
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

self.addEventListener('install', event => {
    event.waitUntil(
      caches.open('my-cache').then(cache => {
        return cache.addAll([
          '/',
          '/index.html',
          '/App.css',
          '/app.js'
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', event => {
    try {
      const requestUrl = new URL(event.request.url);

      // Skip handling for API requests or dynamic media served via backend
      if (
        requestUrl.pathname.startsWith('/api/') ||
        requestUrl.pathname.includes('/public-files/') ||
        requestUrl.pathname.startsWith('/storage/')
      ) {
        return;
      }

      // Allow other origins to pass through untouched
      if (requestUrl.origin !== self.location.origin) {
        return;
      }

      // For same-origin static assets, use a simple cache-first strategy
      event.respondWith(
        caches.match(event.request).then(response => {
          return response || fetch(event.request).catch(err => {
            console.error('Service Worker: fetch failed for same-origin', err, event.request.url);
            return new Response('Service unavailable', { status: 503, statusText: 'Service Worker fetch failed' });
          });
        })
      );
    } catch (e) {
      // If URL parsing fails, fallback to network
      event.respondWith(fetch(event.request));
    }
  });
  
  caches.keys().then((cacheNames) => {
    return Promise.all(
      cacheNames.map((cache) => caches.delete(cache))
    );
  });