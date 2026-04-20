'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Heart, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import AuthGuard from '@/components/layout/AuthGuard';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { socialPostRepository } from '@/lib/repositories/socialPostRepository';
import { platformLabel } from '@/lib/social/platforms';
import type { SocialPost, SocialPlatform } from '@/types';
import SocialImportModal from './SocialImportModal';
import SocialPostCard from './SocialPostCard';

const PLATFORM_TABS: Array<{ id: 'all' | SocialPlatform | 'favorites'; label: string; emoji: string }> = [
  { id: 'all', label: 'Tout', emoji: '✨' },
  { id: 'favorites', label: 'Favoris', emoji: '❤️' },
  { id: 'tiktok', label: platformLabel('tiktok'), emoji: '🎵' },
  { id: 'instagram', label: platformLabel('instagram'), emoji: '📸' },
  { id: 'twitter', label: platformLabel('twitter'), emoji: '🐦' },
  { id: 'youtube', label: platformLabel('youtube'), emoji: '▶️' },
];

export default function SocialPage() {
  return (
    <AuthGuard>
      <SocialPageInner />
    </AuthGuard>
  );
}

function SocialPageInner() {
  const { user, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | SocialPlatform | 'favorites'>('all');
  const [showImport, setShowImport] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await socialPostRepository.list();
      setPosts(list);
    } catch (err) {
      console.error('Load social posts failed', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    load();
  }, [user, authLoading, load]);

  const visible = useMemo(() => {
    let list = posts;
    if (tab === 'favorites') list = list.filter((p) => p.isFavorite);
    else if (tab !== 'all') list = list.filter((p) => p.platform === tab);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.caption?.toLowerCase().includes(q) ||
          p.author?.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [posts, tab, search]);

  const toggleFavorite = async (post: SocialPost) => {
    const updated = await socialPostRepository.update(post.id, { isFavorite: !post.isFavorite });
    if (updated) {
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
  };

  const handleImported = (post: SocialPost) => {
    setPosts((prev) => [post, ...prev.filter((p) => p.id !== post.id)]);
  };

  return (
    <div className="min-h-screen pb-32" style={{ background: 'var(--bg-base)' }}>
      <PageHeader
        title="Posts Sociaux"
        subtitle="TikTok, Reels, Tweets, YouTube — organisés et analysés par IA"
      />

      <div className="px-4 md:px-8 max-w-7xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un post…" />
          </div>
          <Button variant="primary" iconLeft={<Plus size={16} />} onClick={() => setShowImport(true)}>
            Importer
          </Button>
        </div>

        {/* Platform tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
          {PLATFORM_TABS.map((t) => {
            const count =
              t.id === 'all'
                ? posts.length
                : t.id === 'favorites'
                ? posts.filter((p) => p.isFavorite).length
                : posts.filter((p) => p.platform === t.id).length;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap transition-all cursor-pointer"
                style={{
                  background: isActive ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? 'transparent' : 'var(--border-subtle)'}`,
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
                {count > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)' }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[9/16] rounded-2xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={tab === 'favorites' ? Heart : TrendingUp}
            title={posts.length === 0 ? 'Aucun post importé' : 'Aucun résultat'}
            description={
              posts.length === 0
                ? 'Commence en important ton premier TikTok, Reel ou tweet islamique.'
                : 'Essaie d\'ajuster tes filtres ou ta recherche.'
            }
            actionLabel={posts.length === 0 ? 'Importer un lien' : undefined}
            onAction={posts.length === 0 ? () => setShowImport(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {visible.map((p) => (
              <SocialPostCard key={p.id} post={p} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        )}
      </div>

      {user && (
        <SocialImportModal
          isOpen={showImport}
          onClose={() => setShowImport(false)}
          userId={user.id}
          onImported={handleImported}
        />
      )}
    </div>
  );
}
