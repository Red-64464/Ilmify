'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search, Star, BookOpen, Brain, Layers, FileText,
  BookMarked, TrendingUp, GraduationCap,
} from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/ui/EmptyState';
import AuthGuard from '@/components/layout/AuthGuard';
import { searchAll, popularSearches } from '@/lib/search';
import { useAuth } from '@/contexts/AuthContext';
import { topicRepository } from '@/lib/repositories/topicRepository';
import { courseRepository } from '@/lib/repositories/courseRepository';
import { bookRepository } from '@/lib/repositories/bookRepository';
import type { SearchResult } from '@/types';

const typeConfig: Record<string, { icon: typeof Star; color: string; label: string }> = {
  topic: { icon: FileText, color: 'var(--accent)', label: 'Topic' },
  course: { icon: GraduationCap, color: '#d4ad4a', label: 'Cours' },
  book: { icon: BookOpen, color: '#ec4899', label: 'Livre' },
  theme: { icon: Star, color: 'var(--accent)', label: 'Thème' },
  content: { icon: FileText, color: '#d4ad4a', label: 'Contenu' },
  quiz: { icon: Brain, color: '#7c7cf0', label: 'Quiz' },
  flashcard: { icon: Layers, color: '#28c4b0', label: 'Flashcard' },
  passage: { icon: BookMarked, color: '#f59e0b', label: 'Passage' },
};

const filterTabs = [
  { id: 'all', label: 'Tout' },
  { id: 'topic', label: 'Topics' },
  { id: 'course', label: 'Cours' },
  { id: 'book', label: 'Livres' },
  { id: 'theme', label: 'Thèmes' },
  { id: 'content', label: 'Contenus' },
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

function SearchPageInner() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filter, setFilter] = useState('all');
  const [dynamicResults, setDynamicResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
  }, [searchParams]);

  // Fetch from Supabase when query changes
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setDynamicResults([]);
      return;
    }
    const q = query.trim();
    const promises: Promise<SearchResult[]>[] = [];

    if (user) {
      promises.push(
        topicRepository.search(user.id, q).then(topics =>
          topics.map(t => ({
            id: t.id,
            type: 'topic' as const,
            title: t.title,
            description: t.blocks?.slice(0, 3).map(b => b.content).filter(Boolean).join(' · ').slice(0, 120) || 'Topic personnel',
          }))
        ).catch(() => [])
      );
    }

    promises.push(
      courseRepository.searchPages(q).then(pages =>
        pages.map(p => ({
          id: p.id,
          type: 'course' as const,
          title: p.title,
          description: p.description || p.blocks?.slice(0, 3).map(b => b.content).filter(Boolean).join(' · ').slice(0, 120) || 'Page de cours',
        }))
      ).catch(() => [])
    );

    promises.push(
      bookRepository.search(q, user?.id).then(books =>
        books.map(b => ({
          id: b.id,
          type: 'book' as const,
          title: b.title,
          description: `${b.author}${b.description ? ' — ' + b.description.slice(0, 100) : ''}`,
        }))
      ).catch(() => [])
    );

    Promise.all(promises).then(arrays => {
      setDynamicResults(arrays.flat());
    });
  }, [query, user]);

  // Merge static and dynamic results, deduplicate by id
  const staticResults: SearchResult[] = searchAll(query, filter !== 'all' ? filter : undefined);
  const allResults = [...dynamicResults, ...staticResults].filter((r, i, arr) =>
    arr.findIndex(x => x.id === r.id) === i
  );
  const results = filter !== 'all' ? allResults.filter(r => r.type === filter) : allResults;

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
              topic: `/topics/${result.id}`,
              course: `/courses/${result.id}`,
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

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}
