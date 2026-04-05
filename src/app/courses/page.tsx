'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  GraduationCap, FolderOpen, ChevronRight, Plus,
  Trash2,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/layout/AuthGuard';
import { courseRepository } from '@/lib/repositories/courseRepository';
import type { CourseFolder, CoursePage } from '@/types';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function CoursesPage() {
  const { isAdmin, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageFolder, setNewPageFolder] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [folders, setFolders] = useState<CourseFolder[]>([]);
  const [allPages, setAllPages] = useState<CoursePage[]>([]);
  const [filteredPages, setFilteredPages] = useState<CoursePage[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    setDataLoading(true);
    Promise.all([
      courseRepository.getFolders(),
      courseRepository.getAllPages(),
    ]).then(([f, p]) => {
      setFolders(f);
      setAllPages(p);
    }).catch(() => {}).finally(() => setDataLoading(false));
  }, [refreshKey, authLoading, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!search) { setFilteredPages([]); return; }
    courseRepository.searchPages(search).then(setFilteredPages).catch(() => {});
  }, [search, refreshKey, authLoading, user]);

  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderTitle.trim() || !user || creating) return;
    try {
      setCreating(true);
      setError('');
      await courseRepository.createFolder(user.id, {
        title: newFolderTitle.trim(),
        description: newFolderDesc.trim() || undefined,
        icon: '📁',
        order: folders.length + 1,
      });
      setShowCreateFolder(false);
      setNewFolderTitle('');
      setNewFolderDesc('');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  }, [newFolderTitle, newFolderDesc, folders.length, user, creating]);

  const handleCreatePage = useCallback(async () => {
    if (!newPageTitle.trim() || !newPageFolder || !user || creating) return;
    try {
      setCreating(true);
      setError('');
      const page = await courseRepository.createPage(user.id, {
        folderId: newPageFolder,
        title: newPageTitle.trim(),
        blocks: [courseRepository.createDefaultBlock()],
        tags: [],
        order: allPages.filter((p) => p.folderId === newPageFolder).length + 1,
      });
      setShowCreatePage(false);
      setNewPageTitle('');
      setNewPageFolder('');
      router.push(`/courses/${page.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  }, [newPageTitle, newPageFolder, allPages, user, creating]);

  const handleDeleteFolder = useCallback(async (id: string) => {
    if (!confirm('Supprimer ce dossier et tout son contenu ?')) return;
    try {
      await courseRepository.deleteFolder(id);
      setRefreshKey((k) => k + 1);
    } catch { /* ignore */ }
  }, []);

  return (
    <AuthGuard>
    <div className="pb-10">
      <PageHeader
        title="Cours"
        subtitle="Ressources islamiques fiables"
        rightAction={
          isAdmin ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<FolderOpen size={14} />}
                onClick={() => setShowCreateFolder(true)}
              >
                Dossier
              </Button>
              <Button
                variant="primary"
                size="sm"
                iconLeft={<Plus size={14} />}
                onClick={() => {
                  if (folders.length > 0) {
                    setNewPageFolder(folders[0].id);
                    setShowCreatePage(true);
                  }
                }}
              >
                Page
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Search */}
      <div className="mb-8">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher dans les cours..."
        />
      </div>

      {/* Search results */}
      {search && (
        <div className="mb-8">
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            Résultats ({filteredPages.length})
          </h3>
          {filteredPages.length > 0 ? (
            <div className="space-y-2">
              {filteredPages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => { router.push(`/courses/${page.id}`); }}
                  className="cursor-pointer"
                >
                  <Card glowColor="gold" className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{page.icon || '📄'}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {page.title}
                        </h4>
                        {page.description && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                            {page.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
              Aucun cours trouvé pour &quot;{search}&quot;
            </p>
          )}
        </div>
      )}

      {/* Folders and content */}
      {!search && dataLoading && (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i}>
              <Skeleton variant="text" width="40%" height="1.2rem" className="mb-3" />
              <div className="space-y-2">
                <Skeleton variant="rectangle" height="4rem" />
                <Skeleton variant="rectangle" height="4rem" />
              </div>
            </div>
          ))}
        </div>
      )}
      {!search && !dataLoading && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-6"
          key={refreshKey}
        >
          {folders.length > 0 ? (
            folders.map((folder) => {
              const pages = allPages.filter((p) => p.folderId === folder.id);
              return (
                <motion.div key={folder.id} variants={fadeUp}>
                  {/* Folder header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{folder.icon || '📁'}</span>
                      <div>
                        <h3 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                          {folder.title}
                        </h3>
                        {folder.description && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {folder.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="default" size="sm">
                        {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                      </Badge>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteFolder(folder.id)}
                          className="p-1.5 rounded-lg transition-colors cursor-pointer"
                          style={{ color: 'var(--text-muted)' }}
                          title="Supprimer le dossier"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pages in folder */}
                  <div className="space-y-2">
                    {pages.map((page) => (
                      <div
                        key={page.id}
                        onClick={() => { router.push(`/courses/${page.id}`); }}
                        className="cursor-pointer"
                      >
                        <Card glowColor="none" className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-base">{page.icon || '📄'}</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                                {page.title}
                              </h4>
                              {page.description && (
                                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                                  {page.description}
                                </p>
                              )}
                              {page.tags.length > 0 && (
                                <div className="flex gap-1.5 mt-1.5">
                                  {page.tags.map((tag) => (
                                    <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        </Card>
                      </div>
                    ))}

                    {pages.length === 0 && (
                      <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
                        Aucune page dans ce dossier
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <EmptyState
              icon={GraduationCap}
              title="Aucun cours disponible"
              description="Les cours seront bientôt disponibles."
            />
          )}
        </motion.div>
      )}

      {/* Create folder modal */}
      <Modal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        title="Nouveau Dossier"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Titre
            </label>
            <input
              type="text"
              value={newFolderTitle}
              onChange={(e) => setNewFolderTitle(e.target.value)}
              placeholder="Ex: Sciences du Hadith"
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-[var(--text-muted)]"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Description (optionnel)
            </label>
            <input
              type="text"
              value={newFolderDesc}
              onChange={(e) => setNewFolderDesc(e.target.value)}
              placeholder="Description courte..."
              className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-[var(--text-muted)]"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            />
          </div>
          {error && (
            <p className="text-sm text-center py-2 px-3 rounded-xl" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>{error}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => { setShowCreateFolder(false); setError(''); }} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" onClick={handleCreateFolder} disabled={!newFolderTitle.trim() || creating} className="flex-1">
              {creating ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create page modal */}
      <Modal
        isOpen={showCreatePage}
        onClose={() => setShowCreatePage(false)}
        title="Nouvelle Page de Cours"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Titre
            </label>
            <input
              type="text"
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              placeholder="Ex: Introduction au Tawhid"
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-[var(--text-muted)]"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Dossier
            </label>
            <select
              value={newPageFolder}
              onChange={(e) => setNewPageFolder(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none cursor-pointer"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p className="text-sm text-center py-2 px-3 rounded-xl" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>{error}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => { setShowCreatePage(false); setError(''); }} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" onClick={handleCreatePage} disabled={!newPageTitle.trim() || creating} className="flex-1">
              {creating ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </AuthGuard>
  );
}
