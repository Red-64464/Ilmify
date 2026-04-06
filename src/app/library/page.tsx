'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Star, Plus, Upload, Smile, Trash2, Edit3 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import ImageCropper from '@/components/ui/ImageCropper';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/layout/AuthGuard';
import { bookRepository } from '@/lib/repositories/bookRepository';
import { useToast } from '@/components/ui/Toast';
import type { Book } from '@/types';

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
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
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

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    setBooksLoading(true);
    bookRepository.getAll(user.id).then(b => { if (!cancelled) setBooks(b); }).catch(() => {}).finally(() => { if (!cancelled) setBooksLoading(false); });
    return () => { cancelled = true; };
  }, [authLoading, user]);

  const filtered = books.filter((b) => {
    const matchesTab = tab === 'all' || b.status === tab;
    const matchesSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleAddBook = useCallback(async () => {
    if (!newTitle.trim() || !newAuthor.trim() || !user || addingBook) return;
    try {
      setAddingBook(true);
      const created = await bookRepository.create(user.id, {
        title: `${newEmoji ? newEmoji + ' ' : ''}${newTitle.trim()}`,
        author: newAuthor.trim(),
        coverUrl: newCoverUrl || undefined,
        description: '',
        category: newCategory || 'Autre',
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
  }, [user, newTitle, newAuthor, newCategory, newCoverUrl, newEmoji, addingBook, toast]);

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
              {(() => {
                const defaultCats = ['Aqida', 'Hadith', 'Sira', 'Fiqh', 'Tafsir', 'Adhkar', 'Autre'];
                const userCats = books.map(b => b.category).filter(c => c && !defaultCats.includes(c));
                const allCats = [...defaultCats, ...Array.from(new Set(userCats))];
                return allCats.map((cat) => (
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
                ));
              })()}
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
              {(() => {
                const defaultCats = ['Aqida', 'Hadith', 'Sira', 'Fiqh', 'Tafsir', 'Adhkar', 'Autre'];
                const userCats = books.map(b => b.category).filter(c => c && !defaultCats.includes(c));
                const allCats = [...defaultCats, ...Array.from(new Set(userCats))];
                return allCats.map((cat) => (
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
                ));
              })()}
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
    </div>
    </AuthGuard>
  );
}
