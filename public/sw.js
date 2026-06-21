const CACHE_NAME = 'fitsync-v2'
const STATIC_ASSETS = ['/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png']

// Never cache auth-gated pages or API routes
const NO_CACHE_PATHS = ['/auth/', '/api/']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Never cache: API calls or auth pages (prevents leaking auth state between users)
  if (NO_CACHE_PATHS.some(p => url.pathname.startsWith(p))) return

  // Only cache same-origin requests
  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        // Cache only static assets (JS, CSS, images, fonts) — NOT HTML pages
        if (response.ok && response.type === 'basic') {
          const contentType = response.headers.get('content-type') || ''
          const isStatic = contentType.includes('javascript') ||
                           contentType.includes('css') ||
                           contentType.includes('image') ||
                           contentType.includes('font')
          if (isStatic) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()))
          }
        }
        return response
      }).catch(() => cached)
      return cached || network
    })
  )
})
