'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, Moon, Star, BookOpenCheck, SearchCode, Loader2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import SurahCard from '@/components/quran/SurahCard';
import HifzTracker from '@/components/quran/HifzTracker';
import JuzList from '@/components/quran/JuzList';
import { SURAH_LIST, searchQuran } from '@/lib/api/quranApi';
import type { QuranSearchResult } from '@/lib/api/quranApi';
import { useQuranMemorization, useQuranPosition } from '@/lib/quranStorage';

const tabs = [
  { id: 'surah', label: 'Sourate', icon: <BookOpen size={14} /> },
  { id: 'juz', label: 'Juz', icon: <Moon size={14} /> },
  { id: 'hifz', label: 'Mémorisation', icon: <Star size={14} /> },
  { id: 'search', label: 'Recherche', icon: <SearchCode size={14} /> },
];

export default function QuranPage() {
  const [activeTab, setActiveTab] = useState('surah');
  const [search, setSearch] = useState('');
  const { memorizations, updateStatus } = useQuranMemorization();
  const { position } = useQuranPosition();

  // Full-text search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<QuranSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);

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

  const handleFullTextSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    const data = await searchQuran(searchQuery);
    setSearchResults(data.results);
    setSearchTotal(data.totalResults);
    setSearchLoading(false);
  }, [searchQuery]);

  const hasPosition = position.surahNumber >= 1 && (position.surahNumber > 1 || position.ayahNumber > 1);
  const positionSurah = SURAH_LIST[position.surahNumber - 1];

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

      {/* Resume reading banner */}
      {hasPosition && positionSurah && (
        <div className="px-4 pt-3">
          <button
            onClick={() => { window.location.href = `/quran/${position.surahNumber}`; }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
            style={{
              background: 'rgba(46,158,140,0.08)',
              border: '1px solid rgba(46,158,140,0.15)',
              cursor: 'pointer',
            }}
          >
            <BookOpenCheck size={18} style={{ color: 'var(--accent)' }} />
            <div className="flex-1 text-left">
              <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                Reprendre la lecture
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {positionSurah.name} ({positionSurah.nameAr}) • Verset {position.ayahNumber}
              </p>
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>→</span>
          </button>
        </div>
      )}

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

        {activeTab === 'search' && (
          <div className="space-y-4">
            {/* Search input */}
            <div className="flex gap-2">
              <div
                className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              >
                <Search size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Rechercher dans le Coran..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFullTextSearch()}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
              <button
                onClick={handleFullTextSearch}
                disabled={searchLoading || !searchQuery.trim()}
                className="px-4 py-2.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
                style={{
                  background: 'rgba(212,173,74,0.12)',
                  color: '#d4ad4a',
                  cursor: 'pointer',
                  opacity: searchLoading ? 0.6 : 1,
                }}
              >
                {searchLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              </button>
            </div>

            {/* Results */}
            {searchLoading && (
              <div className="flex items-center justify-center py-8 gap-3">
                <Loader2 size={20} className="animate-spin" style={{ color: '#d4ad4a' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Recherche en cours...</span>
              </div>
            )}

            {!searchLoading && searchResults.length > 0 && (
              <>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {searchTotal} résultat{searchTotal !== 1 ? 's' : ''} trouvé{searchTotal !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {searchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { window.location.href = `/quran/${r.surah}`; }}
                      className="w-full text-left rounded-xl p-3 transition-colors"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{ background: 'rgba(212,173,74,0.15)', color: '#d4ad4a' }}
                        >
                          {r.ayah}
                        </span>
                        <span className="text-xs font-medium" style={{ color: '#d4ad4a' }}>
                          {r.surahName} ({r.surahNameAr})
                        </span>
                      </div>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {r.highlightedText.replace(/<[^>]*>/g, '')}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {!searchLoading && searchQuery && searchResults.length === 0 && searchTotal === 0 && (
              <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                Aucun résultat trouvé
              </div>
            )}

            {!searchQuery && (
              <div className="py-8 text-center space-y-2">
                <SearchCode size={32} className="mx-auto" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Recherchez un mot ou un thème dans tout le Coran
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
