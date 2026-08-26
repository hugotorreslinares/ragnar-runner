// Service worker — its only real job is to make the game installable.
//
// Chromium browsers only fire `beforeinstallprompt` (the event behind the
// "Install app" button, see js/install.js) for a page that has a manifest
// AND a service worker with a fetch handler. This file is that fetch
// handler, and it is deliberately the most conservative one that qualifies.
//
// Strategy: network first, cache only as a fallback. A cache-first worker
// would be faster on repeat visits, but this game ships new versions to
// Vercel often, and cache-first means players keep running the build they
// first loaded until the cache is invalidated — the classic "the new
// obstacle doesn't show up for me" bug. Here the network always wins when
// it answers; the cache exists so the app still opens with no connection.
const CACHE = 'escape-bogota-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  // Only same-origin GETs. The leaderboard's Supabase calls (including
  // POSTing a score) must reach the network untouched — replaying a cached
  // response for those would be wrong, not merely stale.
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
