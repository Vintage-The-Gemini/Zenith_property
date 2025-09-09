// Cache busting service worker
const CACHE_NAME = 'palvoria-v' + Date.now();
const STATIC_CACHE_NAME = CACHE_NAME + '-static';
const DYNAMIC_CACHE_NAME = CACHE_NAME + '-dynamic';

// Critical resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/properties',
  '/about',
  '/contact',
  '/palvoria-logo.png',
  '/site.webmanifest',
  // Add critical CSS and JS files here
]

// Property images and dynamic content
const DYNAMIC_ASSETS = [
  '/api/',
  'https://images.unsplash.com/',
]

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .catch(err => console.error('Service Worker: Cache failed', err))
  )
  
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => 
            cacheName !== STATIC_CACHE_NAME && 
            cacheName !== DYNAMIC_CACHE_NAME
          )
          .map(cacheName => caches.delete(cacheName))
      )
    })
  )
  
  // Take control of all clients
  event.waitUntil(clients.claim())
})

// Fetch event - implement cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Handle different types of requests
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    // Cache first strategy for static assets
    event.respondWith(cacheFirst(request))
  } else if (url.pathname.startsWith('/api/')) {
    // Network first strategy for API calls
    event.respondWith(networkFirst(request))
  } else if (url.pathname.startsWith('/properties/')) {
    // Stale while revalidate for property pages
    event.respondWith(staleWhileRevalidate(request))
  } else {
    // Default network first
    event.respondWith(networkFirst(request))
  }
})

// Cache Strategies
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    
    const response = await fetch(request)
    const cache = await caches.open(STATIC_CACHE_NAME)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    console.error('Cache first strategy failed:', error)
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.error('Network first strategy failed:', error)
    
    // Try to serve from cache
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    
    // Return offline fallback
    if (request.destination === 'document') {
      return caches.match('/offline.html') || new Response('Offline')
    }
    
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME)
  const cached = await cache.match(request)
  
  // Fetch fresh content in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  })
  
  // Return cached content immediately if available
  return cached || fetchPromise
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'property-inquiry') {
    event.waitUntil(syncPropertyInquiry())
  }
  
  if (event.tag === 'contact-form') {
    event.waitUntil(syncContactForm())
  }
})

async function syncPropertyInquiry() {
  try {
    // Get stored inquiries from IndexedDB
    const inquiries = await getStoredInquiries()
    
    for (const inquiry of inquiries) {
      try {
        await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inquiry)
        })
        
        // Remove from local storage after successful sync
        await removeStoredInquiry(inquiry.id)
      } catch (error) {
        console.error('Failed to sync inquiry:', error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

async function syncContactForm() {
  // Similar implementation for contact form sync
  console.log('Syncing contact forms...')
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New property alert!',
    icon: '/palvoria-logo.png',
    badge: '/palvoria-logo.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/properties'
    },
    actions: [
      {
        action: 'view',
        title: 'View Properties',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('Palvoria Properties', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    )
  }
})

// Helper functions for IndexedDB operations
async function getStoredInquiries() {
  // Implement IndexedDB operations
  return []
}

async function removeStoredInquiry(id) {
  // Implement IndexedDB operations
  console.log('Removing inquiry:', id)
}