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
    <div className="pb-8">
      <PageHeader title="Bibliothèque" subtitle={`${books.length} livres`} />

      <div className="mb-4 overflow-x-auto">
        <Tabs tabs={statusTabs} activeTab={tab} onChange={setTab} />
      </div>

      <div className="mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un livre..."
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((book, i) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link href={`/library/${book.id}`}>
                <Card glowColor="gold" className="p-5 h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-500/15">
                      <BookOpen size={20} className="text-gold-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-ivory-200 truncate">
                        {book.title}
                      </h3>
                      <p className="text-xs text-ivory-400">{book.author}</p>
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
                          className={
                            j < (book.rating || 0) ? 'text-gold-400' : 'text-primary-700'
                          }
                          fill={j < (book.rating || 0) ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                  )}
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
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
