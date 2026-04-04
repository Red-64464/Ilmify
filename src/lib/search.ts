import Fuse from 'fuse.js';
import { themes } from '@/data/themes';
import { contentItems } from '@/data/content';
import { quizQuestions } from '@/data/quiz';
import { flashcardDecks, flashcards } from '@/data/flashcards';
import { books, bookPassages } from '@/data/books';
import { SearchResult } from '@/types';

function truncate(text: string, maxLength = 120): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  themes.forEach(t => results.push({
    id: t.id, type: 'theme', title: t.title,
    description: t.description,
  }));

  contentItems.forEach(c => results.push({
    id: c.id, type: 'content', title: c.title,
    description: truncate(c.content),
    themeId: c.themeId,
  }));

  quizQuestions.forEach(q => results.push({
    id: q.id, type: 'quiz', title: q.question,
    description: truncate(q.explanation),
    themeId: q.themeId,
  }));

  flashcardDecks.forEach(d => results.push({
    id: d.id, type: 'flashcard', title: d.title,
    description: d.description,
  }));

  books.forEach(b => results.push({
    id: b.id, type: 'book', title: b.title,
    description: truncate(b.description),
  }));

  bookPassages.forEach(p => results.push({
    id: p.id, type: 'passage', title: p.title,
    description: truncate(p.content),
  }));

  return results;
}

const searchIndex = buildSearchIndex();

const fuse = new Fuse(searchIndex, {
  keys: ['title', 'description'],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2,
});

export function searchAll(query: string, typeFilter?: string): SearchResult[] {
  if (!query.trim()) return [];
  const results = fuse.search(query);
  let items = results.map(r => r.item);
  if (typeFilter && typeFilter !== 'all') {
    items = items.filter(i => i.type === typeFilter);
  }
  return items;
}

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('ilmify-recent-searches');
  return stored ? JSON.parse(stored) : [];
}

export function addRecentSearch(query: string): void {
  if (typeof window === 'undefined') return;
  const recent = getRecentSearches();
  const updated = [query, ...recent.filter(s => s !== query)].slice(0, 8);
  localStorage.setItem('ilmify-recent-searches', JSON.stringify(updated));
}

export const popularSearches = ['Tawhid', 'Prière', 'Patience', 'Foi', 'Coran', 'Comportement'];
