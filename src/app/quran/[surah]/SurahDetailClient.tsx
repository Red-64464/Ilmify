'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Settings,
  X,
  Bookmark,
  Type,
  Globe,
  Eye,
  EyeOff,
  BookOpenCheck,
} from 'lucide-react';
import {
  SURAH_LIST,
  getArabicSurah,
  getSurahTranslation,
  getTransliteration,
  getAudioUrl,
  getTranslationKey,
} from '@/lib/api/quranApi';
import { useQuranBookmarks, useQuranMemorization, useQuranPosition, useQuranSettings } from '@/lib/quranStorage';
import AyahDisplay from '@/components/quran/AyahDisplay';
import QuranAudioPlayer from '@/components/quran/QuranAudioPlayer';
import ReciterSelector from '@/components/quran/ReciterSelector';
import Skeleton from '@/components/ui/Skeleton';

interface SurahDetailClientProps {
  surah: string;
}

interface AyahData {
  ayah: number;
  arabic: string;
  transliteration: string;
  translation: string;
  audioUrl: string;
}

/** Extract the ayah number from an Arabic verse object returned by the API. */
function getAyahNumber(verse: { id?: number; verse_key?: string }, fallbackIndex: number): number {
  if (verse.verse_key) {
    const part = verse.verse_key.split(':')[1];
    if (part) return parseInt(part, 10);
  }
  return fallbackIndex + 1;
}

export default function SurahDetailClient({ surah }: SurahDetailClientProps) {
  const surahNum = parseInt(surah, 10);
  const surahInfo = SURAH_LIST.find((s) => s.number === surahNum);

  const [ayahs, setAyahs] = useState<AyahData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [audioIndex, setAudioIndex] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { settings, updateSettings } = useQuranSettings();
  const { isBookmarked, toggleBookmark } = useQuranBookmarks();
  const { isAyahMemorized, toggleAyahMemorized } = useQuranMemorization();
  const { position, savePosition } = useQuranPosition();
  const containerRef = useRef<HTMLDivElement>(null);
  const ayahRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const visibleAyahRef = useRef(1);
  const hasScrolledToSaved = useRef(false);

  // Register ayah element refs for IntersectionObserver
  const setAyahRef = useCallback((ayahNum: number) => (el: HTMLDivElement | null) => {
    if (el) {
      ayahRefs.current.set(ayahNum, el);
    } else {
      ayahRefs.current.delete(ayahNum);
    }
  }, []);

  // Load ayah data
  useEffect(() => {
    if (!surahInfo || isNaN(surahNum)) return;
    setLoading(true);
    setError(null);

    const translationKey = getTranslationKey(settings.translationLang);

    Promise.all([
      getArabicSurah(surahNum),
      getSurahTranslation(surahNum, translationKey),
      getTransliteration(surahNum),
    ])
      .then(([arabicVerses, translations, transliterations]) => {
        const data: AyahData[] = arabicVerses.map((v, i) => ({
          ayah: getAyahNumber(v, i),
          arabic: v.text_uthmani,
          transliteration: transliterations[i]?.text ?? '',
          translation: translations[i]?.translation ?? '',
          audioUrl: getAudioUrl(surahNum, i + 1, settings.reciterId),
        }));
        setAyahs(data);
      })
      .catch(() => setError('Impossible de charger cette sourate. Vérifiez votre connexion.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahNum, settings.reciterId, settings.translationLang]);

  // IntersectionObserver to track visible ayah for reading position
  useEffect(() => {
    const container = containerRef.current;
    if (!container || ayahs.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const ayahNum = parseInt((entry.target as HTMLElement).dataset.ayah || '1', 10);
            if (!isNaN(ayahNum)) {
              visibleAyahRef.current = ayahNum;
            }
          }
        }
      },
      { root: container, rootMargin: '-30% 0px -60% 0px', threshold: 0.1 }
    );

    ayahRefs.current.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [ayahs]);

  // Save position periodically on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container || ayahs.length === 0) return;

    let timeout: ReturnType<typeof setTimeout>;
    const handler = () => {
      setShowScrollTop(container.scrollTop > 300);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        savePosition(surahNum, visibleAyahRef.current);
      }, 1000);
    };
    container.addEventListener('scroll', handler);
    return () => {
      container.removeEventListener('scroll', handler);
      clearTimeout(timeout);
    };
  }, [surahNum, ayahs.length, savePosition]);

  // Scroll to saved position on first load
  useEffect(() => {
    if (hasScrolledToSaved.current || ayahs.length === 0) return;
    if (position.surahNumber === surahNum && position.ayahNumber > 1) {
      const el = ayahRefs.current.get(position.ayahNumber);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
    hasScrolledToSaved.current = true;
  }, [ayahs, position, surahNum]);

  // Save position on unmount
  useEffect(() => {
    return () => {
      if (surahNum && visibleAyahRef.current > 0) {
        savePosition(surahNum, visibleAyahRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahNum]);

  const navigateSurah = (delta: number) => {
    const next = surahNum + delta;
    if (next >= 1 && next <= 114) {
      window.location.href = `/quran/${next}`;
    }
  };

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeReading = () => {
    if (position.surahNumber !== surahNum) {
      window.location.href = `/quran/${position.surahNumber}`;
      return;
    }
    const el = ayahRefs.current.get(position.ayahNumber);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const audioUrls = ayahs.map((a) => a.audioUrl);

  if (!surahInfo || isNaN(surahNum)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Sourate introuvable.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen overflow-y-auto pb-32"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{
          background: 'rgba(6,18,15,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => { window.location.href = '/quran'; }}
          className="p-2 rounded-xl"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {surahInfo.name}
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {surahInfo.revelationType === 'Meccan' ? 'Mecquoise' : 'Médinoise'} • {surahInfo.ayahCount} versets • Juz {surahInfo.juzStart}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ReciterSelector
            value={settings.reciterId}
            onChange={(id) => updateSettings({ reciterId: id })}
          />
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="p-2 rounded-xl"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div className="px-4 py-3 space-y-3">
              {/* Row 1: Quick actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowPlayer((v) => !v)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                    style={{
                      background: showPlayer ? 'var(--accent)' : 'var(--bg-card)',
                      color: showPlayer ? '#fff' : 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    Lecteur audio
                  </button>
                  <button
                    onClick={() => { window.location.href = '/quran/bookmarks'; }}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    <Bookmark size={12} />
                    Favoris
                  </button>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1.5 rounded-lg"
                  style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Row 2: Arabic font size slider */}
              <div className="flex items-center gap-3">
                <Type size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Taille arabe</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.25}
                  value={settings.arabicFontSize}
                  onChange={(e) => updateSettings({ arabicFontSize: parseFloat(e.target.value) })}
                  className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: '#d4ad4a' }}
                />
                <span className="text-xs font-mono w-10 text-right" style={{ color: 'var(--text-muted)' }}>
                  {settings.arabicFontSize.toFixed(1)}x
                </span>
              </div>

              {/* Row 3: Translation language */}
              <div className="flex items-center gap-3">
                <Globe size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Traduction</span>
                <div className="flex gap-1 ml-auto">
                  {(['fr', 'en'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => updateSettings({ translationLang: lang })}
                      className="px-3 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: settings.translationLang === lang ? 'var(--accent)' : 'var(--bg-card)',
                        color: settings.translationLang === lang ? '#fff' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      {lang === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 4: Toggle transliteration */}
              <div className="flex items-center gap-3">
                {settings.showTransliteration ? <Eye size={14} style={{ color: 'var(--text-muted)' }} /> : <EyeOff size={14} style={{ color: 'var(--text-muted)' }} />}
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Translitération</span>
                <button
                  onClick={() => updateSettings({ showTransliteration: !settings.showTransliteration })}
                  className="ml-auto px-3 py-1 rounded-lg text-xs font-medium"
                  style={{
                    background: settings.showTransliteration ? 'var(--accent)' : 'var(--bg-card)',
                    color: settings.showTransliteration ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {settings.showTransliteration ? 'Visible' : 'Masqué'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resume reading banner */}
      {!loading && position.surahNumber === surahNum && position.ayahNumber > 1 && (
        <div className="px-4 pt-3">
          <button
            onClick={handleResumeReading}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors"
            style={{
              background: 'rgba(46,158,140,0.1)',
              color: 'var(--accent)',
              border: '1px solid rgba(46,158,140,0.2)',
              cursor: 'pointer',
            }}
          >
            <BookOpenCheck size={14} />
            Reprendre la lecture au verset {position.ayahNumber}
          </button>
        </div>
      )}

      {/* Decorative banner */}
      <div
        className="px-4 py-6 text-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(212,173,74,0.1) 0%, rgba(46,158,140,0.06) 100%)',
          borderBottom: '1px solid rgba(212,173,74,0.08)',
        }}
      >
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pattern-surah" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="1" fill="#d4ad4a" />
                <polygon points="15,2 17,11 26,11 19,17 21,26 15,21 9,26 11,17 4,11 13,11" fill="none" stroke="#d4ad4a" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern-surah)" />
          </svg>
        </div>

        <p
          className="font-arabic text-3xl font-bold relative"
          style={{ color: '#d4ad4a', direction: 'rtl', lineHeight: '1.8' }}
        >
          {surahInfo.nameAr}
        </p>
        <p className="text-sm font-medium mt-1 relative" style={{ color: 'var(--text-secondary)' }}>
          {surahInfo.name}
        </p>
        <p className="text-xs mt-0.5 relative" style={{ color: 'var(--text-muted)' }}>
          {surahInfo.revelationType === 'Meccan' ? 'Mecquoise' : 'Médinoise'} • {surahInfo.ayahCount} versets
        </p>

        {/* Bismillah (except At-Tawbah, surah 9) */}
        {surahNum !== 9 && (
          <p
            className="font-arabic text-lg mt-3 relative"
            style={{ color: 'var(--text-secondary)', direction: 'rtl', lineHeight: '2' }}
          >
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>
        )}
      </div>

      {/* Audio player */}
      <AnimatePresence>
        {showPlayer && audioUrls.length > 0 && (
          <div className="px-4 pt-4">
            <QuranAudioPlayer
              audioUrls={audioUrls}
              currentIndex={audioIndex}
              onIndexChange={setAudioIndex}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Ayahs */}
      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-4 space-y-3"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            >
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="text" width="100%" height="2rem" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="90%" />
            </div>
          ))
        ) : error ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          >
            <p style={{ color: 'var(--text-muted)' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 rounded-xl text-sm"
              style={{ background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}
            >
              Réessayer
            </button>
          </div>
        ) : (
          ayahs.map((ayahData) => (
            <AyahDisplay
              key={ayahData.ayah}
              surah={surahNum}
              ayah={ayahData.ayah}
              arabic={ayahData.arabic}
              transliteration={ayahData.transliteration}
              translation={ayahData.translation}
              audioUrl={ayahData.audioUrl}
              isBookmarked={isBookmarked(surahNum, ayahData.ayah)}
              isMemorized={isAyahMemorized(surahNum, ayahData.ayah)}
              onBookmark={() => toggleBookmark(surahNum, ayahData.ayah)}
              onMemorize={() => toggleAyahMemorized(surahNum, ayahData.ayah)}
              isPlaying={showPlayer && audioIndex === ayahData.ayah - 1}
              onPlay={() => {
                setAudioIndex(ayahData.ayah - 1);
                setShowPlayer(true);
              }}
              arabicFontSize={settings.arabicFontSize}
              showTransliteration={settings.showTransliteration}
              ayahRef={setAyahRef(ayahData.ayah)}
            />
          ))
        )}
      </div>

      {/* Navigation */}
      <div className="px-4 pt-6 flex items-center justify-between gap-3">
        <button
          onClick={() => navigateSurah(-1)}
          disabled={surahNum <= 1}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium disabled:opacity-40"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
        >
          <ChevronLeft size={16} />
          Précédent
        </button>

        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {surahNum} / 114
        </span>

        <button
          onClick={() => navigateSurah(1)}
          disabled={surahNum >= 114}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium disabled:opacity-40"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
        >
          Suivant
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Scroll to top FAB */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-24 right-4 w-10 h-10 rounded-full flex items-center justify-center z-40"
            style={{
              background: 'linear-gradient(135deg, #d4ad4a, #c49a3d)',
              color: '#06120f',
              boxShadow: '0 4px 12px rgba(212,173,74,0.3)',
              cursor: 'pointer',
            }}
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
