'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { quizQuestions } from '@/data/quiz';
import type { QuizQuestion } from '@/types';

export default function QuizPlayPage() {
  const searchParams = useSearchParams();
  const themeFilter = searchParams.get('theme');

  const questions: QuizQuestion[] = useMemo(() => {
    const filtered = themeFilter
      ? quizQuestions.filter((q) => q.themeId === themeFilter)
      : quizQuestions;
    return filtered;
  }, [themeFilter]);

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
    if (isCorrect()) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
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

  if (questions.length === 0) {
    return (
      <div className="pb-8">
        <PageHeader title="Quiz" backButton />
        <div className="text-center py-16">
          <p className="text-ivory-400">Aucune question disponible.</p>
        </div>
      </div>
    );
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="pb-8">
        <PageHeader title="Résultats" backButton />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card glowColor="gold" className="p-6 text-center">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gold-500/15 mb-4">
              <Trophy size={32} className="text-gold-400" />
            </div>
            <h2 className="text-2xl font-bold text-ivory-200 mb-2">Quiz terminé !</h2>
            <p className="text-4xl font-bold text-gold-400 mb-1">
              {score}/{questions.length}
            </p>
            <p className="text-sm text-ivory-400 mb-4">{percentage}% de bonnes réponses</p>
            <ProgressBar
              value={percentage}
              showLabel
              size="md"
              color={percentage >= 70 ? '#3aaa60' : percentage >= 40 ? '#d4991a' : '#ef4444'}
              className="mb-6"
            />
            <Button
              variant="primary"
              onClick={handleRestart}
              iconLeft={<RotateCcw size={16} />}
            >
              Recommencer
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  const canSubmit =
    current.type === 'short-answer' ? textAnswer.trim().length > 0 : selectedAnswer !== null;

  return (
    <div className="pb-8">
      <PageHeader
        title={`Question ${currentIndex + 1}/${questions.length}`}
        backButton
      />

      <ProgressBar
        value={currentIndex + 1}
        max={questions.length}
        color="#3aaa60"
        size="sm"
        className="mb-6"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-5 mb-4">
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
            <h2 className="text-base font-semibold text-ivory-200 leading-relaxed">
              {current.question}
            </h2>
          </Card>

          {/* Answer Options */}
          <div className="space-y-2 mb-4">
            {current.type === 'mcq' && current.options && current.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === current.correctAnswer;
              let optionStyle = 'border-primary-700/50';
              if (showResult && isCorrectOption) optionStyle = 'border-green-500 bg-green-500/10';
              else if (showResult && isSelected && !isCorrectOption) optionStyle = 'border-red-500 bg-red-500/10';
              else if (isSelected) optionStyle = 'border-primary-500 bg-primary-500/10';

              return (
                <button
                  key={idx}
                  onClick={() => !showResult && setSelectedAnswer(idx)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${optionStyle}`}
                  style={{ background: showResult ? undefined : 'var(--bg-card)' }}
                >
                  <span className="text-sm text-ivory-200">{option}</span>
                </button>
              );
            })}

            {current.type === 'true-false' && ['true', 'false'].map((val) => {
              const isSelected = selectedAnswer === val;
              const isCorrectOption = val === current.correctAnswer;
              let optionStyle = 'border-primary-700/50';
              if (showResult && isCorrectOption) optionStyle = 'border-green-500 bg-green-500/10';
              else if (showResult && isSelected && !isCorrectOption) optionStyle = 'border-red-500 bg-red-500/10';
              else if (isSelected) optionStyle = 'border-primary-500 bg-primary-500/10';

              return (
                <button
                  key={val}
                  onClick={() => !showResult && setSelectedAnswer(val)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${optionStyle}`}
                  style={{ background: showResult ? undefined : 'var(--bg-card)' }}
                >
                  <span className="text-sm text-ivory-200">
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
                              ? 'border-green-500 bg-green-500/10 text-ivory-200'
                              : showResult
                                ? 'border-red-500 bg-red-500/10 text-ivory-200'
                                : 'border-primary-500 bg-primary-500/10 text-ivory-200'
                            : showResult && idx === current.correctAnswer
                              ? 'border-green-500 bg-green-500/10 text-ivory-200'
                              : 'border-primary-700/50 text-ivory-300'
                        }`}
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
                    className="w-full p-4 rounded-xl border border-primary-700/50 bg-transparent text-sm text-ivory-200 outline-none focus:border-primary-500 transition-colors"
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
              <Card className="p-4 mb-4">
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
                <p className="text-sm text-ivory-400">{current.explanation}</p>
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
