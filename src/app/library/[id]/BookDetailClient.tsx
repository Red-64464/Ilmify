'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { BookOpen, Star, FileQuestion, BookMarked, Plus, Upload, Link2, Image, Search, Edit3, Trash2, LayoutGrid, List, AlignJustify, ExternalLink, Download, Layers, Sparkles, FileText, BookOpenCheck, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import { ProgressBar } from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import AIResponsePanel, { CopyableText } from '@/components/ui/AIResponsePanel';
import { useAuth } from '@/contexts/AuthContext';
import { bookRepository } from '@/lib/repositories/bookRepository';
import { flashcardRepository } from '@/lib/repositories/flashcardRepository';
import { exportPassagesToPdf } from '@/lib/exportPdf';
import { generateFlashcardsFromPassage, summarizePassage, suggestSourcesForPassage, improveReflection, type GeneratedFlashcard } from '@/lib/ai/groq';
import type { Book, BookPassage, FlashcardDeck } from '@/types';

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
  }, [id, refreshKey, authLoading, user]);

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
  const [passageSaving, setPassageSaving] = useState(false);
  const [passageError, setPassageError] = useState('');

  // Search and view mode
  const [passageSearch, setPassageSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'titles'>('cards');

  // Edit passage state
  const [editingPassage, setEditingPassage] = useState<BookPassage | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPage, setEditPage] = useState('');
  const [editReflection, setEditReflection] = useState('');
  const [editImportant, setEditImportant] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editLink, setEditLink] = useState('');
  const editImageRef = useRef<HTMLInputElement>(null);

  // Flashcard from passage
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [flashcardFront, setFlashcardFront] = useState('');
  const [flashcardBack, setFlashcardBack] = useState('');
  const [flashcardDeckId, setFlashcardDeckId] = useState('');
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>([]);
  const [flashcardSaving, setFlashcardSaving] = useState(false);

  // AI states
  const [aiPassageId, setAiPassageId] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<'flashcards' | 'summary' | 'sources' | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [aiFlashcards, setAiFlashcards] = useState<GeneratedFlashcard[]>([]);
  const [aiSources, setAiSources] = useState<{ hadithKeywords: string[]; quranVerses: { surah: number; ayah: number; reason: string }[] } | null>(null);
  const [aiFlashcardDeckId, setAiFlashcardDeckId] = useState('');
  const [aiFlashcardSaving, setAiFlashcardSaving] = useState(false);
  const [improvingReflection, setImprovingReflection] = useState(false);
  const [improvedReflectionPreview, setImprovedReflectionPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) flashcardRepository.getAllDecks(user.id).then(setFlashcardDecks).catch(() => {});
  }, [user]);

  const openFlashcardFromPassage = (passage: BookPassage) => {
    setFlashcardFront(passage.title);
    setFlashcardBack(passage.content);
    setFlashcardDeckId(flashcardDecks[0]?.id || '');
    setShowFlashcard(true);
  };

  const handleCreateFlashcard = async () => {
    if (!user || !flashcardDeckId || !flashcardFront.trim() || !flashcardBack.trim() || flashcardSaving) return;
    setFlashcardSaving(true);
    try {
      await flashcardRepository.createCard(user.id, {
        deckId: flashcardDeckId,
        front: flashcardFront.trim(),
        back: flashcardBack.trim(),
        tags: book ? [book.title] : [],
        difficulty: 'medium',
      });
      setShowFlashcard(false);
    } catch { /* ignore */ }
    setFlashcardSaving(false);
  };

  // ─── AI Handlers ───
  const openAIPanel = (passage: BookPassage, mode: 'flashcards' | 'summary' | 'sources') => {
    if (aiPassageId === passage.id && aiMode === mode) {
      setAiPassageId(null);
      setAiMode(null);
      return;
    }
    setAiPassageId(passage.id);
    setAiMode(mode);
    setAiError('');
    setAiLoading(true);
    setAiSummary('');
    setAiFlashcards([]);
    setAiSources(null);

    if (mode === 'flashcards') {
      generateFlashcardsFromPassage(passage.title, passage.content, book?.title)
        .then((cards) => { setAiFlashcards(cards); setAiFlashcardDeckId(flashcardDecks[0]?.id || ''); })
        .catch((e) => setAiError(e.message))
        .finally(() => setAiLoading(false));
    } else if (mode === 'summary') {
      summarizePassage(passage.title, passage.content)
        .then(setAiSummary)
        .catch((e) => setAiError(e.message))
        .finally(() => setAiLoading(false));
    } else if (mode === 'sources') {
      suggestSourcesForPassage(passage.title, passage.content)
        .then(setAiSources)
        .catch((e) => setAiError(e.message))
        .finally(() => setAiLoading(false));
    }
  };

  const handleSaveAIFlashcards = async () => {
    if (!user || !aiFlashcardDeckId || aiFlashcards.length === 0 || aiFlashcardSaving) return;
    setAiFlashcardSaving(true);
    try {
      await flashcardRepository.importCards(
        user.id,
        aiFlashcardDeckId,
        aiFlashcards.map((c) => ({ front: c.front, back: c.back, tags: book ? [book.title] : [], difficulty: 'medium' as const })),
      );
      setAiPassageId(null);
      setAiMode(null);
    } catch { /* ignore */ }
    setAiFlashcardSaving(false);
  };

  const handleImproveReflection = async () => {
    if (!editingPassage || !editReflection.trim() || improvingReflection) return;
    setImprovingReflection(true);
    setImprovedReflectionPreview(null);
    try {
      const improved = await improveReflection(editingPassage.title, editingPassage.content, editReflection);
      setImprovedReflectionPreview(improved);
    } catch { /* ignore */ }
    setImprovingReflection(false);
  };

  // Filtered passages
  const filteredPassages = passageSearch.trim()
    ? passages.filter((p) => p.title.toLowerCase().includes(passageSearch.toLowerCase()) || p.content.toLowerCase().includes(passageSearch.toLowerCase()))
    : passages;

  const handleAddPassage = useCallback(async () => {
    if (!passageTitle.trim() || !passageContent.trim() || !user || passageSaving) return;
    try {
      setPassageSaving(true);
      await bookRepository.createPassage(user.id, {
        bookId: id,
        title: passageTitle.trim(),
        content: passageContent.trim(),
        personalReflection: passageReflection.trim() || undefined,
        pageNumber: passagePage ? parseInt(passagePage, 10) : undefined,
        tags: [],
        isFavorite: false,
        isImportant: passageImportant,
        imageUrl: passageImageUrl || undefined,
        linkUrl: passageLink.trim() || undefined,
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
      console.error('Error creating passage:', err);      setPassageError('Erreur lors de l\'ajout du passage');    } finally {
      setPassageSaving(false);
    }
  }, [id, passageTitle, passageContent, passagePage, passageReflection, passageImportant, user, passageSaving]);

  const handlePassageImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPassageImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setEditImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const openEditPassage = (passage: BookPassage) => {
    setEditingPassage(passage);
    setEditTitle(passage.title);
    setEditContent(passage.content);
    setEditPage(passage.pageNumber ? String(passage.pageNumber) : '');
    setEditReflection(passage.personalReflection || '');
    setEditImportant(passage.isImportant || false);
    setEditImageUrl(passage.imageUrl || '');
    setEditLink(passage.linkUrl || '');
  };

  const handleUpdatePassage = useCallback(async () => {
    if (!editingPassage || !editTitle.trim() || !editContent.trim() || passageSaving) return;
    try {
      setPassageSaving(true);
      await bookRepository.updatePassage(editingPassage.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        personalReflection: editReflection.trim() || undefined,
        pageNumber: editPage ? parseInt(editPage, 10) : undefined,
        isImportant: editImportant,
        imageUrl: editImageUrl || undefined,
        linkUrl: editLink.trim() || undefined,
      });
      setEditingPassage(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Error updating passage:', err);
      setPassageError('Erreur lors de la modification du passage');
    } finally {
      setPassageSaving(false);
    }
  }, [editingPassage, editTitle, editContent, editPage, editReflection, editImportant, editImageUrl, editLink, passageSaving]);

  const handleDeletePassage = useCallback(async (passageId: string) => {
    if (!confirm('Supprimer ce passage ?')) return;
    try {
      await bookRepository.deletePassage(passageId);
      setRefreshKey((k) => k + 1);
    } catch { /* ignore */ }
  }, []);

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
      <div className="flex items-center justify-between mb-4">
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
        <div className="flex items-center gap-2">
          {passages.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Download size={14} />}
              onClick={() => exportPassagesToPdf(book.title, book.author, passages)}
            >
              PDF
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Plus size={14} />}
            onClick={() => setShowAddPassage(true)}
          >
            Ajouter
          </Button>
        </div>
      </div>

      {/* Search & View Mode */}
      {passages.length > 0 && (
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1">
            <SearchInput
              value={passageSearch}
              onChange={setPassageSearch}
              placeholder="Rechercher un passage..."
            />
          </div>
          <div className="flex items-center rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            {([
              { mode: 'cards' as const, icon: LayoutGrid, label: 'Cartes' },
              { mode: 'list' as const, icon: List, label: 'Liste' },
              { mode: 'titles' as const, icon: AlignJustify, label: 'Titres' },
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={label}
                className="p-2 cursor-pointer transition-colors"
                style={{
                  background: viewMode === mode ? 'rgba(196,154,61,0.12)' : 'transparent',
                  color: viewMode === mode ? '#d4ad4a' : 'var(--text-muted)',
                }}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredPassages.length > 0 ? (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <motion.div
              className="space-y-4"
              variants={stagger}
              initial="hidden"
              animate="visible"
              key={`${refreshKey}-cards`}
            >
              {filteredPassages.map((passage) => (
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
                        <button
                          onClick={() => openFlashcardFromPassage(passage)}
                          className="p-1.5 rounded-lg cursor-pointer transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title="Créer une flashcard"
                        >
                          <Layers size={13} />
                        </button>
                        <button
                          onClick={() => openAIPanel(passage, 'flashcards')}
                          className="p-1.5 rounded-lg cursor-pointer transition-colors"
                          style={{ color: aiPassageId === passage.id && aiMode === 'flashcards' ? '#d4ad4a' : 'var(--text-muted)' }}
                          title="✨ Flashcards IA"
                        >
                          <Sparkles size={13} />
                        </button>
                        <button
                          onClick={() => openAIPanel(passage, 'summary')}
                          className="p-1.5 rounded-lg cursor-pointer transition-colors"
                          style={{ color: aiPassageId === passage.id && aiMode === 'summary' ? '#d4ad4a' : 'var(--text-muted)' }}
                          title="Résumer"
                        >
                          <FileText size={13} />
                        </button>
                        <button
                          onClick={() => openAIPanel(passage, 'sources')}
                          className="p-1.5 rounded-lg cursor-pointer transition-colors"
                          style={{ color: aiPassageId === passage.id && aiMode === 'sources' ? '#d4ad4a' : 'var(--text-muted)' }}
                          title="Trouver des sources"
                        >
                          <BookOpenCheck size={13} />
                        </button>
                        <button
                          onClick={() => openEditPassage(passage)}
                          className="p-1.5 rounded-lg cursor-pointer transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title="Modifier"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeletePassage(passage.id)}
                          className="p-1.5 rounded-lg cursor-pointer transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {passage.imageUrl && (
                      <div className="mb-3 rounded-xl overflow-hidden" style={{ maxWidth: '300px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={passage.imageUrl} alt="" className="w-full rounded-xl" />
                      </div>
                    )}

                    <p className="text-sm leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>
                      {passage.content}
                    </p>

                    {passage.linkUrl && (
                      <a
                        href={passage.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium transition-colors"
                        style={{ color: '#60a5fa' }}
                      >
                        <ExternalLink size={12} />
                        {passage.linkUrl.length > 50 ? passage.linkUrl.slice(0, 50) + '...' : passage.linkUrl}
                      </a>
                    )}

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

                    {/* AI Panel */}
                    {aiPassageId === passage.id && aiMode && (
                      <AIResponsePanel
                        isOpen
                        onClose={() => { setAiPassageId(null); setAiMode(null); }}
                        title={aiMode === 'flashcards' ? 'Flashcards IA' : aiMode === 'summary' ? 'Résumé IA' : 'Sources suggérées'}
                        loading={aiLoading}
                        error={aiError}
                      >
                        {aiMode === 'summary' && aiSummary && <CopyableText text={aiSummary} />}

                        {aiMode === 'flashcards' && aiFlashcards.length > 0 && (
                          <div className="space-y-3">
                            {aiFlashcards.map((card, i) => (
                              <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(196,154,61,0.04)', border: '1px solid rgba(196,154,61,0.06)' }}>
                                <p className="text-xs font-semibold mb-1" style={{ color: '#d4ad4a' }}>Q{i + 1}</p>
                                <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{card.front}</p>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{card.back}</p>
                              </div>
                            ))}
                            <div className="flex items-center gap-2 mt-3">
                              <select
                                value={aiFlashcardDeckId}
                                onChange={(e) => setAiFlashcardDeckId(e.target.value)}
                                className="flex-1 rounded-xl px-3 py-2 text-xs outline-none cursor-pointer"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                              >
                                {flashcardDecks.length === 0 && <option value="">Aucun deck</option>}
                                {flashcardDecks.map(d => <option key={d.id} value={d.id}>{d.icon || '📚'} {d.title}</option>)}
                              </select>
                              <Button variant="primary" size="sm" onClick={handleSaveAIFlashcards} disabled={!aiFlashcardDeckId || aiFlashcardSaving}>
                                {aiFlashcardSaving ? 'Ajout...' : `Ajouter ${aiFlashcards.length} cartes`}
                              </Button>
                            </div>
                          </div>
                        )}

                        {aiMode === 'sources' && aiSources && (
                          <div className="space-y-4">
                            {aiSources.quranVerses.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-2" style={{ color: '#d4ad4a' }}>📖 Versets du Coran</p>
                                {aiSources.quranVerses.map((v, i) => (
                                  <div key={i} className="p-2.5 rounded-lg mb-2" style={{ background: 'rgba(46,158,140,0.06)', border: '1px solid rgba(46,158,140,0.08)' }}>
                                    <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Sourate {v.surah}, Verset {v.ayah}</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{v.reason}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {aiSources.hadithKeywords.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-2" style={{ color: '#d4ad4a' }}>🔍 Mots-clés hadiths</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {aiSources.hadithKeywords.map((kw, i) => (
                                    <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-medium" style={{ background: 'rgba(196,154,61,0.08)', color: '#d4ad4a' }}>{kw}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </AIResponsePanel>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-2" key={`${refreshKey}-list`}>
              {filteredPassages.map((passage) => (
                <div
                  key={passage.id}
                  className="rounded-xl p-3.5 flex items-center gap-3 group"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {passage.isImportant && (
                    <Star size={14} style={{ color: '#d4ad4a' }} fill="#d4ad4a" className="shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {passage.title}
                    </h4>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {passage.content}
                    </p>
                  </div>
                  {passage.pageNumber && (
                    <Badge variant="default" size="sm">p.{passage.pageNumber}</Badge>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditPassage(passage)}
                      className="p-1.5 rounded-lg cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeletePassage(passage.id)}
                      className="p-1.5 rounded-lg cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Titles View */}
          {viewMode === 'titles' && (
            <div className="space-y-1" key={`${refreshKey}-titles`}>
              {filteredPassages.map((passage) => (
                <button
                  key={passage.id}
                  onClick={() => openEditPassage(passage)}
                  className="w-full text-left px-3.5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                  style={{
                    color: 'var(--text-primary)',
                  }}
                >
                  {passage.isImportant && (
                    <Star size={12} style={{ color: '#d4ad4a' }} fill="#d4ad4a" className="shrink-0" />
                  )}
                  <span className="text-sm font-medium truncate flex-1">{passage.title}</span>
                  {passage.pageNumber && (
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>p.{passage.pageNumber}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      ) : passages.length > 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
          Aucun passage trouvé pour &quot;{passageSearch}&quot;
        </p>
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
        <div className="space-y-4">
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
            <Button variant="primary" size="md" onClick={handleAddPassage} disabled={!passageTitle.trim() || !passageContent.trim() || passageSaving} className="flex-1">
              {passageSaving ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Passage Modal */}
      <Modal
        isOpen={!!editingPassage}
        onClose={() => setEditingPassage(null)}
        title="Modifier le passage"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Titre du passage
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
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
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
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
                value={editPage}
                onChange={(e) => setEditPage(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex items-end pb-1">
              <button
                onClick={() => setEditImportant(!editImportant)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all w-full"
                style={{
                  background: editImportant ? 'rgba(196,154,61,0.12)' : 'var(--bg-secondary)',
                  border: `1px solid ${editImportant ? 'rgba(196,154,61,0.25)' : 'var(--border-subtle)'}`,
                  color: editImportant ? '#d4ad4a' : 'var(--text-muted)',
                }}
              >
                <Star size={14} fill={editImportant ? 'currentColor' : 'none'} />
                Important
              </button>
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Photo (optionnel)
            </label>
            {editImageUrl && (
              <div className="mb-2 rounded-lg overflow-hidden" style={{ maxWidth: '200px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={editImageUrl} alt="" className="w-full rounded-lg" />
              </div>
            )}
            <button
              onClick={() => editImageRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors"
              style={{
                background: 'rgba(236,72,153,0.08)',
                border: '1px dashed rgba(236,72,153,0.25)',
                color: '#ec4899',
              }}
            >
              <Image size={12} />
              {editImageUrl ? 'Changer la photo' : 'Ajouter une photo'}
            </button>
            <input
              ref={editImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleEditImage}
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Lien (optionnel)
            </label>
            <div className="flex items-center gap-2">
              <Link2 size={14} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
              <input
                type="url"
                value={editLink}
                onChange={(e) => setEditLink(e.target.value)}
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
              value={editReflection}
              onChange={(e) => setEditReflection(e.target.value)}
              rows={2}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            />
            {editReflection.trim().length > 10 && (
              <button
                onClick={handleImproveReflection}
                disabled={improvingReflection}
                className="flex items-center gap-1.5 mt-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all"
                style={{
                  background: 'rgba(196,154,61,0.08)',
                  border: '1px solid rgba(196,154,61,0.15)',
                  color: '#d4ad4a',
                  opacity: improvingReflection ? 0.6 : 1,
                }}
              >
                {improvingReflection ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {improvingReflection ? 'Amélioration...' : 'Améliorer avec l\'IA'}
              </button>
            )}
            {improvedReflectionPreview && (
              <div className="mt-3 rounded-xl p-3" style={{ background: 'rgba(196,154,61,0.06)', border: '1px solid rgba(196,154,61,0.12)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={11} style={{ color: '#d4ad4a' }} />
                  <span className="text-[11px] font-medium" style={{ color: '#d4ad4a' }}>✨ Version améliorée par l&apos;IA</span>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{improvedReflectionPreview}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditReflection(improvedReflectionPreview); setImprovedReflectionPreview(null); }}
                    className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all"
                    style={{ background: 'rgba(58,170,96,0.12)', color: '#3aaa60', border: '1px solid rgba(58,170,96,0.2)' }}
                  >
                    ✓ Utiliser cette version
                  </button>
                  <button
                    onClick={() => setImprovedReflectionPreview(null)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}
                  >
                    ✕ Ignorer
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setEditingPassage(null)} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" onClick={handleUpdatePassage} disabled={!editTitle.trim() || !editContent.trim() || passageSaving} className="flex-1">
              {passageSaving ? 'Sauvegarde...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>
      {/* Flashcard from Passage Modal */}
      <Modal isOpen={showFlashcard} onClose={() => setShowFlashcard(false)} title="Créer une flashcard">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Deck</label>
            <select value={flashcardDeckId} onChange={(e) => setFlashcardDeckId(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm outline-none cursor-pointer" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              {flashcardDecks.length === 0 && <option value="">Aucun deck disponible</option>}
              {flashcardDecks.map(d => <option key={d.id} value={d.id}>{d.icon || '📚'} {d.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Recto (question)</label>
            <textarea value={flashcardFront} onChange={(e) => setFlashcardFront(e.target.value)} rows={2} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Verso (réponse)</label>
            <textarea value={flashcardBack} onChange={(e) => setFlashcardBack(e.target.value)} rows={3} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
          </div>
          {book && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Source : {book.title} — {book.author}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setShowFlashcard(false)} className="flex-1">Annuler</Button>
            <Button variant="primary" size="md" onClick={handleCreateFlashcard} disabled={!flashcardDeckId || !flashcardFront.trim() || !flashcardBack.trim() || flashcardSaving} className="flex-1">{flashcardSaving ? 'Création...' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
