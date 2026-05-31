'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Persists across navigations within the same session (module-level).
// Prevents the stagger animation from replaying every time the user returns to home.
let _homeHasAnimated = false;

import {
  FileText, GraduationCap, BookOpen, Star, Sun,
  ChevronRight, BookMarked, Plus, LogIn, UserPlus,
  Flame, Brain, Layers, Zap, RefreshCw, Loader2,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import { useAuth } from '@/contexts/AuthContext';
import { topicRepository } from '@/lib/repositories/topicRepository';
import { courseRepository } from '@/lib/repositories/courseRepository';
import { bookRepository } from '@/lib/repositories/bookRepository';
import { activityRepository } from '@/lib/repositories/activityRepository';
import { withCache } from '@/lib/queryCache';
import { getRootCategories, getHadithsByCategory, getHadithDetail } from '@/lib/api/hadithApi';
import { getVerseTranslation, getArabicVerse, SURAH_LIST } from '@/lib/api/quranApi';

const quickLinks = [
  { href: '/topics', icon: FileText, label: 'Mes Topics', color: 'var(--accent)', gradient: 'linear-gradient(135deg, rgba(26,122,107,0.12), rgba(18,163,147,0.06))' },
  { href: '/courses', icon: GraduationCap, label: 'Cours', color: '#d4ad4a', gradient: 'linear-gradient(135deg, rgba(196,154,61,0.1), rgba(168,128,49,0.06))' },
  { href: '/library', icon: BookOpen, label: 'Bibliothèque', color: '#6366f1', gradient: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))' },
  { href: '/explore', icon: Star, label: 'Explorer', color: '#28c4b0', gradient: 'linear-gradient(135deg, rgba(18,163,147,0.1), rgba(40,196,176,0.06))' },
];

const typeIcons: Record<string, typeof Star> = {
  verse: BookOpen,
  hadith: BookMarked,
  quote: Star,
  reminder: Sun,
};

interface DailyData {
  content: string;
  contentAr?: string;
  source?: string;
  type: 'hadith' | 'verse' | 'quote' | 'reminder';
  date: string;
}

async function fetchDailyFromAPI(): Promise<DailyData> {
  const isHadith = Math.random() > 0.5;
  if (isHadith) {
    try {
      const cats = await getRootCategories('fr');
      const randomCat = cats[Math.floor(Math.random() * cats.length)];
      const result = await getHadithsByCategory(randomCat.id, 'fr');
      if (result.data && result.data.length > 0) {
        const randomH = result.data[Math.floor(Math.random() * result.data.length)];
        const detail = await getHadithDetail(randomH.id, 'fr');
        return {
          content: detail.hadeeth,
          source: detail.attribution || 'HadeethEnc',
          type: 'hadith',
          date: new Date().toISOString().split('T')[0],
        };
      }
    } catch { /* fallback to verse */ }
  }
  // Fetch random verse
  const randomSurah = Math.floor(Math.random() * 114) + 1;
  const maxAyah = SURAH_LIST[randomSurah - 1]?.ayahCount || 7;
  const randomAyah = Math.floor(Math.random() * maxAyah) + 1;
  const [trans, arabic] = await Promise.all([
    getVerseTranslation(randomSurah, randomAyah, 'french_hameedullah').catch(() => null),
    getArabicVerse(randomSurah, randomAyah).catch(() => ''),
  ]);
  return {
    content: trans?.translation || `Sourate ${randomSurah}, verset ${randomAyah}`,
    contentAr: arabic || '',
    source: `${SURAH_LIST[randomSurah - 1]?.name || 'Coran'}, verset ${randomAyah}`,
    type: 'verse',
    date: new Date().toISOString().split('T')[0],
  };
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [daily, setDaily] = useState<DailyData | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState(false);
  const [search, setSearch] = useState('');
  // Skip stagger on return visits — only animate on first load
  const isFirstLoad = useRef(!_homeHasAnimated);
  useEffect(() => { _homeHasAnimated = true; }, []);

  // Fetch daily reminder from APIs (cached in localStorage by date)
  const loadDaily = useCallback(async (forceRefresh = false) => {
    if (dailyLoading) return;
    const today = new Date().toISOString().split('T')[0];
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem('ilmify_daily');
        if (cached) {
          const parsed = JSON.parse(cached) as DailyData;
          if (parsed.date === today) { setDaily(parsed); return; }
        }
      } catch { /* ignore */ }
    }
    setDailyLoading(true);
    setDailyError(false);
    try {
      const data = await fetchDailyFromAPI();
      setDaily(data);
      localStorage.setItem('ilmify_daily', JSON.stringify(data));
    } catch {
      setDailyError(true);
    }
    setDailyLoading(false);
  }, [dailyLoading]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadDaily(); }, []);

  // Navigate to search page when user types (debounced)
  useEffect(() => {
    if (!search.trim()) return;
    const timeout = setTimeout(() => {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
    }, 400);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const [recentTopics, setRecentTopics] = useState<{ id: string; title: string; updatedAt: string; icon?: string }[]>([]);
  const [readingBooks, setReadingBooks] = useState<{ id: string; title: string; author: string; progress?: number }[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<{ id: string; title: string; description?: string; icon?: string }[]>([]);
  const [streak, setStreak] = useState(0);
  const [todayStats, setTodayStats] = useState<{ quiz: number; flashcard: number; total: number }>({ quiz: 0, flashcard: 0, total: 0 });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [showFab, setShowFab] = useState(false);

  useEffect(() => {
    if (!user) { setDashboardLoading(false); return; }
    Promise.all([
      withCache(`topics:${user.id}:4`, () => topicRepository.listByUser(user.id, 4), 120_000).catch(() => [] as { id: string; title: string; updatedAt: string; icon?: string }[]),
      withCache(`books:reading:${user.id}`, () => bookRepository.listBooks(user.id, { status: 'reading' }), 120_000).catch(() => [] as { id: string; title: string; author: string; progress?: number }[]),
      withCache('courses:featured:3', () => courseRepository.listPages(3), 300_000).catch(() => [] as { id: string; title: string; description?: string; icon?: string }[]),
      withCache(`streak:${user.id}`, () => activityRepository.getStreak(user.id), 300_000).catch(() => 0),
      withCache(`today:${user.id}`, () => activityRepository.getTodayActivities(user.id), 60_000).catch(() => [] as { activity_type: string; count: number }[]),
    ]).then(([topics, books, courses, streakVal, acts]) => {
      setRecentTopics(topics.map((t) => ({ id: t.id, title: t.title, updatedAt: t.updatedAt, icon: t.icon })));
      setReadingBooks(books.map((b) => ({ id: b.id, title: b.title, author: b.author, progress: b.progress })));
      setFeaturedCourses(courses.map((c) => ({ id: c.id, title: c.title, description: c.description, icon: c.icon })));
      setStreak(streakVal as number);
      const activities = acts as { activity_type: string; count: number }[];
      const quiz = activities.filter((a) => a.activity_type === 'quiz').reduce((s, a) => s + a.count, 0);
      const flashcard = activities.filter((a) => a.activity_type === 'flashcard').reduce((s, a) => s + a.count, 0);
      setTodayStats({ quiz, flashcard, total: quiz + flashcard });
      setDashboardLoading(false);
    });
  }, [user]);

  const DailyIcon = daily ? typeIcons[daily.type] || Star : Star;

  // If not logged in, show welcome screen
  if (!isLoading && !user) {
    return (
      <motion.div
        className="min-h-[80vh] flex flex-col items-center justify-center py-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div className="relative mb-6 h-24 w-24">
          <Image src="/logo.png" alt="Ilmify" fill className="object-contain" priority />
        </div>
        <h1 className="text-3xl font-bold font-heading tracking-tight mb-2" style={{ color: '#d4ad4a' }}>
          Ilmify
        </h1>
        <p className="text-sm text-center max-w-xs leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
          Votre espace personnel de savoir islamique. Organisez, étudiez et approfondissez vos connaissances.
        </p>

        {/* Daily reminder */}
        {daily && (
          <div
            className="w-full max-w-sm rounded-2xl p-5 mb-8"
            style={{
              background: 'rgba(196,154,61,0.05)',
              border: '1px solid rgba(196,154,61,0.08)',
            }}
          >
            <Badge variant="gold" size="sm" className="mb-2">Rappel du jour</Badge>
            <p className="text-sm leading-[1.8]" style={{ color: 'var(--text-primary)' }}>
              {daily.content}
            </p>
            {daily.source && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{daily.source}</p>
            )}
          </div>
        )}
        {dailyLoading && (
          <div className="w-full max-w-sm flex items-center justify-center py-4 mb-8">
            <Loader2 size={18} className="animate-spin" style={{ color: '#d4ad4a' }} />
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            variant="primary"
            size="lg"
            iconLeft={<LogIn size={18} />}
            onClick={() => router.push('/login')}
            className="w-full"
          >
            Se connecter
          </Button>
          <Button
            variant="secondary"
            size="lg"
            iconLeft={<UserPlus size={18} />}
            onClick={() => router.push('/signup')}
            className="w-full"
          >
            Créer un compte
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-10 py-6 pb-10"
      variants={stagger}
      initial={isFirstLoad.current ? 'hidden' : 'visible'}
      animate="visible"
    >
      {/* ===== Hero ===== */}
      <motion.section variants={fadeUp} className="relative">
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
          style={{
            background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
            boxShadow: 'var(--shadow-elevated), var(--shadow-glow-green)',
          }}
        >
          {/* Subtle ambient glow */}
          <div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(26,122,107,0.1) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(196,154,61,0.06) 0%, transparent 70%)' }}
          />

          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight mb-2"
              style={{ color: '#d4ad4a' }}
            >
              As-salamu alaykum{user ? `, ${user.displayName}` : ''}
            </h1>
            <p className="text-sm sm:text-base max-w-md leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Bienvenue sur <span style={{ color: 'var(--accent)' }} className="font-semibold">Ilmify</span>, votre espace
              de savoir islamique.
            </p>
          </div>
        </div>
      </motion.section>

      {/* ===== Search ===== */}
      <motion.section variants={fadeUp}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher dans tout Ilmify..."
        />
      </motion.section>

      {/* ===== Daily Reminder ===== */}
      {(daily || dailyLoading || dailyError) && (
        <motion.section variants={fadeUp}>
          <div
            className="relative overflow-hidden rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(196,154,61,0.06) 0%, var(--bg-card) 50%, rgba(26,122,107,0.04) 100%)',
              boxShadow: 'var(--shadow-card), var(--shadow-glow-gold)',
              border: '1px solid rgba(196,154,61,0.08)',
            }}
          >
            {dailyLoading ? (
              <div className="flex items-center justify-center py-6 gap-3">
                <Loader2 size={20} className="animate-spin" style={{ color: '#d4ad4a' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Chargement du rappel...</span>
              </div>
            ) : dailyError && !daily ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Impossible de charger le rappel du jour</p>
                <button
                  onClick={() => loadDaily(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                  style={{ background: 'rgba(196,154,61,0.1)', color: '#d4ad4a' }}
                >
                  <RefreshCw size={12} /> Réessayer
                </button>
              </div>
            ) : daily && (
            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(196,154,61,0.15), rgba(196,154,61,0.08))',
                }}
              >
                <DailyIcon size={20} style={{ color: '#d4ad4a' }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="gold" size="sm">Rappel du jour</Badge>
                  <button
                    onClick={() => loadDaily(true)}
                    className="p-1 rounded-lg cursor-pointer transition-colors ml-auto"
                    style={{ color: 'var(--text-muted)' }}
                    title="Autre rappel"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>
                <p className="text-sm leading-[1.8]" style={{ color: 'var(--text-primary)' }}>
                  {daily.content}
                </p>
                {daily.contentAr && (
                  <p
                    className="mt-3 text-right text-lg font-arabic leading-[2]"
                    style={{ color: '#d4ad4a' }}
                  >
                    {daily.contentAr}
                  </p>
                )}
                {daily.source && (
                  <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {daily.source}
                  </p>
                )}
              </div>
            </div>
            )}
          </div>
        </motion.section>
      )}

      {/* ===== Learning Stats ===== */}
      {user && (
        <motion.section variants={fadeUp}>
          <SectionHeader title="Mes stats" />
          <div className="grid grid-cols-3 gap-3 mt-5">
            {dashboardLoading ? (
              <>
                <div className="skeleton rounded-2xl h-24" />
                <div className="skeleton rounded-2xl h-24" />
                <div className="skeleton rounded-2xl h-24" />
              </>
            ) : (
              <>
                <div
                  className="rounded-2xl p-4 text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))',
                    border: '1px solid rgba(245,158,11,0.1)',
                  }}
                >
                  <Flame size={22} className="mx-auto mb-2" style={{ color: '#f59e0b' }} />
                  <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{streak}</p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {streak <= 1 ? 'jour' : 'jours'} de suite
                  </p>
                </div>
                <div
                  className="rounded-2xl p-4 text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.03))',
                    border: '1px solid rgba(99,102,241,0.1)',
                  }}
                >
                  <Brain size={22} className="mx-auto mb-2" style={{ color: '#6366f1' }} />
                  <p className="text-2xl font-bold" style={{ color: '#6366f1' }}>{todayStats.quiz}</p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Quiz aujourd&apos;hui</p>
                </div>
                <div
                  className="rounded-2xl p-4 text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(46,158,140,0.08), rgba(46,158,140,0.03))',
                    border: '1px solid rgba(46,158,140,0.1)',
                  }}
                >
                  <Layers size={22} className="mx-auto mb-2" style={{ color: '#2e9e8c' }} />
                  <p className="text-2xl font-bold" style={{ color: '#2e9e8c' }}>{todayStats.flashcard}</p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Cartes révisées</p>
                </div>
              </>
            )}
          </div>
        </motion.section>
      )}

      {/* ===== Quick Access ===== */}
      <motion.section variants={fadeUp}>
        <SectionHeader title="Accès rapide" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
                className="rounded-2xl p-4 text-center transition-all duration-200"
                style={{
                  background: link.gradient,
                  boxShadow: 'var(--shadow-card)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: `${link.color}15` }}
                >
                  <link.icon size={22} style={{ color: link.color }} strokeWidth={1.8} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {link.label}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ===== Quick Actions ===== */}
      {user && (
        <motion.section variants={fadeUp}>
          <SectionHeader title="Actions rapides" />
          <div className="flex gap-3 mt-5 overflow-x-auto scrollbar-none -mx-5 px-5">
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Plus size={14} />}
              onClick={() => router.push('/topics')}
            >
              Nouveau topic
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<BookOpen size={14} />}
              onClick={() => router.push('/library')}
            >
              Ajouter un livre
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<GraduationCap size={14} />}
              onClick={() => router.push('/courses')}
            >
              Voir les cours
            </Button>
          </div>
        </motion.section>
      )}

      {/* ===== Recent Topics ===== */}
      {(dashboardLoading || recentTopics.length > 0) && user && (
        <motion.section variants={fadeUp}>
          <SectionHeader title="Topics récents" seeAllHref="/topics" seeAllLabel="Voir tout" />
          <div className="mt-5 space-y-3">
            {dashboardLoading ? (
              <>
                <div className="skeleton rounded-2xl h-14" />
                <div className="skeleton rounded-2xl h-14" />
                <div className="skeleton rounded-2xl h-14" />
              </>
            ) : recentTopics.map((topic) => (
              <Link key={topic.id} href={`/topics/${topic.id}`}>
                <Card glowColor="green" className="p-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{topic.icon || '📝'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                        {topic.title}
                      </h3>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {new Date(topic.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* ===== Featured Courses ===== */}
      {(dashboardLoading || featuredCourses.length > 0) && user && (
        <motion.section variants={fadeUp}>
          <SectionHeader title="Cours disponibles" seeAllHref="/courses" seeAllLabel="Voir tout" />
          <div className="mt-5 space-y-3">
            {dashboardLoading ? (
              <>
                <div className="skeleton rounded-2xl h-14" />
                <div className="skeleton rounded-2xl h-14" />
              </>
            ) : featuredCourses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <Card glowColor="gold" className="p-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{course.icon || '📚'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                          {course.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* ===== Recent Books ===== */}
      {(dashboardLoading || readingBooks.length > 0) && user && (
        <motion.section variants={fadeUp}>
          <SectionHeader title="Lectures en cours" seeAllHref="/library" seeAllLabel="Voir tout" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            {dashboardLoading ? (
              <>
                <div className="skeleton rounded-2xl h-24" />
                <div className="skeleton rounded-2xl h-24" />
              </>
            ) : readingBooks.map((book) => (
              <Link key={book.id} href={`/library/${book.id}`}>
                <Card glowColor="gold" className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: 'linear-gradient(135deg, rgba(196,154,61,0.12), rgba(196,154,61,0.06))' }}
                    >
                      <BookOpen size={20} style={{ color: '#d4ad4a' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                        {book.title}
                      </h3>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                        {book.author}
                      </p>
                      {book.progress !== undefined && (
                        <ProgressBar value={book.progress} showLabel className="mt-3" />
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* ===== FAB Quick Add ===== */}
      {user && (
        <div className="fixed bottom-24 right-5 z-50 flex flex-col items-end gap-2">
          <AnimatePresence>
            {showFab && (
              <>
                {[
                  { label: 'Topic', href: '/topics', icon: FileText, color: 'var(--accent)' },
                  { label: 'Livre', href: '/library', icon: BookOpen, color: '#d4ad4a' },
                  { label: 'Flashcards', href: '/flashcards', icon: Layers, color: '#6366f1' },
                  { label: 'Quiz', href: '/quiz', icon: Zap, color: '#f59e0b' },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 rounded-full py-2 pl-4 pr-3 text-sm font-medium shadow-lg"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {item.label}
                      <item.icon size={16} style={{ color: item.color }} />
                    </Link>
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFab((v) => !v)}
            className="flex h-14 w-14 items-center justify-center rounded-full shadow-xl cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #2e9e8c, #1a7a6b)',
              color: '#fff',
            }}
          >
            <motion.div animate={{ rotate: showFab ? 45 : 0 }} transition={{ duration: 0.2 }}>
              <Plus size={24} />
            </motion.div>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
