'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Compass, Brain, Layers, BookOpen, Star, Sun,
  ChevronRight, BookMarked,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import { themes } from '@/data/themes';
import { books } from '@/data/books';
import { dailyReminders } from '@/data/daily';

const quickLinks = [
  { href: '/explore', icon: Compass, label: 'Explorer', color: '#2e9e8c', gradient: 'linear-gradient(135deg, rgba(26,122,107,0.12), rgba(18,163,147,0.06))' },
  { href: '/quiz', icon: Brain, label: 'Quiz', color: '#7c7cf0', gradient: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))' },
  { href: '/flashcards', icon: Layers, label: 'Flashcards', color: '#28c4b0', gradient: 'linear-gradient(135deg, rgba(18,163,147,0.1), rgba(40,196,176,0.06))' },
  { href: '/library', icon: BookOpen, label: 'Bibliothèque', color: '#d4ad4a', gradient: 'linear-gradient(135deg, rgba(196,154,61,0.1), rgba(168,128,49,0.06))' },
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function HomePage() {
  const daily = useMemo(() => getDailyReminder(), []);

  const inProgress = themes.filter((t) => t.progress && t.progress > 0 && t.progress < 100);
  const readingBooks = books.filter((b) => b.status === 'reading');
  const DailyIcon = daily ? typeIcons[daily.type] || Star : Star;

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
              As-salamu alaykum
            </h1>
            <p className="text-sm sm:text-base max-w-md leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Bienvenue sur <span style={{ color: '#2e9e8c' }} className="font-semibold">Ilmify</span>, votre compagnon
              de savoir islamique.
            </p>
          </div>
        </div>
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

      {/* ===== Continue Learning ===== */}
      {inProgress.length > 0 && (
        <motion.section variants={fadeUp}>
          <SectionHeader
            title="Continuer l'apprentissage"
            seeAllHref="/explore"
            seeAllLabel="Voir tout"
          />
          <div className="mt-5 space-y-3">
            {inProgress.slice(0, 4).map((theme) => (
              <Link key={theme.id} href={`/explore/${theme.id}`}>
                <Card glowColor="green" className="p-4 sm:p-5 mb-3">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${theme.color}18, ${theme.color}08)`,
                      }}
                    >
                      <Star size={18} style={{ color: theme.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                        {theme.title}
                      </h3>
                      <ProgressBar
                        value={theme.progress || 0}
                        showLabel
                        color={theme.color}
                        className="mt-2"
                      />
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
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
