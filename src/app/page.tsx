'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Compass, Brain, Layers, BookOpen, Heart, Search, ChevronRight, BookMarked, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { themes, dailyReminders, books, flashcards, quizQuestions } from '@/data/mockData';

import { BookOpen as BookOpenIcon, Star, Moon, Heart as HeartIcon, Sparkles, Shield, Hand, Users } from 'lucide-react';
const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = { BookOpen: BookOpenIcon, Star, Moon, Heart: HeartIcon, Sparkles, Shield, Hand, Users };

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const reminder = dailyReminders[0];
  const readingBook = books.find(b => b.status === 'reading');
  const cardsToReview = flashcards.filter(f => f.mastery !== 'mastered').length;
  const avgMastery = Math.round(quizQuestions.reduce((a, q) => a + q.mastery, 0) / quizQuestions.length);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[100] bg-ilm-darkest flex flex-col items-center justify-center"
          >
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} className="animate-pulse-glow rounded-3xl">
              <Image src="/logo.png" alt="Ilmify" width={120} height={120} className="rounded-3xl" priority />
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-3xl font-bold text-gradient-gold mt-6">Ilmify</motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-ilm-sage text-xs tracking-[0.3em] mt-3 uppercase">Savoir • Lumière • Sérénité</motion.p>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 1.5 }} className="w-32 h-0.5 bg-gradient-to-r from-transparent via-ilm-gold to-transparent mt-8 origin-left" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Hero - Daily Reminder */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: showSplash ? 0 : 1, y: showSplash ? 20 : 0 }} transition={{ delay: 0.2 }}>
          <Card glow className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-ilm-accent/20 to-transparent" />
            <div className="relative">
              <p className="text-ilm-gold text-xs font-semibold tracking-widest uppercase mb-3">Assalamu Alaykum</p>
              <p className="text-ilm-ivory text-lg leading-relaxed italic mb-3">{reminder.content}</p>
              {reminder.source && <p className="text-ilm-sage text-sm">{reminder.source}</p>}
              <Badge variant="gold" size="sm" className="mt-3">{reminder.type === 'verse' ? 'Verset' : reminder.type === 'hadith' ? 'Hadith' : 'Sagesse'}</Badge>
            </div>
          </Card>
        </motion.div>

        {/* Quick Access */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: showSplash ? 0 : 1, y: showSplash ? 20 : 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-lg font-semibold text-ilm-ivory mb-3">Accès rapide</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: Compass, label: 'Explorer', desc: 'Thèmes', href: '/themes', color: 'text-ilm-teal' },
              { icon: Brain, label: 'Quiz', desc: 'Tester', href: '/quiz', color: 'text-ilm-gold' },
              { icon: Layers, label: 'Flashcards', desc: 'Mémoriser', href: '/flashcards', color: 'text-ilm-info' },
              { icon: BookOpen, label: 'Bibliothèque', desc: 'Livres', href: '/library', color: 'text-ilm-cream' },
              { icon: Heart, label: 'Favoris', desc: 'Sauvegardés', href: '/favorites', color: 'text-ilm-error' },
              { icon: Search, label: 'Recherche', desc: 'Trouver', href: '/search', color: 'text-ilm-sage' },
            ].map((item, i) => (
              <motion.div key={item.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
                <Link href={item.href}>
                  <Card hover className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ilm-accent/20 flex items-center justify-center"><item.icon className={`w-5 h-5 ${item.color}`} /></div>
                    <div><p className="text-sm font-semibold text-ilm-ivory">{item.label}</p><p className="text-xs text-ilm-sage">{item.desc}</p></div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Themes Carousel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: showSplash ? 0 : 1, y: showSplash ? 20 : 0 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-ilm-ivory">Thèmes à explorer</h2>
            <Link href="/themes" className="text-ilm-teal text-sm flex items-center gap-1 hover:underline">Voir tout <ChevronRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 snap-x">
            {themes.slice(0, 6).map((theme) => {
              const Icon = iconMap[theme.icon] || BookOpenIcon;
              return (
                <Link href={`/themes/${theme.id}`} key={theme.id} className="snap-start shrink-0">
                  <div className="w-44 h-32 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden card-hover" style={{ background: `linear-gradient(135deg, ${theme.color}30, ${theme.color}10)`, border: `1px solid ${theme.color}30` }}>
                    <Icon className="w-6 h-6" style={{ color: theme.color }} />
                    <div><p className="font-semibold text-sm text-ilm-ivory">{theme.title}</p><p className="text-xs text-ilm-sage">{theme.contentCount} contenus</p></div>
                    {theme.progress !== undefined && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-ilm-darkest/50"><div className="h-full rounded-r-full" style={{ width: `${theme.progress}%`, background: theme.color }} /></div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: showSplash ? 0 : 1, y: showSplash ? 20 : 0 }} transition={{ delay: 0.6 }}>
          <h2 className="text-lg font-semibold text-ilm-ivory mb-3">Activité récente</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ilm-teal/15 flex items-center justify-center"><Brain className="w-5 h-5 text-ilm-teal" /></div>
              <div><p className="text-sm font-medium text-ilm-ivory">Maîtrise quiz</p><p className="text-xs text-ilm-sage">{avgMastery}% en moyenne</p></div>
            </Card>
            {readingBook && (
              <Link href={`/library/${readingBook.id}`}>
                <Card hover className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ilm-gold/15 flex items-center justify-center"><BookMarked className="w-5 h-5 text-ilm-gold" /></div>
                  <div className="min-w-0"><p className="text-sm font-medium text-ilm-ivory truncate">{readingBook.title}</p><p className="text-xs text-ilm-sage">En cours de lecture</p></div>
                </Card>
              </Link>
            )}
            <Link href="/flashcards">
              <Card hover className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ilm-info/15 flex items-center justify-center"><RotateCcw className="w-5 h-5 text-ilm-info" /></div>
                <div><p className="text-sm font-medium text-ilm-ivory">{cardsToReview} cartes</p><p className="text-xs text-ilm-sage">À réviser</p></div>
              </Card>
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
