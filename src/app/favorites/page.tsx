'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Star, BookOpen, Brain, Layers, FileText,
  BookMarked,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/ui/EmptyState';
import { favorites } from '@/data/favorites';

const filterTabs = [
  { id: 'all', label: 'Tous' },
  { id: 'content', label: 'Contenus' },
  { id: 'theme', label: 'Thèmes' },
  { id: 'book', label: 'Livres' },
  { id: 'passage', label: 'Passages' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'flashcard', label: 'Flashcards' },
];

const typeConfig: Record<string, { icon: typeof Star; color: string; label: string }> = {
  content: { icon: FileText, color: '#d4991a', label: 'Contenu' },
  theme: { icon: Star, color: '#3aaa60', label: 'Thème' },
  book: { icon: BookOpen, color: '#ec4899', label: 'Livre' },
  passage: { icon: BookMarked, color: '#f59e0b', label: 'Passage' },
  quiz: { icon: Brain, color: '#6366f1', label: 'Quiz' },
  flashcard: { icon: Layers, color: '#24ad9d', label: 'Flashcard' },
};

export default function FavoritesPage() {
  const [tab, setTab] = useState('all');

  const filtered = useMemo(() => {
    if (tab === 'all') return favorites;
    return favorites.filter((f) => f.itemType === tab);
  }, [tab]);

  return (
    <div className="pb-10">
      <PageHeader title="Favoris" subtitle={`${favorites.length} éléments sauvegardés`} />

      <div className="mb-5 overflow-x-auto">
        <Tabs tabs={filterTabs} activeTab={tab} onChange={setTab} />
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((fav, i) => {
            const cfg = typeConfig[fav.itemType] || typeConfig.content;
            const Icon = cfg.icon;
            const dateStr = new Date(fav.addedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <Card glowColor="gold" className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${cfg.color}20` }}
                    >
                      <Icon size={16} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {fav.title || 'Sans titre'}
                        </h3>
                        <Badge variant="default" size="sm">{cfg.label}</Badge>
                      </div>
                      {fav.preview && (
                        <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{fav.preview}</p>
                      )}
                      <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{dateStr}</p>
                    </div>
                    <Heart size={14} className="text-red-400 shrink-0 mt-1" fill="currentColor" />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="Aucun favori"
          description="Vous n'avez pas encore de favoris dans cette catégorie."
        />
      )}
    </div>
  );
}
