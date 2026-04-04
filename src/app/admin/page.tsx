'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Star, FileText, Brain, BookOpen,
  Layers, Users, BarChart3,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { themes } from '@/data/themes';
import { contentItems } from '@/data/content';
import { quizQuestions } from '@/data/quiz';
import { books } from '@/data/books';
import { flashcardDecks, flashcards } from '@/data/flashcards';
import { favorites } from '@/data/favorites';

export default function AdminPage() {
  const stats = useMemo(
    () => [
      { label: 'Thèmes', value: themes.length, icon: Star, color: '#3aaa60' },
      { label: 'Contenus', value: contentItems.length, icon: FileText, color: '#d4991a' },
      { label: 'Questions quiz', value: quizQuestions.length, icon: Brain, color: '#6366f1' },
      { label: 'Livres', value: books.length, icon: BookOpen, color: '#ec4899' },
      { label: 'Decks flashcards', value: flashcardDecks.length, icon: Layers, color: '#24ad9d' },
      { label: 'Flashcards', value: flashcards.length, icon: Layers, color: '#14b8a6' },
      { label: 'Favoris', value: favorites.length, icon: Users, color: '#f59e0b' },
    ],
    []
  );

  const sections = useMemo(
    () => [
      {
        title: 'Thèmes',
        icon: Star,
        color: '#3aaa60',
        items: themes.map((t) => ({
          name: t.title,
          detail: `${t.contentCount} contenus · ${t.progress ?? 0}% progression`,
        })),
      },
      {
        title: 'Livres',
        icon: BookOpen,
        color: '#ec4899',
        items: books.map((b) => ({
          name: b.title,
          detail: `${b.author} · ${b.status === 'read' ? 'Terminé' : b.status === 'reading' ? 'En cours' : 'À lire'}`,
        })),
      },
      {
        title: 'Decks Flashcards',
        icon: Layers,
        color: '#24ad9d',
        items: flashcardDecks.map((d) => ({
          name: d.title,
          detail: `${d.cardCount} cartes · ${d.masteredCount} maîtrisées`,
        })),
      },
    ],
    []
  );

  return (
    <div className="pb-8">
      <PageHeader
        title="Administration"
        subtitle="Tableau de bord"
        rightAction={
          <Badge variant="gold" size="md">
            <LayoutDashboard size={14} className="mr-1" />
            Admin
          </Badge>
        }
      />

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h3 className="text-lg font-semibold text-ivory-200 mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-gold-400" />
          Vue d&apos;ensemble
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Card className="p-4 text-center">
                <div
                  className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
                <p className="text-2xl font-bold text-ivory-200">{stat.value}</p>
                <p className="text-xs text-ivory-400">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Management Sections */}
      {sections.map((section, si) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 + si * 0.1 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-ivory-200 mb-4 flex items-center gap-2">
            <section.icon size={18} style={{ color: section.color }} />
            {section.title}
          </h3>
          <Card className="divide-y divide-primary-700/50">
            {section.items.map((item, j) => (
              <div key={j} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ivory-200">{item.name}</p>
                  <p className="text-xs text-ivory-400">{item.detail}</p>
                </div>
                <Badge variant="default" size="sm">#{j + 1}</Badge>
              </div>
            ))}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
