'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileText, GraduationCap, BookOpen, Star, Sun,
  ChevronRight, BookMarked, Plus, LogIn, UserPlus,
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
import { dailyReminders } from '@/data/daily';

const quickLinks = [
  { href: '/topics', icon: FileText, label: 'Mes Topics', color: '#2e9e8c', gradient: 'linear-gradient(135deg, rgba(26,122,107,0.12), rgba(18,163,147,0.06))' },
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

function getDailyReminder() {
  const today = new Date().toISOString().split('T')[0];
  return dailyReminders.find((r) => r.date === today) || dailyReminders[0] || null;
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const daily = useMemo(() => getDailyReminder(), []);
  const [search, setSearch] = useState('');

  const [recentTopics, setRecentTopics] = useState<{ id: string; title: string; updatedAt: string; icon?: string }[]>([]);
  const [readingBooks, setReadingBooks] = useState<{ id: string; title: string; author: string; progress?: number }[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<{ id: string; title: string; description?: string; icon?: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    topicRepository.getByUser(user.id).then((topics) => {
      setRecentTopics(topics.slice(0, 4).map((t) => ({ id: t.id, title: t.title, updatedAt: t.updatedAt, icon: t.icon })));
    });
    bookRepository.getAll().then((bks) => {
      setReadingBooks(bks.filter((b) => b.status === 'reading').map((b) => ({ id: b.id, title: b.title, author: b.author, progress: b.progress })));
    });
    courseRepository.getAllPages().then((courses) => {
      setFeaturedCourses(courses.slice(0, 3).map((c) => ({ id: c.id, title: c.title, description: c.description, icon: c.icon })));
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
      initial="hidden"
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
              Bienvenue sur <span style={{ color: '#2e9e8c' }} className="font-semibold">Ilmify</span>, votre espace
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
      {daily && (
        <motion.section variants={fadeUp}>
          <div
            className="relative overflow-hidden rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(196,154,61,0.06) 0%, var(--bg-card) 50%, rgba(26,122,107,0.04) 100%)',
              boxShadow: 'var(--shadow-card), var(--shadow-glow-gold)',
              border: '1px solid rgba(196,154,61,0.08)',
            }}
          >
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
                <Badge variant="gold" size="sm" className="mb-3">Rappel du jour</Badge>
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
      {recentTopics.length > 0 && (
        <motion.section variants={fadeUp}>
          <SectionHeader
            title="Topics récents"
            seeAllHref="/topics"
            seeAllLabel="Voir tout"
          />
          <div className="mt-5 space-y-3">
            {recentTopics.map((topic) => (
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
      {featuredCourses.length > 0 && (
        <motion.section variants={fadeUp}>
          <SectionHeader
            title="Cours disponibles"
            seeAllHref="/courses"
            seeAllLabel="Voir tout"
          />
          <div className="mt-5 space-y-3">
            {featuredCourses.map((course) => (
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
      {readingBooks.length > 0 && (
        <motion.section variants={fadeUp}>
          <SectionHeader
            title="Lectures en cours"
            seeAllHref="/library"
            seeAllLabel="Voir tout"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            {readingBooks.map((book) => (
              <Link key={book.id} href={`/library/${book.id}`}>
                <Card glowColor="gold" className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(196,154,61,0.12), rgba(196,154,61,0.06))',
                      }}
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
    </motion.div>
  );
}
