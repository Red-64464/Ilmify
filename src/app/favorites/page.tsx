'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Heart, BookOpen, Compass, Quote, FileText } from 'lucide-react';
import { favorites } from '@/data/mockData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const typeIcons: Record<string, React.ReactNode> = {
  content: <Quote className="w-4 h-4 text-ilm-gold" />,
  theme: <Compass className="w-4 h-4 text-ilm-teal" />,
  book: <BookOpen className="w-4 h-4 text-ilm-cream" />,
  passage: <FileText className="w-4 h-4 text-ilm-sage" />,
  quiz: <FileText className="w-4 h-4 text-ilm-info" />,
  flashcard: <FileText className="w-4 h-4 text-ilm-warning" />,
};

const typeLabels: Record<string, string> = {
  content: 'Contenu', theme: 'Thème', book: 'Livre', passage: 'Passage', quiz: 'Quiz', flashcard: 'Flashcard',
};

const typeLinks: Record<string, (id: string) => string> = {
  content: () => '/themes',
  theme: (id) => `/themes/${id}`,
  book: (id) => `/library/${id}`,
  passage: () => '/library',
  quiz: () => '/quiz',
  flashcard: () => '/flashcards',
};

export default function FavoritesPage() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-ilm-error/15 flex items-center justify-center"><Heart className="w-5 h-5 text-ilm-error" /></div>
          <div><h1 className="text-2xl font-bold text-ilm-ivory">Favoris</h1><p className="text-sm text-ilm-sage">Vos éléments sauvegardés</p></div>
        </div>
      </motion.div>

      <div className="space-y-3">
        {favorites.map((fav, i) => (
          <motion.div key={fav.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={typeLinks[fav.type]?.(fav.itemId) || '/'}>
              <Card hover className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-ilm-accent/15 flex items-center justify-center shrink-0">
                  {typeIcons[fav.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ilm-ivory text-sm truncate">{fav.title}</p>
                  {fav.description && <p className="text-xs text-ilm-sage truncate">{fav.description}</p>}
                </div>
                <Badge variant="gold" size="sm">{typeLabels[fav.type]}</Badge>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {favorites.length === 0 && (
        <div className="text-center py-16 text-ilm-sage">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucun favori pour le moment</p>
        </div>
      )}
    </div>
  );
}
