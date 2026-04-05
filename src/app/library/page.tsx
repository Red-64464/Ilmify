'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Star, Plus, Upload, Smile, Trash2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
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
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [addingBook, setAddingBook] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading || !user) return;
    bookRepository.getAll(user.id).then(setBooks).catch(() => {});
  }, [refreshKey, authLoading, user]);

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
      await bookRepository.create(user.id, {
        title: `${newEmoji ? newEmoji + ' ' : ''}${newTitle.trim()}`,
        author: newAuthor.trim(),
        coverUrl: newCoverUrl || undefined,
        description: '',
        category: newCategory || 'Autre',
        language: 'fr',
        status: 'to-read',
        tags: [],
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewAuthor('');
      setNewCategory('');
      setNewCoverUrl('');
      setNewEmoji('');
      setRefreshKey((k) => k + 1);
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
      setCropImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteBook = useCallback(async (bookId: string) => {
    if (!confirm('Supprimer ce livre et tous ses passages ?')) return;
    try {
      await bookRepository.delete(bookId);
      setRefreshKey((k) => k + 1);
      toast('success', 'Livre supprimé');
    } catch (err) {
      console.error('Error deleting book:', err);
      toast('error', 'Erreur lors de la suppression');
    }
  }, []);

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

      {filtered.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          variants={stagger}
          initial="hidden"
          animate="visible"
          key={tab}
        >
          {filtered.map((book) => (
            <motion.div key={book.id} variants={fadeUp}>
              <div onClick={() => { window.location.href = `/library/${book.id}`; }} className="cursor-pointer">
                <Card glowColor="gold" className="p-5 h-full relative group/card">
                  {/* Delete button */}
                  {user && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteBook(book.id); }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover/card:opacity-100 transition-all duration-200 cursor-pointer z-10"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                      }}
                      title="Supprimer ce livre"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(196,154,61,0.12), rgba(196,154,61,0.05))',
                      }}
                    >
                      {book.coverUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={book.coverUrl} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <BookOpen size={20} style={{ color: '#d4ad4a' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-sm font-semibold tracking-tight truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {book.title}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {book.author}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
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
                    <ProgressBar value={book.progress} showLabel className="mb-3" />
                  )}

                  {book.rating !== undefined && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, j) => (
                        <Star
                          key={j}
                          size={14}
                          style={{
                            color: j < (book.rating || 0) ? '#d4ad4a' : 'rgba(255,255,255,0.08)',
                          }}
                          fill={j < (book.rating || 0) ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </motion.div>
          ))}
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
                className="h-16 w-12 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px dashed var(--border-light)',
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
              {['Aqida', 'Hadith', 'Sira', 'Fiqh', 'Tafsir', 'Adhkar', 'Autre'].map((cat) => (
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

      {/* Image cropper */}
      {cropImage && (
        <ImageCropper
          imageDataUrl={cropImage}
          onCrop={(croppedDataUrl) => {
            setNewCoverUrl(croppedDataUrl);
            setCropImage(null);
          }}
          onCancel={() => setCropImage(null)}
        />
      )}
    </div>
    </AuthGuard>
  );
}
