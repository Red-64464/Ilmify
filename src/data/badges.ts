export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  /** returns 0-1 progress */
  check: (stats: BadgeStats) => number;
}

export interface BadgeStats {
  topicCount: number;
  booksRead: number;
  totalBooks: number;
  flashcardCount: number;
  coursePageCount: number;
  favoriteCount: number;
}

export const badges: BadgeDef[] = [
  {
    id: 'first-topic',
    title: 'Première Note',
    description: 'Créer votre premier topic',
    icon: '✏️',
    color: '#3aaa60',
    check: (s) => Math.min(s.topicCount, 1),
  },
  {
    id: 'writer-10',
    title: 'Écrivain',
    description: 'Créer 5 topics',
    icon: '📝',
    color: '#2e9e8c',
    check: (s) => Math.min(s.topicCount / 5, 1),
  },
  {
    id: 'scholar-25',
    title: 'Savant',
    description: 'Créer 15 topics',
    icon: '🎓',
    color: '#d4ad4a',
    check: (s) => Math.min(s.topicCount / 15, 1),
  },
  {
    id: 'first-book',
    title: 'Lecteur',
    description: 'Terminer un livre',
    icon: '📖',
    color: '#ec4899',
    check: (s) => Math.min(s.booksRead, 1),
  },
  {
    id: 'bookworm',
    title: 'Bibliophile',
    description: 'Terminer 3 livres',
    icon: '📚',
    color: '#8b5cf6',
    check: (s) => Math.min(s.booksRead / 3, 1),
  },
  {
    id: 'librarian',
    title: 'Bibliothécaire',
    description: 'Ajouter 5 livres à votre bibliothèque',
    icon: '🏛️',
    color: '#6366f1',
    check: (s) => Math.min(s.totalBooks / 5, 1),
  },
  {
    id: 'flashcard-starter',
    title: 'Apprenti',
    description: 'Créer 10 flashcards',
    icon: '🃏',
    color: '#28c4b0',
    check: (s) => Math.min(s.flashcardCount / 10, 1),
  },
  {
    id: 'flashcard-master',
    title: 'Maître des Cartes',
    description: 'Créer 30 flashcards',
    icon: '🏆',
    color: '#f59e0b',
    check: (s) => Math.min(s.flashcardCount / 30, 1),
  },
  {
    id: 'course-explorer',
    title: 'Explorateur',
    description: 'Suivre 3 pages de cours',
    icon: '🧭',
    color: '#06b6d4',
    check: (s) => Math.min(s.coursePageCount / 3, 1),
  },
  {
    id: 'collector',
    title: 'Collectionneur',
    description: 'Ajouter 5 favoris',
    icon: '⭐',
    color: '#d4ad4a',
    check: (s) => Math.min(s.favoriteCount / 5, 1),
  },
];

export function computeBadges(stats: BadgeStats) {
  return badges.map((b) => ({
    ...b,
    progress: b.check(stats),
    unlocked: b.check(stats) >= 1,
  }));
}

const BADGES_STORAGE_KEY = 'ilmify-unlocked-badges';

/** Detect newly unlocked badges by comparing with localStorage */
export function detectNewBadges(stats: BadgeStats): string[] {
  const computed = computeBadges(stats);
  const unlocked = computed.filter(b => b.unlocked).map(b => b.id);
  const prev: string[] = JSON.parse(localStorage.getItem(BADGES_STORAGE_KEY) || '[]');
  const newBadges = unlocked.filter(id => !prev.includes(id));
  if (newBadges.length > 0) {
    localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(unlocked));
  }
  return newBadges;
}

/** Get badge def by id */
export function getBadgeById(id: string): BadgeDef | undefined {
  return badges.find(b => b.id === id);
}
