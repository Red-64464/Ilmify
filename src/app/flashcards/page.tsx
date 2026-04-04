'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ArrowLeft, Check, RotateCcw, Trophy } from 'lucide-react';
import { BookOpen, Star, Heart, Sparkles } from 'lucide-react';
import { flashcardDecks, flashcards } from '@/data/mockData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import type { Flashcard } from '@/types';

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = { BookOpen, Star, Heart, Sparkles };

function FlashcardPlayer({ cards, deckTitle, onExit }: { cards: Flashcard[]; deckTitle: string; onExit: () => void }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Record<string, 'known' | 'review'>>({});
  const [done, setDone] = useState(false);

  const card = cards[idx];
  const known = Object.values(results).filter(v => v === 'known').length;
  const review = Object.values(results).filter(v => v === 'review').length;

  const handleAnswer = (result: 'known' | 'review') => {
    setResults(prev => ({ ...prev, [card.id]: result }));
    if (idx + 1 >= cards.length) { setDone(true); return; }
    setIdx(idx + 1);
    setFlipped(false);
  };

  if (done) {
    const pct = Math.round((known / cards.length) * 100);
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
        <Card glow className="text-center py-8">
          <Trophy className="w-16 h-16 text-ilm-gold mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-ilm-ivory mb-4">{deckTitle}</h2>
          <div className="flex justify-center gap-8 mb-6">
            <div><p className="text-3xl font-bold text-ilm-success">{known}</p><p className="text-xs text-ilm-sage">Maîtrisées</p></div>
            <div><p className="text-3xl font-bold text-ilm-error">{review}</p><p className="text-xs text-ilm-sage">À revoir</p></div>
          </div>
          <p className="text-ilm-sage mb-6">{pct}% de maîtrise</p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={onExit}>Retour</Button>
            <Button variant="gold" onClick={() => { setIdx(0); setFlipped(false); setResults({}); setDone(false); }}>Recommencer</Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onExit} className="text-ilm-sage hover:text-ilm-ivory"><ArrowLeft className="w-5 h-5" /></button>
        <span className="text-sm text-ilm-sage">Carte {idx + 1} sur {cards.length}</span>
        <Badge variant="gold" size="sm">{deckTitle}</Badge>
      </div>

      <div className="h-1.5 bg-ilm-dark rounded-full mb-6 overflow-hidden">
        <motion.div animate={{ width: `${((idx + 1) / cards.length) * 100}%` }} className="h-full bg-ilm-gold rounded-full" />
      </div>

      <div className="perspective-[1000px] mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${idx}-${flipped}`}
            initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setFlipped(!flipped)}
            className={`min-h-[280px] md:min-h-[340px] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer border-2 transition-colors ${
              flipped ? 'bg-ilm-accent/15 border-ilm-teal/30' : 'bg-ilm-card border-ilm-accent/15'
            }`}
          >
            <p className="text-xs text-ilm-sage mb-4 uppercase tracking-widest">{flipped ? 'Réponse' : 'Question'}</p>
            <p className={`text-lg font-medium ${flipped ? 'text-ilm-teal' : 'text-ilm-ivory'}`}>
              {flipped ? card.back : card.front}
            </p>
            {!flipped && <p className="text-xs text-ilm-sage mt-6">Touchez pour retourner</p>}
          </motion.div>
        </AnimatePresence>
      </div>

      {flipped && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
          <Button variant="secondary" onClick={() => handleAnswer('review')} className="flex-1" icon={<RotateCcw className="w-4 h-4" />}>
            À revoir
          </Button>
          <Button variant="primary" onClick={() => handleAnswer('known')} className="flex-1" icon={<Check className="w-4 h-4" />}>
            Je connais
          </Button>
        </motion.div>
      )}
    </div>
  );
}

const fcTabs = [{ id: 'decks', label: 'Decks' }, { id: 'review', label: 'À Réviser' }];

export default function FlashcardsPage() {
  const [activeTab, setActiveTab] = useState('decks');
  const [playing, setPlaying] = useState<{ cards: Flashcard[]; title: string } | null>(null);

  const reviewCards = flashcards.filter(f => f.mastery !== 'mastered');

  if (playing) return <div className="p-4 md:p-8"><FlashcardPlayer cards={playing.cards} deckTitle={playing.title} onExit={() => setPlaying(null)} /></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-ilm-info/20 flex items-center justify-center"><Layers className="w-5 h-5 text-ilm-info" /></div>
          <div><h1 className="text-2xl font-bold text-ilm-ivory">Flashcards</h1><p className="text-sm text-ilm-sage">Mémorisez par la répétition</p></div>
        </div>
      </motion.div>

      <Tabs tabs={fcTabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {activeTab === 'decks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flashcardDecks.map((deck, i) => {
              const Icon = iconMap[deck.icon] || Layers;
              const deckCards = flashcards.filter(f => f.deckId === deck.id);
              return (
                <motion.div key={deck.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card hover onClick={() => setPlaying({ cards: deckCards, title: deck.title })}>
                    <div className="h-1.5 rounded-full mb-4" style={{ background: `${deck.color}30` }}>
                      <div className="h-full rounded-full" style={{ width: `${(deck.masteredCount / deck.cardCount) * 100}%`, background: deck.color }} />
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${deck.color}20` }}>
                        <Icon className="w-5 h-5" style={{ color: deck.color }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-ilm-ivory">{deck.title}</h3>
                        <p className="text-xs text-ilm-sage mt-1">{deck.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="teal" size="sm">{deck.cardCount} cartes</Badge>
                          <Badge variant="gold" size="sm">{deck.masteredCount} maîtrisées</Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {activeTab === 'review' && (
          <div>
            {reviewCards.length > 0 ? (
              <>
                <Card className="mb-4 flex items-center justify-between">
                  <div><p className="font-semibold text-ilm-ivory">{reviewCards.length} cartes à réviser</p><p className="text-xs text-ilm-sage">Révisez pour renforcer votre mémoire</p></div>
                  <Button variant="gold" size="sm" onClick={() => setPlaying({ cards: reviewCards, title: 'Révision' })}>Commencer</Button>
                </Card>
                <div className="space-y-2">
                  {reviewCards.slice(0, 5).map(c => (
                    <Card key={c.id} className="flex items-center justify-between">
                      <p className="text-sm text-ilm-cream truncate flex-1">{c.front}</p>
                      <Badge variant={c.mastery === 'new' ? 'sage' : c.mastery === 'learning' ? 'gold' : 'teal'} size="sm">{c.mastery === 'new' ? 'Nouvelle' : c.mastery === 'learning' ? 'En cours' : 'Révision'}</Badge>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-ilm-sage">
                <Check className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Toutes les cartes sont maîtrisées !</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
