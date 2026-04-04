'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, FileText, Pin, Heart, Archive,
  LayoutGrid, List, MoreVertical, Trash2, Copy,
  Star,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/layout/AuthGuard';
import { topicRepository } from '@/lib/repositories/topicRepository';
import type { Topic } from '@/types';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

const CATEGORIES = [
  'Tous', 'Aqida', 'Fiqh', 'Hadith', 'Quran', 'Sira', 'Akhlaq', 'Adhkar', 'Notes', 'Recherche', 'Autre',
];

export default function TopicsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [categoryFilter, setCategoryFilter] = useState('Tous');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadTopics = async () => {
      let result = search
        ? await topicRepository.search(user.id, search)
        : await topicRepository.getByUser(user.id);
      if (categoryFilter !== 'Tous') {
        result = result.filter((t) => t.category === categoryFilter);
      }
      setTopics(result);
    };
    loadTopics();
  }, [user, search, categoryFilter, refreshKey]);

  const [error, setError] = useState('');

  const handleCreate = useCallback(async () => {
    if (!user || !newTitle.trim()) return;
    try {
      setError('');
      const topic = await topicRepository.create(user.id, newTitle.trim(), newCategory || undefined);
      setShowCreateModal(false);
      setNewTitle('');
      setNewCategory('');
      router.push(`/topics/${topic.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    }
  }, [user, newTitle, newCategory, router]);

  const handleAction = useCallback(
    async (action: string, topic: Topic) => {
      setContextMenu(null);
      try {
        switch (action) {
          case 'pin':
            await topicRepository.togglePin(topic.id);
            break;
          case 'favorite':
            await topicRepository.toggleFavorite(topic.id);
            break;
          case 'archive':
            await topicRepository.archive(topic.id);
            break;
          case 'duplicate':
            if (user) await topicRepository.duplicate(topic.id, user.id);
            break;
          case 'delete':
            await topicRepository.delete(topic.id);
            break;
        }
        setRefreshKey((k) => k + 1);
      } catch {
        setError('Erreur lors de l\'action');
      }
    },
    [user]
  );

  if (!user) {
    return null;
  }

  return (
    <AuthGuard>
    <div className="pb-10">
      <PageHeader
        title="Mes Topics"
        subtitle="Votre espace de savoir personnel"
        rightAction={
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Plus size={16} />}
            onClick={() => setShowCreateModal(true)}
          >
            Nouveau
          </Button>
        }
      />

      {/* Search + Filters */}
      <div className="mb-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher dans vos topics..."
        />
      </div>

      {/* Category filter + View toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer"
              style={{
                background: categoryFilter === cat ? 'rgba(26, 122, 107, 0.15)' : 'rgba(255,255,255,0.04)',
                color: categoryFilter === cat ? '#2e9e8c' : 'var(--text-muted)',
                border: categoryFilter === cat ? '1px solid rgba(26, 122, 107, 0.2)' : '1px solid transparent',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-3 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{
              color: viewMode === 'list' ? '#2e9e8c' : 'var(--text-muted)',
              background: viewMode === 'list' ? 'rgba(26, 122, 107, 0.1)' : 'transparent',
            }}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{
              color: viewMode === 'grid' ? '#2e9e8c' : 'var(--text-muted)',
              background: viewMode === 'grid' ? 'rgba(26, 122, 107, 0.1)' : 'transparent',
            }}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Topics list */}
      {topics.length > 0 ? (
        <motion.div
          className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}
          variants={stagger}
          initial="hidden"
          animate="visible"
          key={`${categoryFilter}-${refreshKey}`}
        >
          {topics.map((topic) => (
            <motion.div key={topic.id} variants={fadeUp}>
              <div
                className="cursor-pointer relative"
                onClick={() => { window.location.href = `/topics/${topic.id}`; }}
              >
                <Card glowColor="green" className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                      style={{
                        background: 'linear-gradient(135deg, rgba(26,122,107,0.12), rgba(26,122,107,0.06))',
                      }}
                    >
                      {topic.icon || '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                          {topic.title}
                        </h3>
                        {topic.isPinned && <Pin size={12} style={{ color: '#2e9e8c' }} />}
                        {topic.isFavorite && <Heart size={12} style={{ color: '#d4ad4a' }} fill="#d4ad4a" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {topic.category && (
                          <Badge variant="default" size="sm">{topic.category}</Badge>
                        )}
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {topic.blocks.length} blocs
                        </span>
                      </div>
                      {viewMode === 'list' && topic.blocks[0]?.content && (
                        <p className="text-xs mt-1.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                          {topic.blocks[0].content}
                        </p>
                      )}
                      <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                        {new Date(topic.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>

                    {/* Context menu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu(contextMenu === topic.id ? null : topic.id);
                      }}
                      className="p-1 rounded transition-colors cursor-pointer shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {contextMenu === topic.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        className="absolute right-4 top-12 z-20 w-44 rounded-xl overflow-hidden"
                        style={{
                          background: 'var(--bg-elevated)',
                          boxShadow: 'var(--shadow-elevated)',
                          border: '1px solid var(--border-light)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {[
                          { action: 'pin', icon: Pin, label: topic.isPinned ? 'Désépingler' : 'Épingler' },
                          { action: 'favorite', icon: Star, label: topic.isFavorite ? 'Retirer favori' : 'Favori' },
                          { action: 'duplicate', icon: Copy, label: 'Dupliquer' },
                          { action: 'archive', icon: Archive, label: 'Archiver' },
                          { action: 'delete', icon: Trash2, label: 'Supprimer', danger: true },
                        ].map((item) => (
                          <button
                            key={item.action}
                            onClick={() => handleAction(item.action, topic)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors cursor-pointer"
                            style={{
                              color: 'danger' in item && item.danger ? '#f87171' : 'var(--text-primary)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <item.icon size={14} />
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={FileText}
          title={search ? 'Aucun résultat' : 'Aucun topic'}
          description={search ? `Aucun topic trouvé pour "${search}"` : 'Commencez à construire votre base de savoir personnelle.'}
          actionLabel={search ? undefined : 'Créer mon premier topic'}
          onAction={search ? undefined : () => setShowCreateModal(true)}
        />
      )}

      {/* Create modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouveau Topic"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Titre
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Conditions de la prière"
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-[var(--text-muted)]"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Catégorie (optionnel)
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => c !== 'Tous').map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNewCategory(newCategory === cat ? '' : cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
                  style={{
                    background: newCategory === cat ? 'rgba(26, 122, 107, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: newCategory === cat ? '#2e9e8c' : 'var(--text-muted)',
                    border: newCategory === cat ? '1px solid rgba(26, 122, 107, 0.2)' : '1px solid transparent',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p className="text-sm text-center py-2 px-3 rounded-xl" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>{error}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => { setShowCreateModal(false); setError(''); }} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" onClick={handleCreate} disabled={!newTitle.trim()} className="flex-1">
              Créer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </AuthGuard>
  );
}
