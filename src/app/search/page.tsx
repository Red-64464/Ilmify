'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search, Star, BookOpen, Brain, Layers, FileText,
  BookMarked, TrendingUp,
} from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/ui/EmptyState';
import { searchAll, popularSearches } from '@/lib/search';
import type { SearchResult } from '@/types';

const typeConfig: Record<string, { icon: typeof Star; color: string; label: string }> = {
  theme: { icon: Star, color: '#3aaa60', label: 'Thème' },
  content: { icon: FileText, color: '#d4991a', label: 'Contenu' },
  quiz: { icon: Brain, color: '#6366f1', label: 'Quiz' },
  flashcard: { icon: Layers, color: '#24ad9d', label: 'Flashcard' },
  book: { icon: BookOpen, color: '#ec4899', label: 'Livre' },
  passage: { icon: BookMarked, color: '#f59e0b', label: 'Passage' },
};

const filterTabs = [
  { id: 'all', label: 'Tout' },
  { id: 'theme', label: 'Thèmes' },
  { id: 'content', label: 'Contenus' },
  { id: 'book', label: 'Livres' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'flashcard', label: 'Flashcards' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const results: SearchResult[] = searchAll(query, filter !== 'all' ? filter : undefined);

  return (
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ivory-200 mb-4">Rechercher</h1>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Rechercher dans Ilmify..."
        />
      </div>

      {query.trim() && (
        <div className="mb-4 overflow-x-auto">
          <Tabs tabs={filterTabs} activeTab={filter} onChange={setFilter} />
        </div>
      )}

      {!query.trim() ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-gold-400" />
            <h2 className="text-sm font-semibold text-ivory-300">Recherches populaires</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="cursor-pointer"
              >
                <Badge variant="default" size="md" className="hover:bg-white/15 transition-colors">
                  {term}
                </Badge>
              </button>
            ))}
          </div>
        </motion.div>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          {results.map((result, i) => {
            const cfg = typeConfig[result.type] || typeConfig.content;
            const Icon = cfg.icon;
            const href =
              result.type === 'theme'
                ? `/explore/${result.id}`
                : result.type === 'book'
                  ? `/library/${result.id}`
                  : result.type === 'content' && result.themeId
                    ? `/explore/${result.themeId}`
                    : result.type === 'quiz'
                      ? '/quiz'
                      : result.type === 'flashcard'
                        ? '/flashcards'
                        : '#';

            return (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
              >
                <Link href={href}>
                  <Card glowColor="green" className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${cfg.color}20` }}
                      >
                        <Icon size={16} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-ivory-200 truncate">
                            {result.title}
                          </h3>
                          <Badge variant="default" size="sm">{cfg.label}</Badge>
                        </div>
                        <p className="text-xs text-ivory-400 line-clamp-2">
                          {result.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="Aucun résultat"
          description={`Aucun résultat pour "${query}". Essayez un autre terme.`}
        />
      )}
    </div>
  );
}
