'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, BookOpen, Plus, Trash2, Upload, Smile, Edit3, FileJson } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';
import AuthGuard from '@/components/layout/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { flashcardRepository } from '@/lib/repositories/flashcardRepository';
import type { FlashcardDeck } from '@/types';

const DECK_EMOJIS = ['🧠', '📚', '📖', '✨', '🌙', '⭐', '🕌', '🕋', '☪️', '🤲', '📿', '🎓', '💡', '🌟', '🏆', '📝', '🔬', '💎', '🌍', '🎯'];

const DECK_COLORS = [
  '#3aaa60', '#6366f1', '#24ad9d', '#ec4899', '#f59e0b',
  '#ef4444', '#8b5cf6', '#14b8a6', '#3b82f6', '#d4ad4a',
];

export default function FlashcardsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [expandedDeck, setExpandedDeck] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddDeck, setShowAddDeck] = useState(false);
  const [showAddCard, setShowAddCard] = useState<string | null>(null);
  const [showImport, setShowImport] = useState<string | null>(null);
  const [showEditDeck, setShowEditDeck] = useState<string | null>(null);

  // New deck state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(DECK_COLORS[0]);
  const [newEmoji, setNewEmoji] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [newTags, setNewTags] = useState('');

  // New card state
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardDifficulty, setCardDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Import state
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit deck state
  const [editEmoji, setEditEmoji] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [showEditEmoji, setShowEditEmoji] = useState(false);

  const [addingDeck, setAddingDeck] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [importing, setImporting] = useState(false);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);

  useEffect(() => {
    if (authLoading || !user) return;
    flashcardRepository.getAllDecks(user.id).then(setDecks).catch(() => {});
  }, [refreshKey, authLoading, user]);

  const handleAddDeck = useCallback(async () => {
    if (!newTitle.trim() || !user || addingDeck) return;
    try {
      setAddingDeck(true);
      await flashcardRepository.createDeck(user.id, {
        title: `${newEmoji ? newEmoji + ' ' : ''}${newTitle.trim()}`,
        description: newDesc.trim(),
        color: newColor,
        icon: newIcon || undefined,
        tags: newTags ? newTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      });
      setShowAddDeck(false);
      setNewTitle('');
      setNewDesc('');
      setNewColor(DECK_COLORS[0]);
      setNewEmoji('');
      setNewIcon('');
      setNewTags('');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Error creating deck:', err);
    } finally {
      setAddingDeck(false);
    }
  }, [user, newTitle, newDesc, newColor, newEmoji, newIcon, newTags, addingDeck]);

  const handleDeleteDeck = useCallback(async (deckId: string) => {
    if (!confirm('Supprimer ce deck et toutes ses cartes ?')) return;
    try {
      await flashcardRepository.deleteDeck(deckId);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Error deleting deck:', err);
    }
  }, []);

  const handleAddCard = useCallback(async () => {
    if (!cardFront.trim() || !cardBack.trim() || !showAddCard || !user || addingCard) return;
    try {
      setAddingCard(true);
      await flashcardRepository.createCard(user.id, {
        deckId: showAddCard,
        front: cardFront.trim(),
        back: cardBack.trim(),
        tags: [],
        difficulty: cardDifficulty,
      });
      setCardFront('');
      setCardBack('');
      setCardDifficulty('medium');
      setShowAddCard(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Error creating card:', err);
    } finally {
      setAddingCard(false);
    }
  }, [user, cardFront, cardBack, cardDifficulty, showAddCard, addingCard]);

  const handleImportJson = useCallback(async () => {
    if (!importJson.trim() || !showImport || !user || importing) return;
    setImportError('');
    setImportSuccess('');
    setImporting(true);
    try {
      const parsed = JSON.parse(importJson);
      const cards = Array.isArray(parsed) ? parsed : parsed.cards || parsed.flashcards || [parsed];

      // Validate structure
      const validCards = cards.filter((c: Record<string, unknown>) =>
        typeof c.front === 'string' && typeof c.back === 'string'
      );

      if (validCards.length === 0) {
        setImportError('Aucune carte valide trouvée. Format attendu: [{"front": "...", "back": "..."}]');
        return;
      }

      const count = await flashcardRepository.importCards(user.id, showImport, validCards);
      setImportSuccess(`${count} carte(s) importée(s) avec succès !`);
      setImportJson('');
      setRefreshKey((k) => k + 1);
      setTimeout(() => { setShowImport(null); setImportSuccess(''); }, 1500);
    } catch {
      setImportError('JSON invalide. Vérifiez le format.');
    } finally {
      setImporting(false);
    }
  }, [importJson, showImport, user, importing]);

  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportJson(ev.target?.result as string);
    };
    reader.readAsText(file);
  }, []);

  const handleEditDeck = useCallback(async () => {
    if (!showEditDeck) return;
    try {
      const updates: Record<string, string> = {};
      if (editTitle.trim()) updates.title = editTitle.trim();
      if (editColor) updates.color = editColor;
      if (editEmoji) {
        const deck = await flashcardRepository.getDeckById(showEditDeck);
        if (deck) {
          const titleWithoutEmoji = deck.title.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, '');
          updates.title = `${editEmoji} ${editTitle.trim() || titleWithoutEmoji}`;
        }
      }
      await flashcardRepository.updateDeck(showEditDeck, updates);
      setShowEditDeck(null);
      setEditEmoji('');
      setEditColor('');
      setEditTitle('');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error('Error editing deck:', err);
    }
  }, [showEditDeck, editEmoji, editColor, editTitle]);

  const openEditDeck = useCallback(async (deckId: string) => {
    const deck = await flashcardRepository.getDeckById(deckId);
    if (!deck) return;
    setShowEditDeck(deckId);
    setEditTitle(deck.title);
    setEditColor(deck.color);
    setEditEmoji('');
    setShowEditEmoji(false);
  }, []);

  return (
    <AuthGuard>
    <div className="pb-10">
      <PageHeader
        title="Flashcards"
        subtitle="Révisez avec les cartes mémoire"
        rightAction={
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Plus size={14} />}
            onClick={() => setShowAddDeck(true)}
          >
            Nouveau deck
          </Button>
        }
      />

      {decks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {decks.map((deck, i) => (
            <motion.div
              key={deck.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
            >
              <Card
                glowColor="teal"
                className="p-5 relative group/deck"
                onClick={() =>
                  setExpandedDeck(expandedDeck === deck.id ? null : deck.id)
                }
              >
                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover/deck:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditDeck(deck.id); }}
                    className="p-1.5 rounded-lg cursor-pointer transition-colors"
                    style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}
                    title="Modifier"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck.id); }}
                    className="p-1.5 rounded-lg cursor-pointer transition-colors"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                    title="Supprimer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: `${deck.color}20` }}
                  >
                    {deck.icon || <Layers size={20} style={{ color: deck.color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {deck.title}
                    </h3>
                    <p className="text-xs line-clamp-2 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {deck.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="default" size="sm">
                    {deck.cardCount} cartes
                  </Badge>
                  <Badge variant="green" size="sm">
                    {deck.masteredCount} maîtrisées
                  </Badge>
                  {deck.toReviewCount > 0 && (
                    <Badge variant="gold" size="sm">
                      {deck.toReviewCount} à revoir
                    </Badge>
                  )}
                </div>

                <ProgressBar
                  value={deck.masteredCount}
                  max={deck.cardCount}
                  color={deck.color}
                  showLabel
                />

                {expandedDeck === deck.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 flex flex-wrap items-center gap-3"
                    style={{ borderTop: '1px solid rgba(46,158,140,0.2)' }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); window.location.href = `/flashcards/${deck.id}`; }}
                      className="inline-flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer"
                      style={{ color: 'var(--accent)' }}
                    >
                      <BookOpen size={14} />
                      Étudier
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowAddCard(deck.id); }}
                      className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors"
                      style={{ color: '#6366f1' }}
                    >
                      <Plus size={14} />
                      Ajouter une carte
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowImport(deck.id); setImportJson(''); setImportError(''); setImportSuccess(''); }}
                      className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors"
                      style={{ color: '#d4ad4a' }}
                    >
                      <FileJson size={14} />
                      Importer JSON
                    </button>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="Aucun deck"
          description="Créez votre premier deck de flashcards."
        />
      )}

      {/* Add deck modal */}
      <Modal isOpen={showAddDeck} onClose={() => setShowAddDeck(false)} title="Nouveau deck">
        <div className="space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Emoji / Icône (optionnel)
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors"
                style={{
                  background: newEmoji ? 'rgba(46,158,140,0.1)' : 'var(--bg-secondary)',
                  border: `1px solid ${newEmoji ? 'rgba(46,158,140,0.2)' : 'var(--border-light)'}`,
                  color: 'var(--text-primary)',
                }}
              >
                {newEmoji || <Smile size={14} style={{ color: 'var(--text-muted)' }} />}
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {newEmoji ? 'Changer' : 'Choisir'}
                </span>
              </button>
              {newEmoji && (
                <button onClick={() => setNewEmoji('')} className="text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>
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
                  {DECK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { setNewEmoji(emoji); setShowEmojiPicker(false); }}
                      className="h-9 w-9 flex items-center justify-center rounded-lg text-lg cursor-pointer transition-all hover:scale-110"
                      style={{
                        background: newEmoji === emoji ? 'rgba(46,158,140,0.15)' : 'rgba(255,255,255,0.04)',
                        border: newEmoji === emoji ? '1px solid rgba(46,158,140,0.2)' : '1px solid transparent',
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Couleur
            </label>
            <div className="flex flex-wrap gap-2">
              {DECK_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className="h-8 w-8 rounded-full cursor-pointer transition-all hover:scale-110"
                  style={{
                    background: c,
                    border: newColor === c ? '3px solid white' : '2px solid transparent',
                    boxShadow: newColor === c ? `0 0 0 2px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Titre</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nom du deck"
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-[var(--text-muted)]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description du deck"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-[var(--text-muted)]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tags (séparés par des virgules)</label>
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="ex: fiqh, salat, aqida"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-[var(--text-muted)]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setShowAddDeck(false)} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" onClick={handleAddDeck} disabled={!newTitle.trim() || addingDeck} className="flex-1">
              {addingDeck ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add card modal */}
      <Modal isOpen={!!showAddCard} onClose={() => setShowAddCard(null)} title="Nouvelle carte">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Question (Recto)</label>
            <textarea
              value={cardFront}
              onChange={(e) => setCardFront(e.target.value)}
              placeholder="Question..."
              autoFocus
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none placeholder:text-[var(--text-muted)]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Réponse (Verso)</label>
            <textarea
              value={cardBack}
              onChange={(e) => setCardBack(e.target.value)}
              placeholder="Réponse..."
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none placeholder:text-[var(--text-muted)]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Difficulté</label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setCardDifficulty(d)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all"
                  style={{
                    background: cardDifficulty === d
                      ? d === 'easy' ? 'rgba(58,170,96,0.15)' : d === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'
                      : 'rgba(255,255,255,0.04)',
                    color: cardDifficulty === d
                      ? d === 'easy' ? '#3aaa60' : d === 'medium' ? '#f59e0b' : '#ef4444'
                      : 'var(--text-muted)',
                    border: cardDifficulty === d ? '1px solid currentColor' : '1px solid transparent',
                  }}
                >
                  {d === 'easy' ? 'Facile' : d === 'medium' ? 'Moyen' : 'Difficile'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setShowAddCard(null)} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" onClick={handleAddCard} disabled={!cardFront.trim() || !cardBack.trim() || addingCard} className="flex-1">
              {addingCard ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import JSON modal */}
      <Modal isOpen={!!showImport} onClose={() => { setShowImport(null); setImportError(''); setImportSuccess(''); }} title="Importer des cartes (JSON)">
        <div className="space-y-4">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Format attendu: un tableau JSON de cartes avec les champs <code className="px-1 py-0.5 rounded" style={{ background: 'var(--bg-secondary)' }}>front</code> et <code className="px-1 py-0.5 rounded" style={{ background: 'var(--bg-secondary)' }}>back</code>.
          </p>
          <div
            className="rounded-lg p-3 text-xs font-mono"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
          >
            {`[{"front": "Question ?", "back": "Réponse"}]`}
          </div>

          {/* File upload */}
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors w-full justify-center"
              style={{ background: 'rgba(212,173,74,0.08)', border: '1px dashed rgba(212,173,74,0.25)', color: '#d4ad4a' }}
            >
              <Upload size={14} />
              Charger un fichier .json
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileImport}
            />
          </div>

          {/* Or paste JSON */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Ou collez le JSON</label>
            <textarea
              value={importJson}
              onChange={(e) => { setImportJson(e.target.value); setImportError(''); }}
              placeholder='[{"front": "...", "back": "..."}]'
              rows={6}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none font-mono placeholder:text-[var(--text-muted)]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
            />
          </div>

          {importError && (
            <p className="text-xs" style={{ color: '#f87171' }}>{importError}</p>
          )}
          {importSuccess && (
            <p className="text-xs font-medium" style={{ color: '#3aaa60' }}>{importSuccess}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => { setShowImport(null); setImportError(''); setImportSuccess(''); }} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" onClick={handleImportJson} disabled={!importJson.trim() || importing} className="flex-1">
              {importing ? 'Import...' : 'Importer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit deck modal (emoji/color/title) */}
      <Modal isOpen={!!showEditDeck} onClose={() => setShowEditDeck(null)} title="Modifier le deck">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Titre</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Titre du deck"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-[var(--text-muted)]"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
            />
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Emoji
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditEmoji(!showEditEmoji)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors"
                style={{
                  background: editEmoji ? 'rgba(46,158,140,0.1)' : 'var(--bg-secondary)',
                  border: `1px solid ${editEmoji ? 'rgba(46,158,140,0.2)' : 'var(--border-light)'}`,
                  color: 'var(--text-primary)',
                }}
              >
                {editEmoji || <Smile size={14} style={{ color: 'var(--text-muted)' }} />}
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {editEmoji ? 'Changer' : 'Choisir'}
                </span>
              </button>
            </div>
            <AnimatePresence>
              {showEditEmoji && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 flex flex-wrap gap-1.5"
                >
                  {DECK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { setEditEmoji(emoji); setShowEditEmoji(false); }}
                      className="h-9 w-9 flex items-center justify-center rounded-lg text-lg cursor-pointer transition-all hover:scale-110"
                      style={{
                        background: editEmoji === emoji ? 'rgba(46,158,140,0.15)' : 'rgba(255,255,255,0.04)',
                        border: editEmoji === emoji ? '1px solid rgba(46,158,140,0.2)' : '1px solid transparent',
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Couleur</label>
            <div className="flex flex-wrap gap-2">
              {DECK_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setEditColor(c)}
                  className="h-8 w-8 rounded-full cursor-pointer transition-all hover:scale-110"
                  style={{
                    background: c,
                    border: editColor === c ? '3px solid white' : '2px solid transparent',
                    boxShadow: editColor === c ? `0 0 0 2px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="md" onClick={() => setShowEditDeck(null)} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" onClick={handleEditDeck} className="flex-1">
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </AuthGuard>
  );
}
