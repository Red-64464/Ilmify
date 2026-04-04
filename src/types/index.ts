// ============================================================
// Ilmify – TypeScript data models
// ============================================================

export interface Theme {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  icon: string;
  color: string;
  contentCount: number;
  progress?: number;
  tags: string[];
}

export type ContentType = 'verse' | 'hadith' | 'quote' | 'explanation' | 'reminder' | 'note';

export interface ContentBlock {
  id: string;
  type: ContentType;
  title?: string;
  content: string;
  source?: string;
  reference?: string;
  themeId: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export type QuestionType = 'mcq' | 'true_false' | 'short_answer';

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  source?: string;
  themeId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mastery: number;
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
  themeId: string;
  cardCount: number;
  masteredCount: number;
  color: string;
  icon: string;
  tags: string[];
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  mastery: 'new' | 'learning' | 'review' | 'mastered';
  nextReview?: string;
  lastReviewed?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl?: string;
  category: string;
  language: string;
  status: 'to_read' | 'reading' | 'read';
  rating?: number;
  tags: string[];
  addedAt: string;
  isbn?: string;
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
  themeId?: string;
  createdAt: string;
}

export type FavoriteType = 'content' | 'theme' | 'quiz' | 'flashcard' | 'book' | 'passage';

export interface Favorite {
  id: string;
  type: FavoriteType;
  itemId: string;
  title: string;
  description?: string;
  addedAt: string;
}

export interface DailyReminder {
  id: string;
  content: string;
  source?: string;
  type: 'verse' | 'hadith' | 'wisdom';
  date: string;
}

export interface SearchResult {
  id: string;
  type: 'theme' | 'content' | 'quiz' | 'flashcard' | 'book' | 'passage';
  title: string;
  description: string;
  themeId?: string;
}
