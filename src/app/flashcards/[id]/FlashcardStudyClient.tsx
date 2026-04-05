'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { RotateCcw, ChevronLeft, ChevronRight, FileQuestion, RefreshCw, Filter } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { flashcardRepository } from '@/lib/repositories/flashcardRepository';
import { activityRepository } from '@/lib/repositories/activityRepository';
import type { FlashcardDeck, Flashcard } from '@/types';

export default function FlashcardStudyClient({ id: propId }: { id: string }) {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const paramId = (params?.id as string) || propId;
  const [id, setId] = useState(paramId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || id === '_placeholder') {
      const segments = window.location.pathname.split('/').filter(Boolean);
      const urlId = segments[segments.length - 1];
      if (urlId && urlId !== '_placeholder') setId(urlId);
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!id || id === '_placeholder') return;
    Promise.all([
      flashcardRepository.getDeckById(id),
      flashcardRepository.getCardsByDeck(id),
    ]).then(([d, c]) => {
      setDeck(d);
      setAllCards(c);
      setCards(c);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [id, authLoading, user]);

  if (loading) {
    return (
      <div className="pb-10">
        <PageHeader title="Chargement..." backButton />
      </div>
    );
  }

  if (!deck || cards.length === 0) {
    return (
      <div className="pb-10">
        <PageHeader title={deck?.title || 'Deck introuvable'} backButton />
        <EmptyState
          icon={FileQuestion}
          title={reviewMode ? 'Aucune carte à réviser' : 'Deck introuvable'}
          description={reviewMode ? 'Toutes les cartes sont maîtrisées ! Revenez plus tard.' : 'Ce deck n\'existe pas ou ne contient aucune carte.'}
        />
        {reviewMode && (
          <div className="flex justify-center mt-4">
            <Button variant="secondary" onClick={() => { setReviewMode(false); setCards(allCards); setCurrentIndex(0); }}>
              Voir toutes les cartes
            </Button>
          </div>
        )}
      </div>
    );
  }

  const current = cards[currentIndex];

  const toggleReviewMode = () => {
    const newMode = !reviewMode;
    setReviewMode(newMode);
    if (newMode) {
      const now = new Date();
      const due = allCards.filter(c => !c.nextReviewAt || new Date(c.nextReviewAt) <= now || c.masteryLevel < 80);
      setCards(due.length > 0 ? due : []);
    } else {
      setCards(allCards);
    }
    setCurrentIndex(0);
    setFlipped(false);
  };

  const dueCount = allCards.filter(c => !c.nextReviewAt || new Date(c.nextReviewAt) <= new Date() || c.masteryLevel < 80).length;

  const handlePrev = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i > 0 ? i - 1 : cards.length - 1));
  };

  const handleNext = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i < cards.length - 1 ? i + 1 : 0));
  };

  const handleRate = async (rating: 0 | 1 | 2 | 3) => {
    // Optimistic local mastery update
    const deltas = [-30, -10, 15, 25];
    const delta = deltas[rating];
    const oldM = current.masteryLevel;
    const newM = Math.max(0, Math.min(100, oldM + delta));
    setCards((prev) => prev.map((c) => c.id === current.id ? { ...c, masteryLevel: Math.round(newM), reviewCount: c.reviewCount + 1 } : c));
    setAllCards((prev) => prev.map((c) => c.id === current.id ? { ...c, masteryLevel: Math.round(newM), reviewCount: c.reviewCount + 1 } : c));

    // Persist in background
    flashcardRepository.reviewCard(current.id, rating).catch(() => {});
    if (user) activityRepository.log(user.id, 'flashcard').catch(() => {});

    // Advance to next card
    setFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCurrentIndex(0);
    }
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

      {/* Review mode toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={toggleReviewMode}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer"
          style={{
            background: reviewMode ? 'rgba(46,158,140,0.12)' : 'rgba(255,255,255,0.04)',
            color: reviewMode ? 'var(--accent)' : 'var(--text-muted)',
            border: reviewMode ? '1px solid rgba(46,158,140,0.3)' : '1px solid var(--border-subtle)',
          }}
        >
          <Filter size={14} />
          {reviewMode ? 'Mode révision' : 'Révision'}
          {!reviewMode && dueCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#ef4444', color: '#fff' }}>{dueCount}</span>
          )}
        </button>
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {reviewMode ? `${cards.length} carte${cards.length > 1 ? 's' : ''} à réviser` : `${allCards.length} cartes au total`}
        </span>
      </div>

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

      {/* Rating Buttons (shown when flipped) */}
      {flipped && (
        <div className="max-w-md mx-auto mb-6">
          <p className="text-xs text-center mb-3" style={{ color: 'var(--text-muted)' }}>Comment était-ce ?</p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleRate(0)}
              className="flex flex-col items-center gap-1 rounded-xl py-3 px-2 text-xs font-medium transition-colors"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <RefreshCw size={16} />
              À revoir
            </button>
            <button
              onClick={() => handleRate(1)}
              className="flex flex-col items-center gap-1 rounded-xl py-3 px-2 text-xs font-medium transition-colors"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              <span className="text-base">😓</span>
              Difficile
            </button>
            <button
              onClick={() => handleRate(2)}
              className="flex flex-col items-center gap-1 rounded-xl py-3 px-2 text-xs font-medium transition-colors"
              style={{ background: 'rgba(46,158,140,0.12)', color: '#2e9e8c', border: '1px solid rgba(46,158,140,0.3)' }}
            >
              <span className="text-base">👍</span>
              Bien
            </button>
            <button
              onClick={() => handleRate(3)}
              className="flex flex-col items-center gap-1 rounded-xl py-3 px-2 text-xs font-medium transition-colors"
              style={{ background: 'rgba(58,170,96,0.12)', color: '#3aaa60', border: '1px solid rgba(58,170,96,0.3)' }}
            >
              <span className="text-base">🌟</span>
              Facile
            </button>
          </div>
        </div>
      )}

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
