'use client';

import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Circle, Clock } from 'lucide-react';
import type { QuranMemorization } from '@/types';

interface SurahCardProps {
  number: number;
  name: string;
  nameAr: string;
  ayahCount: number;
  revelationType: 'Meccan' | 'Medinan';
  juzStart?: number;
  memorization?: QuranMemorization;
  onClick?: () => void;
}

const statusIcon = (status?: QuranMemorization['status']) => {
  if (status === 'memorized') return <CheckCircle2 size={16} style={{ color: '#3aaa60' }} />;
  if (status === 'in-progress') return <Clock size={16} style={{ color: '#d4ad4a' }} />;
  return <Circle size={16} style={{ color: 'var(--text-muted)' }} />;
};

export default function SurahCard({
  number,
  name,
  nameAr,
  ayahCount,
  revelationType,
  juzStart,
  memorization,
  onClick,
}: SurahCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        cursor: 'pointer',
      }}
    >
      {/* Surah number badge */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
        style={{
          background: 'linear-gradient(135deg, rgba(212,173,74,0.15), rgba(212,173,74,0.05))',
          border: '1px solid rgba(212,173,74,0.2)',
          color: '#d4ad4a',
        }}
      >
        {number}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {name}
          </span>
          <span
            className="font-arabic text-base flex-shrink-0"
            style={{ color: 'var(--text-primary)', direction: 'rtl' }}
          >
            {nameAr}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: revelationType === 'Meccan'
                ? 'rgba(212,173,74,0.1)'
                : 'rgba(46,158,140,0.1)',
              color: revelationType === 'Meccan' ? '#d4ad4a' : 'var(--accent)',
            }}
          >
            {revelationType === 'Meccan' ? 'Mecquoise' : 'Médinoise'}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <BookOpen size={10} className="inline mr-1" />
            {ayahCount} versets
          </span>
          {juzStart && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              · Juz {juzStart}
            </span>
          )}
        </div>
      </div>

      {/* Memorization status */}
      <div className="flex-shrink-0">{statusIcon(memorization?.status)}</div>
    </motion.button>
  );
}
