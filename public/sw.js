self.addEventListener('push', function (event) {
    const payload = event.data ? event.data.json() : {};

    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: '/icon.png',
            data: { url: payload.url }
        })
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url));
});