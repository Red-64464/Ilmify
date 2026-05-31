'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Focus,
  Sparkles,
  MessageSquare,
  BookOpen,
  GraduationCap,
  Calendar,
  Search,
  Loader2,
} from 'lucide-react';
import {
  SURAH_LIST,
  getArabicSurah,
  getSurahTranslation,
  getTransliteration,
  getSurahAudio,
  getAudioUrl,
  reciterNeedsApi,
  getTranslationKey,
} from '@/lib/api/quranApi';
import {
  generateSurahSummary,
  generateSurahQuiz,
  generateSurahFlashcards,
  generateHifzPlan,
  generateThematicExplanation,
} from '@/lib/ai/groq';
import type {
  SurahQuizQuestion,
  SurahFlashcard,
  HifzPlanResult,
} from '@/lib/ai/groq';
import dynamic from 'next/dynamic';
import { useQuranBookmarks, useQuranMemorization, useQuranPosition, useQuranSettings } from '@/lib/quranStorage';
import AyahDisplay from '@/components/quran/AyahDisplay';
import ReciterSelector from '@/components/quran/ReciterSelector';
import Skeleton from '@/components/ui/Skeleton';

const QuranAudioPlayer = dynamic(() => import('@/components/quran/QuranAudioPlayer'), {
  ssr: false,
  loading: () => <div className="skeleton rounded-2xl" style={{ height: '5rem' }} aria-hidden="true" />,
});

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
  const router = useRouter();

  const [ayahs, setAyahs] = useState<AyahData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [audioIndex, setAudioIndex] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // New feature states
  const [focusMode, setFocusMode] = useState(false);
  const [listenOnlyMode, setListenOnlyMode] = useState(false);
  const [translationFontSize, setTranslationFontSize] = useState(0.875); // rem
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [surahSummary, setSurahSummary] = useState<string | null>(null);
  const [surahQuiz, setSurahQuiz] = useState<SurahQuizQuestion[] | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [surahFlashcards, setSurahFlashcards] = useState<SurahFlashcard[] | null>(null);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [hifzPlan, setHifzPlan] = useState<HifzPlanResult | null>(null);
  const [hifzWeeks] = useState(4);
  const [thematicSearch, setThematicSearch] = useState('');
  const [thematicResult, setThematicResult] = useState<{ introduction: string; verses: { surah: number; ayah: number; surahName: string; explanation: string }[]; conclusion: string } | null>(null);
  const [basmalAnimated] = useState(true);
  const [tajwidEnabled, setTajwidEnabled] = useState(false);

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
    const needsApiAudio = reciterNeedsApi(settings.reciterId);

    Promise.all([
      getArabicSurah(surahNum),
      getSurahTranslation(surahNum, translationKey),
      getTransliteration(surahNum),
      // Always fetch from Quran.com API for reliable audio across all reciters
      getSurahAudio(surahNum, settings.reciterId),
    ])
      .then(([arabicVerses, translations, transliterations, audioUrls]) => {
        const data: AyahData[] = arabicVerses.map((v, i) => ({
          ayah: getAyahNumber(v, i),
          arabic: v.text_uthmani,
          transliteration: transliterations[i]?.text ?? '',
          translation: translations[i]?.translation ?? '',
          audioUrl: audioUrls[i] || (needsApiAudio ? '' : getAudioUrl(surahNum, i + 1, settings.reciterId)),
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

  // Auto-scroll to the ayah being played
  useEffect(() => {
    if (!showPlayer) return;
    const ayahNum = audioIndex + 1;
    const el = ayahRefs.current.get(ayahNum);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [audioIndex, showPlayer]);

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
      router.push(`/quran/${next}`);
    }
  };

  const handleNextSurah = () => {
    if (surahNum < 114) {
      router.push(`/quran/${surahNum + 1}`);
    }
  };

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeReading = () => {
    if (position.surahNumber !== surahNum) {
      router.push(`/quran/${position.surahNumber}`);
      return;
    }
    const el = ayahRefs.current.get(position.ayahNumber);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // AI handlers
  const versesText = ayahs.map(a => `${a.ayah}. ${a.arabic}\n${a.translation}`).join('\n\n');

  const handleSurahSummary = async () => {
    if (surahSummary || !surahInfo) return;
    setAiLoading('summary');
    try {
      const result = await generateSurahSummary(surahNum, surahInfo.name, versesText.slice(0, 6000));
      setSurahSummary(result);
    } catch { setSurahSummary('Erreur lors de la génération du résumé.'); }
    setAiLoading(null);
  };

  const handleSurahQuiz = async () => {
    if (surahQuiz || !surahInfo) return;
    setAiLoading('quiz');
    try {
      const result = await generateSurahQuiz(surahNum, surahInfo.name, versesText.slice(0, 6000));
      setSurahQuiz(result);
    } catch { setSurahQuiz([]); }
    setAiLoading(null);
  };

  const handleSurahFlashcards = async () => {
    if (surahFlashcards || !surahInfo) return;
    setAiLoading('flashcards');
    try {
      const result = await generateSurahFlashcards(surahNum, surahInfo.name, versesText.slice(0, 6000));
      setSurahFlashcards(result);
    } catch { setSurahFlashcards([]); }
    setAiLoading(null);
  };

  const handleHifzPlan = async () => {
    if (hifzPlan || !surahInfo) return;
    setAiLoading('hifz');
    try {
      const result = await generateHifzPlan(surahNum, surahInfo.name, surahInfo.ayahCount, hifzWeeks);
      setHifzPlan(result);
    } catch { setHifzPlan(null); }
    setAiLoading(null);
  };

  const handleThematicSearch = async () => {
    if (!thematicSearch.trim()) return;
    setAiLoading('thematic');
    try {
      const result = await generateThematicExplanation(thematicSearch);
      setThematicResult(result);
    } catch { setThematicResult(null); }
    setAiLoading(null);
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
        className="sticky top-0 z-30 px-3 py-2.5 flex items-center gap-2"
        style={{
          background: 'rgba(6,18,15,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => { router.push('/quran'); }}
          className="p-2 rounded-xl flex-shrink-0"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {surahInfo.name}
          </h1>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {surahInfo.revelationType === 'Meccan' ? 'Mecquoise' : 'Médinoise'} · {surahInfo.ayahCount}v · Juz {surahInfo.juzStart}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
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
                    onClick={() => { router.push('/quran/bookmarks'); }}
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

              {/* Row 5: Translation font size */}
              <div className="flex items-center gap-3">
                <Type size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Taille traduction</span>
                <input
                  type="range"
                  min={0.7}
                  max={1.3}
                  step={0.05}
                  value={translationFontSize}
                  onChange={(e) => setTranslationFontSize(parseFloat(e.target.value))}
                  className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: '#d4ad4a' }}
                />
                <span className="text-xs font-mono w-10 text-right" style={{ color: 'var(--text-muted)' }}>
                  {translationFontSize.toFixed(1)}x
                </span>
              </div>

              {/* Row 6: Focus mode */}
              <div className="flex items-center gap-3">
                <Focus size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Mode focus (arabe seul)</span>
                <button
                  onClick={() => setFocusMode(v => !v)}
                  className="ml-auto px-3 py-1 rounded-lg text-xs font-medium"
                  style={{
                    background: focusMode ? 'rgba(212,173,74,0.2)' : 'var(--bg-card)',
                    color: focusMode ? '#d4ad4a' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {focusMode ? 'Actif' : 'Désactivé'}
                </button>
              </div>

              {/* Row 6b: Tajwid mode */}
              <div className="flex items-center gap-3">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>🎨</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Mode tajwid (couleurs)</span>
                <button
                  onClick={() => setTajwidEnabled(v => !v)}
                  className="ml-auto px-3 py-1 rounded-lg text-xs font-medium"
                  style={{
                    background: tajwidEnabled ? 'rgba(46,158,140,0.2)' : 'var(--bg-card)',
                    color: tajwidEnabled ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {tajwidEnabled ? 'Actif' : 'Désactivé'}
                </button>
              </div>

              {/* Row 7: AI features button */}
              <button
                onClick={() => { setShowAiPanel(v => !v); setShowSettings(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,173,74,0.1), rgba(46,158,140,0.08))',
                  color: '#d4ad4a',
                  border: '1px solid rgba(212,173,74,0.15)',
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={14} />
                Outils IA (résumé, quiz, flashcards, hifz...)
              </button>
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
        className="px-4 py-4 text-center relative overflow-hidden"
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

        {/* Animated Bismillah (except At-Tawbah, surah 9) */}
        {surahNum !== 9 && basmalAnimated && (
          <motion.p
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
            className="font-arabic text-lg mt-3 relative"
            style={{ color: 'var(--text-secondary)', direction: 'rtl', lineHeight: '2' }}
          >
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </motion.p>
        )}
        {surahNum !== 9 && !basmalAnimated && (
          <p
            className="font-arabic text-lg mt-3 relative"
            style={{ color: 'var(--text-secondary)', direction: 'rtl', lineHeight: '2' }}
          >
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>
        )}
      </div>

      {/* Listen-only mode overlay */}
      <AnimatePresence>
        {listenOnlyMode && showPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: '#000' }}
          >
            <div className="text-center space-y-6 px-6 w-full max-w-md">
              <p className="text-xs" style={{ color: 'rgba(212,173,74,0.5)' }}>
                {surahInfo.name} ({surahInfo.nameAr})
              </p>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(212,173,74,0.1)', border: '2px solid rgba(212,173,74,0.3)' }}>
                <span className="text-2xl font-bold" style={{ color: '#d4ad4a' }}>{audioIndex + 1}</span>
              </div>
              <p className="font-arabic text-xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)', direction: 'rtl' }}>
                {ayahs[audioIndex]?.arabic || ''}
              </p>
              <div className="pt-4">
                <QuranAudioPlayer
                  audioUrls={audioUrls}
                  currentIndex={audioIndex}
                  onIndexChange={(idx) => { setAudioIndex(idx); setAudioProgress(0); }}
                  onProgress={setAudioProgress}
                  surahNumber={surahNum}
                  onNextSurah={handleNextSurah}
                  onListenOnlyToggle={(v) => setListenOnlyMode(v)}
                  isListenOnly={listenOnlyMode}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio player (sticky) */}
      <AnimatePresence>
        {showPlayer && audioUrls.length > 0 && !listenOnlyMode && (
          <div className="px-4 pt-4 sticky top-[52px] z-20">
            <QuranAudioPlayer
              audioUrls={audioUrls}
              currentIndex={audioIndex}
              onIndexChange={(idx) => { setAudioIndex(idx); setAudioProgress(0); }}
              onProgress={setAudioProgress}
              surahNumber={surahNum}
              onNextSurah={handleNextSurah}
              onListenOnlyToggle={(v) => setListenOnlyMode(v)}
              isListenOnly={listenOnlyMode}
            />
          </div>
        )}
      </AnimatePresence>

      {/* AI Panel */}
      <AnimatePresence>
        {showAiPanel && !loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pt-4 space-y-3">
              {/* AI Panel Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} style={{ color: '#d4ad4a' }} />
                  <span className="text-xs font-medium" style={{ color: '#d4ad4a' }}>Outils IA</span>
                </div>
                <button onClick={() => setShowAiPanel(false)} className="p-1" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </div>

              {/* AI Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'summary', icon: <MessageSquare size={14} />, label: 'Résumé', handler: handleSurahSummary },
                  { key: 'quiz', icon: <GraduationCap size={14} />, label: 'Quiz', handler: handleSurahQuiz },
                  { key: 'flashcards', icon: <BookOpen size={14} />, label: 'Flashcards', handler: handleSurahFlashcards },
                  { key: 'hifz', icon: <Calendar size={14} />, label: 'Plan Hifz', handler: handleHifzPlan },
                ].map(({ key, icon, label, handler }) => (
                  <button
                    key={key}
                    onClick={handler}
                    disabled={aiLoading === key}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      opacity: aiLoading === key ? 0.6 : 1,
                    }}
                  >
                    {aiLoading === key ? <Loader2 size={14} className="animate-spin" /> : icon}
                    {label}
                  </button>
                ))}
              </div>

              {/* Thematic search */}
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                  <Search size={12} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Que dit le Coran sur... (ex: patience)"
                    value={thematicSearch}
                    onChange={(e) => setThematicSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleThematicSearch()}
                    className="flex-1 bg-transparent text-xs outline-none"
                    style={{ color: 'var(--text-primary)' }}
                  />
                </div>
                <button
                  onClick={handleThematicSearch}
                  disabled={aiLoading === 'thematic' || !thematicSearch.trim()}
                  className="px-3 py-2 rounded-xl text-xs"
                  style={{ background: 'rgba(212,173,74,0.12)', color: '#d4ad4a', cursor: 'pointer' }}
                >
                  {aiLoading === 'thematic' ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                </button>
              </div>

              {/* Summary result */}
              {surahSummary && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(46,158,140,0.06)', borderLeft: '3px solid var(--accent)' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MessageSquare size={12} style={{ color: 'var(--accent)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Résumé de la sourate</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{surahSummary}</p>
                </div>
              )}

              {/* Quiz result */}
              {surahQuiz && surahQuiz.length > 0 && (
                <div className="rounded-xl p-3 space-y-3" style={{ background: 'rgba(212,173,74,0.04)', border: '1px solid rgba(212,173,74,0.1)' }}>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap size={12} style={{ color: '#d4ad4a' }} />
                    <span className="text-xs font-medium" style={{ color: '#d4ad4a' }}>Quiz - {surahInfo.name}</span>
                  </div>
                  {surahQuiz.map((q, qi) => (
                    <div key={qi} className="space-y-1.5">
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{qi + 1}. {q.question}</p>
                      <div className="space-y-1">
                        {q.options.map((opt, oi) => {
                          const answered = quizAnswers[qi] !== undefined;
                          const isCorrect = oi === q.correctIndex;
                          const isSelected = quizAnswers[qi] === oi;
                          return (
                            <button
                              key={oi}
                              onClick={() => { if (!answered) setQuizAnswers(prev => ({ ...prev, [qi]: oi })); }}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] transition-colors"
                              style={{
                                background: answered
                                  ? isCorrect ? 'rgba(58,170,96,0.15)' : isSelected ? 'rgba(220,38,38,0.12)' : 'var(--bg-elevated)'
                                  : 'var(--bg-elevated)',
                                color: answered
                                  ? isCorrect ? '#3aaa60' : isSelected ? '#dc2626' : 'var(--text-muted)'
                                  : 'var(--text-secondary)',
                                border: `1px solid ${answered && isCorrect ? 'rgba(58,170,96,0.3)' : 'var(--border-subtle)'}`,
                                cursor: answered ? 'default' : 'pointer',
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {quizAnswers[qi] !== undefined && (
                        <p className="text-[10px] italic pl-2" style={{ color: 'var(--text-muted)' }}>{q.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Flashcards result */}
              {surahFlashcards && surahFlashcards.length > 0 && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(46,158,140,0.04)', border: '1px solid rgba(46,158,140,0.1)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={12} style={{ color: 'var(--accent)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Flashcard {flashcardIndex + 1}/{surahFlashcards.length}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setFlashcardIndex(Math.max(0, flashcardIndex - 1)); setFlashcardFlipped(false); }} className="px-2 py-1 rounded text-[10px]" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'pointer' }}>←</button>
                      <button onClick={() => { setFlashcardIndex(Math.min(surahFlashcards.length - 1, flashcardIndex + 1)); setFlashcardFlipped(false); }} className="px-2 py-1 rounded text-[10px]" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'pointer' }}>→</button>
                    </div>
                  </div>
                  <button
                    onClick={() => setFlashcardFlipped(v => !v)}
                    className="w-full text-center py-4 rounded-xl transition-all"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                  >
                    {!flashcardFlipped ? (
                      <>
                        <p className="font-arabic text-xl" style={{ color: '#d4ad4a', direction: 'rtl' }}>{surahFlashcards[flashcardIndex]?.arabic}</p>
                        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Tap pour voir la signification</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs italic" style={{ color: 'var(--accent)' }}>{surahFlashcards[flashcardIndex]?.transliteration}</p>
                        <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{surahFlashcards[flashcardIndex]?.meaning}</p>
                        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{surahFlashcards[flashcardIndex]?.context}</p>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Hifz plan result */}
              {hifzPlan && (
                <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(212,173,74,0.04)', border: '1px solid rgba(212,173,74,0.1)' }}>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} style={{ color: '#d4ad4a' }} />
                    <span className="text-xs font-medium" style={{ color: '#d4ad4a' }}>Plan de mémorisation</span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    {hifzPlan.totalVerses} versets · ~{hifzPlan.versesPerDay} versets/jour
                  </p>
                  <p className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>{hifzPlan.advice}</p>
                  {hifzPlan.weeks.map((week, wi) => (
                    <div key={wi} className="pl-2">
                      <p className="text-[10px] font-medium" style={{ color: '#d4ad4a' }}>Semaine {week.week}</p>
                      <div className="flex gap-2 text-[10px] py-0.5">
                        <span style={{ color: 'var(--text-muted)' }}>{week.verses}</span>
                      </div>
                      <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>{week.tip}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Thematic search result */}
              {thematicResult && (
                <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(46,158,140,0.04)', border: '1px solid rgba(46,158,140,0.1)' }}>
                  <div className="flex items-center gap-1.5">
                    <Search size={12} style={{ color: 'var(--accent)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Recherche thématique</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{thematicResult.introduction}</p>
                  {thematicResult.verses.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => router.push(`/quran/${v.surah}`)}
                      className="w-full text-left rounded-lg p-2 transition-colors"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                    >
                      <span className="text-[10px] font-medium" style={{ color: '#d4ad4a' }}>{v.surahName} {v.surah}:{v.ayah}</span>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{v.explanation}</p>
                    </button>
                  ))}
                  <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>{thematicResult.conclusion}</p>
                </div>
              )}
            </div>
          </motion.div>
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
              transliteration={focusMode ? '' : ayahData.transliteration}
              translation={focusMode ? '' : ayahData.translation}
              audioUrl={ayahData.audioUrl}
              isBookmarked={isBookmarked(surahNum, ayahData.ayah)}
              isMemorized={isAyahMemorized(surahNum, ayahData.ayah)}
              onBookmark={() => toggleBookmark(surahNum, ayahData.ayah)}
              onMemorize={() => toggleAyahMemorized(surahNum, ayahData.ayah)}
              isPlaying={showPlayer && audioIndex === ayahData.ayah - 1}
              playProgress={showPlayer && audioIndex === ayahData.ayah - 1 ? audioProgress : undefined}
              onPlay={() => {
                setAudioIndex(ayahData.ayah - 1);
                setAudioProgress(0);
                setShowPlayer(true);
              }}
              arabicFontSize={settings.arabicFontSize}
              showTransliteration={!focusMode && settings.showTransliteration}
              tafsirLang={settings.translationLang}
              ayahRef={setAyahRef(ayahData.ayah)}
              translationFontSize={translationFontSize}
              tajwidEnabled={tajwidEnabled}
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
