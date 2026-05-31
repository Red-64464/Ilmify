'use client';

import { queryCache } from './queryCache';
import { topicRepository } from './repositories/topicRepository';
import { bookRepository } from './repositories/bookRepository';
import { courseRepository } from './repositories/courseRepository';
import { activityRepository } from './repositories/activityRepository';
import { flashcardRepository } from './repositories/flashcardRepository';
import { quizRepository } from './repositories/quizRepository';
import { socialPostRepository } from './repositories/socialPostRepository';
import { mediaRepository } from './repositories/mediaRepository';
import { favoriteRepository } from './repositories/favoriteRepository';

let prefetchStarted = false;

/** Called once as soon as user is known. Warms the cache for ALL main pages. */
export async function prefetchUserData(userId: string): Promise<void> {
  if (prefetchStarted) return;
  prefetchStarted = true;

  const set = <T>(key: string, data: T, ttlMs = 120_000) =>
    queryCache.set(key, data, ttlMs);

  await Promise.allSettled([
    // ── Home page ──────────────────────────────────────────
    topicRepository.listByUser(userId, 4).then((d) => set(`topics:${userId}:4`, d)),
    bookRepository.listBooks(userId, { status: 'reading' }).then((d) => set(`books:reading:${userId}`, d)),
    courseRepository.listPages(3).then((d) => set('courses:featured:3', d, 300_000)),
    activityRepository.getStreak(userId).then((d) => set(`streak:${userId}`, d, 300_000)),
    activityRepository.getTodayActivities(userId).then((d) => set(`today:${userId}`, d, 60_000)),

    // ── Topics page ─────────────────────────────────────────
    topicRepository.getByUser(userId).then((d) => set(`topics:${userId}:all`, d)),

    // ── Library page ────────────────────────────────────────
    bookRepository.getAll(userId).then((d) => set(`books:all:${userId}`, d)),

    // ── Flashcards page ─────────────────────────────────────
    flashcardRepository.getAllDecks(userId).then((d) => set(`flashcards:decks:${userId}`, d)),

    // ── Quiz page ───────────────────────────────────────────
    quizRepository.getAllQuestions(userId).then((d) => set(`quiz:questions:${userId}`, d)),

    // ── Courses page ─────────────────────────────────────────
    Promise.all([
      courseRepository.getAllFolders(),
      courseRepository.getAllPages(),
    ]).then(([folders, pages]) => {
      set('courses:folders', folders, 300_000);
      set('courses:pages', pages, 300_000);
    }),

    // ── Social page ──────────────────────────────────────────
    socialPostRepository.list().then((d) => set('social:posts', d)),

    // ── Media page ───────────────────────────────────────────
    Promise.all([
      mediaRepository.getAllFolders(),
      mediaRepository.getAllVideos(),
    ]).then(([folders, videos]) => {
      set('media:folders', folders),
      set('media:videos', videos);
    }),

    // ── Favorites page ───────────────────────────────────────
    favoriteRepository.getAll(userId).then((d) => set(`favorites:${userId}`, d)),
  ]);
}

/** Reset so prefetch fires again after logout/login */
export function resetPrefetch(): void {
  prefetchStarted = false;
  queryCache.clear();
}
