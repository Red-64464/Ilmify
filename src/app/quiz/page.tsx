'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, XCircle, ArrowLeft, ArrowRight, Trophy } from 'lucide-react';
import { quizQuestions, themes } from '@/data/mockData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import type { QuizQuestion } from '@/types';

const diffColors = { easy: 'teal', medium: 'gold', hard: 'sage' } as const;
const diffLabels = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };

function QuizPlayer({ questions, onExit }: { questions: QuizQuestion[]; onExit: () => void }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);

  const q = questions[idx];
  const isCorrect = selected?.toLowerCase() === q.correctAnswer.toLowerCase();

  const handleSubmit = () => {
    if (!selected) return;
    setShowResult(true);
    setAnswers(prev => ({ ...prev, [q.id]: isCorrect }));
  };

  const handleNext = () => {
    if (idx + 1 >= questions.length) { setDone(true); return; }
    setIdx(idx + 1);
    setSelected(null);
    setShowResult(false);
  };

  const score = Object.values(answers).filter(Boolean).length;

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
        <Card glow className="text-center py-8">
          <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: pct >= 80 ? '#D4A843' : pct >= 60 ? '#2DA891' : '#8BA89A' }} />
          <h2 className="text-3xl font-bold text-ilm-ivory mb-2">{score} / {questions.length}</h2>
          <p className="text-lg text-ilm-sage mb-4">{pct}% de réussite</p>
          <p className="text-ilm-cream mb-6">{pct >= 80 ? 'Excellent ! 🌟' : pct >= 60 ? 'Bien joué ! 📚' : 'Continue d\'apprendre 💪'}</p>
          <div className="space-y-2 mb-6 text-left">
            {questions.map((qq, i) => (
              <div key={qq.id} className="flex items-center gap-2 text-sm">
                {answers[qq.id] ? <CheckCircle className="w-4 h-4 text-ilm-success shrink-0" /> : <XCircle className="w-4 h-4 text-ilm-error shrink-0" />}
                <span className="text-ilm-cream truncate">Q{i + 1}: {qq.question}</span>
              </div>
            ))}
          </div>
          <Button onClick={onExit}>Retour aux quiz</Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onExit} className="text-ilm-sage hover:text-ilm-ivory"><ArrowLeft className="w-5 h-5" /></button>
        <span className="text-sm text-ilm-sage">Question {idx + 1} sur {questions.length}</span>
        <Badge variant={diffColors[q.difficulty]} size="sm">{diffLabels[q.difficulty]}</Badge>
      </div>

      <div className="h-1.5 bg-ilm-dark rounded-full mb-6 overflow-hidden">
        <motion.div animate={{ width: `${((idx + 1) / questions.length) * 100}%` }} className="h-full bg-ilm-gold rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
          <Card className="mb-4">
            <p className="text-lg font-semibold text-ilm-ivory">{q.question}</p>
          </Card>

          <div className="space-y-2 mb-4">
            {(q.options || ['Vrai', 'Faux']).map((opt) => {
              let cls = 'border-ilm-accent/20';
              if (showResult) {
                if (opt.toLowerCase() === q.correctAnswer.toLowerCase()) cls = 'border-ilm-success bg-ilm-success/10';
                else if (opt === selected) cls = 'border-ilm-error bg-ilm-error/10';
              } else if (opt === selected) {
                cls = 'border-ilm-teal bg-ilm-teal/10';
              }
              return (
                <motion.button
                  key={opt}
                  whileTap={{ scale: 0.98 }}
                  disabled={showResult}
                  onClick={() => setSelected(opt)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors text-ilm-ivory ${cls}`}
                >
                  {opt}
                </motion.button>
              );
            })}
            {q.type === 'short_answer' && !q.options && (
              <input
                type="text"
                value={selected || ''}
                onChange={(e) => setSelected(e.target.value)}
                disabled={showResult}
                placeholder="Votre réponse..."
                className="w-full p-4 rounded-xl bg-ilm-card border-2 border-ilm-accent/20 text-ilm-ivory placeholder:text-ilm-sage/50 focus:outline-none focus:border-ilm-teal"
              />
            )}
          </div>

          {!showResult ? (
            <Button onClick={handleSubmit} disabled={!selected} className="w-full" variant="gold">Valider</Button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={`mb-4 border-l-4 ${isCorrect ? 'border-l-ilm-success' : 'border-l-ilm-error'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? <CheckCircle className="w-5 h-5 text-ilm-success" /> : <XCircle className="w-5 h-5 text-ilm-error" />}
                  <span className={`font-semibold ${isCorrect ? 'text-ilm-success' : 'text-ilm-error'}`}>{isCorrect ? 'Correct !' : 'Incorrect'}</span>
                </div>
                {!isCorrect && <p className="text-sm text-ilm-cream mb-1">Réponse : <strong>{q.correctAnswer}</strong></p>}
                <p className="text-sm text-ilm-sage">{q.explanation}</p>
              </Card>
              <Button onClick={handleNext} className="w-full" icon={<ArrowRight className="w-4 h-4" />}>
                {idx + 1 >= questions.length ? 'Voir les résultats' : 'Question suivante'}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const quizTabs = [{ id: 'home', label: 'Accueil' }, { id: 'themes', label: 'Par Thème' }, { id: 'history', label: 'Historique' }];

export default function QuizPage() {
  const [activeTab, setActiveTab] = useState('home');
  const [playing, setPlaying] = useState<QuizQuestion[] | null>(null);

  const toReview = quizQuestions.filter(q => q.mastery < 50);
  const avg = Math.round(quizQuestions.reduce((a, q) => a + q.mastery, 0) / quizQuestions.length);

  if (playing) return <div className="p-4 md:p-8"><QuizPlayer questions={playing} onExit={() => setPlaying(null)} /></div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-ilm-gold/20 flex items-center justify-center"><Brain className="w-5 h-5 text-ilm-gold" /></div>
          <div><h1 className="text-2xl font-bold text-ilm-ivory">Quiz Intelligent</h1><p className="text-sm text-ilm-sage">Testez et renforcez vos connaissances</p></div>
        </div>
      </motion.div>

      <Tabs tabs={quizTabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {activeTab === 'home' && (
          <div className="space-y-4">
            <Card glow className="cursor-pointer" onClick={() => setPlaying(quizQuestions.slice(0, 5))}>
              <div className="flex items-center justify-between">
                <div><h3 className="font-semibold text-ilm-ivory text-lg">Quiz du jour</h3><p className="text-sm text-ilm-sage mt-1">5 questions variées</p></div>
                <Button variant="gold" size="sm">Commencer</Button>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              <Card className="text-center"><p className="text-2xl font-bold text-ilm-ivory">{quizQuestions.length}</p><p className="text-xs text-ilm-sage">Questions</p></Card>
              <Card className="text-center"><p className="text-2xl font-bold text-ilm-gold">{avg}%</p><p className="text-xs text-ilm-sage">Maîtrise</p></Card>
              <Card className="text-center"><p className="text-2xl font-bold text-ilm-error">{toReview.length}</p><p className="text-xs text-ilm-sage">À revoir</p></Card>
            </div>

            {toReview.length > 0 && (
              <div>
                <h3 className="font-semibold text-ilm-ivory mb-2">À revoir</h3>
                {toReview.slice(0, 3).map(q => (
                  <Card key={q.id} className="mb-2"><p className="text-sm text-ilm-cream">{q.question}</p><Badge variant="sage" size="sm" className="mt-1">Maîtrise : {q.mastery}%</Badge></Card>
                ))}
                <Button variant="secondary" size="sm" onClick={() => setPlaying(toReview)} className="mt-2">Revoir ces questions</Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'themes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {themes.map(theme => {
              const tqs = quizQuestions.filter(q => q.themeId === theme.id);
              if (!tqs.length) return null;
              const tAvg = Math.round(tqs.reduce((a, q) => a + q.mastery, 0) / tqs.length);
              return (
                <Card key={theme.id} hover onClick={() => setPlaying(tqs)}>
                  <div className="flex items-center justify-between">
                    <div><p className="font-semibold text-ilm-ivory">{theme.title}</p><p className="text-xs text-ilm-sage">{tqs.length} questions • {tAvg}% maîtrise</p></div>
                    <Button variant="secondary" size="sm">Jouer</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="text-center py-16 text-ilm-sage">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>L&apos;historique sera disponible prochainement</p>
          </div>
        )}
      </div>
    </div>
  );
}
