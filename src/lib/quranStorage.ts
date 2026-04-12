'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { QuranMemorization, QuranBookmark, QuranReadingPosition, QuranSettings } from '@/types';
import { quranRepository } from '@/lib/repositories/quranRepository';
import { useAuth } from '@/contexts/AuthContext';

// ─────────────────────────────────────────────
// Local-storage helpers (used as fast cache)
// ─────────────────────────────────────────────

const STORAGE_KEYS = {
  memorizations: 'ilmify_quran_memorizations',
  bookmarks: 'ilmify_quran_bookmarks',
  position: 'ilmify_quran_position',
  settings: 'ilmify_quran_settings',
};

const DEFAULT_SETTINGS: QuranSettings = {
  reciterId: 7,
  arabicFontSize: 1.5,
  translationLang: 'fr',
  showTransliteration: true,
};

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────
// Quran Settings — synced with Supabase
// ─────────────────────────────────────────────

export function useQuranSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<QuranSettings>(
    () => loadFromStorage<QuranSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  );
  const hasFetchedRef = useRef(false);

  // Load from Supabase once when user is available
  useEffect(() => {
    if (!user || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    quranRepository.getSettings(user.id).then((remote) => {
      if (remote) {
        setSettings(remote);
        saveToStorage(STORAGE_KEYS.settings, remote);
      }
    }).catch((e) => console.warn('[Ilmify] Supabase sync failed:', e));
  }, [user]);

  const updateSettings = useCallback((patch: Partial<QuranSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...patch };
      saveToStorage(STORAGE_KEYS.settings, updated);
      // Fire-and-forget sync to Supabase
      if (user) {
        quranRepository.saveSettings(user.id, updated).catch((e) => console.warn('[Ilmify] Supabase sync failed:', e));
      }
      return updated;
    });
  }, [user]);

  return { settings, updateSettings };
}

// ─────────────────────────────────────────────
// Memorization — synced with Supabase
// ─────────────────────────────────────────────

export function useQuranMemorization() {
  const { user } = useAuth();
  const [memorizations, setMemorizations] = useState<QuranMemorization[]>(
    () => loadFromStorage<QuranMemorization[]>(STORAGE_KEYS.memorizations, [])
  );
  const hasFetchedRef = useRef(false);

  // Load from Supabase once
  useEffect(() => {
    if (!user || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    quranRepository.getMemorizations(user.id).then((remote) => {
      if (remote.length > 0) {
        setMemorizations(remote);
        saveToStorage(STORAGE_KEYS.memorizations, remote);
      }
    }).catch((e) => console.warn('[Ilmify] Supabase sync failed:', e));
  }, [user]);

  const updateStatus = useCallback(
    (surahNumber: number, status: QuranMemorization['status']) => {
      setMemorizations((prev) => {
        const existing = prev.find((m) => m.surahNumber === surahNumber);
        let updated: QuranMemorization[];
        let entry: QuranMemorization;

        if (existing) {
          entry = {
            ...existing,
            status,
            lastReviewedAt: new Date().toISOString(),
            startedAt: existing.startedAt ?? (status !== 'not-started' ? new Date().toISOString() : undefined),
            completedAt: status === 'memorized' ? new Date().toISOString() : existing.completedAt,
          };
          updated = prev.map((m) => (m.surahNumber === surahNumber ? entry : m));
        } else {
          entry = {
            id: `local-${surahNumber}`,
            surahNumber,
            status,
            memorizedAyahs: [],
            reviewCount: 0,
            startedAt: status !== 'not-started' ? new Date().toISOString() : undefined,
            completedAt: status === 'memorized' ? new Date().toISOString() : undefined,
            lastReviewedAt: new Date().toISOString(),
          };
          updated = [...prev, entry];
        }
        saveToStorage(STORAGE_KEYS.memorizations, updated);
        // Sync to Supabase
        if (user) {
          quranRepository.upsertMemorization(user.id, entry).catch((e) => console.warn('[Ilmify] Supabase sync failed:', e));
        }
        return updated;
      });
    },
    [user]
  );

  const toggleAyahMemorized = useCallback(
    (surahNumber: number, ayahNumber: number) => {
      setMemorizations((prev) => {
        const existing = prev.find((m) => m.surahNumber === surahNumber);
        let updated: QuranMemorization[];
        let entry: QuranMemorization;

        if (existing) {
          const ayahs = existing.memorizedAyahs.includes(ayahNumber)
            ? existing.memorizedAyahs.filter((a) => a !== ayahNumber)
            : [...existing.memorizedAyahs, ayahNumber];
          entry = {
            ...existing,
            memorizedAyahs: ayahs,
            lastReviewedAt: new Date().toISOString(),
            status: ayahs.length > 0 ? (existing.status === 'not-started' ? 'in-progress' : existing.status) : existing.status,
          };
          updated = prev.map((m) => (m.surahNumber === surahNumber ? entry : m));
        } else {
          entry = {
            id: `local-${surahNumber}`,
            surahNumber,
            status: 'in-progress',
            memorizedAyahs: [ayahNumber],
            reviewCount: 0,
            startedAt: new Date().toISOString(),
            lastReviewedAt: new Date().toISOString(),
          };
          updated = [...prev, entry];
        }
        saveToStorage(STORAGE_KEYS.memorizations, updated);
        if (user) {
          quranRepository.upsertMemorization(user.id, entry).catch((e) => console.warn('[Ilmify] Supabase sync failed:', e));
        }
        return updated;
      });
    },
    [user]
  );

  const isAyahMemorized = useCallback(
    (surahNumber: number, ayahNumber: number): boolean => {
      const mem = memorizations.find((m) => m.surahNumber === surahNumber);
      if (!mem) return false;
      return mem.status === 'memorized' || mem.memorizedAyahs.includes(ayahNumber);
    },
    [memorizations]
  );

  const getStatus = useCallback(
    (surahNumber: number): QuranMemorization['status'] => {
      return memorizations.find((m) => m.surahNumber === surahNumber)?.status ?? 'not-started';
    },
    [memorizations]
  );

  return { memorizations, updateStatus, getStatus, toggleAyahMemorized, isAyahMemorized };
}

// ─────────────────────────────────────────────
// Bookmarks — synced with Supabase
// ─────────────────────────────────────────────

export function useQuranBookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>(
    () => loadFromStorage<QuranBookmark[]>(STORAGE_KEYS.bookmarks, [])
  );
  const hasFetchedRef = useRef(false);

  // Load from Supabase once
  useEffect(() => {
    if (!user || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    quranRepository.getBookmarks(user.id).then((remote) => {
      if (remote.length > 0) {
        setBookmarks(remote);
        saveToStorage(STORAGE_KEYS.bookmarks, remote);
      }
    }).catch((e) => console.warn('[Ilmify] Supabase sync failed:', e));
  }, [user]);

  const addBookmark = useCallback(
    (surahNumber: number, ayahNumber: number, category: QuranBookmark['category'] = 'favorite', note?: string) => {
      setBookmarks((prev) => {
        if (prev.some((b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)) return prev;
        const newBm: QuranBookmark = {
          id: `local-${surahNumber}-${ayahNumber}`,
          surahNumber,
          ayahNumber,
          category,
          note,
          createdAt: new Date().toISOString(),
        };
        const updated = [...prev, newBm];
        saveToStorage(STORAGE_KEYS.bookmarks, updated);
        // Sync — also replace local id with DB id when it resolves
        if (user) {
          quranRepository.addBookmark(user.id, surahNumber, ayahNumber, category, note)
            .then((serverBm) => {
              setBookmarks((cur) =>
                cur.map((b) =>
                  b.surahNumber === surahNumber && b.ayahNumber === ayahNumber ? serverBm : b
                )
              );
            })
            .catch((e) => console.warn('[Ilmify] Supabase sync failed:', e));
        }
        return updated;
      });
    },
    [user]
  );

  const removeBookmark = useCallback(
    (surahNumber: number, ayahNumber: number) => {
      setBookmarks((prev) => {
        const updated = prev.filter((b) => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber));
        saveToStorage(STORAGE_KEYS.bookmarks, updated);
        if (user) {
          quranRepository.removeBookmark(user.id, surahNumber, ayahNumber).catch((e) => console.warn('[Ilmify] Supabase sync failed:', e));
        }
        return updated;
      });
    },
    [user]
  );

  const updateBookmarkNote = useCallback(
    (surahNumber: number, ayahNumber: number, note: string) => {
      setBookmarks((prev) => {
        const updated = prev.map((b) =>
          b.surahNumber === surahNumber && b.ayahNumber === ayahNumber ? { ...b, note } : b
        );
        saveToStorage(STORAGE_KEYS.bookmarks, updated);
        if (user) {
          quranRepository.updateBookmarkNote(user.id, surahNumber, ayahNumber, note).catch((e) => console.warn('[Ilmify] Supabase sync failed:', e));
        }
        return updated;
      });
    },
    [user]
  );

  const updateBookmarkCategory = useCallback(
    (surahNumber: number, ayahNumber: number, category: QuranBookmark['category']) => {
      setBookmarks((prev) => {
        const updated = prev.map((b) =>
          b.surahNumber === surahNumber && b.ayahNumber === ayahNumber ? { ...b, category } : b
        );
        saveToStorage(STORAGE_KEYS.bookmarks, updated);
        if (user) {
          quranRepository.updateBookmarkCategory(user.id, surahNumber, ayahNumber, category).catch((e) => console.warn('[Ilmify] Supabase sync failed:', e));
        }
        return updated;
      });
    },
    [user]
  );

  const isBookmarked = useCallback(
    (surahNumber: number, ayahNumber: number) =>
      bookmarks.some((b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    (surahNumber: number, ayahNumber: number) => {
      if (isBookmarked(surahNumber, ayahNumber)) {
        removeBookmark(surahNumber, ayahNumber);
      } else {
        addBookmark(surahNumber, ayahNumber);
      }
    },
    [isBookmarked, addBookmark, removeBookmark]
  );

  return { bookmarks, addBookmark, removeBookmark, isBookmarked, toggleBookmark, updateBookmarkNote, updateBookmarkCategory };
}

// ─────────────────────────────────────────────
// Reading Position — synced with Supabase
// ─────────────────────────────────────────────

export function useQuranPosition() {
  const { user } = useAuth();
  const [position, setPosition] = useState<QuranReadingPosition>(
    () => loadFromStorage<QuranReadingPosition>(STORAGE_KEYS.position, { surahNumber: 1, ayahNumber: 1 })
  );
  const hasFetchedRef = useRef(false);

  // Load from Supabase once
  useEffect(() => {
    if (!user || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    quranRepository.getPosition(user.id).then((remote) => {
      if (remote) {
        setPosition(remote);
        saveToStorage(STORAGE_KEYS.position, remote);
      }
    }).catch((e) => console.warn('[Ilmify] Supabase sync failed:', e));
  }, [user]);

  const savePosition = useCallback(
    (surahNumber: number, ayahNumber: number, juzNumber?: number) => {
      const pos: QuranReadingPosition = {
        surahNumber,
        ayahNumber,
        juzNumber,
        timestamp: new Date().toISOString(),
      };
      setPosition(pos);
      saveToStorage(STORAGE_KEYS.position, pos);
      // Sync to Supabase
      if (user) {
        quranRepository.savePosition(user.id, pos).catch((e) => console.warn('[Ilmify] Supabase sync failed:', e));
      }
    },
    [user]
  );

  return { position, savePosition };
}
