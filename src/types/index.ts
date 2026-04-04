export interface Theme {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  icon: string;
  color: string;
  contentCount: number;
  progress?: number;
  image?: string;
  parentId?: string;
  order: number;
  tags?: string[];
}

export interface ContentItem {
  id: string;
  themeId: string;
  type: 'verse' | 'hadith' | 'explanation' | 'reminder' | 'quote' | 'note' | 'proof' | 'link';
  title: string;
  content: string;
  arabicText?: string;
  source?: string;
  reference?: string;
  tags: string[];
  isFavorite: boolean;
  order: number;
  contentAr?: string;
  createdAt?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface QuizQuestion {
  id: string;
  themeId: string;
  type: 'mcq' | 'true-false' | 'short-answer' | 'association';
  question: string;
  options?: string[];
  correctAnswer: string | number; // number used for association-type answers
  explanation: string;
  source?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  masteryLevel: number; // 0-100
  lastReviewedAt?: string;
  errorCount: number;
  tags?: string[];
  proof?: string;
}

export interface QuizSession {
  id: string;
  themeId?: string;
  questions: string[];
  answers: Record<string, string>;
  score: number;
  total: number;
  completedAt: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  description: string;
  themeId?: string;
  cardCount: number;
  masteredCount: number;
  color: string;
  icon?: string;
  lastStudiedAt?: string;
  toReviewCount: number;
  createdAt: string;
  tags: string[];
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  masteryLevel: number; // 0-100
  nextReviewAt?: string;
  reviewCount: number;
  themeId?: string;
  lastReviewedAt?: string;
  createdAt?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  description: string;
  category: string;
  language: string;
  isbn?: string;
  status: 'to-read' | 'reading' | 'read';
  progress?: number;
  rating?: number;
  tags: string[];
  addedAt: string;
  personalNotes?: string;
  passageCount?: number;
  startedAt?: string;
  finishedAt?: string;
}

export interface BookPassage {
  id: string;
  bookId: string;
  title: string;
  content: string;
  personalReflection?: string;
  pageNumber?: number;
  tags: string[];
  isFavorite: boolean;
  addedAt: string;
  themeId?: string;
  isImportant?: boolean;
}

export interface Favorite {
  id: string;
  itemType: 'content' | 'theme' | 'quiz' | 'flashcard' | 'book' | 'passage';
  itemId: string;
  addedAt: string;
  title?: string;
  preview?: string;
}

export interface DailyReminder {
  id: string;
  type: 'verse' | 'hadith' | 'quote' | 'reminder';
  content: string;
  contentAr?: string;
  source?: string;
  date: string;
}

export type SearchResult = {
  id: string;
  type: 'theme' | 'content' | 'quiz' | 'flashcard' | 'book' | 'passage';
  title: string;
  description: string;
  themeId?: string;
};
