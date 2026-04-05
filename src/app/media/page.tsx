'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, FolderOpen, ChevronRight, Plus,
  Trash2, Edit3, ChevronDown, Home, FolderPlus,
  ArrowRightLeft, Smile, Play, Eye, EyeOff,
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
import { mediaRepository } from '@/lib/repositories/mediaRepository';
import type { MediaFolder, MediaVideo } from '@/types';

const FOLDER_EMOJIS = ['📁', '📂', '🎬', '🎥', '📺', '🎧', '🎙️', '🕌', '🕋', '☪️', '🌙', '⭐', '🤲', '📿', '🎓', '📚', '💡', '🌟', '🏆', '✨'];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

function buildBreadcrumb(folderId: string | null, allFolders: MediaFolder[]): MediaFolder[] {
  if (!folderId) return [];
  const path: MediaFolder[] = [];
  let current = allFolders.find((f) => f.id === folderId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? allFolders.find((f) => f.id === current!.parentId) : undefined;
  }
  return path;
}

function countVideosRecursive(folderId: string, allFolders: MediaFolder[], allVideos: MediaVideo[]): number {
  let count = allVideos.filter((v) => v.folderId === folderId).length;
  const children = allFolders.filter((f) => f.parentId === folderId);
  for (const child of children) {
    count += countVideosRecursive(child.id, allFolders, allVideos);
  }
  return count;
}

function getFolderOptions(allFolders: MediaFolder[], excludeId?: string): { id: string; label: string }[] {
  const options: { id: string; label: string }[] = [];
  function walk(parentId: string | undefined, depth: number) {
    const children = allFolders.filter((f) => (f.parentId || undefined) === parentId && f.id !== excludeId);
    for (const folder of children) {
      options.push({ id: folder.id, label: '\u00A0\u00A0'.repeat(depth) + (folder.icon || '📁') + ' ' + folder.title });
      walk(folder.id, depth + 1);
    }
  }
  walk(undefined, 0);
  return options;
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function MediaPage() {
  const { isAdmin, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [allFolders, setAllFolders] = useState<MediaFolder[]>([]);
  const [allVideos, setAllVideos] = useState<MediaVideo[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Navigation
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  // Create folder
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');
  const [showFolderEmojis, setShowFolderEmojis] = useState(false);

  // Edit folder
  const [editingFolder, setEditingFolder] = useState<MediaFolder | null>(null);
  const [editFolderTitle, setEditFolderTitle] = useState('');
  const [editFolderDesc, setEditFolderDesc] = useState('');
  const [editFolderIcon, setEditFolderIcon] = useState('');
  const [editFolderParent, setEditFolderParent] = useState('');
  const [showEditFolderEmojis, setShowEditFolderEmojis] = useState(false);

  // Add video
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoChannel, setNewVideoChannel] = useState('');
  const [newVideoTags, setNewVideoTags] = useState('');
  const [fetchingMeta, setFetchingMeta] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [folders, videos] = await Promise.all([
        mediaRepository.getAllFolders(),
        mediaRepository.getAllVideos(),
      ]);
      setAllFolders(folders);
      setAllVideos(videos);
    } catch { /* ignore */ }
    setDataLoading(false);
  }, [user]);

  useEffect(() => { if (user) loadAll(); else setDataLoading(false); }, [user, loadAll]);

  const breadcrumb = useMemo(() => buildBreadcrumb(currentFolderId, allFolders), [currentFolderId, allFolders]);

  const visibleFolders = useMemo(() => {
    if (search) return allFolders.filter((f) => f.title.toLowerCase().includes(search.toLowerCase()));
    return allFolders.filter((f) => (f.parentId || null) === currentFolderId);
  }, [allFolders, currentFolderId, search]);

  const visibleVideos = useMemo(() => {
    if (search) return allVideos.filter((v) => v.title.toLowerCase().includes(search.toLowerCase()) || v.channelName?.toLowerCase().includes(search.toLowerCase()));
    if (!currentFolderId) return [];
    return allVideos.filter((v) => v.folderId === currentFolderId);
  }, [allVideos, currentFolderId, search]);

  // Auto-fetch YouTube metadata
  const handleUrlBlur = async () => {
    if (!newVideoUrl.trim() || fetchingMeta) return;
    const ytId = extractYouTubeId(newVideoUrl);
    if (!ytId) return;
    setFetchingMeta(true);
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${ytId}`);
      const data = await res.json();
      if (data.title && !newVideoTitle) setNewVideoTitle(data.title);
      if (data.author_name && !newVideoChannel) setNewVideoChannel(data.author_name);
    } catch { /* ignore */ }
    setFetchingMeta(false);
  };

  const handleCreateFolder = async () => {
    if (!user || !newFolderTitle.trim()) return;
    try {
      await mediaRepository.createFolder(user.id, {
        title: newFolderTitle.trim(),
        description: newFolderDesc.trim() || undefined,
        icon: newFolderIcon,
        parentId: currentFolderId || undefined,
        order: visibleFolders.length,
      });
      setShowCreateFolder(false);
      setNewFolderTitle(''); setNewFolderDesc(''); setNewFolderIcon('📁');
      loadAll();
    } catch { /* ignore */ }
  };

  const handleEditFolder = async () => {
    if (!editingFolder || !editFolderTitle.trim()) return;
    try {
      await mediaRepository.updateFolder(editingFolder.id, {
        title: editFolderTitle.trim(),
        description: editFolderDesc.trim() || undefined,
        icon: editFolderIcon,
        parentId: editFolderParent || undefined,
      });
      setEditingFolder(null);
      loadAll();
    } catch { /* ignore */ }
  };

  const handleDeleteFolder = async (id: string) => {
    try { await mediaRepository.deleteFolder(id); loadAll(); } catch { /* ignore */ }
  };

  const handleAddVideo = async () => {
    if (!user || !newVideoTitle.trim() || !newVideoUrl.trim()) return;
    try {
      // Auto-create a default folder if none selected
      let folderId = currentFolderId;
      if (!folderId) {
        const existing = allFolders.find((f) => !f.parentId);
        if (existing) {
          folderId = existing.id;
        } else {
          const created = await mediaRepository.createFolder(user.id, {
            title: 'Mes vidéos',
            icon: '🎬',
            order: 0,
          });
          folderId = created.id;
        }
        setCurrentFolderId(folderId);
      }
      const ytId = extractYouTubeId(newVideoUrl);
      await mediaRepository.createVideo(user.id, {
        folderId,
        title: newVideoTitle.trim(),
        url: newVideoUrl.trim(),
        thumbnailUrl: ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : undefined,
        channelName: newVideoChannel.trim() || undefined,
        notes: [],
        tags: newVideoTags.split(',').map(t => t.trim()).filter(Boolean),
        watched: false,
        order: visibleVideos.length,
      });
      setShowAddVideo(false);
      setNewVideoTitle(''); setNewVideoUrl(''); setNewVideoChannel(''); setNewVideoTags('');
      loadAll();
    } catch { /* ignore */ }
  };

  const handleToggleWatched = async (video: MediaVideo) => {
    try { await mediaRepository.updateVideo(video.id, { watched: !video.watched }); loadAll(); } catch { /* ignore */ }
  };

  const handleDeleteVideo = async (id: string) => {
    try { await mediaRepository.deleteVideo(id); loadAll(); } catch { /* ignore */ }
  };

  const totalVideos = allVideos.length;
  const watchedCount = allVideos.filter(v => v.watched).length;

  return (
    <AuthGuard>
    <div className="pb-10">
      <PageHeader
        title="Médiathèque"
        subtitle={`${totalVideos} vidéo${totalVideos !== 1 ? 's' : ''} • ${watchedCount} vue${watchedCount !== 1 ? 's' : ''}`}
        rightAction={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" iconLeft={<FolderPlus size={14} />} onClick={() => setShowCreateFolder(true)}>
              Dossier
            </Button>
            {currentFolderId && (
              <Button variant="primary" size="sm" iconLeft={<Plus size={14} />} onClick={() => setShowAddVideo(true)}>
                Vidéo
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une vidéo..." />
      </div>

      {/* Breadcrumb */}
      {!search && (
        <div className="flex items-center gap-1 mb-6 text-sm flex-wrap" style={{ color: 'var(--text-muted)' }}>
          <button onClick={() => setCurrentFolderId(null)} className="flex items-center gap-1 hover:underline cursor-pointer" style={{ color: currentFolderId ? 'var(--accent)' : 'var(--text-primary)' }}>
            <Home size={14} /> Racine
          </button>
          {breadcrumb.map((f) => (
            <span key={f.id} className="flex items-center gap-1">
              <ChevronRight size={14} />
              <button onClick={() => setCurrentFolderId(f.id)} className="hover:underline cursor-pointer" style={{ color: f.id === currentFolderId ? 'var(--text-primary)' : 'var(--accent)' }}>
                {f.icon || '📁'} {f.title}
              </button>
            </span>
          ))}
        </div>
      )}

      {dataLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
          {/* Folders */}
          {visibleFolders.map((folder) => {
            const videoCount = countVideosRecursive(folder.id, allFolders, allVideos);
            const isCollapsed = collapsedFolders.has(folder.id);
            return (
              <motion.div key={folder.id} variants={fadeUp}>
                <Card glowColor="green" className="p-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCurrentFolderId(folder.id)} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer text-left">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {folder.icon || '📁'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{folder.title}</h4>
                        {folder.description && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{folder.description}</p>}
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{videoCount} vidéo{videoCount !== 1 ? 's' : ''}</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setEditingFolder(folder); setEditFolderTitle(folder.title); setEditFolderDesc(folder.description || ''); setEditFolderIcon(folder.icon || '📁'); setEditFolderParent(folder.parentId || ''); }} className="p-2 rounded-lg hover:bg-white/5 cursor-pointer" style={{ color: 'var(--text-muted)' }}><Edit3 size={14} /></button>
                      <button onClick={() => handleDeleteFolder(folder.id)} className="p-2 rounded-lg hover:bg-red-500/10 cursor-pointer" style={{ color: '#f87171' }}><Trash2 size={14} /></button>
                      <button onClick={() => setCollapsedFolders(s => { const n = new Set(s); isCollapsed ? n.delete(folder.id) : n.add(folder.id); return n; })} className="p-2 rounded-lg hover:bg-white/5 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                        <ChevronDown size={14} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {/* Videos */}
          {visibleVideos.map((video) => {
            const ytId = extractYouTubeId(video.url);
            return (
              <motion.div key={video.id} variants={fadeUp}>
                <Card glowColor="green" className="overflow-hidden">
                  <div className="flex gap-3 p-4">
                    {/* Thumbnail */}
                    <button onClick={() => router.push(`/media/${video.id}`)} className="shrink-0 cursor-pointer">
                      <div className="relative w-28 h-16 sm:w-36 sm:h-20 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        {video.thumbnailUrl ? (
                          <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full"><Video size={24} style={{ color: 'var(--text-muted)' }} /></div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                          <Play size={20} className="text-white" />
                        </div>
                        {video.duration && (
                          <span className="absolute bottom-1 right-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/70 text-white">{video.duration}</span>
                        )}
                      </div>
                    </button>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <button onClick={() => router.push(`/media/${video.id}`)} className="text-left cursor-pointer">
                        <h4 className="text-sm font-semibold line-clamp-2 leading-snug" style={{ color: 'var(--text-primary)' }}>{video.title}</h4>
                      </button>
                      {video.channelName && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{video.channelName}</p>}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {video.tags.slice(0, 3).map(t => <Badge key={t} variant="default" size="sm">{t}</Badge>)}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button onClick={() => handleToggleWatched(video)} className="p-2 rounded-lg hover:bg-white/5 cursor-pointer" title={video.watched ? 'Marquer non vu' : 'Marquer vu'} style={{ color: video.watched ? '#3aaa60' : 'var(--text-muted)' }}>
                        {video.watched ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button onClick={() => handleDeleteVideo(video.id)} className="p-2 rounded-lg hover:bg-red-500/10 cursor-pointer" style={{ color: '#f87171' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {/* Empty states */}
          {visibleFolders.length === 0 && visibleVideos.length === 0 && !search && !currentFolderId && (
            <EmptyState icon={Video} title="Médiathèque vide" description="Créez un dossier pour organiser vos vidéos." />
          )}
          {visibleFolders.length === 0 && visibleVideos.length === 0 && !search && currentFolderId && (
            <EmptyState icon={Video} title="Dossier vide" description="Ajoutez une vidéo avec le bouton + ci-dessus." />
          )}
          {visibleFolders.length === 0 && visibleVideos.length === 0 && search && (
            <EmptyState icon={Video} title="Aucun résultat" description="Aucune vidéo ne correspond à votre recherche." />
          )}
        </motion.div>
      )}

      {/* Create Folder Modal */}
      <Modal isOpen={showCreateFolder} onClose={() => setShowCreateFolder(false)} title="Nouveau dossier">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFolderEmojis(!showFolderEmojis)} className="flex h-12 w-12 items-center justify-center rounded-xl text-xl cursor-pointer" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              {newFolderIcon}
            </button>
            <input value={newFolderTitle} onChange={(e) => setNewFolderTitle(e.target.value)} placeholder="Nom du dossier" className="flex-1 rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
          <AnimatePresence>
            {showFolderEmojis && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="flex flex-wrap gap-2 p-2 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                  {FOLDER_EMOJIS.map(e => <button key={e} onClick={() => { setNewFolderIcon(e); setShowFolderEmojis(false); }} className="text-lg p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">{e}</button>)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <textarea value={newFolderDesc} onChange={(e) => setNewFolderDesc(e.target.value)} placeholder="Description (optionnel)" rows={2} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setShowCreateFolder(false)} className="flex-1">Annuler</Button>
            <Button variant="primary" size="md" onClick={handleCreateFolder} disabled={!newFolderTitle.trim()} className="flex-1">Créer</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Folder Modal */}
      <Modal isOpen={!!editingFolder} onClose={() => setEditingFolder(null)} title="Modifier le dossier">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowEditFolderEmojis(!showEditFolderEmojis)} className="flex h-12 w-12 items-center justify-center rounded-xl text-xl cursor-pointer" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              {editFolderIcon}
            </button>
            <input value={editFolderTitle} onChange={(e) => setEditFolderTitle(e.target.value)} className="flex-1 rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
          <AnimatePresence>
            {showEditFolderEmojis && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="flex flex-wrap gap-2 p-2 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                  {FOLDER_EMOJIS.map(e => <button key={e} onClick={() => { setEditFolderIcon(e); setShowEditFolderEmojis(false); }} className="text-lg p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">{e}</button>)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <textarea value={editFolderDesc} onChange={(e) => setEditFolderDesc(e.target.value)} placeholder="Description" rows={2} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          {editingFolder && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Déplacer vers</label>
              <select value={editFolderParent} onChange={(e) => setEditFolderParent(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm outline-none cursor-pointer" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                <option value="">Racine</option>
                {getFolderOptions(allFolders, editingFolder.id).map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setEditingFolder(null)} className="flex-1">Annuler</Button>
            <Button variant="primary" size="md" onClick={handleEditFolder} disabled={!editFolderTitle.trim()} className="flex-1">Enregistrer</Button>
          </div>
        </div>
      </Modal>

      {/* Add Video Modal */}
      <Modal isOpen={showAddVideo} onClose={() => setShowAddVideo(false)} title="Ajouter une vidéo">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>URL YouTube</label>
            <input value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} onBlur={handleUrlBlur} placeholder="https://youtube.com/watch?v=..." className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
            {fetchingMeta && <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>Récupération des infos...</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Titre</label>
            <input value={newVideoTitle} onChange={(e) => setNewVideoTitle(e.target.value)} placeholder="Titre de la vidéo" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Chaîne</label>
            <input value={newVideoChannel} onChange={(e) => setNewVideoChannel(e.target.value)} placeholder="Nom de la chaîne" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tags (séparés par des virgules)</label>
            <input value={newVideoTags} onChange={(e) => setNewVideoTags(e.target.value)} placeholder="fiqh, aqida, tafsir" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setShowAddVideo(false)} className="flex-1">Annuler</Button>
            <Button variant="primary" size="md" onClick={handleAddVideo} disabled={!newVideoTitle.trim() || !newVideoUrl.trim()} className="flex-1">Ajouter</Button>
          </div>
        </div>
      </Modal>
    </div>
    </AuthGuard>
  );
}
