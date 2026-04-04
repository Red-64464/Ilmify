'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Settings, BookOpen, Brain, Layers, Compass, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { themes, quizQuestions, flashcardDecks, books, contentBlocks } from '@/data/mockData';

const sections = [
  { icon: Compass, label: 'Thèmes', count: themes.length, desc: 'Gérer les thèmes', href: '/themes', color: 'text-ilm-teal' },
  { icon: FileText, label: 'Contenus', count: contentBlocks.length, desc: 'Gérer les contenus', href: '/themes', color: 'text-ilm-gold' },
  { icon: Brain, label: 'Quiz', count: quizQuestions.length, desc: 'Gérer les questions', href: '/quiz', color: 'text-ilm-warning' },
  { icon: Layers, label: 'Flashcards', count: flashcardDecks.length, desc: 'Gérer les decks', href: '/flashcards', color: 'text-ilm-info' },
  { icon: BookOpen, label: 'Livres', count: books.length, desc: 'Gérer la bibliothèque', href: '/library', color: 'text-ilm-cream' },
];

export default function AdminPage() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-ilm-accent/20 flex items-center justify-center"><Settings className="w-5 h-5 text-ilm-sage" /></div>
          <div><h1 className="text-2xl font-bold text-ilm-ivory">Administration</h1><p className="text-sm text-ilm-sage">Gérez votre contenu</p></div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, i) => (
          <motion.div key={section.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={section.href}>
              <Card hover className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-ilm-accent/15 flex items-center justify-center">
                  <section.icon className={`w-6 h-6 ${section.color}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-ilm-ivory">{section.label}</p>
                  <p className="text-xs text-ilm-sage">{section.desc}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-ilm-ivory">{section.count}</p>
                  <p className="text-xs text-ilm-sage">éléments</p>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <Card className="mt-6">
        <h3 className="font-semibold text-ilm-ivory mb-2">À propos</h3>
        <p className="text-sm text-ilm-sage">Ilmify v1.0 — Plateforme islamique d&apos;apprentissage et de mémorisation.</p>
        <p className="text-xs text-ilm-sage/60 mt-2">Les données affichées sont des exemples de démonstration.</p>
      </Card>
    </div>
  );
}
