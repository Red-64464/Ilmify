const CACHE_NAME = 'ilmify-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
];

// Install: pre-cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Handle notification messages from the prayer-times page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      tag: event.data.tag || 'prayer-reminder',
      icon: '/logo.png',
    });
  }

  // Schedule a daily reminder notification
  if (event.data && event.data.type === 'SCHEDULE_DAILY_REMINDER') {
    const hour = event.data.hour || 9;
    const minute = event.data.minute || 0;
    scheduleDailyReminder(hour, minute, event.data.body || "N'oubliez pas votre session d'apprentissage !");
  }
});

// Daily reminder scheduling
let dailyReminderTimer = null;
function scheduleDailyReminder(hour, minute, body) {
  if (dailyReminderTimer) clearTimeout(dailyReminderTimer);

  function scheduleNext() {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();

    dailyReminderTimer = setTimeout(() => {
      self.registration.showNotification('Ilmify — Rappel quotidien 📖', {
        body: body,
        tag: 'daily-reminder',
        icon: '/logo.png',
      });
      // Reschedule for the next day
      scheduleNext();
    }, delay);
  }

  scheduleNext();
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests, Supabase API calls, and Next.js chunks (always network)
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('supabase')) return;
  if (url.pathname.startsWith('/_next/')) return;

  // For navigation requests: network-first with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('/')))
    );
    return;
  }

  // For static assets (fonts, images): cache-first
  if (
    url.pathname.startsWith('/fonts/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // For other requests: network-first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
