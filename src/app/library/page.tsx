'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Star } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import { ProgressBar } from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import { books } from '@/data/books';

const statusTabs = [
  { id: 'all', label: 'Tous' },
  { id: 'reading', label: 'En cours' },
  { id: 'to-read', label: 'À lire' },
  { id: 'read', label: 'Terminés' },
];

const categoryColors: Record<string, 'gold' | 'green' | 'teal' | 'blue' | 'default'> = {
  Aqida: 'gold',
  Hadith: 'teal',
  Sira: 'green',
  Adhkar: 'green',
  Tafsir: 'gold',
  Fiqh: 'blue',
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function LibraryPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchesTab = tab === 'all' || b.status === tab;
      const matchesSearch =
        !search ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [search, tab]);

  return (
    <div className="pb-10">
      <PageHeader title="Bibliothèque" subtitle={`${books.length} livres`} />

      <div className="mb-5 overflow-x-auto scrollbar-none -mx-5 px-5">
        <Tabs tabs={statusTabs} activeTab={tab} onChange={setTab} />
      </div>

      <div className="mb-8">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un livre..."
        />
      </div>

      {filtered.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          variants={stagger}
          initial="hidden"
          animate="visible"
          key={tab}
        >
          {filtered.map((book) => (
            <motion.div key={book.id} variants={fadeUp}>
              <Link href={`/library/${book.id}`}>
                <Card glowColor="gold" className="p-5 h-full">
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(196,154,61,0.12), rgba(196,154,61,0.05))',
                      }}
                    >
                      <BookOpen size={20} style={{ color: '#d4ad4a' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-sm font-semibold tracking-tight truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {book.title}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {book.author}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={categoryColors[book.category] || 'default'} size="sm">
                      {book.category}
                    </Badge>
                    <Badge
                      variant={
                        book.status === 'read'
                          ? 'green'
                          : book.status === 'reading'
                            ? 'gold'
                            : 'default'
                      }
                      size="sm"
                    >
                      {book.status === 'read'
                        ? 'Terminé'
                        : book.status === 'reading'
                          ? 'En cours'
                          : 'À lire'}
                    </Badge>
                  </div>

                  {book.status === 'reading' && book.progress !== undefined && (
                    <ProgressBar value={book.progress} showLabel className="mb-3" />
                  )}

                  {book.rating !== undefined && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, j) => (
                        <Star
                          key={j}
                          size={14}
                          style={{
                            color: j < (book.rating || 0) ? '#d4ad4a' : 'rgba(255,255,255,0.08)',
                          }}
                          fill={j < (book.rating || 0) ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                  )}
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="Aucun livre trouvé"
          description="Essayez de modifier vos filtres ou votre recherche."
        />
      )}
    </div>
  );
}
