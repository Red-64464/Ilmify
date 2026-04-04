'use client';

import { motion } from 'framer-motion';
import { BookOpen, Star, FileQuestion, BookMarked } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import { books, bookPassages } from '@/data/books';

export default function BookDetailClient({ id }: { id: string }) {

  const book = books.find((b) => b.id === id);
  const passages = bookPassages.filter((p) => p.bookId === id);

  if (!book) {
    return (
      <div className="pb-8">
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
    <div className="pb-8">
      <PageHeader title={book.title} backButton />

      {/* Book Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card glowColor="gold" className="p-5 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gold-500/15">
              <BookOpen size={26} className="text-gold-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-ivory-200">{book.title}</h2>
              <p className="text-sm text-ivory-400">{book.author}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
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

          <p className="text-sm text-ivory-400 mb-4">{book.description}</p>

          {book.status === 'reading' && book.progress !== undefined && (
            <div className="mb-4">
              <p className="text-xs text-ivory-400 mb-1">Progression</p>
              <ProgressBar value={book.progress} showLabel size="md" />
            </div>
          )}

          {book.rating !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-ivory-400 mr-1">Note :</span>
              {Array.from({ length: 5 }, (_, j) => (
                <Star
                  key={j}
                  size={16}
                  className={j < (book.rating || 0) ? 'text-gold-400' : 'text-primary-700'}
                  fill={j < (book.rating || 0) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
          )}

          {book.personalNotes && (
            <div className="mt-4 p-3 rounded-xl bg-primary-900/50 border border-primary-700/50">
              <p className="text-xs text-ivory-400 mb-1 font-medium">Notes personnelles</p>
              <p className="text-sm text-ivory-300">{book.personalNotes}</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Passages */}
      <h3 className="text-lg font-semibold text-ivory-200 mb-4 flex items-center gap-2">
        <BookMarked size={18} className="text-gold-400" />
        Passages ({passages.length})
      </h3>

      {passages.length > 0 ? (
        <div className="space-y-3">
          {passages.map((passage, i) => (
            <motion.div
              key={passage.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-ivory-200">{passage.title}</h4>
                  <div className="flex items-center gap-2 shrink-0">
                    {passage.isImportant && (
                      <Badge variant="gold" size="sm">Important</Badge>
                    )}
                    {passage.pageNumber && (
                      <Badge variant="default" size="sm">p.{passage.pageNumber}</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-ivory-400 leading-relaxed">{passage.content}</p>
                {passage.personalReflection && (
                  <div className="mt-3 p-2.5 rounded-lg bg-primary-900/50 border border-primary-700/50">
                    <p className="text-xs text-gold-400 mb-1 font-medium">Réflexion</p>
                    <p className="text-sm text-ivory-300">{passage.personalReflection}</p>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
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
