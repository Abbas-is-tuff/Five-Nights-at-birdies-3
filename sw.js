// 5 Nights At Birdies 3: offline support.
// Saves every game file on install and serves them from the device, so the game runs with no connection.
// Bump VERSION whenever a game file changes, so devices pick up the update the next time they're online.
const VERSION = 'fnab3-v1';
const FILES = [
  './', 'index.html', 'three.min.js', 'manifest.webmanifest',
  'fonts/fonts.css', 'fonts/chakra-petch-latin-400-normal.woff2', 'fonts/chakra-petch-latin-500-normal.woff2',
  'fonts/chakra-petch-latin-600-normal.woff2', 'fonts/chakra-petch-latin-700-normal.woff2', 'fonts/vt323-latin-400-normal.woff2',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// The game page: try the network first (to get updates), fall back to the saved copy when offline.
// Everything else: use the saved copy, and fetch it if it's missing.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); return r; })
      .catch(() => caches.match('index.html', { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  })));
});
