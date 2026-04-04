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
}

export interface ContentItem {
  id: string;
  themeId: string;
  type: 'verse' | 'hadith' | 'explanation' | 'reminder' | 'quote' | 'note' | 'proof';
  title: string;
  content: string;
  arabicText?: string;
  source?: string;
  reference?: string;
  tags: string[];
  isFavorite: boolean;
  order: number;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface QuizQuestion {
  id: string;
  themeId: string;
  type: 'mcq' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  source?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mastery: number; // 0-100
  lastReviewed?: string;
  errorCount: number;
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
  icon: string;
  lastStudied?: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  mastery: 'new' | 'learning' | 'reviewing' | 'mastered';
  nextReview?: string;
  reviewCount: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string;
  description: string;
  category: string;
  language: string;
  isbn?: string;
  status: 'to-read' | 'reading' | 'read';
  progress?: number;
  rating?: number;
  tags: string[];
  addedAt: string;
  notes?: string;
}

export interface BookPassage {
  id: string;
  bookId: string;
  title: string;
  content: string;
  reflection?: string;
  page?: number;
  tags: string[];
  isFavorite: boolean;
  addedAt: string;
  themeId?: string;
}

export interface Favorite {
  id: string;
  type: 'content' | 'theme' | 'quiz' | 'flashcard' | 'book' | 'passage';
  itemId: string;
  addedAt: string;
}

export interface DailyReminder {
  id: string;
  type: 'verse' | 'hadith' | 'quote' | 'reminder';
  content: string;
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
