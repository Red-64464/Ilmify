'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { BookOpen, Star, FileQuestion, BookMarked, Plus, Upload, Link2, Image } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { bookRepository } from '@/lib/repositories/bookRepository';
import type { Book, BookPassage } from '@/types';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function BookDetailClient({ id: propId }: { id: string }) {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();
  const paramId = (params?.id as string) || propId;
  const [id, setId] = useState(paramId);
  const [refreshKey, setRefreshKey] = useState(0);
  const [book, setBook] = useState<Book | null>(null);
  const [passages, setPassages] = useState<BookPassage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || id === '_placeholder') {
      const segments = window.location.pathname.split('/').filter(Boolean);
      const urlId = segments[segments.length - 1];
      if (urlId && urlId !== '_placeholder') setId(urlId);
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!id || id === '_placeholder') return;
    setLoading(true);
    Promise.all([
      bookRepository.getById(id),
      bookRepository.getPassagesByBook(id),
    ]).then(([b, p]) => {
      setBook(b);
      setPassages(p);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id, refreshKey, authLoading]);

  // Add passage state
  const [showAddPassage, setShowAddPassage] = useState(false);
  const [passageTitle, setPassageTitle] = useState('');
  const [passageContent, setPassageContent] = useState('');
  const [passagePage, setPassagePage] = useState('');
  const [passageReflection, setPassageReflection] = useState('');
  const [passageImportant, setPassageImportant] = useState(false);
  const [passageImageUrl, setPassageImageUrl] = useState('');
  const [passageLink, setPassageLink] = useState('');
  const passageImageRef = useRef<HTMLInputElement>(null);

  const handleAddPassage = useCallback(async () => {
    if (!passageTitle.trim() || !passageContent.trim() || !user) return;
    try {
      await bookRepository.createPassage(user.id, {
        bookId: id,
        title: passageTitle.trim(),
        content: passageContent.trim(),
        personalReflection: passageReflection.trim() || undefined,
        pageNumber: passagePage ? parseInt(passagePage, 10) : undefined,
        tags: [],
        isFavorite: false,
        isImportant: passageImportant,
      });

      setShowAddPassage(false);
      setPassageTitle('');
      setPassageContent('');
      setPassagePage('');
      setPassageReflection('');
      setPassageImportant(false);
      setPassageImageUrl('');
      setPassageLink('');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Error creating passage:', err);
    }
  }, [id, passageTitle, passageContent, passagePage, passageReflection, passageImportant, user]);

  const handlePassageImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPassageImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="pb-10">
        <PageHeader title="Chargement..." backButton />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="pb-10">
        <PageHeader title="Livre introuvable" backButton />
        <EmptyState
          icon={FileQuestion}
          title="Livre introuvable"
          description="Ce livre n'existe pas ou a été supprimé."
        />
      </div>
    );
  }

  return (
    <div className="pb-10">
      <PageHeader title={book.title} backButton />

      {/* Book Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-7 mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(196,154,61,0.06), var(--bg-card) 50%, rgba(26,122,107,0.03))',
            boxShadow: 'var(--shadow-elevated), var(--shadow-glow-gold)',
            border: '1px solid rgba(196,154,61,0.08)',
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute -top-20 -right-20 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(196,154,61,0.07), transparent 70%)' }}
          />

          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-5">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(196,154,61,0.15), rgba(196,154,61,0.06))',
                  boxShadow: '0 2px 12px rgba(196,154,61,0.1)',
                }}
              >
                {book.coverUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={book.coverUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  <BookOpen size={28} style={{ color: '#d4ad4a' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                  {book.title}
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{book.author}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant="gold" size="sm">{book.category}</Badge>
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
              </div>
            </div>

            {book.description && (
              <p className="text-sm leading-[1.8] mb-5" style={{ color: 'var(--text-secondary)' }}>
                {book.description}
              </p>
            )}

            {book.status === 'reading' && book.progress !== undefined && (
              <div className="mb-5">
                <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                  Progression
                </p>
                <ProgressBar value={book.progress} showLabel size="md" />
              </div>
            )}

            {book.rating !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs mr-1 font-medium" style={{ color: 'var(--text-muted)' }}>Note</span>
                {Array.from({ length: 5 }, (_, j) => (
                  <Star
                    key={j}
                    size={16}
                    style={{
                      color: j < (book.rating || 0) ? '#d4ad4a' : 'rgba(255,255,255,0.08)',
                    }}
                    fill={j < (book.rating || 0) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
            )}

            {book.personalNotes && (
              <div
                className="mt-5 p-4 rounded-xl"
                style={{
                  background: 'rgba(26,122,107,0.06)',
                  border: '1px solid rgba(26,122,107,0.08)',
                }}
              >
                <p className="text-xs mb-1.5 font-medium" style={{ color: 'var(--accent)' }}>Notes personnelles</p>
                <p className="text-sm leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>
                  {book.personalNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Passages Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-6 rounded-full"
            style={{ background: 'linear-gradient(180deg, #d4ad4a, #a88031)' }}
          />
          <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Passages
          </h3>
          <span className="text-xs font-medium ml-1" style={{ color: 'var(--text-muted)' }}>
            ({passages.length})
          </span>
        </div>
        <Button
          variant="primary"
          size="sm"
          iconLeft={<Plus size={14} />}
          onClick={() => setShowAddPassage(true)}
        >
          Ajouter
        </Button>
      </div>

      {passages.length > 0 ? (
        <motion.div
          className="space-y-4"
          variants={stagger}
          initial="hidden"
          animate="visible"
          key={refreshKey}
        >
          {passages.map((passage) => (
            <motion.div key={passage.id} variants={fadeUp}>
              <div
                className="rounded-2xl p-5 transition-all duration-200"
                style={{
                  background: passage.isImportant
                    ? 'linear-gradient(135deg, rgba(196,154,61,0.05), var(--bg-card))'
                    : 'var(--bg-card)',
                  boxShadow: 'var(--shadow-card)',
                  border: passage.isImportant
                    ? '1px solid rgba(196,154,61,0.1)'
                    : '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {passage.title}
                  </h4>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {passage.isImportant && (
                      <Badge variant="gold" size="sm">Important</Badge>
                    )}
                    {passage.pageNumber && (
                      <Badge variant="default" size="sm">p.{passage.pageNumber}</Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>
                  {passage.content}
                </p>

                {passage.personalReflection && (
                  <div
                    className="mt-4 p-4 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(196,154,61,0.04), rgba(26,122,107,0.03))',
                      border: '1px solid rgba(196,154,61,0.06)',
                    }}
                  >
                    <p className="text-xs mb-1.5 font-medium" style={{ color: '#d4ad4a' }}>
                      Réflexion
                    </p>
                    <p className="text-sm italic leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>
                      {passage.personalReflection}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={BookMarked}
          title="Aucun passage"
          description="Ajoutez votre premier passage en cliquant sur le bouton ci-dessus."
        />
      )}

      {/* Add Passage Modal */}
      <Modal
        isOpen={showAddPassage}
        onClose={() => setShowAddPassage(false)}
        title="Ajouter un passage"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Titre du passage
            </label>
            <input
              type="text"
              value={passageTitle}
              onChange={(e) => setPassageTitle(e.target.value)}
              placeholder="Ex: La patience en Islam"
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Contenu
            </label>
            <textarea
              value={passageContent}
              onChange={(e) => setPassageContent(e.target.value)}
              placeholder="Texte du passage..."
              rows={4}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Page (optionnel)
              </label>
              <input
                type="number"
                value={passagePage}
                onChange={(e) => setPassagePage(e.target.value)}
                placeholder="Ex: 42"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex items-end pb-1">
              <button
                onClick={() => setPassageImportant(!passageImportant)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all w-full"
                style={{
                  background: passageImportant ? 'rgba(196,154,61,0.12)' : 'var(--bg-secondary)',
                  border: `1px solid ${passageImportant ? 'rgba(196,154,61,0.25)' : 'var(--border-subtle)'}`,
                  color: passageImportant ? '#d4ad4a' : 'var(--text-muted)',
                }}
              >
                <Star size={14} fill={passageImportant ? 'currentColor' : 'none'} />
                Important
              </button>
            </div>
          </div>

          {/* Photo for passage */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Photo (optionnel)
            </label>
            {passageImageUrl && (
              <div className="mb-2 rounded-lg overflow-hidden" style={{ maxWidth: '200px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={passageImageUrl} alt="" className="w-full rounded-lg" />
              </div>
            )}
            <button
              onClick={() => passageImageRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors"
              style={{
                background: 'rgba(236,72,153,0.08)',
                border: '1px dashed rgba(236,72,153,0.25)',
                color: '#ec4899',
              }}
            >
              <Image size={12} />
              {passageImageUrl ? 'Changer la photo' : 'Ajouter une photo'}
            </button>
            <input
              ref={passageImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePassageImage}
            />
          </div>

          {/* Link for passage */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Lien (optionnel)
            </label>
            <div className="flex items-center gap-2">
              <Link2 size={14} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
              <input
                type="url"
                value={passageLink}
                onChange={(e) => setPassageLink(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: '#60a5fa' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Réflexion personnelle (optionnel)
            </label>
            <textarea
              value={passageReflection}
              onChange={(e) => setPassageReflection(e.target.value)}
              placeholder="Vos réflexions sur ce passage..."
              rows={2}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setShowAddPassage(false)} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" onClick={handleAddPassage} disabled={!passageTitle.trim() || !passageContent.trim()} className="flex-1">
              Ajouter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
