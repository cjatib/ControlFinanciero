/* Replaced during production builds by scripts/generate-sw.mjs. */
const BUILD_ID = '__BUILD_ID__';
const PREFIX = 'controlfinanciero-';
const SHELL_CACHE = PREFIX + 'shell-' + BUILD_ID;
const ASSETS_CACHE = PREFIX + 'assets-' + BUILD_ID;
const BASE = self.registration.scope;
const HOME = new URL('./', BASE).href;
const INDEX = new URL('index.html', BASE).href;
const STATIC_PREFIX = new URL('assets/', BASE).pathname;

function isVersionedStaticAsset(url) {
  return url.pathname.startsWith(STATIC_PREFIX)
    && /-[A-Za-z0-9_-]{8,}\.(?:js|css|svg|png|webp|woff2?)$/i.test(url.pathname);
}

function isPublicShellAsset(url) {
  return [
    'manifest.webmanifest',
    'icon.svg',
    'pwa-192x192.png',
    'pwa-512x512.png',
  ].some((filename) => url.href === new URL(filename, BASE).href);
}

self.addEventListener('install', (event) => {
  // Deliberately do NOT call skipWaiting here. An active user must choose
  // when to reload, so editing forms are not discarded by a deployment.
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll([
      HOME, INDEX,
      new URL('manifest.webmanifest', BASE).href,
      new URL('icon.svg', BASE).href,
    ])),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.filter((name) =>
        name.startsWith(PREFIX) && name !== SHELL_CACHE && name !== ASSETS_CACHE,
      ).map((name) => caches.delete(name)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.cache === 'only-if-cached') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Always try network first for current HTML; offline returns only a
    // cached app shell, not a promise of offline Firestore persistence.
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic' && response.headers.get('content-type')?.includes('text/html')) {
          const cache = await caches.open(SHELL_CACHE);
          await cache.put(INDEX, response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match(INDEX)) || Response.error();
      }
    })());
    return;
  }

  if (isVersionedStaticAsset(url)) {
    // Fingerprinted files are immutable. Never cache requests to Firebase,
    // API endpoints, or arbitrary URLs that may return personal information.
    event.respondWith((async () => {
      const cache = await caches.open(ASSETS_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === 'basic'
          && !response.headers.get('content-type')?.includes('text/html')) {
        await cache.put(request, response.clone());
      }
      return response;
    })());
    return;
  }

  if (isPublicShellAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') {
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (await cache.match(request)) || Response.error();
      }
    })());
  }
});
