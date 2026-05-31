import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ── Sliding-window rate limiter (in-process, per-user via JWT sub) ──────────
// At 1000 concurrent users, a single bad actor must not exhaust the GROQ quota.
// This is an in-memory map per server instance; for multi-instance deployments,
// a Redis-backed solution would be needed.
const rateLimitMap = new Map<string, number[]>();
const RL_WINDOW_MS = 60_000; // 1 minute
const RL_MAX_REQUESTS = 20;  // max 20 AI calls / user / minute

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) ?? []).filter(t => now - t < RL_WINDOW_MS);
  if (timestamps.length >= RL_MAX_REQUESTS) return true;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return false;
}

// Cleanup stale entries every 5 minutes to prevent memory leak
setInterval(() => {
  const cutoff = Date.now() - RL_WINDOW_MS;
  for (const [key, timestamps] of rateLimitMap) {
    const fresh = timestamps.filter(t => t > cutoff);
    if (fresh.length === 0) rateLimitMap.delete(key);
    else rateLimitMap.set(key, fresh);
  }
}, 300_000);

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  // Rate-limit by JWT subject (user ID) extracted from the Authorization header.
  // Falls back to IP so anonymous calls are also capped.
  const authHeader = req.headers.get('authorization') ?? '';
  let rateLimitKey = req.headers.get('x-forwarded-for') ?? 'unknown';
  try {
    const jwtPayload = authHeader.split('.')[1];
    if (jwtPayload) {
      const decoded = JSON.parse(Buffer.from(jwtPayload, 'base64').toString());
      if (decoded.sub) rateLimitKey = decoded.sub;
    }
  } catch { /* use IP fallback */ }

  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans une minute.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const { provider = 'groq', ...forwardBody } = body;

  const isOpenRouter = provider === 'openrouter';
  const apiUrl = isOpenRouter ? OPENROUTER_URL : GROQ_URL;
  const apiKey = isOpenRouter
    ? process.env.OPENROUTER_API_KEY
    : process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: `Clé API ${provider} non configurée côté serveur` },
      { status: 500 },
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (isOpenRouter) {
    headers['HTTP-Referer'] = 'https://rayan-ilmify.duckdns.org';
    headers['X-Title'] = 'Ilmify';
  }

  try {
    const upstream = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(forwardBody),
      signal: AbortSignal.timeout(60000),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('timeout') || msg.includes('abort')) {
      return NextResponse.json({ error: 'Le service IA a mis trop de temps à répondre' }, { status: 504 });
    }
    return NextResponse.json({ error: `Erreur proxy AI: ${msg}` }, { status: 502 });
  }
}
