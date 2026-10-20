// ShopMe service worker: fast repeat visits and a usable shop on weak mobile networks.
// - Pages: network first (fresh prices), cached copy when the network is slow or down
// - /assets (hashed build files): cache first, they never change
// - Product photos: cached, refreshed in the background
// - Product/category/settings API: network first, cached copy as fallback
// Orders, tracking and admin APIs are never cached.
const VERSION = 'v1';
const SHELL_CACHE = `shopme-shell-${VERSION}`;
const ASSET_CACHE = `shopme-assets-${VERSION}`;
const IMAGE_CACHE = `shopme-images-${VERSION}`;
const API_CACHE = `shopme-api-${VERSION}`;
const KEEP = [SHELL_CACHE, ASSET_CACHE, IMAGE_CACHE, API_CACHE];
const CACHEABLE_API = ['/api/products', '/api/categories', '/api/settings'];
const MAX_IMAGES = 120;
const MAX_PAGES = 30;
const MAX_ASSETS = 150;
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.add('/')).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('shopme-') && !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const withTimeout = (promise, ms) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
  });

async function trimCache(name, max) {
  const cache = await caches.open(name);
  // The home page is the offline fallback for every route: never evict it
  const keys = (await cache.keys()).filter((req) => new URL(req.url).pathname !== '/');
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  const network = fetch(request).then((res) => {
    if (res.ok) {
      cache.put(fallbackUrl || request, res.clone()).then(() => cacheName === SHELL_CACHE && trimCache(cacheName, MAX_PAGES));
    }
    return res;
  });
  try {
    return await withTimeout(network, NETWORK_TIMEOUT_MS);
  } catch {
    const cached = await cache.match(fallbackUrl || request);
    if (cached) {
      network.catch(() => {}); // let the slow request finish and refresh the cache
      return cached;
    }
    return network;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone()).then(() => trimCache(cacheName, MAX_ASSETS));
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res.ok || res.type === 'opaque') {
        cache.put(request, res.clone()).then(() => trimCache(cacheName, MAX_IMAGES));
      }
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Pages (SPA routes): the cached home shell can render any route when offline
  if (request.mode === 'navigate') {
    if (url.pathname.startsWith('/adminonly')) return;
    event.respondWith(
      networkFirst(request, SHELL_CACHE).catch(() => caches.match('/', { cacheName: SHELL_CACHE }))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/assets/')) {
      event.respondWith(cacheFirst(request, ASSET_CACHE));
      return;
    }
    if (url.pathname.startsWith('/uploads/') || url.pathname.startsWith('/images/')) {
      event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
      return;
    }
    if (CACHEABLE_API.includes(url.pathname)) {
      event.respondWith(networkFirst(request, API_CACHE));
      return;
    }
    return;
  }

  // Product photos hosted elsewhere (e.g. Unsplash)
  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
  }
});
