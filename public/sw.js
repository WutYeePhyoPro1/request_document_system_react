self.addEventListener('push', (event) => {
    const data = event.data.json();
    console.log('Push event received:', data);
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: 'img', // Optional
        data: { url: data.url },
    });
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url));
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