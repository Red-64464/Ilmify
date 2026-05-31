import { NextRequest, NextResponse } from 'next/server';

// ── Sliding-window rate limiter (edge-compatible, in-memory per instance) ────
// Limits general API traffic at the network edge before hitting route handlers.
// The AI route (/api/ai/chat) has its own per-user limiter — excluded here.
const RL_WINDOW_MS = 60_000;
const RL_GENERAL_MAX = 120; // 120 req/min/IP on general API endpoints
const RL_EXPENSIVE_MAX = 20; // 20 req/min/IP on expensive endpoints

const rateLimitStore = new Map<string, number[]>();

// Expensive routes that carry significant server cost
const EXPENSIVE_PREFIXES = [
  '/api/social/transcribe',
  '/api/youtube-transcript',
  '/api/youtube-playlist',
  '/api/extract-article',
];

function checkRateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(key) ?? []).filter(t => now - t < RL_WINDOW_MS);
  if (timestamps.length >= max) return false;
  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  return true;
}

// Purge stale entries every 5 minutes to prevent memory growth
let lastCleanup = Date.now();
function maybeCleanup() {
  if (Date.now() - lastCleanup < 300_000) return;
  lastCleanup = Date.now();
  const cutoff = Date.now() - RL_WINDOW_MS;
  for (const [key, ts] of rateLimitStore) {
    const fresh = ts.filter(t => t > cutoff);
    if (fresh.length === 0) rateLimitStore.delete(key);
    else rateLimitStore.set(key, fresh);
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── CVE-2025-29927 defense-in-depth ─────────────────────────────────────
  // Next.js 16 is patched, but we strip the header anyway as defense-in-depth.
  // An attacker sending this header should never reach internal logic.
  const reqHeaders = new Headers(req.headers);
  reqHeaders.delete('x-middleware-subrequest');
  reqHeaders.delete('x-middleware-invoke');

  maybeCleanup();

  // ── Rate limiting — API routes only ──────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    // Skip the AI route — it has its own per-user rate limiter
    if (!pathname.startsWith('/api/ai/')) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? req.headers.get('x-real-ip')
        ?? 'unknown';

      const isExpensive = EXPENSIVE_PREFIXES.some(p => pathname.startsWith(p));
      const max = isExpensive ? RL_EXPENSIVE_MAX : RL_GENERAL_MAX;
      const key = `${isExpensive ? 'exp' : 'gen'}:${ip}`;

      if (!checkRateLimit(key, max)) {
        return NextResponse.json(
          { error: 'Trop de requêtes. Réessayez dans une minute.' },
          {
            status: 429,
            headers: {
              'Retry-After': '60',
              'X-RateLimit-Limit': String(max),
              'Content-Type': 'application/json',
            },
          },
        );
      }
    }
  }

  // Pass the request with sanitized headers
  return NextResponse.next({
    request: { headers: reqHeaders },
  });
}

export const config = {
  // Match all API routes and all page routes (for header sanitization)
  matcher: ['/api/:path*'],
};
