'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, FileText, Pin, Heart, Archive,
  LayoutGrid, List, MoreVertical, Trash2, Copy,
  Star, Upload, Globe, Loader2,
} from 'lucide-react';
import { analyzeArticle } from '@/lib/ai/groq';
import PageHeader from '@/components/layout/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import JsonImportModal from '@/components/editor/JsonImportModal';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/layout/AuthGuard';
import { topicRepository } from '@/lib/repositories/topicRepository';
import type { Topic, TopicBlock } from '@/types';

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
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Article URL import
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [urlImportLoading, setUrlImportLoading] = useState(false);
  const [urlImportError, setUrlImportError] = useState('');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    // Debounce search to avoid firing Supabase query on every keystroke
    const timeout = setTimeout(() => {
      setDataLoading(true);
      const loadTopics = async () => {
        try {
          let result = search
            ? await topicRepository.search(user.id, search)
            : await topicRepository.getByUser(user.id);
          if (categoryFilter !== 'Tous') {
            result = result.filter((t) => t.category === categoryFilter);
          }
          if (!cancelled) setTopics(result);
        } catch {
          if (!cancelled) setTopics([]);
        } finally {
          if (!cancelled) setDataLoading(false);
        }
      };
      loadTopics();
    }, search ? 300 : 0); // instant load for initial/filter changes, debounce for typing
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [user, search, categoryFilter]);

  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!user || !newTitle.trim() || creating) return;
    try {
      setCreating(true);
      setError('');
      const topic = await topicRepository.create(user.id, newTitle.trim(), newCategory || undefined);
      setShowCreateModal(false);
      setNewTitle('');
      setNewCategory('');
      router.push(`/topics/${topic.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  }, [user, newTitle, newCategory, creating]);

  const handleJsonImport = useCallback(async (title: string, blocks: TopicBlock[]) => {
    if (!user || creating) return;
    try {
      setCreating(true);
      setError('');
      const topic = await topicRepository.create(user.id, title);
      await topicRepository.updateBlocks(topic.id, blocks);
      setShowJsonImport(false);
      router.push(`/topics/${topic.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
    } finally {
      setCreating(false);
    }
  }, [user, creating, router]);

  const handleUrlImport = useCallback(async () => {
    if (!user || !importUrl.trim() || urlImportLoading) return;
    setUrlImportLoading(true);
    setUrlImportError('');
    try {
      // 1. Fetch article text
      const res = await fetch(`/api/extract-article?url=${encodeURIComponent(importUrl.trim())}`);
      const data = await res.json() as { text?: string; title?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Erreur de récupération');
      if (!data.text) throw new Error('Contenu vide');
      // 2. Analyze with Groq
      const result = await analyzeArticle(data.text, importUrl.trim(), data.title);
      // 3. Build topic blocks
      const VALID_TYPES = new Set([
        'paragraph', 'heading1', 'heading2', 'heading3',
        'quote', 'bullet-list', 'numbered-list',
        'callout', 'reflection', 'reminder', 'source',
        'hadith', 'verse', 'dua', 'definition',
        'checklist', 'poem', 'timeline', 'warning', 'divider',
      ]);
      const blocks: TopicBlock[] = (result.blocks || [])
        .filter((b) => VALID_TYPES.has(b.type))
        .map((b, i) => ({
          id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
          type: b.type as TopicBlock['type'],
          content: Array.isArray(b.content) ? (b.content as string[]).join('\n') : String(b.content ?? ''),
          metadata: b.metadata,
          order: i,
        }));
      const topic = await topicRepository.create(user.id, result.title || data.title || 'Article importé');
      await topicRepository.updateBlocks(topic.id, blocks);
      setShowUrlImport(false);
      setImportUrl('');
      router.push(`/topics/${topic.id}`);
    } catch (err) {
      setUrlImportError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
    } finally {
      setUrlImportLoading(false);
    }
  }, [user, importUrl, urlImportLoading, router]);

  const handleAction = useCallback(
    async (action: string, topic: Topic) => {
      setContextMenu(null);
      try {
        switch (action) {
          case 'pin': {
            const updated = await topicRepository.togglePin(topic.id);
            if (updated) setTopics(prev => prev.map(t => t.id === topic.id ? updated : t));
            break;
          }
          case 'favorite': {
            const updated = await topicRepository.toggleFavorite(topic.id);
            if (updated) setTopics(prev => prev.map(t => t.id === topic.id ? updated : t));
            break;
          }
          case 'archive':
            await topicRepository.archive(topic.id);
            setTopics(prev => prev.filter(t => t.id !== topic.id));
            break;
          case 'duplicate':
            if (user) {
              const dup = await topicRepository.duplicate(topic.id, user.id);
              if (dup) setTopics(prev => [dup, ...prev]);
            }
            break;
          case 'delete':
            if (!confirm('Supprimer ce topic ?')) return;
            await topicRepository.delete(topic.id);
            setTopics(prev => prev.filter(t => t.id !== topic.id));
            break;
        }
      } catch {
        setError('Erreur lors de l\'action');
      }
    },
    [user]
  );

  return (
    <AuthGuard>
    <div className="pb-10">
      <PageHeader
        title="Mes Topics"
        subtitle="Votre espace de savoir personnel"
        rightAction={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Globe size={14} />}
              onClick={() => { setUrlImportError(''); setImportUrl(''); setShowUrlImport(true); }}
            >
              URL
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Upload size={14} />}
              onClick={() => { setError(''); setShowJsonImport(true); }}
            >
              JSON
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Plus size={16} />}
              onClick={() => setShowCreateModal(true)}
            >
              Nouveau
            </Button>
          </div>
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
                background: categoryFilter === cat ? 'var(--accent-light)' : 'rgba(255,255,255,0.04)',
                color: categoryFilter === cat ? 'var(--accent)' : 'var(--text-muted)',
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
              color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-muted)',
              background: viewMode === 'list' ? 'rgba(26, 122, 107, 0.1)' : 'transparent',
            }}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{
              color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-muted)',
              background: viewMode === 'grid' ? 'rgba(26, 122, 107, 0.1)' : 'transparent',
            }}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Topics list */}
      {dataLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : topics.length > 0 ? (
        <motion.div
          className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}
          variants={stagger}
          initial="hidden"
          animate="visible"
          key={categoryFilter}
        >
          {topics.map((topic) => (
            <motion.div key={topic.id} variants={fadeUp} style={contextMenu === topic.id ? { zIndex: 30, position: 'relative' } : undefined}>
              <div
                className="cursor-pointer relative"
                onClick={() => { router.push(`/topics/${topic.id}`); }}
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
                        {topic.isPinned && <Pin size={12} style={{ color: 'var(--accent)' }} />}
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
                        className="absolute right-2 top-12 z-50 w-44 rounded-xl overflow-hidden"
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
                    background: newCategory === cat ? 'var(--accent-light)' : 'rgba(255,255,255,0.04)',
                    color: newCategory === cat ? 'var(--accent)' : 'var(--text-muted)',
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
            <Button variant="primary" size="md" onClick={handleCreate} disabled={!newTitle.trim() || creating} className="flex-1">
              {creating ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* JSON import modal */}
      <JsonImportModal
        isOpen={showJsonImport}
        onClose={() => setShowJsonImport(false)}
        onImport={handleJsonImport}
        importing={creating}
      />

      {/* URL import modal */}
      <Modal isOpen={showUrlImport} onClose={() => setShowUrlImport(false)} title="Importer depuis une URL">
        <div className="space-y-4">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Entrez l&apos;URL d&apos;un article web — l&apos;IA extraira le texte et créera automatiquement une note structurée.
          </p>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>URL de l&apos;article</label>
            <input
              value={importUrl}
              onChange={(e) => { setImportUrl(e.target.value); setUrlImportError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUrlImport(); }}
              placeholder="https://..."
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>
          {urlImportError && (
            <p className="text-xs" style={{ color: '#f87171' }}>⚠️ {urlImportError}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setShowUrlImport(false)} className="flex-1">
              Annuler
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={handleUrlImport}
              disabled={!importUrl.trim() || urlImportLoading}
              iconLeft={urlImportLoading ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            >
              {urlImportLoading ? 'Import en cours...' : 'Importer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </AuthGuard>
  );
}
