const CACHE_NAME = 'ilmify-v3';
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

  if (event.data && event.data.type === 'SCHEDULE_DAILY_REMINDER') {
    const hour = event.data.hour || 9;
    const minute = event.data.minute || 0;
    scheduleDailyReminder(hour, minute, event.data.body || "N'oubliez pas votre session d'apprentissage !");
  }
});

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
      scheduleNext();
    }, delay);
  }

  scheduleNext();
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) clients[0].focus();
      else self.clients.openWindow('/');
    })
  );
});

// ── Fetch strategy ──────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip Supabase API calls — always fresh
  if (url.hostname.includes('supabase')) return;

  // Next.js immutable chunks (content-hashed filenames) → cache-first, 1 year
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Fonts & images → cache-first (long TTL, change by filename)
  const isStaticAsset = (
    url.pathname.startsWith('/fonts/') ||
    /\.(woff2?|png|jpe?g|svg|ico|webp|avif)$/.test(url.pathname)
  );
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation requests → network-first, fallback to cache then '/'
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

  // Everything else → network-first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
