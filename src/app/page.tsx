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
  { href: '/explore', icon: Compass, label: 'Explorer', color: '#3aaa60' },
  { href: '/quiz', icon: Brain, label: 'Quiz', color: '#6366f1' },
  { href: '/flashcards', icon: Layers, label: 'Flashcards', color: '#24ad9d' },
  { href: '/library', icon: BookOpen, label: 'Bibliothèque', color: '#d4991a' },
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

export default function HomePage() {
  const daily = useMemo(() => getDailyReminder(), []);

  const inProgress = themes.filter((t) => t.progress && t.progress > 0 && t.progress < 100);
  const readingBooks = books.filter((b) => b.status === 'reading');
  const DailyIcon = daily ? typeIcons[daily.type] || Star : Star;

  return (
    <div className="space-y-8 pb-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gold-400 font-heading mb-2">
          As-salamu alaykum 👋
        </h1>
        <p className="text-ivory-400 text-sm sm:text-base max-w-lg">
          Bienvenue sur <span className="text-primary-400 font-semibold">Ilmify</span>, votre compagnon
          de savoir islamique. Continuez votre apprentissage aujourd&apos;hui.
        </p>
      </motion.section>

      {/* Daily Reminder */}
      {daily && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card glowColor="gold" className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/15">
                <DailyIcon size={20} className="text-gold-400" />
              </div>
              <div className="min-w-0 flex-1">
                <Badge variant="gold" size="sm" className="mb-2">Rappel du jour</Badge>
                <p className="text-ivory-200 text-sm leading-relaxed">{daily.content}</p>
                {daily.contentAr && (
                  <p className="mt-2 text-right text-lg text-gold-300 font-arabic leading-loose">
                    {daily.contentAr}
                  </p>
                )}
                {daily.source && (
                  <p className="mt-2 text-xs text-ivory-400">{daily.source}</p>
                )}
              </div>
            </div>
          </Card>
        </motion.section>
      )}

      {/* Quick Access */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <SectionHeader title="Accès rapide" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card glowColor="green" className="p-4 text-center">
                <div
                  className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${link.color}20` }}
                >
                  <link.icon size={24} style={{ color: link.color }} />
                </div>
                <span className="text-sm font-medium text-ivory-200">{link.label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* Continue Learning */}
      {inProgress.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <SectionHeader
            title="Continuer l'apprentissage"
            seeAllHref="/explore"
            seeAllLabel="Voir tout"
          />
          <div className="mt-4 space-y-3">
            {inProgress.slice(0, 4).map((theme) => (
              <Link key={theme.id} href={`/explore/${theme.id}`}>
                <Card glowColor="green" className="p-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${theme.color}20` }}
                    >
                      <Star size={18} style={{ color: theme.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-ivory-200 truncate">{theme.title}</h3>
                      <ProgressBar
                        value={theme.progress || 0}
                        showLabel
                        color={theme.color}
                        className="mt-1.5"
                      />
                    </div>
                    <ChevronRight size={16} className="text-ivory-400 shrink-0" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* Recent Books */}
      {readingBooks.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <SectionHeader
            title="Lectures en cours"
            seeAllHref="/library"
            seeAllLabel="Voir tout"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {readingBooks.map((book) => (
              <Link key={book.id} href={`/library/${book.id}`}>
                <Card glowColor="gold" className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/15">
                      <BookOpen size={18} className="text-gold-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-ivory-200 truncate">{book.title}</h3>
                      <p className="text-xs text-ivory-400 truncate">{book.author}</p>
                      {book.progress !== undefined && (
                        <ProgressBar value={book.progress} showLabel className="mt-2" />
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
