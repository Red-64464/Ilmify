'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Star, Plus, Upload, Smile, Trash2, Edit3, Sparkles, FileUp, BarChart3, Loader2, BookCheck } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import dynamic from 'next/dynamic';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';

const ImageCropper = dynamic(() => import('@/components/ui/ImageCropper'), {
  ssr: false,
  loading: () => <div className="skeleton rounded-2xl" style={{ height: '20rem' }} aria-hidden="true" />,
});
import AuthGuard from '@/components/layout/AuthGuard';
import { bookRepository } from '@/lib/repositories/bookRepository';
import { queryCache, getCached, persistCache } from '@/lib/queryCache';
import { useToast } from '@/components/ui/Toast';
import type { Book } from '@/types';
import { parseBookImport } from '@/lib/importBooks';
import { detectBookCategory, generateBookRecommendations } from '@/lib/ai/groq';

const statusTabs = [
  { id: 'all', label: 'Tous' },
  { id: 'reading', label: 'En cours' },
  { id: 'to-read', label: 'À lire' },
  { id: 'read', label: 'Terminés' },
];

const categoryColors: Record<string, 'gold' | 'green' | 'teal' | 'blue' | 'default'> = {
  Aqida: 'gold',
  Hadith: 'teal',
  Sira: 'green',
  Adhkar: 'green',
  Tafsir: 'gold',
  Fiqh: 'blue',
};

const categoryHexColors: Record<string, string> = {
  Aqida: '#d4ad4a',
  Hadith: '#14b8a6',
  Sira: '#3aaa60',
  Adhkar: '#3aaa60',
  Tafsir: '#d4ad4a',
  Fiqh: '#3b82f6',
};

const BOOK_EMOJIS = ['📖', '📚', '📕', '📗', '📘', '📙', '📓', '📔', '🕌', '🕋', '☪️', '🌙', '⭐', '🤲', '📿', '🎓', '✨', '💡', '🌟', '🏆'];

// Dashboard reading-time estimate assumptions
const ESTIMATED_PAGES_PER_BOOK = 30;
const READING_SPEED_WPM = 250;
const WORDS_PER_PAGE = 250;

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function LibraryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [rawCoverUrl, setRawCoverUrl] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const booksCacheKey = user ? `books:all:${user.id}` : '';
  const [books, setBooks] = useState<Book[]>(() => (user ? (getCached<Book[]>(booksCacheKey) ?? []) : []));
  const [booksLoading, setBooksLoading] = useState(() => !(user && getCached(booksCacheKey)));
  const [addingBook, setAddingBook] = useState(false);
  const { toast } = useToast();

  // Edit book state
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editRawCoverUrl, setEditRawCoverUrl] = useState('');
  const [editStatus, setEditStatus] = useState<Book['status']>('to-read');
  const [editCropImage, setEditCropImage] = useState<string | null>(null);
  const editCoverInputRef = useRef<HTMLInputElement>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Import state
  const importFileRef = useRef<HTMLInputElement>(null);
  const [showImport, setShowImport] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<{ title: string; author: string; status: string }[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);

  // AI auto-categorize
  const [aiCategory, setAiCategory] = useState('');
  const [aiCatLoading, setAiCatLoading] = useState(false);

  // Recommendations
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<{ title: string; author: string; reason: string }[]>([]);
  const [recoLoading, setRecoLoading] = useState(false);
  const [recoError, setRecoError] = useState('');

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    const hasCached = getCached(booksCacheKey) !== null;
    if (!hasCached) setBooksLoading(true);
    bookRepository.getAll(user.id)
      .then(b => {
        if (!cancelled) {
          persistCache(booksCacheKey, b, 120_000);
          setBooks(b);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBooksLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const filtered = useMemo(() => books.filter((b) => {
    const matchesTab = tab === 'all' || b.status === tab;
    const matchesSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  }), [books, tab, search]);

  // Pre-compute all categories once (default + user custom)
  const allCategories = useMemo(() => {
    const defaultCats = ['Aqida', 'Hadith', 'Sira', 'Fiqh', 'Tafsir', 'Adhkar', 'Autre'];
    const userCats = books.map(b => b.category).filter(c => c && !defaultCats.includes(c));
    return [...defaultCats, ...Array.from(new Set(userCats))];
  }, [books]);

  // Auto-detect category via AI when title+author are filled
  useEffect(() => {
    if (!newTitle.trim() || !newAuthor.trim() || newCategory) {
      setAiCategory('');
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      setAiCatLoading(true);
      detectBookCategory(newTitle.trim(), newAuthor.trim())
        .then((cat) => { if (!cancelled) setAiCategory(cat); })
        .catch(() => { if (!cancelled) setAiCategory(''); })
        .finally(() => { if (!cancelled) setAiCatLoading(false); });
    }, 800);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [newTitle, newAuthor, newCategory]);

  const handleAddBook = useCallback(async () => {
    if (!newTitle.trim() || !newAuthor.trim() || !user || addingBook) return;
    try {
      setAddingBook(true);
      const created = await bookRepository.create(user.id, {
        title: `${newEmoji ? newEmoji + ' ' : ''}${newTitle.trim()}`,
        author: newAuthor.trim(),
        coverUrl: newCoverUrl || undefined,
        description: '',
        category: newCategory || aiCategory || 'Autre',
        language: 'fr',
        status: 'to-read',
        tags: [],
      });
      setBooks(prev => [created, ...prev]);
      setShowAddModal(false);
      setNewTitle('');
      setNewAuthor('');
      setNewCategory('');
      setNewCoverUrl('');
      setRawCoverUrl('');
      setNewEmoji('');
    } catch (err) {
      console.error('Error creating book:', err);
      toast('error', 'Erreur lors de l\'ajout du livre');
    } finally {
      setAddingBook(false);
    }
  }, [user, newTitle, newAuthor, newCategory, aiCategory, newCoverUrl, newEmoji, addingBook, toast]);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setRawCoverUrl(dataUrl);
      setCropImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteBook = useCallback(async (bookId: string) => {
    if (!confirm('Supprimer ce livre et tous ses passages ?')) return;
    try {
      await bookRepository.delete(bookId);
      setBooks(prev => prev.filter(b => b.id !== bookId));
      toast('success', 'Livre supprimé');
    } catch (err) {
      console.error('Error deleting book:', err);
      toast('error', 'Erreur lors de la suppression');
    }
  }, [toast]);

  const openEditModal = useCallback((book: Book) => {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditCategory(book.category);
    setEditCoverUrl(book.coverUrl || '');
    setEditRawCoverUrl('');
    setEditStatus(book.status);
    setEditCustomCategory('');
  }, []);

  const handleEditBook = useCallback(async () => {
    if (!editingBook || !editTitle.trim() || !editAuthor.trim() || savingEdit) return;
    try {
      setSavingEdit(true);
      const updated = await bookRepository.update(editingBook.id, {
        title: editTitle.trim(),
        author: editAuthor.trim(),
        category: editCategory || 'Autre',
        coverUrl: editCoverUrl || undefined,
        status: editStatus,
      });
      if (updated) {
        setBooks(prev => prev.map(b => b.id === updated.id ? updated : b));
        toast('success', 'Livre modifié');
      }
      setEditingBook(null);
    } catch (err) {
      console.error('Error updating book:', err);
      toast('error', 'Erreur lors de la modification');
    } finally {
      setSavingEdit(false);
    }
  }, [editingBook, editTitle, editAuthor, editCategory, editCoverUrl, editStatus, savingEdit, toast]);

  const handleEditCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setEditRawCoverUrl(dataUrl);
      setEditCropImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    const text = await file.text();
    try {
      const imported = parseBookImport(text, file.name);
      setImportPreview(imported.map(b => ({ title: b.title, author: b.author, status: b.status })));
      setShowImport(true);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erreur d\'import');
    }
    e.target.value = '';
  }, [toast]);

  const handleConfirmImport = useCallback(async () => {
    if (!user || !importFile || importLoading) return;
    setImportLoading(true);
    try {
      const text = await importFile.text();
      const imported = parseBookImport(text, importFile.name);
      for (const b of imported) {
        const created = await bookRepository.create(user.id, {
          title: b.title,
          author: b.author,
          description: '',
          category: b.category || 'Autre',
          language: 'fr',
          status: b.status,
          tags: [],
          isbn: b.isbn,
          rating: b.rating,
        });
        setBooks(prev => [created, ...prev]);
      }
      toast('success', `${imported.length} livres importés !`);
      setShowImport(false);
      setImportFile(null);
      setImportPreview([]);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Erreur d\'import');
    } finally {
      setImportLoading(false);
    }
  }, [user, importFile, importLoading, toast]);

  const handleOpenRecommendations = useCallback(async () => {
    if (recoLoading) return;
    setShowRecommendations(true);
    setRecoLoading(true);
    setRecoError('');
    try {
      const readBooks = books.filter(b => b.status === 'read' || b.rating);
      const reco = await generateBookRecommendations(
        readBooks.map(b => ({ title: b.title, author: b.author, category: b.category, rating: b.rating }))
      );
      setRecommendations(reco);
    } catch (err) {
      setRecoError(err instanceof Error ? err.message : 'Erreur IA');
    } finally {
      setRecoLoading(false);
    }
  }, [books, recoLoading]);

  return (
    <AuthGuard>
    <div className="pb-10">
      <PageHeader
        title="Bibliothèque"
        subtitle={`${books.length} livres`}
        rightAction={
          user ? (
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Plus size={14} />}
              onClick={() => setShowAddModal(true)}
            >
              Ajouter
            </Button>
          ) : undefined
        }
      />

      {/* Action buttons: Import & AI Recommendations */}
      {user && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button
            onClick={() => importFileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all"
            style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.15)',
              color: '#818cf8',
            }}
          >
            <FileUp size={13} />
            Importer (CSV/JSON)
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            onClick={handleOpenRecommendations}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all"
            style={{
              background: 'rgba(196,154,61,0.08)',
              border: '1px solid rgba(196,154,61,0.15)',
              color: '#d4ad4a',
            }}
          >
            <Sparkles size={13} />
            Recommandations IA
          </button>
        </div>
      )}

      {/* Reading Dashboard */}
      {!booksLoading && books.length > 0 && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Tableau de bord
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(46,158,140,0.06)', border: '1px solid rgba(46,158,140,0.1)' }}
            >
              <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                {books.filter(b => {
                  if (b.status !== 'read' || !b.finishedAt) return false;
                  const d = new Date(b.finishedAt);
                  const now = new Date();
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Ce mois-ci</p>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(196,154,61,0.06)', border: '1px solid rgba(196,154,61,0.1)' }}
            >
              <p className="text-lg font-bold" style={{ color: '#d4ad4a' }}>
                {books.filter(b => b.status === 'read').length}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Total lus</p>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}
            >
              <p className="text-lg font-bold" style={{ color: '#818cf8' }}>
                {(() => {
                  const readDates = books
                    .filter(b => b.status === 'read' && b.finishedAt)
                    .map(b => new Date(b.finishedAt!).toISOString().slice(0, 7))
                    .sort();
                  if (readDates.length === 0) return 0;
                  let streak = 1;
                  const now = new Date();
                  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                  if (!readDates.includes(current)) return 0;
                  for (let i = 1; i <= 24; i++) {
                    const prev = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const key = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
                    if (readDates.includes(key)) streak++;
                    else break;
                  }
                  return streak;
                })()}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Streak (mois)</p>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(58,170,96,0.06)', border: '1px solid rgba(58,170,96,0.1)' }}
            >
              <p className="text-lg font-bold" style={{ color: '#3aaa60' }}>
                {Math.round(books.filter(b => b.status === 'read').length * ESTIMATED_PAGES_PER_BOOK * WORDS_PER_PAGE / READING_SPEED_WPM)}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Min. lecture est.</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 overflow-x-auto scrollbar-none -mx-5 px-5">
        <Tabs tabs={statusTabs} activeTab={tab} onChange={setTab} />
      </div>

      <div className="mb-8">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un livre..."
        />
      </div>

      {booksLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 sm:p-6" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-start gap-3 mb-4">
                <Skeleton className="h-24 w-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          variants={stagger}
          initial="hidden"
          animate="visible"
          key={tab}
        >
          {filtered.map((book) => {
            const bookColor = categoryHexColors[book.category] || '#6366f1';
            return (
            <motion.div key={book.id} variants={fadeUp}>
              <div onClick={() => { router.push(`/library/${book.id}`); }} className="cursor-pointer">
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
                  className="relative overflow-hidden rounded-2xl p-5 sm:p-6 h-full transition-all duration-300 group/card"
                  style={{
                    background: `linear-gradient(135deg, ${bookColor}08, var(--bg-card) 40%, ${bookColor}04)`,
                    boxShadow: 'var(--shadow-card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {/* Ambient glow */}
                  <div
                    className="absolute -top-12 -right-12 w-28 h-28 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${bookColor}10, transparent 70%)` }}
                  />

                  <div className="relative z-10">
                    {/* Edit & Delete buttons */}
                    {user && (
                      <div className="absolute top-0 right-0 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-all duration-200 z-10">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(book); }}
                          className="p-1.5 rounded-lg cursor-pointer transition-colors"
                          style={{
                            background: 'rgba(46, 158, 140, 0.1)',
                            color: 'var(--accent)',
                            border: '1px solid rgba(46, 158, 140, 0.15)',
                          }}
                          title="Modifier ce livre"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBook(book.id); }}
                          className="p-1.5 rounded-lg cursor-pointer transition-colors"
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                          }}
                          title="Supprimer ce livre"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="flex h-24 w-16 shrink-0 items-center justify-center rounded-xl overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${bookColor}18, ${bookColor}08)`,
                        }}
                      >
                        {book.coverUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={book.coverUrl} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <BookOpen size={20} style={{ color: bookColor }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-base font-semibold tracking-tight truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {book.title}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {book.author}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={categoryColors[book.category] || 'default'} size="sm">
                          {book.category}
                        </Badge>
                        <Badge
                          variant={
                            book.status === 'read'
                              ? 'green'
                              : book.status === 'reading'
                                ? 'gold'
                                : 'default'
                          }
                          size="sm"
                        >
                          {book.status === 'read'
                            ? 'Terminé'
                            : book.status === 'reading'
                              ? 'En cours'
                              : 'À lire'}
                        </Badge>
                      </div>
                      {book.status === 'reading' && book.progress !== undefined && (
                        <div className="flex-1 max-w-[120px]">
                          <ProgressBar value={book.progress} showLabel color={bookColor} />
                        </div>
                      )}
                    </div>

                    {book.rating !== undefined && (
                      <div className="flex items-center gap-0.5 mt-3">
                        {Array.from({ length: 5 }, (_, j) => (
                          <Star
                            key={j}
                            size={14}
                            style={{
                              color: j < (book.rating || 0) ? bookColor : 'rgba(255,255,255,0.08)',
                            }}
                            fill={j < (book.rating || 0) ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="Aucun livre trouvé"
          description="Essayez de modifier vos filtres ou votre recherche."
        />
      )}

      {/* Add book modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter un livre"
      >
        <div className="space-y-4">
          {/* Cover image upload */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Couverture (optionnel)
            </label>
            <div className="flex items-center gap-3">
              <div
                className="h-24 w-16 rounded-lg overflow-hidden flex items-center justify-center shrink-0 cursor-pointer"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px dashed var(--border-light)',
                }}
                onClick={() => {
                  if (newCoverUrl && rawCoverUrl) { setCropImage(rawCoverUrl); }
                  else { coverInputRef.current?.click(); }
                }}
              >
                {newCoverUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={newCoverUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  <BookOpen size={16} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <button
                onClick={() => coverInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors"
                style={{
                  background: 'rgba(196,154,61,0.08)',
                  border: '1px dashed rgba(196,154,61,0.25)',
                  color: '#d4ad4a',
                }}
              >
                <Upload size={12} />
                {newCoverUrl ? 'Changer' : 'Ajouter une photo'}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>
          </div>

          {/* Emoji picker */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Emoji (optionnel)
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors"
                style={{
                  background: newEmoji ? 'rgba(196,154,61,0.1)' : 'var(--bg-secondary)',
                  border: `1px solid ${newEmoji ? 'rgba(196,154,61,0.2)' : 'var(--border-light)'}`,
                  color: 'var(--text-primary)',
                }}
              >
                {newEmoji || <Smile size={14} style={{ color: 'var(--text-muted)' }} />}
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {newEmoji ? 'Changer' : 'Choisir'}
                </span>
              </button>
              {newEmoji && (
                <button
                  onClick={() => setNewEmoji('')}
                  className="text-xs cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Retirer
                </button>
              )}
            </div>
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 flex flex-wrap gap-1.5"
                >
                  {BOOK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setNewEmoji(emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="h-9 w-9 flex items-center justify-center rounded-lg text-lg cursor-pointer transition-all hover:scale-110"
                      style={{
                        background: newEmoji === emoji ? 'rgba(196,154,61,0.15)' : 'rgba(255,255,255,0.04)',
                        border: newEmoji === emoji ? '1px solid rgba(196,154,61,0.2)' : '1px solid transparent',
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
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
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Titre du livre"
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
              Auteur
            </label>
            <input
              type="text"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="Nom de l'auteur"
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
              Catégorie
            </label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(newCategory === cat ? '' : cat)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
                    style={{
                      background: newCategory === cat ? 'rgba(196, 154, 61, 0.15)' : 'rgba(255,255,255,0.04)',
                      color: newCategory === cat ? '#d4ad4a' : 'var(--text-muted)',
                      border: newCategory === cat ? '1px solid rgba(196, 154, 61, 0.2)' : '1px solid transparent',
                    }}
                  >
                    {cat}
                  </button>
                ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Ou saisir une catégorie..."
                className="flex-1 rounded-xl px-3 py-2 text-xs outline-none placeholder:text-[var(--text-muted)]"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customCategory.trim()) {
                    setNewCategory(customCategory.trim());
                    setCustomCategory('');
                  }
                }}
              />
              {customCategory.trim() && (
                <button
                  onClick={() => { setNewCategory(customCategory.trim()); setCustomCategory(''); }}
                  className="px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  style={{ background: 'rgba(196,154,61,0.1)', color: '#d4ad4a' }}
                >
                  Ajouter
                </button>
              )}
            </div>
            {newCategory && !['Aqida', 'Hadith', 'Sira', 'Fiqh', 'Tafsir', 'Adhkar', 'Autre'].includes(newCategory) && (
              <p className="text-[10px] mt-1" style={{ color: '#d4ad4a' }}>Catégorie personnalisée : {newCategory}</p>
            )}
          </div>
          {/* AI category suggestion */}
          {!newCategory && aiCatLoading && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Loader2 size={12} className="animate-spin" />
              Détection IA de la catégorie...
            </div>
          )}
          {!newCategory && aiCategory && !aiCatLoading && (
            <button
              onClick={() => setNewCategory(aiCategory)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all"
              style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.15)',
                color: '#818cf8',
              }}
            >
              <Sparkles size={11} />
              Suggestion IA : {aiCategory} — Appliquer
            </button>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setShowAddModal(false)} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" onClick={handleAddBook} disabled={!newTitle.trim() || !newAuthor.trim() || addingBook} className="flex-1">
              {addingBook ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit book modal */}
      <Modal
        isOpen={!!editingBook}
        onClose={() => setEditingBook(null)}
        title="Modifier le livre"
      >
        <div className="space-y-4">
          {/* Cover */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Couverture</label>
            <div className="flex items-center gap-3">
              <div
                className="h-24 w-16 rounded-lg overflow-hidden flex items-center justify-center shrink-0 cursor-pointer"
                style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--border-light)' }}
                onClick={() => {
                  if (editCoverUrl && editRawCoverUrl) { setEditCropImage(editRawCoverUrl); }
                  else { editCoverInputRef.current?.click(); }
                }}
              >
                {editCoverUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={editCoverUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  <BookOpen size={16} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <button
                onClick={() => editCoverInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors"
                style={{ background: 'rgba(196,154,61,0.08)', border: '1px dashed rgba(196,154,61,0.25)', color: '#d4ad4a' }}
              >
                <Upload size={12} />
                {editCoverUrl ? 'Changer' : 'Ajouter une photo'}
              </button>
              {editCoverUrl && (
                <button onClick={() => setEditCoverUrl('')} className="text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>Retirer</button>
              )}
              <input ref={editCoverInputRef} type="file" accept="image/*" className="hidden" onChange={handleEditCoverUpload} />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Titre</label>
            <input
              type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-[var(--text-muted)]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Auteur</label>
            <input
              type="text" value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-[var(--text-muted)]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Statut</label>
            <div className="flex flex-wrap gap-2">
              {([{ id: 'to-read', label: 'À lire' }, { id: 'reading', label: 'En cours' }, { id: 'read', label: 'Terminé' }] as const).map((s) => (
                <button
                  key={s.id} onClick={() => setEditStatus(s.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
                  style={{
                    background: editStatus === s.id ? 'rgba(46,158,140,0.15)' : 'rgba(255,255,255,0.04)',
                    color: editStatus === s.id ? 'var(--accent)' : 'var(--text-muted)',
                    border: editStatus === s.id ? '1px solid rgba(46,158,140,0.2)' : '1px solid transparent',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => (
                  <button
                    key={cat} onClick={() => setEditCategory(editCategory === cat ? '' : cat)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
                    style={{
                      background: editCategory === cat ? 'rgba(196,154,61,0.15)' : 'rgba(255,255,255,0.04)',
                      color: editCategory === cat ? '#d4ad4a' : 'var(--text-muted)',
                      border: editCategory === cat ? '1px solid rgba(196,154,61,0.2)' : '1px solid transparent',
                    }}
                  >
                    {cat}
                  </button>
                ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text" value={editCustomCategory} onChange={(e) => setEditCustomCategory(e.target.value)}
                placeholder="Ou saisir une catégorie..."
                className="flex-1 rounded-xl px-3 py-2 text-xs outline-none placeholder:text-[var(--text-muted)]"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                onKeyDown={(e) => { if (e.key === 'Enter' && editCustomCategory.trim()) { setEditCategory(editCustomCategory.trim()); setEditCustomCategory(''); } }}
              />
              {editCustomCategory.trim() && (
                <button onClick={() => { setEditCategory(editCustomCategory.trim()); setEditCustomCategory(''); }} className="px-3 py-2 rounded-xl text-xs font-medium cursor-pointer" style={{ background: 'rgba(196,154,61,0.1)', color: '#d4ad4a' }}>Ajouter</button>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setEditingBook(null)} className="flex-1">Annuler</Button>
            <Button variant="primary" size="md" onClick={handleEditBook} disabled={!editTitle.trim() || !editAuthor.trim() || savingEdit} className="flex-1">
              {savingEdit ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image cropper (add) */}
      {cropImage && (
        <ImageCropper
          imageDataUrl={cropImage}
          aspectRatio={2/3}
          onCrop={(croppedDataUrl) => {
            setNewCoverUrl(croppedDataUrl);
            setCropImage(null);
          }}
          onCancel={() => setCropImage(null)}
        />
      )}

      {/* Image cropper (edit) */}
      {editCropImage && (
        <ImageCropper
          imageDataUrl={editCropImage}
          aspectRatio={2/3}
          onCrop={(croppedDataUrl) => {
            setEditCoverUrl(croppedDataUrl);
            setEditCropImage(null);
          }}
          onCancel={() => setEditCropImage(null)}
        />
      )}

      {/* Import preview modal */}
      <Modal
        isOpen={showImport}
        onClose={() => { setShowImport(false); setImportFile(null); setImportPreview([]); }}
        title="Importer des livres"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BookCheck size={16} style={{ color: 'var(--accent)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {importPreview.length} livre{importPreview.length > 1 ? 's' : ''} détecté{importPreview.length > 1 ? 's' : ''}
            </p>
          </div>
          <div
            className="max-h-60 overflow-y-auto rounded-xl p-3 space-y-2"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
          >
            {importPreview.map((b, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-xs py-1.5" style={{ borderBottom: i < importPreview.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{b.title}</p>
                  <p style={{ color: 'var(--text-muted)' }}>{b.author}</p>
                </div>
                <Badge variant={b.status === 'read' ? 'green' : b.status === 'reading' ? 'gold' : 'default'} size="sm">
                  {b.status === 'read' ? 'Terminé' : b.status === 'reading' ? 'En cours' : 'À lire'}
                </Badge>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => { setShowImport(false); setImportFile(null); setImportPreview([]); }} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" onClick={handleConfirmImport} disabled={importLoading} className="flex-1">
              {importLoading ? (
                <span className="flex items-center gap-1.5"><Loader2 size={13} className="animate-spin" />Import...</span>
              ) : (
                `Importer ${importPreview.length} livre${importPreview.length > 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Recommendations modal */}
      <Modal
        isOpen={showRecommendations}
        onClose={() => setShowRecommendations(false)}
        title="Recommandations IA"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} style={{ color: '#d4ad4a' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Basées sur vos {books.filter(b => b.status === 'read').length} livres lus
            </p>
          </div>
          {recoLoading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Analyse en cours...</p>
            </div>
          ) : recoError ? (
            <div className="text-center py-6">
              <p className="text-sm" style={{ color: '#f87171' }}>{recoError}</p>
              <button
                onClick={handleOpenRecommendations}
                className="mt-3 text-xs cursor-pointer"
                style={{ color: 'var(--accent)' }}
              >
                Réessayer
              </button>
            </div>
          ) : recommendations.length > 0 ? (
            <div
              className="max-h-72 overflow-y-auto rounded-xl p-3 space-y-3"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
            >
              {recommendations.map((r, i) => (
                <div
                  key={i}
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(196,154,61,0.04)', border: '1px solid rgba(196,154,61,0.08)' }}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.author}</p>
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>{r.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucune recommandation disponible.</p>
            </div>
          )}
          <div className="pt-2">
            <Button variant="secondary" size="md" onClick={() => setShowRecommendations(false)} className="w-full">
              Fermer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </AuthGuard>
  );
}
