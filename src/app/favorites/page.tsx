'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Star, BookOpen, Brain, Layers, FileText,
  BookMarked, Trash2, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/ui/EmptyState';
import AuthGuard from '@/components/layout/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { favoriteRepository } from '@/lib/repositories/favoriteRepository';
import { queryCache } from '@/lib/queryCache';
import type { Favorite } from '@/types';

const filterTabs = [
  { id: 'all', label: 'Tous' },
  { id: 'book', label: 'Livres' },
  { id: 'passage', label: 'Passages' },
  { id: 'topic', label: 'Topics' },
  { id: 'flashcard', label: 'Flashcards' },
];

const typeConfig: Record<string, { icon: typeof Star; color: string; label: string }> = {
  content: { icon: FileText, color: '#d4991a', label: 'Contenu' },
  theme: { icon: Star, color: '#3aaa60', label: 'Thème' },
  topic: { icon: FileText, color: 'var(--accent)', label: 'Topic' },
  book: { icon: BookOpen, color: '#ec4899', label: 'Livre' },
  passage: { icon: BookMarked, color: '#f59e0b', label: 'Passage' },
  quiz: { icon: Brain, color: '#6366f1', label: 'Quiz' },
  flashcard: { icon: Layers, color: '#24ad9d', label: 'Flashcard' },
};

const hrefForFav = (fav: Favorite): string => {
  const map: Record<string, string> = {
    topic: `/topics/${fav.itemId}`,
    book: `/library/${fav.itemId}`,
    passage: `/library/${fav.itemId}`,
    flashcard: `/flashcards/${fav.itemId}`,
    theme: `/explore/${fav.itemId}`,
    content: `/explore/${fav.itemId}`,
    quiz: '/quiz',
  };
  return map[fav.itemType] || '#';
};

export default function FavoritesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('all');
  const favCacheKey = user ? `favorites:${user.id}` : '';
  const [favorites, setFavorites] = useState<Favorite[]>(() => (user ? (queryCache.get<Favorite[]>(favCacheKey) ?? []) : []));
  const [loading, setLoading] = useState(() => !(user && queryCache.get(favCacheKey)));

  useEffect(() => {
    if (!user) return;
    const hasCached = queryCache.get(favCacheKey) !== null;
    if (!hasCached) setLoading(true);
    favoriteRepository.getAll(user.id)
      .then((d) => { queryCache.set(favCacheKey, d, 120_000); setFavorites(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRemove = useCallback(async (fav: Favorite) => {
    if (!user) return;
    try {
      await favoriteRepository.remove(user.id, fav.itemType, fav.itemId);
      setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
    } catch { /* ignore */ }
  }, [user]);

  const filtered = useMemo(() => {
    if (tab === 'all') return favorites;
    return favorites.filter((f) => f.itemType === tab);
  }, [tab, favorites]);

  return (
    <AuthGuard>
    <div className="pb-10">
      <PageHeader title="Favoris" subtitle={`${favorites.length} éléments sauvegardés`} />

      <div className="mb-5 overflow-x-auto">
        <Tabs tabs={filterTabs} activeTab={tab} onChange={setTab} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : filtered.length > 0 ? (
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
                <Link href={hrefForFav(fav)}>
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
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(fav); }}
                        className="p-1.5 rounded-lg cursor-pointer transition-colors shrink-0 mt-0.5"
                        style={{ color: '#f87171' }}
                        title="Retirer des favoris"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Card>
                </Link>
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
    </AuthGuard>
  );
}
