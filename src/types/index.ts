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
  imageUrl?: string;
  linkUrl?: string;
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
  type: 'theme' | 'content' | 'quiz' | 'flashcard' | 'book' | 'passage' | 'topic' | 'course' | 'quran';
  title: string;
  description: string;
  themeId?: string;
};

// Quran types
export interface QuranSurah {
  number: number;
  name: string;
  nameAr: string;
  ayahCount: number;
  revelationType: 'Meccan' | 'Medinan';
  juzStart?: number;
}

export interface QuranAyah {
  surah: number;
  ayah: number;
  arabic: string;
  transliteration: string;
  translation: string;
  audioUrl: string;
  footnotes?: string;
}

export interface QuranMemorization {
  id: string;
  surahNumber: number;
  status: 'memorized' | 'in-progress' | 'not-started';
  memorizedAyahs: number[];
  lastReviewedAt?: string;
  startedAt?: string;
  completedAt?: string;
  reviewCount: number;
  notes?: string;
}

export interface QuranBookmark {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  note?: string;
  category: 'favorite' | 'dua' | 'revision' | 'important';
  createdAt: string;
}

export interface QuranReadingPosition {
  surahNumber: number;
  ayahNumber: number;
  juzNumber?: number;
  timestamp?: string;
}

export interface Reciter {
  id: number;
  name: string;
  nameAr: string;
  style?: string;
}

export interface QuranSettings {
  reciterId: number;
  arabicFontSize: number; // in rem, default 1.5
  translationLang: 'fr' | 'en';
  showTransliteration: boolean;
}

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
  | 'paragraph' | 'heading1' | 'heading2'
  | 'quote' | 'bullet-list' | 'numbered-list'
  | 'callout' | 'reflection' | 'reminder' | 'source'
  | 'hadith' | 'verse' | 'dua' | 'definition'
  | 'checklist' | 'audio' | 'poem' | 'timeline' | 'warning'
  | 'image' | 'link' | 'youtube'
  | 'pdf' | 'qa' | 'table' | 'divider'
  | 'heading3';

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

// Media Library types

export interface MediaFolder {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  parentId?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimestampNote {
  time: number; // seconds
  text: string;
}

export interface MediaVideo {
  id: string;
  folderId: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  channelName?: string;
  duration?: string;
  notes: TimestampNote[];
  tags: string[];
  watched: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Social Posts types (TikTok / Instagram / Twitter / YouTube imports)

export type SocialPlatform = 'tiktok' | 'instagram' | 'twitter' | 'youtube' | 'other';

export interface SocialPostStats {
  likes?: number;
  views?: number;
  comments?: number;
  shares?: number;
}

export interface SocialPost {
  id: string;
  url: string;
  platform: SocialPlatform;
  externalId?: string;
  title?: string;
  author?: string;
  authorAvatarUrl?: string;
  caption?: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  mediaType: 'video' | 'image' | 'audio';
  durationSec?: number;
  stats: SocialPostStats;
  themeTag?: string;
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
  importedAt: string;
  updatedAt: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface SocialTranscript {
  id: string;
  postId: string;
  sourceLanguage?: string;
  text: string;
  segments: TranscriptSegment[];
  createdAt: string;
}

export interface SocialSubtitle {
  id: string;
  postId: string;
  language: string;
  label?: string;
  vttContent: string;
  isOriginal: boolean;
  createdAt: string;
}

export interface SocialAnnotation {
  id: string;
  postId: string;
  timeSec: number;
  text: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IslamicCitation {
  type: 'verse' | 'hadith' | 'scholar' | 'dua';
  reference?: string;
  text?: string;
  arabic?: string;
}

export interface KeyPoint {
  title: string;
  detail?: string;
}

export interface DubiousFlag {
  reason: string;
  severity: 'info' | 'warning' | 'danger';
  quote?: string;
}

export interface SocialAnalysis {
  id: string;
  postId: string;
  summary?: string;
  keyPoints: KeyPoint[];
  citations: IslamicCitation[];
  topics: Array<{ tag: string; description?: string }>;
  dubiousFlags: DubiousFlag[];
  languageDetected?: string;
  createdAt: string;
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
