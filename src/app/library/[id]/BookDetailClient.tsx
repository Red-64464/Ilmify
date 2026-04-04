'use client';

import { motion } from 'framer-motion';
import { BookOpen, Star, FileQuestion, BookMarked } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import { books, bookPassages } from '@/data/books';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function BookDetailClient({ id }: { id: string }) {

  const book = books.find((b) => b.id === id);
  const passages = bookPassages.filter((p) => p.bookId === id);

  if (!book) {
    return (
      <div className="pb-10">
        <PageHeader title="Livre introuvable" backButton />
        <EmptyState
          icon={FileQuestion}
          title="Livre introuvable"
          description="Ce livre n'existe pas ou a été supprimé."
        />
      </div>
    );
  }

  return (
    <div className="pb-10">
      <PageHeader title={book.title} backButton />

      {/* Book Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-7 mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(196,154,61,0.06), var(--bg-card) 50%, rgba(26,122,107,0.03))',
            boxShadow: 'var(--shadow-elevated), var(--shadow-glow-gold)',
            border: '1px solid rgba(196,154,61,0.08)',
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute -top-20 -right-20 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(196,154,61,0.07), transparent 70%)' }}
          />

          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-5">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(196,154,61,0.15), rgba(196,154,61,0.06))',
                  boxShadow: '0 2px 12px rgba(196,154,61,0.1)',
                }}
              >
                <BookOpen size={28} style={{ color: '#d4ad4a' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                  {book.title}
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{book.author}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant="gold" size="sm">{book.category}</Badge>
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
              </div>
            </div>

            <p className="text-sm leading-[1.8] mb-5" style={{ color: 'var(--text-secondary)' }}>
              {book.description}
            </p>

            {book.status === 'reading' && book.progress !== undefined && (
              <div className="mb-5">
                <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                  Progression
                </p>
                <ProgressBar value={book.progress} showLabel size="md" />
              </div>
            )}

            {book.rating !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs mr-1 font-medium" style={{ color: 'var(--text-muted)' }}>Note</span>
                {Array.from({ length: 5 }, (_, j) => (
                  <Star
                    key={j}
                    size={16}
                    style={{
                      color: j < (book.rating || 0) ? '#d4ad4a' : 'rgba(255,255,255,0.08)',
                    }}
                    fill={j < (book.rating || 0) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
            )}

            {book.personalNotes && (
              <div
                className="mt-5 p-4 rounded-xl"
                style={{
                  background: 'rgba(26,122,107,0.06)',
                  border: '1px solid rgba(26,122,107,0.08)',
                }}
              >
                <p className="text-xs mb-1.5 font-medium" style={{ color: '#2e9e8c' }}>Notes personnelles</p>
                <p className="text-sm leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>
                  {book.personalNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Passages Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-1 h-6 rounded-full"
          style={{ background: 'linear-gradient(180deg, #d4ad4a, #a88031)' }}
        />
        <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Passages
        </h3>
        <span className="text-xs font-medium ml-1" style={{ color: 'var(--text-muted)' }}>
          ({passages.length})
        </span>
      </div>

      {passages.length > 0 ? (
        <motion.div
          className="space-y-4"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {passages.map((passage) => (
            <motion.div key={passage.id} variants={fadeUp}>
              <div
                className="rounded-2xl p-5 transition-all duration-200"
                style={{
                  background: passage.isImportant
                    ? 'linear-gradient(135deg, rgba(196,154,61,0.05), var(--bg-card))'
                    : 'var(--bg-card)',
                  boxShadow: 'var(--shadow-card)',
                  border: passage.isImportant
                    ? '1px solid rgba(196,154,61,0.1)'
                    : '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {passage.title}
                  </h4>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {passage.isImportant && (
                      <Badge variant="gold" size="sm">Important</Badge>
                    )}
                    {passage.pageNumber && (
                      <Badge variant="default" size="sm">p.{passage.pageNumber}</Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>
                  {passage.content}
                </p>

                {passage.personalReflection && (
                  <div
                    className="mt-4 p-4 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(196,154,61,0.04), rgba(26,122,107,0.03))',
                      border: '1px solid rgba(196,154,61,0.06)',
                    }}
                  >
                    <p className="text-xs mb-1.5 font-medium" style={{ color: '#d4ad4a' }}>
                      Réflexion
                    </p>
                    <p className="text-sm italic leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>
                      {passage.personalReflection}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={BookMarked}
          title="Aucun passage"
          description="Aucun passage enregistré pour ce livre."
        />
      )}
    </div>
  );
}
