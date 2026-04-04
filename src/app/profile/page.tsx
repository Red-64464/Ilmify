'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  User, Star, Brain, Layers, BookOpen, Settings,
  Info, Shield, Heart,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { themes } from '@/data/themes';
import { quizQuestions } from '@/data/quiz';
import { flashcards } from '@/data/flashcards';
import { books } from '@/data/books';

const menuItems = [
  { icon: Settings, label: 'Paramètres', desc: 'Personnaliser l\'application' },
  { icon: Heart, label: 'Favoris', desc: 'Gérer vos favoris' },
  { icon: Shield, label: 'Confidentialité', desc: 'Paramètres de confidentialité' },
  { icon: Info, label: 'À propos', desc: 'Version et informations' },
];

export default function ProfilePage() {
  const stats = useMemo(() => {
    const themesExplored = themes.filter((t) => t.progress && t.progress > 0).length;
    const avgQuizScore = quizQuestions.length > 0
      ? Math.round(
          quizQuestions.reduce((acc, q) => acc + q.masteryLevel, 0) / quizQuestions.length
        )
      : 0;
    const flashcardsMastered = flashcards.filter((f) => f.masteryLevel >= 80).length;
    const booksRead = books.filter((b) => b.status === 'read').length;

    return [
      { label: 'Thèmes explorés', value: themesExplored, total: themes.length, icon: Star, color: '#3aaa60' },
      { label: 'Score quiz', value: `${avgQuizScore}%`, icon: Brain, color: '#6366f1' },
      { label: 'Cartes maîtrisées', value: flashcardsMastered, total: flashcards.length, icon: Layers, color: '#24ad9d' },
      { label: 'Livres lus', value: booksRead, total: books.length, icon: BookOpen, color: '#d4991a' },
    ];
  }, []);

  return (
    <div className="pb-10">
      {/* Avatar & Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <div
          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: 'rgba(46,158,140,0.25)', border: '2px solid rgba(46,158,140,0.4)' }}
        >
          <User size={36} style={{ color: 'var(--text-secondary)' }} />
        </div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Étudiant</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Apprenant sur Ilmify</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className="p-4 text-center">
              <div
                className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {stat.value}
                {'total' in stat && stat.total !== undefined && (
                  <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/{stat.total}</span>
                )}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Menu */}
      <div className="space-y-2">
        {menuItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.2 + i * 0.05 }}
          >
            <Card hoverable className="p-4 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                  <item.icon size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
