self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_ALARM_NOTIFICATION') {
    const { title, body, vibrate, silent, tag } = event.data.payload;
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        tag: tag || 'megabrain-alarm',
        renotify: true,
        requireInteraction: true,
        vibrate: vibrate ? [400, 150, 400, 150, 600] : undefined,
        silent: Boolean(silent),
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
