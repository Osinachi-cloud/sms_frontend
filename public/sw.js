const CACHE_NAME = 'school-saas-v3';
const STATIC_ASSETS = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/students',
  '/teachers',
  '/cms',
  '/settings',
  '/analytics',
  '/calendar',
  '/timetable',
  '/quizzes',
  '/library',
  '/id-cards',
  '/report-cards',
  '/admissions',
  '/payments',
  '/messages',
  '/notifications',
  '/gamification',
  '/roles',
  '/schools',
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html>
  <head>
    <title>Offline - School SaaS</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body {
        font-family: system-ui, -apple-system, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      }
      .container { text-align: center; padding: 2rem; }
      .icon { font-size: 4rem; margin-bottom: 1rem; }
      h1 { color: #1e293b; margin-bottom: 0.5rem; }
      p { color: #64748b; margin-bottom: 1.5rem; }
      button {
        background: #3b82f6; color: white; border: none;
        padding: 0.75rem 1.5rem; border-radius: 0.5rem;
        font-size: 1rem; cursor: pointer;
      }
      button:hover { background: #2563eb; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="icon">📴</div>
      <h1>You are Offline</h1>
      <p>Please check your internet connection and try again.</p>
      <button onclick="window.location.reload()">Retry</button>
    </div>
  </body>
</html>`;

const API_CACHE_NAME = 'school-saas-api-v1';
const CACHEABLE_API_ROUTES = [
  '/api/schools',
  '/api/auth/me',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache the offline page response so it is always available
      const offlineResponse = new Response(OFFLINE_HTML, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
      await cache.put('/offline', offlineResponse);

      // Cache static assets individually so one 404 doesn't break everything
      for (const url of STATIC_ASSETS) {
        try {
          await cache.add(new Request(url, { cache: 'reload' }));
        } catch (err) {
          console.warn(`Failed to cache ${url}:`, err);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip Next.js internal RSC payloads (used by App Router for client navigation)
  if (url.searchParams.has('_rsc')) {
    return;
  }

  // Skip internal Next.js webpack HMR and data requests in dev mode
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/__nextjs')) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  event.respondWith(handleStaticRequest(request));
});

async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_API_ROUTES.some(route =>
    url.pathname.includes(route)
  );

  if (request.method === 'GET' && isCacheable) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(API_CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }
      return new Response(
        JSON.stringify({ error: 'Network unavailable', offline: true }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  if (request.method !== 'GET') {
    try {
      return await fetch(request);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Network unavailable',
          offline: true,
          queued: true,
          message: 'Your changes will be synced when you are back online',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  try {
    return await fetch(request);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Network unavailable', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }

    return new Response(OFFLINE_HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

async function handleStaticRequest(request) {
  const cached = await caches.match(request);
  if (cached) {
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, response);
        });
      }
    }).catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Network error', { status: 503 });
  }
}

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
