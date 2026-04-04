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

// Auth & User types

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: string;
  avatarUrl?: string;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  password: string;
  displayName: string;
}

// Topic types

export type BlockType =
  | 'paragraph' | 'heading2' | 'heading3'
  | 'quote' | 'bullet-list' | 'numbered-list'
  | 'callout' | 'reflection' | 'reminder' | 'source'
  | 'hadith' | 'verse' | 'image' | 'link' | 'youtube'
  | 'pdf' | 'qa' | 'table' | 'divider';

export interface TopicBlock {
  id: string;
  type: BlockType;
  content: string;
  metadata?: Record<string, string>;
  order: number;
}

export interface Topic {
  id: string;
  userId: string;
  title: string;
  icon?: string;
  coverImage?: string;
  blocks: TopicBlock[];
  tags: string[];
  category?: string;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// Course types

export interface CourseFolder {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  parentId?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoursePage {
  id: string;
  folderId: string;
  title: string;
  description?: string;
  blocks: TopicBlock[];
  tags: string[];
  icon?: string;
  coverImage?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Activity & Settings types

export interface RecentActivity {
  id: string;
  userId: string;
  type: 'topic' | 'book' | 'passage' | 'course';
  itemId: string;
  title: string;
  action: 'created' | 'updated' | 'viewed';
  timestamp: string;
}

export interface UserSettings {
  userId: string;
  textSize: 'small' | 'medium' | 'large';
  theme: 'dark' | 'light';
  language: 'fr' | 'en' | 'ar';
}
