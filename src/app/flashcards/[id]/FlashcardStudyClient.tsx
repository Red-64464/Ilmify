'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ChevronLeft, ChevronRight, FileQuestion } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import { flashcardRepository } from '@/lib/repositories/flashcardRepository';

export default function FlashcardStudyClient({ id }: { id: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const deck = flashcardRepository.getDeckById(id);
  const cards = flashcardRepository.getCardsByDeck(id);

  if (!deck || cards.length === 0) {
    return (
      <div className="pb-10">
        <PageHeader title="Deck introuvable" backButton />
        <EmptyState
          icon={FileQuestion}
          title="Deck introuvable"
          description="Ce deck n'existe pas ou ne contient aucune carte."
        />
      </div>
    );
  }

  const current = cards[currentIndex];

  const handlePrev = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i > 0 ? i - 1 : cards.length - 1));
  };

  const handleNext = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i < cards.length - 1 ? i + 1 : 0));
  };

  const masteryColor =
    current.masteryLevel >= 80
      ? '#3aaa60'
      : current.masteryLevel >= 50
        ? '#d4991a'
        : '#ef4444';

  return (
    <div className="pb-10">
      <PageHeader title={deck.title} subtitle={`Carte ${currentIndex + 1}/${cards.length}`} backButton />

      <ProgressBar
        value={currentIndex + 1}
        max={cards.length}
        color={deck.color}
        size="sm"
        className="mb-8"
      />

      {/* Flip Card */}
      <div className="flex justify-center mb-8">
        <motion.div
          className="w-full max-w-md cursor-pointer perspective-[1000px]"
          onClick={() => setFlipped(!flipped)}
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative min-h-[240px]"
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-2xl p-6 flex flex-col justify-center items-center text-center"
              style={{
                backfaceVisibility: 'hidden',
                background: 'var(--bg-card)',
                border: '1px solid rgba(46,158,140,0.3)',
              }}
            >
              <Badge variant="default" size="sm" className="mb-4">
                Question
              </Badge>
              <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {current.front}
              </p>
              <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>Cliquez pour retourner</p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-2xl p-6 flex flex-col justify-center items-center text-center"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'var(--bg-card)',
                border: '1px solid rgba(212,173,74,0.2)',
              }}
            >
              <Badge variant="gold" size="sm" className="mb-4">
                Réponse
              </Badge>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {current.back}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Mastery */}
      <div className="max-w-md mx-auto mb-8">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Maîtrise</span>
          <Badge
            variant={
              current.difficulty === 'easy'
                ? 'green'
                : current.difficulty === 'medium'
                  ? 'gold'
                  : 'red'
            }
            size="sm"
          >
            {current.difficulty === 'easy'
              ? 'Facile'
              : current.difficulty === 'medium'
                ? 'Moyen'
                : 'Difficile'}
          </Badge>
        </div>
        <ProgressBar
          value={current.masteryLevel}
          showLabel
          color={masteryColor}
          size="md"
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
        <Button variant="secondary" onClick={handlePrev} iconLeft={<ChevronLeft size={16} />}>
          Précédente
        </Button>
        <Button
          variant="ghost"
          onClick={() => setFlipped(!flipped)}
          iconLeft={<RotateCcw size={16} />}
        >
          Retourner
        </Button>
        <Button variant="secondary" onClick={handleNext} iconRight={<ChevronRight size={16} />}>
          Suivante
        </Button>
      </div>
    </div>
  );
}
