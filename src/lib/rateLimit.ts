/**
 * Shared sliding-window rate limiter for Next.js Route Handlers (Node.js runtime).
 *
 * Each route handler can call `checkRateLimit(key, { max, windowMs })`.
 * Returns { allowed: boolean, remaining: number, retryAfter: number }.
 *
 * Uses an in-memory Map — fine for a single-instance VPS deployment.
 * For multi-instance, replace with Redis (Upstash, ioredis, etc.).
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory growth (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cutoff = Date.now() - 600_000; // 10 min
    for (const [key, entry] of store) {
      const fresh = entry.timestamps.filter(t => t > cutoff);
      if (fresh.length === 0) store.delete(key);
      else entry.timestamps = fresh;
    }
  }, 300_000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // seconds until window resets
}

export interface RateLimitOptions {
  max: number;       // max requests in the window
  windowMs: number;  // window duration in milliseconds
}

export function checkRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const { max, windowMs } = opts;
  const now = Date.now();

  const entry = store.get(key) ?? { timestamps: [] };
  // Slide the window — discard timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);

  if (entry.timestamps.length >= max) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    store.set(key, entry);
    return { allowed: false, remaining: 0, retryAfter: Math.max(1, retryAfter) };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return { allowed: true, remaining: max - entry.timestamps.length, retryAfter: 0 };
}

/**
 * Extract the best available identifier from a request for rate limiting.
 * Priority: JWT user ID > x-forwarded-for > x-real-ip > 'unknown'.
 */
export function getRateLimitKey(
  req: Request,
  prefix: string,
  authHeader?: string | null,
): string {
  // Try JWT subject for per-user limiting
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const jwtPayload = authHeader.split('.')[1];
      if (jwtPayload) {
        const decoded = JSON.parse(Buffer.from(jwtPayload, 'base64url').toString());
        if (decoded.sub) return `${prefix}:user:${decoded.sub}`;
      }
    } catch { /* fallback to IP */ }
  }

  // Fallback to IP
  const xfwd = (req.headers as Headers).get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = (req.headers as Headers).get('x-real-ip');
  const ip = xfwd ?? realIp ?? 'unknown';
  return `${prefix}:ip:${ip}`;
}

/** Build a 429 response with correct Retry-After header. */
export function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({ error: 'Trop de requêtes. Réessayez dans quelques instants.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    },
  );
}
