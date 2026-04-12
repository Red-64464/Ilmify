'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Circle, BookOpen, Star } from 'lucide-react';
import { SURAH_LIST } from '@/lib/api/quranApi';
import type { QuranMemorization } from '@/types';

interface HifzTrackerProps {
  memorizations: QuranMemorization[];
  onStatusChange?: (surahNumber: number, status: QuranMemorization['status']) => void;
}

export default function HifzTracker({ memorizations, onStatusChange }: HifzTrackerProps) {
  const [filter, setFilter] = useState<'all' | 'memorized' | 'in-progress' | 'not-started'>('all');

  const memorized = memorizations.filter((m) => m.status === 'memorized');
  const inProgress = memorizations.filter((m) => m.status === 'in-progress');
  const totalAyahs = 6236;
  const memorizedAyahs = memorized.reduce((sum, m) => {
    const surah = SURAH_LIST.find((s) => s.number === m.surahNumber);
    return sum + (surah?.ayahCount ?? 0);
  }, 0);

  const surahProgress = (memorized.length / 114) * 100;
  const ayahProgress = (memorizedAyahs / totalAyahs) * 100;

  const filteredSurahs = SURAH_LIST.filter((s) => {
    const mem = memorizations.find((m) => m.surahNumber === s.number);
    const status = mem?.status ?? 'not-started';
    if (filter === 'all') return true;
    return status === filter;
  });

  const getStatus = (surahNumber: number): QuranMemorization['status'] => {
    return memorizations.find((m) => m.surahNumber === surahNumber)?.status ?? 'not-started';
  };

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <Star size={16} style={{ color: '#d4ad4a' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Progression Hifz
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Sourates mémorisées</span>
            <span style={{ color: '#d4ad4a' }}>{memorized.length}/114</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${surahProgress}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #d4ad4a, #c49a3d)' }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Versets mémorisés</span>
            <span style={{ color: 'var(--accent)' }}>{memorizedAyahs}/{totalAyahs}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${ayahProgress}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const, delay: 0.1 }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #2e9e8c, #12a393)' }}
            />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} style={{ color: '#3aaa60' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {memorized.length} mémorisées
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} style={{ color: '#d4ad4a' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {inProgress.length} en cours
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {114 - memorized.length - inProgress.length} pas commencées
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {(['all', 'memorized', 'in-progress', 'not-started'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            style={{
              background: filter === f ? 'var(--accent)' : 'var(--bg-card)',
              color: filter === f ? '#fff' : 'var(--text-muted)',
              border: '1px solid',
              borderColor: filter === f ? 'var(--accent)' : 'var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            {f === 'all' ? 'Toutes' : f === 'memorized' ? '✅ Mémorisées' : f === 'in-progress' ? '�� En cours' : '❌ Pas commencées'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredSurahs.map((surah) => {
          const status = getStatus(surah.number);
          const mem = memorizations.find((m) => m.surahNumber === surah.number);
          return (
            <div
              key={surah.number}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            >
              <span
                className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--bg-elevated)', color: '#d4ad4a' }}
              >
                {surah.number}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {surah.name}
                </p>
                {mem?.lastReviewedAt && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Révisé le {new Date(mem.lastReviewedAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {(['not-started', 'in-progress', 'memorized'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => onStatusChange?.(surah.number, s)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{
                      background:
                        status === s
                          ? s === 'memorized'
                            ? 'rgba(58,170,96,0.2)'
                            : s === 'in-progress'
                            ? 'rgba(212,173,74,0.2)'
                            : 'var(--bg-elevated)'
                          : 'transparent',
                      cursor: 'pointer',
                    }}
                    title={s === 'memorized' ? 'Mémorisée' : s === 'in-progress' ? 'En cours' : 'Pas commencée'}
                  >
                    {s === 'memorized' ? (
                      <CheckCircle2 size={14} style={{ color: status === s ? '#3aaa60' : 'var(--text-muted)' }} />
                    ) : s === 'in-progress' ? (
                      <BookOpen size={14} style={{ color: status === s ? '#d4ad4a' : 'var(--text-muted)' }} />
                    ) : (
                      <Circle size={14} style={{ color: status === s ? 'var(--text-secondary)' : 'var(--text-muted)' }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
