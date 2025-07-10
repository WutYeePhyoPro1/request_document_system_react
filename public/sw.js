self.addEventListener('push', (event) => {
    const data = event.data.json();

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
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  });
  
  caches.keys().then((cacheNames) => {
    return Promise.all(
      cacheNames.map((cache) => caches.delete(cache))
    );
  });