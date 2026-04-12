'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { getJuzMapping, SURAH_LIST } from '@/lib/api/quranApi';

interface JuzListProps {
  onSurahClick?: (surahNumber: number) => void;
}

export default function JuzList({ onSurahClick }: JuzListProps) {
  const juzMapping = getJuzMapping();

  return (
    <div className="space-y-3">
      {juzMapping.map((juz, index) => {
        const surahs = juz.surahs.map((n) => SURAH_LIST.find((s) => s.number === n)).filter(Boolean);
        return (
          <motion.div
            key={juz.juzNumber}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02, duration: 0.3 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          >
            {/* Juz header */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,173,74,0.2), rgba(212,173,74,0.05))',
                  border: '1px solid rgba(212,173,74,0.25)',
                  color: '#d4ad4a',
                }}
              >
                {juz.juzNumber}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Juz {juz.juzNumber}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Sourate {juz.startSurah}:{juz.startAyah} → {juz.endSurah}:{juz.endAyah}
                </p>
              </div>
            </div>

            {/* Surahs in this juz */}
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {surahs.map((surah) => {
                if (!surah) return null;
                return (
                  <button
                    key={surah.number}
                    onClick={() => onSurahClick?.(surah.number)}
                    className="w-full flex items-center justify-between px-4 py-2.5 transition-colors"
                    style={{
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ background: 'var(--bg-elevated)', color: '#d4ad4a' }}
                      >
                        {surah.number}
                      </span>
                      <span className="text-sm">{surah.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-arabic text-sm"
                        style={{ direction: 'rtl', color: 'var(--text-muted)' }}
                      >
                        {surah.nameAr}
                      </span>
                      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
