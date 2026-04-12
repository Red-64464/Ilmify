'use client';

import { useState, useEffect, useCallback } from 'react';
import type { QuranMemorization, QuranBookmark, QuranReadingPosition } from '@/types';

const STORAGE_KEYS = {
  memorizations: 'ilmify_quran_memorizations',
  bookmarks: 'ilmify_quran_bookmarks',
  position: 'ilmify_quran_position',
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

  const getStatus = useCallback(
    (surahNumber: number): QuranMemorization['status'] => {
      return memorizations.find((m) => m.surahNumber === surahNumber)?.status ?? 'not-started';
    },
    [memorizations]
  );

  return { memorizations, updateStatus, getStatus };
}

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

  return { bookmarks, addBookmark, removeBookmark, isBookmarked, toggleBookmark };
}

export function useQuranPosition() {
  const [position, setPosition] = useState<QuranReadingPosition>({ surahNumber: 1, ayahNumber: 1 });

  useEffect(() => {
    const saved = loadFromStorage<QuranReadingPosition>(STORAGE_KEYS.position, { surahNumber: 1, ayahNumber: 1 });
    setPosition(saved);
  }, []);

  const savePosition = useCallback((surahNumber: number, ayahNumber: number, juzNumber?: number) => {
    const pos: QuranReadingPosition = { surahNumber, ayahNumber, juzNumber };
    setPosition(pos);
    saveToStorage(STORAGE_KEYS.position, pos);
  }, []);

  return { position, savePosition };
}
