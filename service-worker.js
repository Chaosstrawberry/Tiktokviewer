const CACHE = 'tikview-shell-v1';
const SHELL = ['./', './index.html', './style.css', './app.js', './manifest.json', './assets/icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    const clone = response.clone();
    caches.open(CACHE).then(cache => cache.put(request, clone));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
