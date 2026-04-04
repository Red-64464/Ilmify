'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon } from 'lucide-react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { SearchInput } from '@/components/ui/SearchInput';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { themes, contentBlocks, quizQuestions, flashcardDecks, books, bookPassages, tags } from '@/data/mockData';
import type { SearchResult } from '@/types';

const typeLabels: Record<string, string> = { theme: 'Thème', content: 'Contenu', quiz: 'Quiz', flashcard: 'Flashcard', book: 'Livre', passage: 'Passage' };
const typeVariants: Record<string, 'gold' | 'teal' | 'sage' | 'default'> = { theme: 'teal', content: 'gold', quiz: 'sage', flashcard: 'default', book: 'gold', passage: 'teal' };
const typeLinks: Record<string, (r: SearchResult) => string> = {
  theme: (r) => `/themes/${r.id}`,
  content: (r) => `/themes/${r.themeId || ''}`,
  quiz: () => '/quiz',
  flashcard: () => '/flashcards',
  book: (r) => `/library/${r.id}`,
  passage: () => '/library',
};

const filterTabs = [
  { id: 'all', label: 'Tous' },
  { id: 'theme', label: 'Thèmes' },
  { id: 'content', label: 'Contenus' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'book', label: 'Livres' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);

  const allItems = useMemo<SearchResult[]>(() => [
    ...themes.map(t => ({ id: t.id, type: 'theme' as const, title: t.title, description: t.description })),
    ...contentBlocks.map(c => ({ id: c.id, type: 'content' as const, title: c.title || c.content.slice(0, 60), description: c.content.slice(0, 100), themeId: c.themeId })),
    ...quizQuestions.map(q => ({ id: q.id, type: 'quiz' as const, title: q.question, description: q.explanation })),
    ...flashcardDecks.map(d => ({ id: d.id, type: 'flashcard' as const, title: d.title, description: d.description })),
    ...books.map(b => ({ id: b.id, type: 'book' as const, title: b.title, description: b.author })),
    ...bookPassages.map(p => ({ id: p.id, type: 'passage' as const, title: p.title, description: p.content.slice(0, 100) })),
  ], []);

  const fuse = useMemo(() => new Fuse(allItems, { keys: ['title', 'description'], threshold: 0.4, includeScore: true }), [allItems]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        const res = fuse.search(query).map(r => r.item);
        setResults(filter === 'all' ? res : res.filter(r => r.type === filter));
      } else {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, filter, fuse]);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-ilm-accent/20 flex items-center justify-center">
            <SearchIcon className="w-5 h-5 text-ilm-teal" />
          </div>
          <h1 className="text-2xl font-bold text-ilm-ivory">Recherche</h1>
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher dans tout Ilmify..." autoFocus className="mb-4" />
        <Tabs tabs={filterTabs} activeTab={filter} onChange={setFilter} />
      </motion.div>

      {query.trim() ? (
        <div className="mt-4 space-y-3">
          {results.length > 0 ? results.map((r, i) => (
            <motion.div key={`${r.type}-${r.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link href={typeLinks[r.type]?.(r) || '/'}>
                <Card hover>
                  <div className="flex items-start gap-3">
                    <Badge variant={typeVariants[r.type]} size="sm">{typeLabels[r.type]}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ilm-ivory truncate">{r.title}</p>
                      <p className="text-xs text-ilm-sage mt-1 line-clamp-2">{r.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          )) : (
            <div className="text-center py-16 text-ilm-sage">
              <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Aucun résultat pour &quot;{query}&quot;</p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-ilm-sage mb-3">Recherches populaires</h3>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 6).map(tag => (
              <button key={tag.id} onClick={() => setQuery(tag.name)} className="px-3 py-1.5 rounded-full bg-ilm-card border border-ilm-accent/15 text-sm text-ilm-cream hover:bg-ilm-accent/20 transition-colors">{tag.name}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
