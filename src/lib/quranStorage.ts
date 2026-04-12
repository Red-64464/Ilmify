'use client';

import { useState, useEffect, useCallback } from 'react';
import type { QuranMemorization, QuranBookmark, QuranReadingPosition, QuranSettings } from '@/types';

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

// --- Quran Settings ---
export function useQuranSettings() {
  const [settings, setSettings] = useState<QuranSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadFromStorage<QuranSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
  }, []);

  const updateSettings = useCallback((patch: Partial<QuranSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...patch };
      saveToStorage(STORAGE_KEYS.settings, updated);
      return updated;
    });
  }, []);

  return { settings, updateSettings };
}

// --- Memorization ---
export function useQuranMemorization() {
  const [memorizations, setMemorizations] = useState<QuranMemorization[]>([]);

  useEffect(() => {
    setMemorizations(loadFromStorage<QuranMemorization[]>(STORAGE_KEYS.memorizations, []));
  }, []);

  const updateStatus = useCallback(
    (surahNumber: number, status: QuranMemorization['status']) => {
      setMemorizations((prev) => {
        const existing = prev.find((m) => m.surahNumber === surahNumber);
        let updated: QuranMemorization[];
        if (existing) {
          updated = prev.map((m) =>
            m.surahNumber === surahNumber
              ? {
                  ...m,
                  status,
                  lastReviewedAt: new Date().toISOString(),
                  startedAt: m.startedAt ?? (status !== 'not-started' ? new Date().toISOString() : undefined),
                  completedAt: status === 'memorized' ? new Date().toISOString() : m.completedAt,
                }
              : m
          );
        } else {
          const newEntry: QuranMemorization = {
            id: `local-${surahNumber}`,
            surahNumber,
            status,
            memorizedAyahs: [],
            reviewCount: 0,
            startedAt: status !== 'not-started' ? new Date().toISOString() : undefined,
            completedAt: status === 'memorized' ? new Date().toISOString() : undefined,
            lastReviewedAt: new Date().toISOString(),
          };
          updated = [...prev, newEntry];
        }
        saveToStorage(STORAGE_KEYS.memorizations, updated);
        return updated;
      });
    },
    []
  );

  const toggleAyahMemorized = useCallback(
    (surahNumber: number, ayahNumber: number) => {
      setMemorizations((prev) => {
        const existing = prev.find((m) => m.surahNumber === surahNumber);
        let updated: QuranMemorization[];
        if (existing) {
          const ayahs = existing.memorizedAyahs.includes(ayahNumber)
            ? existing.memorizedAyahs.filter((a) => a !== ayahNumber)
            : [...existing.memorizedAyahs, ayahNumber];
          updated = prev.map((m) =>
            m.surahNumber === surahNumber
              ? {
                  ...m,
                  memorizedAyahs: ayahs,
                  lastReviewedAt: new Date().toISOString(),
                  status: ayahs.length > 0 ? (m.status === 'not-started' ? 'in-progress' : m.status) : m.status,
                }
              : m
          );
        } else {
          const newEntry: QuranMemorization = {
            id: `local-${surahNumber}`,
            surahNumber,
            status: 'in-progress',
            memorizedAyahs: [ayahNumber],
            reviewCount: 0,
            startedAt: new Date().toISOString(),
            lastReviewedAt: new Date().toISOString(),
          };
          updated = [...prev, newEntry];
        }
        saveToStorage(STORAGE_KEYS.memorizations, updated);
        return updated;
      });
    },
    []
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

// --- Bookmarks ---
export function useQuranBookmarks() {
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);

  useEffect(() => {
    setBookmarks(loadFromStorage<QuranBookmark[]>(STORAGE_KEYS.bookmarks, []));
  }, []);

  const addBookmark = useCallback(
    (surahNumber: number, ayahNumber: number, category: QuranBookmark['category'] = 'favorite', note?: string) => {
      setBookmarks((prev) => {
        if (prev.some((b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)) return prev;
        const updated = [
          ...prev,
          {
            id: `local-${surahNumber}-${ayahNumber}`,
            surahNumber,
            ayahNumber,
            category,
            note,
            createdAt: new Date().toISOString(),
          } as QuranBookmark,
        ];
        saveToStorage(STORAGE_KEYS.bookmarks, updated);
        return updated;
      });
    },
    []
  );

  const removeBookmark = useCallback((surahNumber: number, ayahNumber: number) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber));
      saveToStorage(STORAGE_KEYS.bookmarks, updated);
      return updated;
    });
  }, []);

  const updateBookmarkNote = useCallback((surahNumber: number, ayahNumber: number, note: string) => {
    setBookmarks((prev) => {
      const updated = prev.map((b) =>
        b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
          ? { ...b, note }
          : b
      );
      saveToStorage(STORAGE_KEYS.bookmarks, updated);
      return updated;
    });
  }, []);

  const updateBookmarkCategory = useCallback((surahNumber: number, ayahNumber: number, category: QuranBookmark['category']) => {
    setBookmarks((prev) => {
      const updated = prev.map((b) =>
        b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
          ? { ...b, category }
          : b
      );
      saveToStorage(STORAGE_KEYS.bookmarks, updated);
      return updated;
    });
  }, []);

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

// --- Reading Position ---
export function useQuranPosition() {
  const [position, setPosition] = useState<QuranReadingPosition>({ surahNumber: 1, ayahNumber: 1 });

  useEffect(() => {
    const saved = loadFromStorage<QuranReadingPosition>(STORAGE_KEYS.position, { surahNumber: 1, ayahNumber: 1 });
    setPosition(saved);
  }, []);

  const savePosition = useCallback((surahNumber: number, ayahNumber: number, juzNumber?: number) => {
    const pos: QuranReadingPosition = { surahNumber, ayahNumber, juzNumber, timestamp: new Date().toISOString() };
    setPosition(pos);
    saveToStorage(STORAGE_KEYS.position, pos);
  }, []);

  return { position, savePosition };
}
