'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Layers, BookOpen } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import AuthGuard from '@/components/layout/AuthGuard';
import { flashcardDecks } from '@/data/flashcards';

export default function FlashcardsPage() {
  const [expandedDeck, setExpandedDeck] = useState<string | null>(null);

  return (
    <AuthGuard>
    <div className="pb-10">
      <PageHeader title="Flashcards" subtitle="Révisez avec les cartes mémoire" />

      {flashcardDecks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {flashcardDecks.map((deck, i) => (
            <motion.div
              key={deck.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card
                glowColor="teal"
                className="p-5"
                onClick={() =>
                  setExpandedDeck(expandedDeck === deck.id ? null : deck.id)
                }
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${deck.color}20` }}
                  >
                    <Layers size={20} style={{ color: deck.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {deck.title}
                    </h3>
                    <p className="text-xs line-clamp-2 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {deck.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="default" size="sm">
                    {deck.cardCount} cartes
                  </Badge>
                  <Badge variant="green" size="sm">
                    {deck.masteredCount} maîtrisées
                  </Badge>
                  {deck.toReviewCount > 0 && (
                    <Badge variant="gold" size="sm">
                      {deck.toReviewCount} à revoir
                    </Badge>
                  )}
                </div>

                <ProgressBar
                  value={deck.masteredCount}
                  max={deck.cardCount}
                  color={deck.color}
                  showLabel
                />

                {expandedDeck === deck.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4"
                    style={{ borderTop: '1px solid rgba(46,158,140,0.2)' }}
                  >
                    <Link
                      href={`/flashcards/${deck.id}`}
                      className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                      style={{ color: '#2e9e8c' }}
                    >
                      <BookOpen size={14} />
                      Étudier ce deck
                    </Link>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="Aucun deck"
          description="Aucun deck de flashcards disponible."
        />
      )}
    </div>
    </AuthGuard>
  );
}
