'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, Star, CheckCircle, AlertCircle, Play, Plus, Upload, Loader2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import AuthGuard from '@/components/layout/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { quizRepository } from '@/lib/repositories/quizRepository';
import { quizQuestions as staticQuestions } from '@/data/quiz';
import { themes } from '@/data/themes';
import type { QuizQuestion } from '@/types';

export default function QuizPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState('');
  const [newCorrect, setNewCorrect] = useState('0');
  const [newExplanation, setNewExplanation] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [newTheme, setNewTheme] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    quizRepository.getAllQuestions(user.id)
      .then((q) => setQuestions(q.length > 0 ? q : staticQuestions))
      .catch(() => setQuestions(staticQuestions))
      .finally(() => setLoading(false));
  }, [user]);

  const stats = useMemo(() => {
    const total = questions.length;
    const mastered = questions.filter((q) => q.masteryLevel >= 80).length;
    const toReview = questions.filter((q) => q.masteryLevel < 50).length;
    return { total, mastered, toReview };
  }, [questions]);

  const themeGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    questions.forEach((q) => { groups[q.themeId] = (groups[q.themeId] || 0) + 1; });
    return Object.entries(groups).map(([themeId, count]) => {
      const theme = themes.find((t) => t.id === themeId);
      return { themeId, count, theme };
    });
  }, [questions]);

  const handleAdd = async () => {
    if (!user || !newQuestion.trim() || saving) return;
    setSaving(true);
    try {
      const opts = newOptions.split('\n').map(o => o.trim()).filter(Boolean);
      await quizRepository.createQuestion(user.id, {
        themeId: newTheme || 'general',
        type: opts.length > 0 ? 'mcq' : 'true-false',
        question: newQuestion.trim(),
        options: opts.length > 0 ? opts : undefined,
        correctAnswer: parseInt(newCorrect, 10) || 0,
        explanation: newExplanation.trim(),
        difficulty: newDifficulty,
        tags: [],
      });
      setShowAdd(false);
      setNewQuestion(''); setNewOptions(''); setNewCorrect('0'); setNewExplanation('');
      const q = await quizRepository.getAllQuestions(user.id);
      setQuestions(q);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleImportStatic = async () => {
    if (!user || importing) return;
    setImporting(true);
    try {
      await quizRepository.importQuestions(user.id, staticQuestions);
      const q = await quizRepository.getAllQuestions(user.id);
      setQuestions(q);
    } catch { /* ignore */ }
    setImporting(false);
  };

  return (
    <AuthGuard>
    <div className="pb-10">
      <PageHeader
        title="Quiz"
        subtitle="Testez vos connaissances"
        rightAction={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" iconLeft={<Plus size={14} />} onClick={() => setShowAdd(true)}>
              Ajouter
            </Button>
            <Link href="/quiz/play">
              <Button variant="primary" size="sm" iconLeft={<Play size={14} />}>
                Commencer
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Total', value: stats.total, icon: Brain, color: '#6366f1' },
          { label: 'Maîtrisées', value: stats.mastered, icon: CheckCircle, color: '#3aaa60' },
          { label: 'À revoir', value: stats.toReview, icon: AlertCircle, color: '#d4991a' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-4 text-center">
              <div
                className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Theme Quiz Cards */}
      <h3 className="text-lg font-semibold tracking-tight mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Star size={18} style={{ color: '#d4ad4a' }} />
        Quiz par thème
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {themeGroups.map(({ themeId, count, theme }, i) => (
          <motion.div
            key={themeId}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Link href={`/quiz/play?theme=${themeId}`}>
              <Card glowColor="green" className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: theme ? `${theme.color}20` : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <Brain
                      size={18}
                      style={{ color: theme?.color || '#6366f1' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {theme?.title || themeId}
                    </h4>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {count} question{count > 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge variant="default" size="sm">{count}</Badge>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Import static questions button */}
      {user && questions === staticQuestions && (
        <div className="mt-6 text-center">
          <Button variant="secondary" size="sm" iconLeft={importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} onClick={handleImportStatic} disabled={importing}>
            {importing ? 'Import...' : 'Importer les questions démo dans mon compte'}
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      )}

      {!loading && questions.length === 0 && (
        <EmptyState
          icon={Brain}
          title="Aucune question"
          description="Ajoutez vos premières questions de quiz."
        />
      )}

      {/* Add Question Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Ajouter une question">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Question</label>
            <textarea value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} rows={2} placeholder="Votre question..." className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Options (une par ligne, vide = Vrai/Faux)</label>
            <textarea value={newOptions} onChange={(e) => setNewOptions(e.target.value)} rows={3} placeholder={"Option A\nOption B\nOption C\nOption D"} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Réponse correcte (index 0-3)</label>
              <input type="number" value={newCorrect} onChange={(e) => setNewCorrect(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Difficulté</label>
              <select value={newDifficulty} onChange={(e) => setNewDifficulty(e.target.value as 'easy' | 'medium' | 'hard')} className="w-full rounded-xl px-4 py-3 text-sm outline-none cursor-pointer" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                <option value="easy">Facile</option>
                <option value="medium">Moyen</option>
                <option value="hard">Difficile</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Explication</label>
            <textarea value={newExplanation} onChange={(e) => setNewExplanation(e.target.value)} rows={2} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setShowAdd(false)} className="flex-1">Annuler</Button>
            <Button variant="primary" size="md" onClick={handleAdd} disabled={!newQuestion.trim() || saving} className="flex-1">{saving ? 'Ajout...' : 'Ajouter'}</Button>
          </div>
        </div>
      </Modal>
    </div>
    </AuthGuard>
  );
}
