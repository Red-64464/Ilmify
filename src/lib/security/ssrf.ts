// SSRF guard: validates that an outbound URL points to a public host before
// the server fetches it. Prevents access to localhost / internal Docker services
// (supabase-kong, coolify-db, …) and cloud metadata endpoints.
import { lookup } from 'node:dns/promises';
import net from 'node:net';

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SsrfError';
  }
}

/** True if an IPv4/IPv6 address is private, loopback, link-local, or otherwise non-public. */
function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;                       // 10.0.0.0/8
    if (a === 127) return true;                      // loopback
    if (a === 0) return true;                        // 0.0.0.0/8
    if (a === 169 && b === 254) return true;         // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true;         // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;       // loopback / unspecified
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique-local fc00::/7
    if (lower.startsWith('fe80')) return true;                // link-local
    // IPv4-mapped IPv6 (::ffff:a.b.c.d)
    const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return false;
  }
  return true; // unknown format → treat as unsafe
}

/**
 * Validates a single URL: only http/https, and its hostname must resolve to
 * public IP addresses only. Throws SsrfError otherwise.
 */
export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SsrfError('URL invalide');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SsrfError('Protocole non supporté');
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  // Block obvious internal hostnames outright.
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    !host.includes('.') && !net.isIP(host) // bare container names like "supabase-kong"
  ) {
    throw new SsrfError('Hôte interne interdit');
  }

  // If the host is a literal IP, validate it directly.
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new SsrfError('Adresse IP privée interdite');
    return parsed;
  }

  // Resolve the hostname and ensure every address is public.
  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    throw new SsrfError('Résolution DNS impossible');
  }
  if (addresses.length === 0) throw new SsrfError('Hôte introuvable');
  for (const { address } of addresses) {
    if (isPrivateIp(address)) throw new SsrfError('Hôte résolu vers une adresse interne');
  }

  return parsed;
}

/**
 * SSRF-safe fetch with manual redirect handling: every redirect hop is
 * re-validated against the public-host policy. Caps total hops.
 */
export async function safeFetch(
  rawUrl: string,
  init: RequestInit & { timeoutMs?: number } = {},
  maxRedirects = 4,
): Promise<Response> {
  const { timeoutMs = 10000, ...rest } = init;
  let currentUrl = rawUrl;

  for (let i = 0; i <= maxRedirects; i++) {
    await assertPublicUrl(currentUrl);
    const res = await fetch(currentUrl, {
      ...rest,
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });

    // Not a redirect → return as-is.
    if (res.status < 300 || res.status >= 400) return res;

    const location = res.headers.get('location');
    if (!location) return res;
    currentUrl = new URL(location, currentUrl).toString();
  }

  throw new SsrfError('Trop de redirections');
}
