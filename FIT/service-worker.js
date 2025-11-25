
const CACHE_NAME = 'fit-cache-v1';
const OFFLINE_URL = 'index.html';
self.addEventListener('install', function(event) {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll([OFFLINE_URL, 'styles.css', 'app.js', 'chart.min.js'])));
  self.skipWaiting();
});
self.addEventListener('fetch', function(event) {
  event.respondWith(caches.match(event.request).then(resp => resp || fetch(event.request)));
});
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
