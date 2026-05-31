'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, FolderOpen, ChevronRight, Plus,
  Trash2, Edit3, ChevronDown, Home, FolderPlus,
  ArrowRightLeft, Smile, FileText, Upload, Sparkles, Loader2,
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
import { queryCache, getCached, persistCache } from '@/lib/queryCache';
import { generateCoursePlan } from '@/lib/ai/groq';
import { useToast } from '@/components/ui/Toast';
import JsonImportModal from '@/components/editor/JsonImportModal';
import type { CourseFolder, CoursePage, TopicBlock } from '@/types';

const FOLDER_EMOJIS = ['📁', '📂', '🕌', '🕋', '☪️', '🌙', '⭐', '🤲', '📿', '🎓', '📚', '📖', '📕', '📗', '📘', '💡', '🌟', '🏆', '✨', '🔬'];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

// Helper: build breadcrumb path from folder id to root
function buildBreadcrumb(folderId: string | null, allFolders: CourseFolder[]): CourseFolder[] {
  if (!folderId) return [];
  const path: CourseFolder[] = [];
  let current = allFolders.find((f) => f.id === folderId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? allFolders.find((f) => f.id === current!.parentId) : undefined;
  }
  return path;
}

// Helper: count all pages recursively under a folder
function countPagesRecursive(folderId: string, allFolders: CourseFolder[], allPages: CoursePage[]): number {
  let count = allPages.filter((p) => p.folderId === folderId).length;
  const children = allFolders.filter((f) => f.parentId === folderId);
  for (const child of children) {
    count += countPagesRecursive(child.id, allFolders, allPages);
  }
  return count;
}

// Helper: get indented folder label for selects
function getFolderOptions(allFolders: CourseFolder[], excludeId?: string): { id: string; label: string }[] {
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

export default function CoursesPage() {
  const { isAdmin, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [allFolders, setAllFolders] = useState<CourseFolder[]>(() => getCached<CourseFolder[]>('courses:folders') ?? []);
  const [allPages, setAllPages] = useState<CoursePage[]>(() => getCached<CoursePage[]>('courses:pages') ?? []);
  const [filteredPages, setFilteredPages] = useState<CoursePage[]>([]);
  const [dataLoading, setDataLoading] = useState(() => !getCached('courses:folders'));

  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  // Create folder state
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');
  const [showFolderEmojis, setShowFolderEmojis] = useState(false);

  // Edit folder state
  const [editingFolder, setEditingFolder] = useState<CourseFolder | null>(null);
  const [editFolderTitle, setEditFolderTitle] = useState('');
  const [editFolderDesc, setEditFolderDesc] = useState('');
  const [editFolderIcon, setEditFolderIcon] = useState('');
  const [editFolderParent, setEditFolderParent] = useState('');
  const [showEditFolderEmojis, setShowEditFolderEmojis] = useState(false);

  // Create page state
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageFolder, setNewPageFolder] = useState('');

  // Move page state
  const [movingPage, setMovingPage] = useState<CoursePage | null>(null);
  const [moveTargetFolder, setMoveTargetFolder] = useState('');

  // JSON import state
  const [showJsonImport, setShowJsonImport] = useState(false);

  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  // AI course plan
  const { toast } = useToast();
  const [showAiPlan, setShowAiPlan] = useState(false);
  const [aiPlanUrl, setAiPlanUrl] = useState('');
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const aiPlanFileRef = useRef<HTMLInputElement>(null);

  const handleAiCoursePlan = useCallback(async (transcript: string, sourceTitle: string, sourceType: 'youtube' | 'pdf') => {
    if (aiPlanLoading || !user) return;
    setAiPlanLoading(true);
    try {
      const plan = await generateCoursePlan(transcript, sourceTitle, sourceType);
      // Create a folder for the course
      const folder = await courseRepository.createFolder(user.id, {
        title: plan.title || sourceTitle,
        icon: '🤖',
        parentId: currentFolderId || undefined,
        order: 0,
      });
      // Create pages for each section
      for (let i = 0; i < plan.sections.length; i++) {
        const section = plan.sections[i];
        const blocks: TopicBlock[] = section.blocks.map((b, j) => ({
          id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${j}`,
          type: b.type as TopicBlock['type'],
          content: b.content,
          metadata: b.metadata,
          order: j,
        }));
        await courseRepository.createPage(user.id, {
          folderId: folder.id,
          title: section.title,
          description: section.description,
          blocks,
          tags: [],
          order: i,
        });
      }
      // Refresh data
      const [f, p] = await Promise.all([courseRepository.getAllFolders(), courseRepository.getAllPages()]);
      setAllFolders(f);
      setAllPages(p);
      setShowAiPlan(false);
      setAiPlanUrl('');
      toast('success', `Cours "${plan.title}" généré avec ${plan.sections.length} leçons !`);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erreur IA');
    } finally {
      setAiPlanLoading(false);
    }
  }, [aiPlanLoading, currentFolderId, toast, user]);

  const handleAiPlanFromUrl = useCallback(async () => {
    if (!aiPlanUrl.trim() || aiPlanLoading) return;
    const ytMatch = aiPlanUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
    if (!ytMatch) {
      toast('error', 'URL YouTube invalide');
      return;
    }
    setAiPlanLoading(true);
    try {
      const endpoint = process.env.NODE_ENV === 'production'
        ? `/.netlify/functions/youtube-transcript?videoId=${ytMatch[1]}`
        : `/api/youtube-transcript?videoId=${ytMatch[1]}`;
      const res = await fetch(endpoint);
      const data = await res.json() as { transcript?: string; error?: string };
      if (!data.transcript) throw new Error(data.error || 'Transcription vide');
      await handleAiCoursePlan(data.transcript, aiPlanUrl, 'youtube');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erreur');
      setAiPlanLoading(false);
    }
  }, [aiPlanUrl, aiPlanLoading, handleAiCoursePlan, toast]);

  const handleAiPlanFromFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await handleAiCoursePlan(text, file.name.replace(/\.[^.]+$/, ''), 'pdf');
    e.target.value = '';
  }, [handleAiCoursePlan]);

  // Load all data
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    const hasCached = queryCache.get('courses:folders') !== null;
    if (!hasCached) setDataLoading(true);
    Promise.all([
      courseRepository.getAllFolders(),
      courseRepository.getAllPages(),
    ]).then(([f, p]) => {
      if (!cancelled) {
        persistCache('courses:folders', f, 300_000);
        persistCache('courses:pages', p, 300_000);
        setAllFolders(f);
        setAllPages(p);
      }
    }).catch(() => {}).finally(() => { if (!cancelled) setDataLoading(false); });
    return () => { cancelled = true; };
  }, [authLoading, user]);

  // Search (debounced to avoid excessive Supabase queries on keystroke)
  useEffect(() => {
    if (authLoading) return;
    if (!search) { setFilteredPages([]); return; }
    let cancelled = false;
    const timeout = setTimeout(() => {
      courseRepository.searchPages(search).then(p => { if (!cancelled) setFilteredPages(p); }).catch(() => {});
    }, 300);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [search, authLoading, user]);

  // Current folder's children & pages
  const currentSubfolders = useMemo(
    () => allFolders.filter((f) => (currentFolderId ? f.parentId === currentFolderId : !f.parentId)),
    [allFolders, currentFolderId],
  );
  const currentPages = useMemo(
    () => currentFolderId ? allPages.filter((p) => p.folderId === currentFolderId) : [],
    [allPages, currentFolderId],
  );
  const breadcrumb = useMemo(
    () => buildBreadcrumb(currentFolderId, allFolders),
    [currentFolderId, allFolders],
  );
  const folderOptions = useMemo(
    () => getFolderOptions(allFolders),
    [allFolders],
  );
  const editFolderOptions = useMemo(
    () => editingFolder ? getFolderOptions(allFolders, editingFolder.id) : [],
    [allFolders, editingFolder],
  );

  // Pre-compute page counts for all folders (avoids O(n²) per render)
  const folderPageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const folder of allFolders) {
      counts.set(folder.id, countPagesRecursive(folder.id, allFolders, allPages));
    }
    return counts;
  }, [allFolders, allPages]);

  // Toggle collapse
  const toggleCollapse = useCallback((id: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Navigate into a folder
  const navigateToFolder = useCallback((id: string | null) => {
    setCurrentFolderId(id);
  }, []);

  // Create folder
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderTitle.trim() || !user || creating) return;
    try {
      setCreating(true);
      setError('');
      const folder = await courseRepository.createFolder(user.id, {
        title: newFolderTitle.trim(),
        description: newFolderDesc.trim() || undefined,
        icon: newFolderIcon || '📁',
        parentId: currentFolderId || undefined,
        order: currentSubfolders.length + 1,
      });
      setAllFolders(prev => [...prev, folder]);
      setShowCreateFolder(false);
      setNewFolderTitle('');
      setNewFolderDesc('');
      setNewFolderIcon('📁');
      setShowFolderEmojis(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  }, [newFolderTitle, newFolderDesc, newFolderIcon, currentFolderId, currentSubfolders.length, user, creating]);

  // Edit folder
  const openEditFolder = useCallback((folder: CourseFolder) => {
    setEditingFolder(folder);
    setEditFolderTitle(folder.title);
    setEditFolderDesc(folder.description || '');
    setEditFolderIcon(folder.icon || '📁');
    setEditFolderParent(folder.parentId || '');
    setShowEditFolderEmojis(false);
    setError('');
  }, []);

  const handleUpdateFolder = useCallback(async () => {
    if (!editingFolder || !editFolderTitle.trim() || creating) return;
    try {
      setCreating(true);
      setError('');
      const updated = await courseRepository.updateFolder(editingFolder.id, {
        title: editFolderTitle.trim(),
        description: editFolderDesc.trim() || undefined,
        icon: editFolderIcon || '📁',
        parentId: editFolderParent || undefined,
      });
      if (updated) setAllFolders(prev => prev.map(f => f.id === editingFolder.id ? updated : f));
      setEditingFolder(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification');
    } finally {
      setCreating(false);
    }
  }, [editingFolder, editFolderTitle, editFolderDesc, editFolderIcon, editFolderParent, creating]);

  // Create page
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
  }, [newPageTitle, newPageFolder, allPages, user, creating, router]);

  // Import JSON as new page
  const handleJsonImport = useCallback(async (title: string, blocks: TopicBlock[]) => {
    if (!user || creating) return;
    const targetFolder = currentFolderId || allFolders.find((f) => !f.parentId)?.id;
    if (!targetFolder) return;
    try {
      setCreating(true);
      setError('');
      const page = await courseRepository.createPage(user.id, {
        folderId: targetFolder,
        title,
        blocks,
        tags: [],
        order: allPages.filter((p) => p.folderId === targetFolder).length + 1,
      });
      setShowJsonImport(false);
      router.push(`/courses/${page.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
    } finally {
      setCreating(false);
    }
  }, [user, creating, currentFolderId, allFolders, allPages, router]);

  // Move page to another folder
  const handleMovePage = useCallback(async () => {
    if (!movingPage || !moveTargetFolder || creating) return;
    try {
      setCreating(true);
      setError('');
      await courseRepository.updatePage(movingPage.id, { folderId: moveTargetFolder });
      setAllPages(prev => prev.map(p => p.id === movingPage.id ? { ...p, folderId: moveTargetFolder } : p));
      setMovingPage(null);
      setMoveTargetFolder('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du déplacement');
    } finally {
      setCreating(false);
    }
  }, [movingPage, moveTargetFolder, creating]);

  // Delete folder
  const handleDeleteFolder = useCallback(async (id: string) => {
    if (!confirm('Supprimer ce dossier et tout son contenu ?')) return;
    try {
      await courseRepository.deleteFolder(id);
      if (currentFolderId === id) setCurrentFolderId(null);
      setAllFolders(prev => prev.filter(f => f.id !== id));
      setAllPages(prev => prev.filter(p => p.folderId !== id));
    } catch { /* ignore */ }
  }, [currentFolderId]);

  // Delete page
  const handleDeletePage = useCallback(async (id: string) => {
    if (!confirm('Supprimer cette page ?')) return;
    try {
      await courseRepository.deletePage(id);
      setAllPages(prev => prev.filter(p => p.id !== id));
    } catch { /* ignore */ }
  }, []);

  // Render a folder card (used in both root view and navigated view)
  const renderFolderCard = (folder: CourseFolder, navigable: boolean) => {
    const pageCount = folderPageCounts.get(folder.id) ?? 0;
    const directSubfolders = allFolders.filter((f) => f.parentId === folder.id).length;
    const isCollapsed = collapsedFolders.has(folder.id);
    const directPages = allPages.filter((p) => p.folderId === folder.id);

    return (
      <motion.div key={folder.id} variants={fadeUp}>
        {/* Folder header */}
        <div className="flex items-center justify-between mb-2">
          <div
            className={`flex items-center gap-2 flex-1 min-w-0 ${navigable ? 'cursor-pointer' : ''}`}
            onClick={() => navigable ? navigateToFolder(folder.id) : toggleCollapse(folder.id)}
          >
            <span className="text-lg shrink-0">{folder.icon || '📁'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                  {folder.title}
                </h3>
                {directSubfolders > 0 && (
                  <Badge variant="teal" size="sm">{directSubfolders} sous-dossier{directSubfolders > 1 ? 's' : ''}</Badge>
                )}
              </div>
              {folder.description && (
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {folder.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Badge variant="default" size="sm">
              {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            </Badge>
            {!navigable && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleCollapse(folder.id); }}
                className="p-1.5 rounded-lg transition-all cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                title={isCollapsed ? 'Déplier' : 'Replier'}
              >
                <ChevronDown
                  size={14}
                  className="transition-transform duration-200"
                  style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                />
              </button>
            )}
            {navigable && (
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
            )}
            {isAdmin && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); openEditFolder(folder); }}
                  className="p-1.5 rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  title="Modifier le dossier"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                  className="p-1.5 rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  title="Supprimer le dossier"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Pages in folder (collapsible, only in root view) */}
        {!navigable && (
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 ml-1 pl-5" style={{ borderLeft: '2px solid var(--border-subtle)' }}>
                  {/* Sub-folders */}
                  {allFolders.filter((f) => f.parentId === folder.id).map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => navigateToFolder(sub.id)}
                      className="cursor-pointer"
                    >
                      <Card glowColor="none" className="p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-base">{sub.icon || '📁'}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                              {sub.title}
                            </h4>
                          </div>
                          <Badge variant="default" size="sm">
                            {folderPageCounts.get(sub.id) ?? 0} pages
                          </Badge>
                          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                        </div>
                      </Card>
                    </div>
                  ))}

                  {/* Pages */}
                  {directPages.map((page) => renderPageCard(page))}

                  {directPages.length === 0 && allFolders.filter((f) => f.parentId === folder.id).length === 0 && (
                    <div className="py-4 text-center">
                      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                        Dossier vide
                      </p>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={<Plus size={12} />}
                          onClick={() => {
                            setNewPageFolder(folder.id);
                            setShowCreatePage(true);
                          }}
                        >
                          Ajouter une page
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    );
  };

  // Render a page card
  const renderPageCard = (page: CoursePage) => (
    <div
      key={page.id}
      className="cursor-pointer group/page"
    >
      <Card glowColor="none" className="p-4">
        <div className="flex items-center gap-3">
          <span
            className="text-base cursor-pointer"
            onClick={() => router.push(`/courses/${page.id}`)}
          >
            {page.icon || '📄'}
          </span>
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => router.push(`/courses/${page.id}`)}
          >
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
          {isAdmin && (
            <div className="flex items-center gap-1 opacity-0 group-hover/page:opacity-100 transition-opacity shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setMovingPage(page); setMoveTargetFolder(page.folderId); setError(''); }}
                className="p-1.5 rounded-lg cursor-pointer transition-colors"
                style={{ color: 'var(--text-muted)' }}
                title="Déplacer"
              >
                <ArrowRightLeft size={13} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id); }}
                className="p-1.5 rounded-lg cursor-pointer transition-colors"
                style={{ color: 'var(--text-muted)' }}
                title="Supprimer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
          <ChevronRight
            size={16}
            style={{ color: 'var(--text-muted)' }}
            className="shrink-0 cursor-pointer"
            onClick={() => router.push(`/courses/${page.id}`)}
          />
        </div>
      </Card>
    </div>
  );

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
                iconLeft={<FolderPlus size={14} />}
                onClick={() => {
                  setNewFolderTitle('');
                  setNewFolderDesc('');
                  setNewFolderIcon('📁');
                  setShowFolderEmojis(false);
                  setError('');
                  setShowCreateFolder(true);
                }}
              >
                Dossier
              </Button>
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Upload size={14} />}
                onClick={() => {
                  setError('');
                  setShowJsonImport(true);
                }}
              >
                JSON
              </Button>
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Sparkles size={14} />}
                onClick={() => {
                  setAiPlanUrl('');
                  setShowAiPlan(true);
                }}
              >
                IA
              </Button>
              <Button
                variant="primary"
                size="sm"
                iconLeft={<Plus size={14} />}
                onClick={() => {
                  const targetFolder = currentFolderId || (allFolders.find((f) => !f.parentId)?.id);
                  if (targetFolder) {
                    setNewPageFolder(targetFolder);
                    setError('');
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

      {/* Breadcrumb navigation */}
      {currentFolderId && (
        <div className="flex items-center gap-1.5 mb-5 overflow-x-auto scrollbar-none -mx-5 px-5">
          <button
            onClick={() => navigateToFolder(null)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
            style={{ color: 'var(--accent)', background: 'rgba(26,122,107,0.08)' }}
          >
            <Home size={12} />
            Cours
          </button>
          {breadcrumb.map((folder, i) => (
            <div key={folder.id} className="flex items-center gap-1.5 shrink-0">
              <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
              <button
                onClick={() => navigateToFolder(i === breadcrumb.length - 1 ? folder.id : folder.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                style={{
                  color: i === breadcrumb.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: i === breadcrumb.length - 1 ? 'var(--bg-elevated)' : 'transparent',
                }}
              >
                <span className="text-sm">{folder.icon || '📁'}</span>
                {folder.title}
              </button>
            </div>
          ))}
        </div>
      )}

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
                  onClick={() => router.push(`/courses/${page.id}`)}
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

      {/* Loading */}
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

      {/* ROOT VIEW — show top-level folders with collapsible content */}
      {!search && !dataLoading && !currentFolderId && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-6"
          key="root"
        >
          {allFolders.filter((f) => !f.parentId).length > 0 ? (
            allFolders.filter((f) => !f.parentId).map((folder) => renderFolderCard(folder, false))
          ) : (
            <EmptyState
              icon={GraduationCap}
              title="Aucun cours disponible"
              description={isAdmin ? 'Créez votre premier dossier pour commencer.' : 'Les cours seront bientôt disponibles.'}
            />
          )}
        </motion.div>
      )}

      {/* SUBFOLDER VIEW — navigated inside a folder */}
      {!search && !dataLoading && currentFolderId && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-4"
          key={`folder-${currentFolderId}`}
        >
          {/* Sub-folders */}
          {currentSubfolders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Sous-dossiers
              </h3>
              {currentSubfolders.map((folder) => renderFolderCard(folder, true))}
            </div>
          )}

          {/* Pages */}
          {currentPages.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Pages
              </h3>
              <div className="space-y-2">
                {currentPages.map((page) => renderPageCard(page))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {currentSubfolders.length === 0 && currentPages.length === 0 && (
            <EmptyState
              icon={FolderOpen}
              title="Dossier vide"
              description={isAdmin ? 'Ajoutez une page ou un sous-dossier.' : 'Aucun contenu dans ce dossier.'}
            />
          )}
        </motion.div>
      )}

      {/* === MODALS === */}

      {/* Create folder modal */}
      <Modal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        title={currentFolderId ? 'Nouveau Sous-dossier' : 'Nouveau Dossier'}
      >
        <div className="space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Icône
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFolderEmojis(!showFolderEmojis)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span className="text-lg">{newFolderIcon}</span>
                <Smile size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <AnimatePresence>
              {showFolderEmojis && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 mt-2">
                    {FOLDER_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => { setNewFolderIcon(emoji); setShowFolderEmojis(false); }}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-lg cursor-pointer transition-all"
                        style={{
                          background: newFolderIcon === emoji ? 'rgba(26,122,107,0.15)' : 'var(--bg-secondary)',
                          border: newFolderIcon === emoji ? '1px solid rgba(26,122,107,0.3)' : '1px solid transparent',
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
          {currentFolderId && (
            <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
              Sera créé dans : <strong>{breadcrumb[breadcrumb.length - 1]?.title || 'Racine'}</strong>
            </p>
          )}
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

      {/* Edit folder modal */}
      <Modal
        isOpen={!!editingFolder}
        onClose={() => setEditingFolder(null)}
        title="Modifier le dossier"
      >
        <div className="space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Icône
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditFolderEmojis(!showEditFolderEmojis)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span className="text-lg">{editFolderIcon}</span>
                <Smile size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <AnimatePresence>
              {showEditFolderEmojis && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 mt-2">
                    {FOLDER_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => { setEditFolderIcon(emoji); setShowEditFolderEmojis(false); }}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-lg cursor-pointer transition-all"
                        style={{
                          background: editFolderIcon === emoji ? 'rgba(26,122,107,0.15)' : 'var(--bg-secondary)',
                          border: editFolderIcon === emoji ? '1px solid rgba(26,122,107,0.3)' : '1px solid transparent',
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Titre
            </label>
            <input
              type="text"
              value={editFolderTitle}
              onChange={(e) => setEditFolderTitle(e.target.value)}
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
              value={editFolderDesc}
              onChange={(e) => setEditFolderDesc(e.target.value)}
              placeholder="Description courte..."
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
              Dossier parent
            </label>
            <select
              value={editFolderParent}
              onChange={(e) => setEditFolderParent(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none cursor-pointer"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <option value="">📂 Racine (aucun parent)</option>
              {editFolderOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
          {error && (
            <p className="text-sm text-center py-2 px-3 rounded-xl" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>{error}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => { setEditingFolder(null); setError(''); }} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" onClick={handleUpdateFolder} disabled={!editFolderTitle.trim() || creating} className="flex-1">
              {creating ? 'Sauvegarde...' : 'Enregistrer'}
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
              {folderOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
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

      {/* Move page modal */}
      <Modal
        isOpen={!!movingPage}
        onClose={() => setMovingPage(null)}
        title="Déplacer la page"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Déplacer <strong style={{ color: 'var(--text-primary)' }}>{movingPage?.title}</strong> vers :
          </p>
          <select
            value={moveTargetFolder}
            onChange={(e) => setMoveTargetFolder(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none cursor-pointer"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {folderOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          {error && (
            <p className="text-sm text-center py-2 px-3 rounded-xl" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>{error}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => { setMovingPage(null); setError(''); }} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" onClick={handleMovePage} disabled={!moveTargetFolder || creating} className="flex-1">
              {creating ? 'Déplacement...' : 'Déplacer'}
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

      {/* AI Course Plan Modal */}
      <Modal isOpen={showAiPlan} onClose={() => setShowAiPlan(false)} title="🤖 Générer un cours avec l'IA">
        <div className="space-y-4">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Collez une URL YouTube ou importez un fichier texte/PDF pour générer automatiquement un plan de cours structuré.
          </p>

          {/* From YouTube URL */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>URL YouTube</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={aiPlanUrl}
                onChange={(e) => setAiPlanUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-[var(--text-muted)]"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                onKeyDown={(e) => e.key === 'Enter' && handleAiPlanFromUrl()}
              />
              <Button variant="primary" size="md" onClick={handleAiPlanFromUrl} disabled={aiPlanLoading || !aiPlanUrl.trim()}>
                {aiPlanLoading ? <Loader2 size={14} className="animate-spin" /> : 'Générer'}
              </Button>
            </div>
          </div>

          {/* From File */}
          <div className="text-center">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ou</span>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Fichier texte / transcript</label>
            <button
              onClick={() => aiPlanFileRef.current?.click()}
              disabled={aiPlanLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all"
              style={{ background: 'rgba(212,173,74,0.08)', border: '1px dashed rgba(212,173,74,0.25)', color: '#d4ad4a' }}
            >
              <Upload size={14} />
              {aiPlanLoading ? 'Génération...' : 'Importer un fichier .txt / .md'}
            </button>
            <input ref={aiPlanFileRef} type="file" accept=".txt,.md,.pdf" className="hidden" onChange={handleAiPlanFromFile} />
          </div>

          {aiPlanLoading && (
            <div className="flex items-center gap-2 justify-center py-4">
              <Loader2 size={16} className="animate-spin" style={{ color: '#d4ad4a' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Analyse et structuration du cours en cours...</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
    </AuthGuard>
  );
}
