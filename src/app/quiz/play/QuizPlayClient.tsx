'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Loader2, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAuth } from '@/contexts/AuthContext';
import { quizRepository } from '@/lib/repositories/quizRepository';
import { activityRepository } from '@/lib/repositories/activityRepository';
import { quizQuestions as staticQuestions } from '@/data/quiz';
import type { QuizQuestion } from '@/types';

async function recordActivity(userId: string) {
  try {
    await activityRepository.log(userId, 'quiz');
  } catch { /* ignore */ }
}

export default function QuizPlayClient() {
  const searchParams = useSearchParams();
  const themeFilter = searchParams.get('theme');
  const modeFilter = searchParams.get('mode');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    if (!user) {
      // Fallback to bundled static questions when not logged in — intentional sync setState.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAllQuestions(staticQuestions);
      setLoading(false);
      return;
    }
    const fetchQuestions = modeFilter === 'errors'
      ? quizRepository.getErrorQuestions(user.id)
      : quizRepository.getAllQuestions(user.id);
    fetchQuestions
      .then((q) => setAllQuestions(q.length > 0 ? q : modeFilter === 'errors' ? [] : staticQuestions))
      .catch(() => setAllQuestions(modeFilter === 'errors' ? [] : staticQuestions))
      .finally(() => setLoading(false));
  }, [user, modeFilter]);

  const questions: QuizQuestion[] = useMemo(() => {
    const filtered = themeFilter
      ? allQuestions.filter((q) => q.themeId === themeFilter)
      : allQuestions;
    return filtered;
  }, [themeFilter, allQuestions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[currentIndex];

  const isCorrect = useCallback(() => {
    if (!current) return false;
    if (current.type === 'short-answer') {
      return textAnswer.trim().toLowerCase() === String(current.correctAnswer).toLowerCase();
    }
    if (current.type === 'true-false') {
      return selectedAnswer === current.correctAnswer;
    }
    return selectedAnswer === current.correctAnswer;
  }, [current, selectedAnswer, textAnswer]);

  const handleSubmit = () => {
    if (showResult) return;
    setShowResult(true);
    const correct = isCorrect();
    if (correct) setScore((s) => s + 1);
    // Persist mastery update
    if (user && current?.id && !current.id.startsWith('quiz-')) {
      quizRepository.updateMastery(current.id, correct).catch(() => {});
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
      // Save session
      if (user) {
        quizRepository.saveSession(user.id, {
          themeId: themeFilter || undefined,
          questions: questions.map(q => q.id),
          answers: {},
          score,
          total: questions.length,
        }).catch(() => {});
        // Record activity for streak
        recordActivity(user.id);
      }
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setTextAnswer('');
      setShowResult(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setTextAnswer('');
    setShowResult(false);
    setScore(0);
    setFinished(false);
  };

  if (loading) {
    return (
      <div className="pb-10">
        <PageHeader title="Quiz" backButton />
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-primary)' }} />
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="pb-10">
        <PageHeader title={modeFilter === 'errors' ? 'Révision des erreurs' : 'Quiz'} backButton />
        <div className="text-center py-16">
          <p style={{ color: 'var(--text-muted)' }}>{modeFilter === 'errors' ? 'Aucune erreur à réviser. Bravo !' : 'Aucune question disponible.'}</p>
        </div>
      </div>
    );
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    // Compute session stats
    const totalMastered = questions.filter(q => q.masteryLevel >= 80).length;
    const hardestQuestions = [...questions].sort((a, b) => b.errorCount - a.errorCount).filter(q => q.errorCount > 0).slice(0, 3);
    const avgMastery = questions.length > 0 ? Math.round(questions.reduce((sum, q) => sum + q.masteryLevel, 0) / questions.length) : 0;
    return (
      <div className="pb-10">
        <PageHeader title="Résultats" backButton />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card glowColor="gold" className="p-6 text-center">
            <div
              className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl mb-5"
              style={{ background: 'linear-gradient(135deg, rgba(196,154,61,0.12), rgba(196,154,61,0.06))' }}
            >
              <Trophy size={32} style={{ color: '#d4ad4a' }} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Quiz terminé !</h2>
            <p className="text-4xl font-bold mb-1" style={{ color: '#d4ad4a' }}>
              {score}/{questions.length}
            </p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{percentage}% de bonnes réponses</p>
            <ProgressBar
              value={percentage}
              showLabel
              size="md"
              color={percentage >= 70 ? '#3aaa60' : percentage >= 40 ? '#d4991a' : '#ef4444'}
              className="mb-8"
            />
            <Button
              variant="primary"
              onClick={handleRestart}
              iconLeft={<RotateCcw size={16} />}
            >
              Recommencer
            </Button>
          </Card>

          {/* Personal Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(58,170,96,0.08)', border: '1px solid rgba(58,170,96,0.15)' }}>
              <TrendingUp size={18} className="mx-auto mb-1.5" style={{ color: '#3aaa60' }} />
              <p className="text-lg font-bold" style={{ color: '#3aaa60' }}>{avgMastery}%</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Maîtrise moy.</p>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <Target size={18} className="mx-auto mb-1.5" style={{ color: '#6366f1' }} />
              <p className="text-lg font-bold" style={{ color: '#6366f1' }}>{totalMastered}/{questions.length}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Maîtrisées</p>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <AlertTriangle size={18} className="mx-auto mb-1.5" style={{ color: '#ef4444' }} />
              <p className="text-lg font-bold" style={{ color: '#ef4444' }}>{questions.filter(q => q.errorCount > 0).length}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Avec erreurs</p>
            </div>
          </div>

          {hardestQuestions.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>⚠️ Questions les plus difficiles</p>
              <div className="space-y-2">
                {hardestQuestions.map((q) => (
                  <div key={q.id} className="rounded-xl p-3 text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                    <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{q.question}</p>
                    <p style={{ color: 'var(--text-muted)' }}>{q.errorCount} erreur{q.errorCount > 1 ? 's' : ''} · Maîtrise {q.masteryLevel}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  const canSubmit =
    current.type === 'short-answer' ? textAnswer.trim().length > 0 : selectedAnswer !== null;

  return (
    <div className="pb-10">
      <PageHeader
        title={`Question ${currentIndex + 1}/${questions.length}`}
        backButton
      />

      <ProgressBar
        value={currentIndex + 1}
        max={questions.length}
        color="#3aaa60"
        size="sm"
        className="mb-8"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
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
              <Badge variant="default" size="sm">{current.type.toUpperCase()}</Badge>
            </div>
            <h2 className="text-base font-semibold tracking-tight leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {current.question}
            </h2>
          </Card>

          {/* Answer Options */}
          <div className="space-y-2 mb-5">
            {current.type === 'mcq' && current.options && current.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === current.correctAnswer;
              let optionStyle = '';
              let optionInlineStyle: React.CSSProperties = { border: '1px solid rgba(46,158,140,0.3)' };
              if (showResult && isCorrectOption) { optionStyle = 'border-green-500 bg-green-500/10'; optionInlineStyle = {}; }
              else if (showResult && isSelected && !isCorrectOption) { optionStyle = 'border-red-500 bg-red-500/10'; optionInlineStyle = {}; }
              else if (isSelected) { optionStyle = ''; optionInlineStyle = { border: '1px solid var(--accent)', background: 'var(--accent-light)' }; }

              return (
                <button
                  key={idx}
                  onClick={() => !showResult && setSelectedAnswer(idx)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${optionStyle}`}
                  style={{ background: showResult ? undefined : 'var(--bg-card)', ...optionInlineStyle }}
                >
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{option}</span>
                </button>
              );
            })}

            {current.type === 'true-false' && ['true', 'false'].map((val) => {
              const isSelected = selectedAnswer === val;
              const isCorrectOption = val === current.correctAnswer;
              let optionStyle = '';
              let optionInlineStyle: React.CSSProperties = { border: '1px solid rgba(46,158,140,0.3)' };
              if (showResult && isCorrectOption) { optionStyle = 'border-green-500 bg-green-500/10'; optionInlineStyle = {}; }
              else if (showResult && isSelected && !isCorrectOption) { optionStyle = 'border-red-500 bg-red-500/10'; optionInlineStyle = {}; }
              else if (isSelected) { optionStyle = ''; optionInlineStyle = { border: '1px solid var(--accent)', background: 'var(--accent-light)' }; }

              return (
                <button
                  key={val}
                  onClick={() => !showResult && setSelectedAnswer(val)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${optionStyle}`}
                  style={{ background: showResult ? undefined : 'var(--bg-card)', ...optionInlineStyle }}
                >
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {val === 'true' ? 'Vrai' : 'Faux'}
                  </span>
                </button>
              );
            })}

            {(current.type === 'short-answer' || current.type === 'association') && (
              <div>
                {current.type === 'association' && current.options && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {current.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => !showResult && setSelectedAnswer(idx)}
                        disabled={showResult}
                        className={`px-3 py-2 rounded-lg border text-sm transition-all cursor-pointer ${
                          selectedAnswer === idx
                            ? showResult && idx === current.correctAnswer
                              ? 'border-green-500 bg-green-500/10'
                              : showResult
                                ? 'border-red-500 bg-red-500/10'
                                : ''
                            : showResult && idx === current.correctAnswer
                              ? 'border-green-500 bg-green-500/10'
                              : ''
                        }`}
                        style={{
                          ...(selectedAnswer !== idx && !(showResult && idx === current.correctAnswer)
                            ? { border: '1px solid rgba(46,158,140,0.3)', color: 'var(--text-secondary)' }
                            : selectedAnswer === idx && !showResult
                              ? { border: '1px solid var(--accent)', background: 'var(--accent-light)', color: 'var(--text-primary)' }
                              : { color: 'var(--text-primary)' }),
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {current.type === 'short-answer' && (
                  <input
                    type="text"
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    disabled={showResult}
                    placeholder="Tapez votre réponse..."
                    className="w-full p-4 rounded-xl border bg-transparent text-sm outline-none transition-colors"
                    style={{ borderColor: 'rgba(46,158,140,0.3)', color: 'var(--text-primary)' }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Result */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect() ? (
                    <CheckCircle size={18} className="text-green-400" />
                  ) : (
                    <XCircle size={18} className="text-red-400" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      isCorrect() ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {isCorrect() ? 'Bonne réponse !' : 'Mauvaise réponse'}
                  </span>
                </div>
                {(() => {
                  const parts = current.explanation.split('---OPTION_EXPLANATIONS---');
                  const baseExplanation = parts[0].trim();
                  let adaptedExplanation = '';
                  if (!isCorrect() && parts[1] && typeof selectedAnswer === 'number') {
                    try {
                      const optExps = JSON.parse(parts[1].trim()) as string[];
                      if (optExps[selectedAnswer]) adaptedExplanation = optExps[selectedAnswer];
                    } catch { /* ignore */ }
                  }
                  return (
                    <>
                      {adaptedExplanation && (
                        <p className="text-sm mb-2 font-medium" style={{ color: '#f59e0b' }}>
                          💡 {adaptedExplanation}
                        </p>
                      )}
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{baseExplanation}</p>
                      <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(196,154,61,0.1)', color: '#d4ad4a' }}>✨ Généré par IA</span>
                    </>
                  );
                })()}
              </Card>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!showResult ? (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1"
              >
                Valider
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
                iconRight={<ArrowRight size={16} />}
                className="flex-1"
              >
                {currentIndex + 1 >= questions.length ? 'Voir les résultats' : 'Suivante'}
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
