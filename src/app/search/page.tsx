'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
import AuthGuard from '@/components/layout/AuthGuard';
import { searchAll, popularSearches } from '@/lib/search';
import type { SearchResult } from '@/types';

const typeConfig: Record<string, { icon: typeof Star; color: string; label: string }> = {
  theme: { icon: Star, color: '#2e9e8c', label: 'Thème' },
  content: { icon: FileText, color: '#d4ad4a', label: 'Contenu' },
  quiz: { icon: Brain, color: '#7c7cf0', label: 'Quiz' },
  flashcard: { icon: Layers, color: '#28c4b0', label: 'Flashcard' },
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

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
  }, [searchParams]);

  const results: SearchResult[] = searchAll(query, filter !== 'all' ? filter : undefined);

  return (
    <AuthGuard>
    <div className="pb-10 py-6">
      <div className="mb-8">
        <h1
          className="text-xl font-bold tracking-tight mb-5"
          style={{ color: 'var(--text-primary)' }}
        >
          Rechercher
        </h1>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Rechercher dans Ilmify..."
        />
      </div>

      {query.trim() && (
        <div className="mb-6 overflow-x-auto scrollbar-none -mx-5 px-5">
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
            <TrendingUp size={16} style={{ color: '#d4ad4a' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Recherches populaires
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="cursor-pointer transition-all duration-200"
              >
                <Badge variant="default" size="md">
                  {term}
                </Badge>
              </button>
            ))}
          </div>
        </motion.div>
      ) : results.length > 0 ? (
        <motion.div
          className="space-y-3"
          variants={stagger}
          initial="hidden"
          animate="visible"
          key={filter}
        >
          {results.map((result) => {
            const cfg = typeConfig[result.type] || typeConfig.content;
            const Icon = cfg.icon;
            const hrefMap: Record<string, string> = {
              theme: `/explore/${result.id}`,
              book: `/library/${result.id}`,
              content: result.themeId ? `/explore/${result.themeId}` : '#',
              quiz: '/quiz',
              flashcard: '/flashcards',
              passage: result.themeId ? `/explore/${result.themeId}` : '/library',
            };
            const href = hrefMap[result.type] || '#';

            return (
              <motion.div key={result.id} variants={fadeUp}>
                <Link href={href}>
                  <Card glowColor="green" className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: `${cfg.color}15` }}
                      >
                        <Icon size={18} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className="text-sm font-semibold truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {result.title}
                          </h3>
                          <Badge variant="default" size="sm">{cfg.label}</Badge>
                        </div>
                        <p
                          className="text-xs line-clamp-2 leading-relaxed"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {result.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState
          icon={Search}
          title="Aucun résultat"
          description={`Aucun résultat pour "${query}". Essayez un autre terme.`}
        />
      )}
    </div>
    </AuthGuard>
  );
}
