'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, Moon, Star } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import SurahCard from '@/components/quran/SurahCard';
import HifzTracker from '@/components/quran/HifzTracker';
import JuzList from '@/components/quran/JuzList';
import { SURAH_LIST } from '@/lib/api/quranApi';
import { useQuranMemorization } from '@/lib/quranStorage';

const tabs = [
  { id: 'surah', label: 'Sourate', icon: <BookOpen size={14} /> },
  { id: 'juz', label: 'Juz', icon: <Moon size={14} /> },
  { id: 'hifz', label: 'Mémorisation', icon: <Star size={14} /> },
];

export default function QuranPage() {
  const [activeTab, setActiveTab] = useState('surah');
  const [search, setSearch] = useState('');
  const { memorizations, updateStatus, getStatus } = useQuranMemorization();

  const filtered = useMemo(() => {
    if (!search.trim()) return SURAH_LIST;
    const q = search.toLowerCase();
    return SURAH_LIST.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nameAr.includes(q) ||
        String(s.number).includes(q)
    );
  }, [search]);

  const navigateToSurah = (n: number) => {
    window.location.href = `/quran/${n}`;
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-base)' }}>
      {/* Decorative header */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(212,173,74,0.12) 0%, rgba(46,158,140,0.08) 100%)',
          borderBottom: '1px solid rgba(212,173,74,0.1)',
        }}
      >
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="islamic-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="#d4ad4a" />
                <line x1="0" y1="20" x2="40" y2="20" stroke="#d4ad4a" strokeWidth="0.5" strokeDasharray="2,6" />
                <line x1="20" y1="0" x2="20" y2="40" stroke="#d4ad4a" strokeWidth="0.5" strokeDasharray="2,6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#islamic-grid)" />
          </svg>
        </div>

        <PageHeader
          title="📖 Le Coran"
          subtitle="القرآن الكريم"
        />

        {/* Bismillah */}
        <div className="px-4 pb-4 text-center">
          <p
            className="font-arabic text-xl"
            style={{ color: '#d4ad4a', direction: 'rtl', letterSpacing: '0.05em' }}
          >
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="sticky top-0 z-30 px-4 py-3"
        style={{ background: 'rgba(6,18,15,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex gap-1 rounded-2xl p-1" style={{ background: 'var(--bg-secondary)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: activeTab === tab.id ? 'var(--bg-elevated)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {activeTab === 'surah' && (
          <>
            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            >
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Rechercher une sourate..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            {/* Surah list */}
            <motion.div
              className="space-y-2"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.02 } },
              }}
            >
              {filtered.map((surah) => (
                <motion.div
                  key={surah.number}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                  }}
                >
                  <SurahCard
                    number={surah.number}
                    name={surah.name}
                    nameAr={surah.nameAr}
                    ayahCount={surah.ayahCount}
                    revelationType={surah.revelationType}
                    juzStart={surah.juzStart}
                    memorization={memorizations.find((m) => m.surahNumber === surah.number)}
                    onClick={() => navigateToSurah(surah.number)}
                  />
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  Aucune sourate trouvée
                </div>
              )}
            </motion.div>
          </>
        )}

        {activeTab === 'juz' && (
          <JuzList onSurahClick={navigateToSurah} />
        )}

        {activeTab === 'hifz' && (
          <HifzTracker
            memorizations={memorizations}
            onStatusChange={updateStatus}
          />
        )}
      </div>
    </div>
  );
}
