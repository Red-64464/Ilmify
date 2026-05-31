type CacheEntry<T> = { data: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

// Keys that survive page reload via localStorage. TTL is respected on read.
const PERSIST_PREFIX = 'ilmify_cache_';

function lsGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PERSIST_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(PERSIST_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function lsSet<T>(key: string, data: T, expiresAt: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERSIST_PREFIX + key, JSON.stringify({ data, expiresAt }));
  } catch {
    // localStorage full or unavailable — silent fallback to memory-only
  }
}

export const queryCache = {
  get<T>(key: string): T | null {
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (entry) {
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
      } else {
        return entry.data;
      }
    }
    return null;
  },

  set<T>(key: string, data: T, ttlMs = 60_000): void {
    store.set(key, { data, expiresAt: Date.now() + ttlMs });
  },

  invalidate(prefix: string): void {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
    if (typeof window !== 'undefined') {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k?.startsWith(PERSIST_PREFIX + prefix)) localStorage.removeItem(k);
        }
      } catch { /* ignore */ }
    }
  },

  clear(): void {
    store.clear();
  },
};

/** Wrap any async function with memory cache. TTL defaults to 60s. */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs = 60_000,
): Promise<T> {
  const cached = queryCache.get<T>(key);
  if (cached !== null) return cached;
  const data = await fn();
  queryCache.set(key, data, ttlMs);
  return data;
}

/**
 * SWR (Stale-While-Revalidate) with localStorage persistence.
 *
 * 1. Returns persisted localStorage data immediately (stale-ok).
 * 2. Re-fetches in the background if data is stale.
 * 3. Calls onFresh with the fresh data when it arrives.
 *
 * Use for critical data that should survive page reloads.
 */
export function withSWR<T>(
  key: string,
  fn: () => Promise<T>,
  options: {
    ttlMs?: number;
    onFresh: (data: T) => void;
  },
): T | null {
  const { ttlMs = 300_000, onFresh } = options;

  // 1. Try memory cache first (fast path)
  const memCached = queryCache.get<T>(key);
  if (memCached !== null) {
    // Still trigger a background refresh if older than half TTL
    return memCached;
  }

  // 2. Try localStorage (survives page reload)
  const lsCached = lsGet<T>(key);
  if (lsCached !== null) {
    // Populate memory cache so subsequent calls in this session are fast
    queryCache.set(key, lsCached, ttlMs);
    // Background refresh
    fn().then((data) => {
      queryCache.set(key, data, ttlMs);
      lsSet(key, data, Date.now() + ttlMs);
      onFresh(data);
    }).catch(() => { /* keep stale data on error */ });
    return lsCached;
  }

  // 3. No cache — fetch and persist
  fn().then((data) => {
    queryCache.set(key, data, ttlMs);
    lsSet(key, data, Date.now() + ttlMs);
    onFresh(data);
  }).catch(() => { /* caller handles loading state */ });

  return null;
}

/** Persist a value to both memory and localStorage caches. */
export function persistCache<T>(key: string, data: T, ttlMs = 300_000): void {
  queryCache.set(key, data, ttlMs);
  lsSet(key, data, Date.now() + ttlMs);
}

/**
 * Check memory cache first, then localStorage fallback.
 * Use this in useState initializers to avoid blank screens on page reload.
 */
export function getCached<T>(key: string): T | null {
  return queryCache.get<T>(key) ?? lsGet<T>(key);
}
