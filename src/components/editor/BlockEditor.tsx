'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Type, Heading1, Heading2, Quote, List, ListOrdered,
  AlertCircle, Lightbulb, Bell, BookOpen, BookMarked,
  Image, Link2, Video, FileText, HelpCircle, Table2, Minus,
  GripVertical, Trash2, ChevronUp, ChevronDown,
  Upload, PlusCircle, MinusCircle, Columns, Rows,
  Hand, BookType, CheckSquare, Music, ScrollText, Clock, AlertTriangle,
} from 'lucide-react';
import type { TopicBlock, BlockType } from '@/types';
import ImageCropper from '@/components/ui/ImageCropper';
import QuranSearchModal from '@/components/islamic/QuranSearchModal';
import HadithSearchModal from '@/components/islamic/HadithSearchModal';

// Block type definitions with metadata
const BLOCK_TYPES: { type: BlockType; icon: React.ElementType; label: string; shortcut: string; color: string }[] = [
  { type: 'heading1', icon: Heading1, label: 'Titre H1', shortcut: '/h1', color: 'var(--text-primary)' },
  { type: 'heading2', icon: Heading2, label: 'Titre H2', shortcut: '/h2', color: 'var(--text-primary)' },
  { type: 'paragraph', icon: Type, label: 'Paragraphe', shortcut: '/text', color: 'var(--text-secondary)' },
  { type: 'quote', icon: Quote, label: 'Citation', shortcut: '/quote', color: '#d4ad4a' },
  { type: 'bullet-list', icon: List, label: 'Liste à puces', shortcut: '/list', color: 'var(--accent)' },
  { type: 'numbered-list', icon: ListOrdered, label: 'Liste numérotée', shortcut: '/numbered', color: 'var(--accent)' },
  { type: 'checklist', icon: CheckSquare, label: 'Checklist', shortcut: '/checklist', color: '#22c55e' },
  { type: 'callout', icon: AlertCircle, label: 'Important', shortcut: '/important', color: '#d4ad4a' },
  { type: 'warning', icon: AlertTriangle, label: 'Avertissement', shortcut: '/warning', color: '#ef4444' },
  { type: 'reflection', icon: Lightbulb, label: 'Réflexion', shortcut: '/reflection', color: '#56e2cc' },
  { type: 'reminder', icon: Bell, label: 'Rappel', shortcut: '/reminder', color: '#f59e0b' },
  { type: 'definition', icon: BookType, label: 'Définition', shortcut: '/definition', color: '#a78bfa' },
  { type: 'dua', icon: Hand, label: 'Dua / Invocation', shortcut: '/dua', color: '#34d399' },
  { type: 'hadith', icon: BookMarked, label: 'Hadith', shortcut: '/hadith', color: 'var(--accent)' },
  { type: 'verse', icon: BookOpen, label: 'Verset', shortcut: '/verse', color: '#d4ad4a' },
  { type: 'source', icon: BookOpen, label: 'Source / Référence', shortcut: '/source', color: '#6366f1' },
  { type: 'poem', icon: ScrollText, label: 'Poème / Matn', shortcut: '/poem', color: '#e879f9' },
  { type: 'timeline', icon: Clock, label: 'Chronologie', shortcut: '/timeline', color: '#06b6d4' },
  { type: 'audio', icon: Music, label: 'Audio', shortcut: '/audio', color: '#f472b6' },
  { type: 'image', icon: Image, label: 'Image', shortcut: '/image', color: '#ec4899' },
  { type: 'link', icon: Link2, label: 'Lien', shortcut: '/link', color: '#3b82f6' },
  { type: 'youtube', icon: Video, label: 'YouTube', shortcut: '/youtube', color: '#ef4444' },
  { type: 'pdf', icon: FileText, label: 'PDF', shortcut: '/pdf', color: '#f97316' },
  { type: 'qa', icon: HelpCircle, label: 'Question / Réponse', shortcut: '/qa', color: '#8b5cf6' },
  { type: 'table', icon: Table2, label: 'Tableau', shortcut: '/table', color: '#14b8a6' },
  { type: 'divider', icon: Minus, label: 'Séparateur', shortcut: '/divider', color: 'var(--text-muted)' },
  { type: 'verse', icon: BookOpen, label: '🔍 Verset (QuranEnc)', shortcut: '/quranenc', color: '#d4ad4a' },
  { type: 'hadith', icon: BookMarked, label: '🔍 Hadith (HadeethEnc)', shortcut: '/hadeethenc', color: 'var(--accent)' },
];

function generateBlockId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `block-${crypto.randomUUID()}`;
  }
  return `block-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

interface BlockEditorProps {
  blocks: TopicBlock[];
  onChange: (blocks: TopicBlock[]) => void;
  readOnly?: boolean;
}

// Slash command menu
function SlashMenu({
  onSelect,
  filter,
  onClose,
}: {
  onSelect: (type: BlockType, shortcut?: string) => void;
  filter: string;
  onClose: () => void;
}) {
  const filtered = BLOCK_TYPES.filter(
    (bt) =>
      bt.label.toLowerCase().includes(filter.toLowerCase()) ||
      bt.shortcut.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="absolute left-0 bottom-full z-50 mb-1 w-[calc(100vw-3rem)] sm:w-72 rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-elevated)',
        border: '1px solid var(--border-light)',
      }}
    >
      <div className="p-2 max-h-64 overflow-y-auto scrollbar-none">
        {filtered.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
            Aucun bloc trouvé
          </p>
        ) : (
          filtered.map((bt) => (
            <button
              key={bt.type + bt.shortcut}
              onClick={() => {
                onSelect(bt.type, bt.shortcut);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <bt.icon size={16} style={{ color: bt.color }} />
              <div className="flex-1 text-left">
                <span className="text-sm font-medium">{bt.label}</span>
              </div>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {bt.shortcut}
              </span>
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}

// Table editor component
function TableEditor({
  block,
  onUpdate,
}: {
  block: TopicBlock;
  onUpdate: (updates: Partial<TopicBlock>) => void;
}) {
  // Parse table data from metadata or initialize default 3x3
  const getTableData = (): string[][] => {
    if (block.metadata?.tableData) {
      try {
        return JSON.parse(block.metadata.tableData);
      } catch {
        // fall through to default
      }
    }
    return [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ];
  };

  const tableData = getTableData();
  const rows = tableData.length;
  const cols = tableData[0]?.length || 3;

  const updateCell = (rowIdx: number, colIdx: number, value: string) => {
    const newData = tableData.map((row) => [...row]);
    newData[rowIdx][colIdx] = value;
    onUpdate({
      metadata: {
        ...block.metadata,
        tableData: JSON.stringify(newData),
      },
    });
  };

  const addRow = () => {
    const newData = [...tableData, new Array(cols).fill('')];
    onUpdate({
      metadata: { ...block.metadata, tableData: JSON.stringify(newData) },
    });
  };

  const removeRow = (rowIdx: number) => {
    if (rows <= 1) return;
    const newData = tableData.filter((_, i) => i !== rowIdx);
    onUpdate({
      metadata: { ...block.metadata, tableData: JSON.stringify(newData) },
    });
  };

  const addColumn = () => {
    const newData = tableData.map((row) => [...row, '']);
    onUpdate({
      metadata: { ...block.metadata, tableData: JSON.stringify(newData) },
    });
  };

  const removeColumn = (colIdx: number) => {
    if (cols <= 1) return;
    const newData = tableData.map((row) => row.filter((_, i) => i !== colIdx));
    onUpdate({
      metadata: { ...block.metadata, tableData: JSON.stringify(newData) },
    });
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Table toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={addRow}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] cursor-pointer transition-colors"
          style={{ background: 'rgba(20,184,166,0.1)', color: '#14b8a6' }}
          title="Ajouter une ligne"
        >
          <PlusCircle size={12} />
          <Rows size={12} />
        </button>
        <button
          onClick={addColumn}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] cursor-pointer transition-colors"
          style={{ background: 'rgba(20,184,166,0.1)', color: '#14b8a6' }}
          title="Ajouter une colonne"
        >
          <PlusCircle size={12} />
          <Columns size={12} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border-light)' }}>
        <table className="w-full border-collapse text-sm">
          <tbody>
            {tableData.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, colIdx) => (
                  <td
                    key={colIdx}
                    className="relative group/cell"
                    style={{
                      border: '1px solid var(--border-subtle)',
                      background: rowIdx === 0 ? 'rgba(20,184,166,0.06)' : 'transparent',
                    }}
                  >
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                      className="w-full bg-transparent px-3 py-2 outline-none text-sm"
                      style={{
                        color: 'var(--text-primary)',
                        fontWeight: rowIdx === 0 ? 600 : 400,
                        minWidth: '80px',
                      }}
                      placeholder={rowIdx === 0 ? 'En-tête' : ''}
                    />
                    {/* Delete column button on first row */}
                    {rowIdx === 0 && cols > 1 && (
                      <button
                        onClick={() => removeColumn(colIdx)}
                        className="absolute -top-3 right-1 opacity-0 group-hover/cell:opacity-100 p-0.5 rounded cursor-pointer transition-opacity"
                        style={{ color: '#f87171', background: 'var(--bg-elevated)' }}
                        title="Supprimer cette colonne"
                      >
                        <MinusCircle size={10} />
                      </button>
                    )}
                  </td>
                ))}
                {/* Delete row button */}
                {rows > 1 && (
                  <td className="w-6" style={{ border: 'none' }}>
                    <button
                      onClick={() => removeRow(rowIdx)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded cursor-pointer transition-opacity"
                      style={{ color: '#f87171' }}
                      title="Supprimer cette ligne"
                    >
                      <MinusCircle size={10} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        {rows} lignes × {cols} colonnes
      </p>
    </div>
  );
}

// Individual block component for editing
function EditableBlock({
  block,
  onUpdate,
  onDelete,
  onAddBelow,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onOpenQuranModal,
  onOpenHadithModal,
}: {
  block: TopicBlock;
  onUpdate: (updates: Partial<TopicBlock>) => void;
  onDelete: () => void;
  onAddBelow: (type: BlockType) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  onOpenQuranModal?: () => void;
  onOpenHadithModal?: () => void;
}) {
  const [showSlash, setShowSlash] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = useCallback(
    (value: string) => {
      // Check for slash command
      if (value.startsWith('/') && block.content === '') {
        setSlashFilter(value.substring(1));
        setShowSlash(true);
      } else {
        setShowSlash(false);
        setSlashFilter('');
      }
      onUpdate({ content: value });
    },
    [block.content, onUpdate]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSlash(false);
      }
      if (e.key === 'Backspace' && block.content === '') {
        e.preventDefault();
        onDelete();
      }
      if (e.key === 'Enter' && !e.shiftKey && block.type !== 'bullet-list' && block.type !== 'numbered-list' && block.type !== 'checklist' && block.type !== 'poem' && block.type !== 'timeline') {
        e.preventDefault();
        onAddBelow('paragraph');
      }
    },
    [block.content, block.type, onDelete, onAddBelow]
  );

  const getBlockStyle = (): { wrapper: React.CSSProperties; textarea: React.CSSProperties; placeholder: string } => {
    switch (block.type) {
      case 'heading1':
        return {
          wrapper: {},
          textarea: { fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2, fontFamily: 'var(--font-heading)' },
          placeholder: 'Titre principal...',
        };
      case 'heading2':
        return {
          wrapper: {},
          textarea: { fontSize: '1.375rem', fontWeight: 700, lineHeight: 1.3, fontFamily: 'var(--font-heading)' },
          placeholder: 'Titre...',
        };
      case 'heading3':
        return {
          wrapper: {},
          textarea: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
          placeholder: 'Sous-titre...',
        };
      case 'quote':
        return {
          wrapper: {
            borderLeft: '3px solid #d4ad4a',
            paddingLeft: '1rem',
            background: 'rgba(196, 154, 61, 0.04)',
            borderRadius: '0 0.5rem 0.5rem 0',
          },
          textarea: { fontStyle: 'italic', color: '#d4ad4a' },
          placeholder: 'Citation...',
        };
      case 'callout':
        return {
          wrapper: {
            background: 'rgba(196, 154, 61, 0.06)',
            borderRadius: '0.75rem',
            padding: '1rem',
            border: '1px solid rgba(196, 154, 61, 0.12)',
          },
          textarea: {},
          placeholder: 'Point important...',
        };
      case 'reflection':
        return {
          wrapper: {
            background: 'rgba(18, 163, 147, 0.06)',
            borderRadius: '0.75rem',
            padding: '1rem',
            border: '1px solid rgba(18, 163, 147, 0.12)',
          },
          textarea: {},
          placeholder: 'Réflexion personnelle...',
        };
      case 'reminder':
        return {
          wrapper: {
            background: 'rgba(245, 158, 11, 0.06)',
            borderRadius: '0.75rem',
            padding: '1rem',
            border: '1px solid rgba(245, 158, 11, 0.12)',
          },
          textarea: {},
          placeholder: 'Rappel...',
        };
      case 'hadith':
        return {
          wrapper: {
            background: 'rgba(46, 158, 140, 0.06)',
            borderRadius: '0.75rem',
            padding: '1rem',
            borderLeft: '3px solid var(--accent)',
          },
          textarea: {},
          placeholder: '[Exemple] Texte du hadith...',
        };
      case 'verse':
        return {
          wrapper: {
            background: 'rgba(196, 154, 61, 0.06)',
            borderRadius: '0.75rem',
            padding: '1rem',
            borderLeft: '3px solid #d4ad4a',
          },
          textarea: {},
          placeholder: '[Exemple] Texte du verset...',
        };
      case 'source':
        return {
          wrapper: {
            background: 'rgba(99, 102, 241, 0.06)',
            borderRadius: '0.75rem',
            padding: '1rem',
            border: '1px solid rgba(99, 102, 241, 0.12)',
          },
          textarea: { fontSize: '0.875rem' },
          placeholder: 'Source / référence...',
        };
      case 'bullet-list':
      case 'numbered-list':
        return {
          wrapper: { paddingLeft: '0.5rem' },
          textarea: {},
          placeholder: 'Élément de liste (un par ligne)...',
        };
      case 'link':
        return {
          wrapper: {
            background: 'rgba(59, 130, 246, 0.06)',
            borderRadius: '0.75rem',
            padding: '1rem',
            border: '1px solid rgba(59, 130, 246, 0.12)',
          },
          textarea: {},
          placeholder: 'URL du lien...',
        };
      case 'youtube':
        return {
          wrapper: {
            background: 'rgba(239, 68, 68, 0.06)',
            borderRadius: '0.75rem',
            padding: '1rem',
            border: '1px solid rgba(239, 68, 68, 0.12)',
          },
          textarea: {},
          placeholder: 'URL YouTube...',
        };
      case 'qa':
        return {
          wrapper: {
            background: 'rgba(139, 92, 246, 0.06)',
            borderRadius: '0.75rem',
            padding: '1rem',
            border: '1px solid rgba(139, 92, 246, 0.12)',
          },
          textarea: {},
          placeholder: 'Question\n---\nRéponse',
        };
      case 'warning':
        return {
          wrapper: {
            background: 'rgba(239, 68, 68, 0.06)',
            borderRadius: '0.75rem',
            padding: '1rem',
            border: '1px solid rgba(239, 68, 68, 0.12)',
          },
          textarea: {},
          placeholder: 'Avertissement / Mise en garde...',
        };
      case 'dua':
        return {
          wrapper: {
            background: 'rgba(52, 211, 153, 0.06)',
            borderRadius: '0.75rem',
            padding: '1rem',
            borderLeft: '3px solid #34d399',
          },
          textarea: {},
          placeholder: "Texte de l'invocation...",
        };
      case 'definition':
        return {
          wrapper: {
            background: 'rgba(167, 139, 250, 0.06)',
            borderRadius: '0.75rem',
            padding: '1rem',
            border: '1px solid rgba(167, 139, 250, 0.12)',
          },
          textarea: {},
          placeholder: 'Terme\n---\nDéfinition',
        };
      case 'checklist':
        return {
          wrapper: { paddingLeft: '0.5rem' },
          textarea: {},
          placeholder: 'Élément (un par ligne, préfixer ✓ pour cocher)...',
        };
      case 'audio':
        return {
          wrapper: {
            background: 'rgba(244, 114, 182, 0.06)',
            borderRadius: '0.75rem',
            padding: '1rem',
            border: '1px solid rgba(244, 114, 182, 0.12)',
          },
          textarea: { display: 'none' },
          placeholder: '',
        };
      case 'poem':
        return {
          wrapper: {
            background: 'rgba(232, 121, 249, 0.06)',
            borderRadius: '0.75rem',
            padding: '1rem',
            borderLeft: '3px solid #e879f9',
          },
          textarea: { fontStyle: 'italic', textAlign: 'center' as const },
          placeholder: 'Vers du poème (un par ligne)...',
        };
      case 'timeline':
        return {
          wrapper: {
            background: 'rgba(6, 182, 212, 0.06)',
            borderRadius: '0.75rem',
            padding: '1rem',
            border: '1px solid rgba(6, 182, 212, 0.12)',
          },
          textarea: {},
          placeholder: 'Date — Événement (un par ligne)',
        };
      case 'divider':
        return {
          wrapper: { padding: '0.5rem 0' },
          textarea: { display: 'none' },
          placeholder: '',
        };
      default:
        return {
          wrapper: {},
          textarea: {},
          placeholder: 'Écrivez ici... (tapez / pour les blocs)',
        };
    }
  };

  const style = getBlockStyle();
  const blockMeta = BLOCK_TYPES.find((bt) => bt.type === block.type);

  // Auto-resize textarea
  const handleTextareaResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  return (
    <div
      className="group relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Left action bar */}
      <div
        className="absolute -left-8 sm:-left-10 top-1 flex flex-col gap-0.5 transition-opacity duration-200"
        style={{ opacity: showActions ? 0.7 : 0.3 }}
      >
        <button
          onClick={() => setShowSlash(true)}
          className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded transition-colors cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
          title="Ajouter un bloc"
        >
          <Plus size={14} />
        </button>
        <button
          className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded cursor-grab"
          style={{ color: 'var(--text-muted)' }}
          title="Déplacer"
        >
          <GripVertical size={14} />
        </button>
      </div>

      {/* Block content */}
      <div className="relative" style={style.wrapper}>
        {/* Block type indicator */}
        {blockMeta && block.type !== 'paragraph' && block.type !== 'divider' && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <blockMeta.icon size={12} style={{ color: blockMeta.color }} />
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: blockMeta.color }}>
              {blockMeta.label}
            </span>
          </div>
        )}

        {block.type === 'divider' ? (
          <div className="separator-ornament py-2">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>✦</span>
          </div>
        ) : (
          <textarea
            ref={(el) => {
              (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
              handleTextareaResize(el);
            }}
            value={block.content}
            onChange={(e) => {
              handleInput(e.target.value);
              handleTextareaResize(e.target);
            }}
            onKeyDown={handleKeyDown}
            placeholder={style.placeholder}
            className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed placeholder:text-[var(--text-muted)]"
            style={{
              color: 'var(--text-primary)',
              minHeight: '1.5rem',
              ...style.textarea,
            }}
            rows={1}
          />
        )}

        {/* Metadata inputs for specific block types */}
        {(block.type === 'hadith' || block.type === 'verse' || block.type === 'source') && (
          <input
            type="text"
            placeholder="Source / Référence..."
            value={block.metadata?.source || block.metadata?.reference || ''}
            onChange={(e) =>
              onUpdate({
                metadata: {
                  ...block.metadata,
                  source: e.target.value,
                  reference: e.target.value,
                },
              })
            }
            className="w-full bg-transparent outline-none text-xs mt-2 placeholder:text-[var(--text-muted)]"
            style={{ color: 'var(--text-muted)' }}
          />
        )}

        {/* Image file picker */}
        {block.type === 'image' && (
          <div className="mt-2 space-y-2">
            {block.metadata?.dataUrl && (
              <div className="rounded-lg overflow-hidden" style={{ maxWidth: block.metadata?.width || '100%' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.metadata.dataUrl} alt={block.content || 'Image'} className="w-full rounded-lg" />
              </div>
            )}
            {block.metadata?.dataUrl && (
              <div className="flex items-center gap-2">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Taille:</span>
                <input
                  type="range"
                  min={100}
                  max={800}
                  value={parseInt(block.metadata?.width || '800', 10)}
                  onChange={(e) =>
                    onUpdate({
                      metadata: {
                        ...block.metadata,
                        width: `${e.target.value}px`,
                      },
                    })
                  }
                  className="flex-1 accent-emerald-600"
                  style={{ height: '4px' }}
                />
                <span className="text-[10px] w-10 text-right" style={{ color: 'var(--text-muted)' }}>
                  {block.metadata?.width || '100%'}
                </span>
              </div>
            )}
            <label
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm"
              style={{
                background: 'rgba(236, 72, 153, 0.08)',
                border: '1px dashed rgba(236, 72, 153, 0.25)',
                color: '#ec4899',
              }}
            >
              <Upload size={14} />
              <span>{block.metadata?.dataUrl ? 'Changer l\'image' : 'Choisir une image depuis votre PC'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setCropImage(ev.target?.result as string);
                      setCropFileName(file.name);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
            {cropImage && (
              <ImageCropper
                imageDataUrl={cropImage}
                onCrop={(croppedDataUrl) => {
                  onUpdate({
                    content: cropFileName,
                    metadata: {
                      ...block.metadata,
                      dataUrl: croppedDataUrl,
                      fileName: cropFileName,
                    },
                  });
                  setCropImage(null);
                  setCropFileName('');
                }}
                onCancel={() => { setCropImage(null); setCropFileName(''); }}
              />
            )}
          </div>
        )}

        {/* PDF file picker */}
        {block.type === 'pdf' && (
          <div className="mt-2 space-y-2">
            {block.metadata?.dataUrl && (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#fb923c' }}>
                <FileText size={14} />
                <span>{block.metadata.fileName || 'Document PDF'}</span>
              </div>
            )}
            <label
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm"
              style={{
                background: 'rgba(249, 115, 22, 0.08)',
                border: '1px dashed rgba(249, 115, 22, 0.25)',
                color: '#f97316',
              }}
            >
              <Upload size={14} />
              <span>{block.metadata?.dataUrl ? 'Changer le PDF' : 'Choisir un PDF depuis votre PC'}</span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      onUpdate({
                        content: file.name,
                        metadata: {
                          ...block.metadata,
                          dataUrl: ev.target?.result as string,
                          fileName: file.name,
                        },
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>
        )}

        {/* Audio file picker */}
        {block.type === 'audio' && (
          <div className="mt-2 space-y-2">
            {block.metadata?.dataUrl && (
              <audio controls className="w-full" style={{ height: '40px' }}>
                <source src={block.metadata.dataUrl} />
              </audio>
            )}
            <label
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm"
              style={{
                background: 'rgba(244, 114, 182, 0.08)',
                border: '1px dashed rgba(244, 114, 182, 0.25)',
                color: '#f472b6',
              }}
            >
              <Upload size={14} />
              <span>{block.metadata?.dataUrl ? 'Changer l\'audio' : 'Choisir un fichier audio'}</span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      onUpdate({
                        content: file.name,
                        metadata: {
                          ...block.metadata,
                          dataUrl: ev.target?.result as string,
                          fileName: file.name,
                        },
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>
        )}

        {/* Dua metadata inputs */}
        {block.type === 'dua' && (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              placeholder="Texte arabe de l'invocation..."
              value={block.metadata?.arabic || ''}
              onChange={(e) =>
                onUpdate({ metadata: { ...block.metadata, arabic: e.target.value } })
              }
              className="w-full bg-transparent outline-none text-base text-right font-arabic placeholder:text-[var(--text-muted)]"
              style={{ color: '#34d399' }}
              dir="rtl"
            />
            <input
              type="text"
              placeholder="Source (ex: Sahih Muslim)..."
              value={block.metadata?.source || ''}
              onChange={(e) =>
                onUpdate({ metadata: { ...block.metadata, source: e.target.value } })
              }
              className="w-full bg-transparent outline-none text-xs mt-2 placeholder:text-[var(--text-muted)]"
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
        )}

        {/* Definition metadata */}
        {block.type === 'definition' && block.content.includes('---') === false && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Séparez le terme et la définition par ---
          </p>
        )}

        {/* Table editor */}
        {block.type === 'table' && (
          <TableEditor block={block} onUpdate={onUpdate} />
        )}

        {/* Inline actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -right-2 top-0 flex items-center gap-0.5"
            >
              {!isFirst && (
                <button
                  onClick={onMoveUp}
                  className="p-1 rounded transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  title="Monter"
                >
                  <ChevronUp size={12} />
                </button>
              )}
              {!isLast && (
                <button
                  onClick={onMoveDown}
                  className="p-1 rounded transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                  title="Descendre"
                >
                  <ChevronDown size={12} />
                </button>
              )}
              <button
                onClick={onDelete}
                className="p-1 rounded transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                title="Supprimer"
              >
                <Trash2 size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slash command menu */}
      <AnimatePresence>
        {showSlash && (
          <SlashMenu
            filter={slashFilter}
            onSelect={(type, shortcut) => {
              if (shortcut === '/quranenc' && onOpenQuranModal) {
                onOpenQuranModal();
                onDelete();
              } else if (shortcut === '/hadeethenc' && onOpenHadithModal) {
                onOpenHadithModal();
                onDelete();
              } else {
                onUpdate({ type, content: '' });
              }
              setShowSlash(false);
            }}
            onClose={() => setShowSlash(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to render inline formatting: URLs as clickable links, ==text== as highlights
function TextWithLinks({ text, style }: { text: string; style?: React.CSSProperties }) {
  // Split by highlights first, then by URLs
  const combinedRegex = /(==.+?==|https?:\/\/[^\s<]+)/g;
  const parts = text.split(combinedRegex);
  if (parts.length === 1) {
    return <span style={style}>{text}</span>;
  }
  return (
    <span style={style}>
      {parts.map((part, i) => {
        if (/^==.+==$/.test(part)) {
          return (
            <mark
              key={i}
              style={{
                background: 'rgba(212, 173, 74, 0.18)',
                color: 'inherit',
                borderRadius: '3px',
                padding: '1px 4px',
              }}
            >
              {part.slice(2, -2)}
            </mark>
          );
        }
        if (/^https?:\/\//.test(part)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#60a5fa', textDecoration: 'underline' }}
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// Read-only block renderer
function ReadOnlyBlock({ block }: { block: TopicBlock }) {
  switch (block.type) {
    case 'heading1':
      return (
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight mt-10 mb-4" style={{ color: 'var(--text-primary)' }}>
          <TextWithLinks text={block.content} />
        </h1>
      );
    case 'heading2':
      return (
        <h2 className="text-xl sm:text-2xl font-bold font-heading tracking-tight mt-8 mb-3" style={{ color: 'var(--text-primary)' }}>
          <TextWithLinks text={block.content} />
        </h2>
      );
    case 'heading3':
      return (
        <h3 className="text-lg font-semibold tracking-tight mt-6 mb-2" style={{ color: 'var(--text-primary)' }}>
          <TextWithLinks text={block.content} />
        </h3>
      );
    case 'paragraph':
      return block.content ? (
        <p className="text-sm leading-[1.9] mb-3" style={{ color: 'var(--text-secondary)' }}>
          <TextWithLinks text={block.content} />
        </p>
      ) : null;
    case 'quote':
      return (
        <blockquote
          className="my-4 py-3 pl-4 rounded-r-lg"
          style={{
            borderLeft: '3px solid #d4ad4a',
            background: 'rgba(196, 154, 61, 0.04)',
          }}
        >
          <p className="text-sm italic leading-[1.9]" style={{ color: '#d4ad4a' }}>
            <TextWithLinks text={block.content} />
          </p>
        </blockquote>
      );
    case 'bullet-list':
      return (
        <ul className="my-3 space-y-1.5 pl-5">
          {block.content.split('\n').filter(Boolean).map((item, i) => (
            <li key={i} className="text-sm leading-[1.8] list-disc" style={{ color: 'var(--text-secondary)' }}>
              <TextWithLinks text={item} />
            </li>
          ))}
        </ul>
      );
    case 'numbered-list':
      return (
        <ol className="my-3 space-y-1.5 pl-5">
          {block.content.split('\n').filter(Boolean).map((item, i) => (
            <li key={i} className="text-sm leading-[1.8] list-decimal" style={{ color: 'var(--text-secondary)' }}>
              <TextWithLinks text={item} />
            </li>
          ))}
        </ol>
      );
    case 'callout':
      return (
        <div
          className="my-4 rounded-xl p-4 flex items-start gap-3"
          style={{
            background: 'rgba(196, 154, 61, 0.06)',
            border: '1px solid rgba(196, 154, 61, 0.12)',
          }}
        >
          <AlertCircle size={18} style={{ color: '#d4ad4a' }} className="shrink-0 mt-0.5" />
          <p className="text-sm leading-[1.8]" style={{ color: 'var(--text-primary)' }}>
            <TextWithLinks text={block.content} />
          </p>
        </div>
      );
    case 'reflection':
      return (
        <div
          className="my-4 rounded-xl p-4 flex items-start gap-3"
          style={{
            background: 'rgba(18, 163, 147, 0.06)',
            border: '1px solid rgba(18, 163, 147, 0.12)',
          }}
        >
          <Lightbulb size={18} style={{ color: '#56e2cc' }} className="shrink-0 mt-0.5" />
          <p className="text-sm leading-[1.8]" style={{ color: 'var(--text-primary)' }}>
            <TextWithLinks text={block.content} />
          </p>
        </div>
      );
    case 'reminder':
      return (
        <div
          className="my-4 rounded-xl p-4 flex items-start gap-3"
          style={{
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.12)',
          }}
        >
          <Bell size={18} style={{ color: '#f59e0b' }} className="shrink-0 mt-0.5" />
          <p className="text-sm leading-[1.8]" style={{ color: 'var(--text-primary)' }}>
            <TextWithLinks text={block.content} />
          </p>
        </div>
      );
    case 'hadith':
      return (
        <div
          className="my-4 rounded-xl p-4"
          style={{
            background: 'rgba(46, 158, 140, 0.06)',
            borderLeft: '3px solid var(--accent)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <BookMarked size={14} style={{ color: 'var(--accent)' }} />
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Hadith
            </span>
            {block.metadata?.grade && (
              <span
                className="ml-1 text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(46, 158, 140, 0.12)',
                  color: 'var(--accent)',
                }}
              >
                {block.metadata.grade}
              </span>
            )}
            {block.metadata?.provider && (
              <span
                className="ml-auto text-[9px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(46, 158, 140, 0.08)', color: 'var(--text-muted)' }}
              >
                {block.metadata.provider === 'hadeethenc' ? 'HadeethEnc' : block.metadata.provider}
              </span>
            )}
          </div>
          <p className="text-sm leading-[1.9]" style={{ color: 'var(--text-primary)' }}>
            <TextWithLinks text={block.content} />
          </p>
          {block.metadata?.source && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              — {block.metadata.source}
            </p>
          )}
          {block.metadata?.explanation && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(46, 158, 140, 0.12)' }}>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--accent)' }}>
                Explication
              </p>
              <p className="text-xs leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>
                <TextWithLinks text={block.metadata.explanation} />
              </p>
            </div>
          )}
        </div>
      );
    case 'verse':
      return (
        <div
          className="my-4 rounded-xl p-4"
          style={{
            background: 'rgba(196, 154, 61, 0.06)',
            borderLeft: '3px solid #d4ad4a',
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen size={14} style={{ color: '#d4ad4a' }} />
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#d4ad4a' }}>
              Verset
            </span>
            {block.metadata?.provider && (
              <span
                className="ml-auto text-[9px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(196, 154, 61, 0.08)', color: 'var(--text-muted)' }}
              >
                {block.metadata.provider === 'quranenc' ? 'QuranEnc' : block.metadata.provider}
              </span>
            )}
          </div>
          {block.metadata?.arabic && (
            <p className="text-lg font-arabic text-right leading-[2] mb-3" style={{ color: '#d4ad4a' }}>
              {block.metadata.arabic}
            </p>
          )}
          <p className="text-sm leading-[1.9]" style={{ color: 'var(--text-primary)' }}>
            <TextWithLinks text={block.content} />
          </p>
          {block.metadata?.source && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              — {block.metadata.source}
            </p>
          )}
          {block.metadata?.footnotes && (
            <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {block.metadata.footnotes}
            </p>
          )}
          {block.metadata?.audioUrl && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(196, 154, 61, 0.12)' }}>
              <audio controls className="w-full" style={{ height: '32px' }}>
                <source src={block.metadata.audioUrl} type="audio/mpeg" />
              </audio>
            </div>
          )}
        </div>
      );
    case 'source':
      return (
        <div
          className="my-4 rounded-xl p-3 flex items-start gap-3"
          style={{
            background: 'rgba(99, 102, 241, 0.06)',
            border: '1px solid rgba(99, 102, 241, 0.12)',
          }}
        >
          <BookOpen size={16} style={{ color: '#6366f1' }} className="shrink-0 mt-0.5" />
          <div>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              <TextWithLinks text={block.content} />
            </p>
            {block.metadata?.reference && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                <TextWithLinks text={block.metadata.reference} />
              </p>
            )}
          </div>
        </div>
      );
    case 'link':
      return (
        <a
          href={block.content}
          target="_blank"
          rel="noopener noreferrer"
          className="my-3 flex items-center gap-2 rounded-lg p-3 text-sm transition-colors hover:opacity-80"
          style={{
            background: 'rgba(59, 130, 246, 0.06)',
            border: '1px solid rgba(59, 130, 246, 0.12)',
            color: '#60a5fa',
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          <Link2 size={16} className="shrink-0" />
          <span className="truncate underline">{block.metadata?.title || block.content}</span>
        </a>
      );
    case 'youtube': {
      // Extract video ID for embed
      const ytMatch = block.content.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      const videoId = ytMatch?.[1];
      return (
        <div className="my-4">
          {videoId ? (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(239, 68, 68, 0.12)' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="YouTube video"
              />
            </div>
          ) : (
            <a
              href={block.content}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg p-3 text-sm hover:opacity-80 transition-colors"
              style={{
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              <Video size={16} className="shrink-0" />
              <span className="truncate underline">{block.content}</span>
            </a>
          )}
        </div>
      );
    }
    case 'image': {
      const imgWidth = block.metadata?.width || '100%';
      return (
        <div className="my-4">
          {block.metadata?.dataUrl ? (
            <div className="rounded-xl overflow-hidden" style={{ maxWidth: imgWidth }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.metadata.dataUrl}
                alt={block.content || 'Image'}
                className="w-full h-auto rounded-xl"
                style={{ display: 'block' }}
              />
              {block.content && block.content !== block.metadata?.fileName && (
                <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
                  {block.content}
                </p>
              )}
            </div>
          ) : block.content ? (
            <div
              className="flex items-center gap-2 rounded-lg p-3 text-sm"
              style={{
                background: 'rgba(236, 72, 153, 0.06)',
                border: '1px solid rgba(236, 72, 153, 0.12)',
                color: '#ec4899',
              }}
            >
              <Image size={16} />
              <span className="truncate">{block.content}</span>
            </div>
          ) : null}
        </div>
      );
    }
    case 'pdf':
      return (
        <div className="my-3">
          {block.metadata?.dataUrl ? (
            <a
              href={block.metadata.dataUrl}
              download={block.metadata.fileName || 'document.pdf'}
              className="flex items-center gap-2 rounded-lg p-3 text-sm transition-colors"
              style={{
                background: 'rgba(249, 115, 22, 0.06)',
                border: '1px solid rgba(249, 115, 22, 0.12)',
                color: '#fb923c',
              }}
            >
              <FileText size={16} />
              <span className="truncate">{block.metadata.fileName || block.content || 'Document PDF'}</span>
              <span className="text-[10px] ml-auto opacity-70">Télécharger</span>
            </a>
          ) : (
            <div
              className="flex items-center gap-2 rounded-lg p-3 text-sm"
              style={{
                background: 'rgba(249, 115, 22, 0.06)',
                border: '1px solid rgba(249, 115, 22, 0.12)',
                color: '#fb923c',
              }}
            >
              <FileText size={16} />
              <span className="truncate">{block.content || 'Document PDF'}</span>
            </div>
          )}
        </div>
      );
    case 'qa': {
      const parts = block.content.split('---');
      return (
        <div
          className="my-4 rounded-xl p-4 space-y-3"
          style={{
            background: 'rgba(139, 92, 246, 0.06)',
            border: '1px solid rgba(139, 92, 246, 0.12)',
          }}
        >
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#8b5cf6' }}>
              Question
            </span>
            <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
              {parts[0]?.trim()}
            </p>
          </div>
          {parts[1] && (
            <div style={{ borderTop: '1px solid rgba(139, 92, 246, 0.12)', paddingTop: '0.75rem' }}>
              <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#8b5cf6' }}>
                Réponse
              </span>
              <p className="text-sm mt-1 leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>
                {parts[1].trim()}
              </p>
            </div>
          )}
        </div>
      );
    }
    case 'table': {
      let tableData: string[][] = [['']];
      try {
        if (block.metadata?.tableData) tableData = JSON.parse(block.metadata.tableData);
      } catch { /* ignore */ }
      return (
        <div className="my-4 overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-light)' }}>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {tableData.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, colIdx) => (
                    <td
                      key={colIdx}
                      className="px-3 py-2"
                      style={{
                        border: '1px solid var(--border-subtle)',
                        background: rowIdx === 0 ? 'rgba(20,184,166,0.06)' : 'transparent',
                        fontWeight: rowIdx === 0 ? 600 : 400,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'warning':
      return (
        <div
          className="my-4 rounded-xl p-4 flex items-start gap-3"
          style={{
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.12)',
          }}
        >
          <AlertTriangle size={18} style={{ color: '#ef4444' }} className="shrink-0 mt-0.5" />
          <p className="text-sm leading-[1.8]" style={{ color: 'var(--text-primary)' }}>
            <TextWithLinks text={block.content} />
          </p>
        </div>
      );
    case 'dua':
      return (
        <div
          className="my-4 rounded-xl p-4"
          style={{
            background: 'rgba(52, 211, 153, 0.06)',
            borderLeft: '3px solid #34d399',
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Hand size={14} style={{ color: '#34d399' }} />
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#34d399' }}>
              Dua / Invocation
            </span>
          </div>
          {block.metadata?.arabic && (
            <p className="text-lg font-arabic text-right leading-[2] mb-3" style={{ color: '#34d399' }} dir="rtl">
              {block.metadata.arabic}
            </p>
          )}
          <p className="text-sm leading-[1.9]" style={{ color: 'var(--text-primary)' }}>
            <TextWithLinks text={block.content} />
          </p>
          {block.metadata?.source && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              — {block.metadata.source}
            </p>
          )}
        </div>
      );
    case 'definition': {
      const defParts = block.content.split('---');
      return (
        <div
          className="my-4 rounded-xl p-4"
          style={{
            background: 'rgba(167, 139, 250, 0.06)',
            border: '1px solid rgba(167, 139, 250, 0.12)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <BookType size={14} style={{ color: '#a78bfa' }} />
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#a78bfa' }}>
              Définition
            </span>
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {defParts[0]?.trim()}
          </p>
          {defParts[1] && (
            <p className="text-sm leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>
              <TextWithLinks text={defParts[1].trim()} />
            </p>
          )}
        </div>
      );
    }
    case 'checklist':
      return (
        <div className="my-3 space-y-1.5 pl-1">
          {block.content.split('\n').filter(Boolean).map((item, i) => {
            const checked = item.startsWith('✓ ') || item.startsWith('✔ ');
            const text = checked ? item.slice(2) : item;
            return (
              <div key={i} className="flex items-start gap-2">
                <div
                  className="mt-1 h-4 w-4 rounded flex-shrink-0 flex items-center justify-center"
                  style={{
                    border: checked ? 'none' : '1.5px solid var(--text-muted)',
                    background: checked ? '#22c55e' : 'transparent',
                  }}
                >
                  {checked && <span className="text-[10px] text-white">✓</span>}
                </div>
                <span
                  className="text-sm leading-[1.8]"
                  style={{
                    color: checked ? 'var(--text-muted)' : 'var(--text-secondary)',
                    textDecoration: checked ? 'line-through' : 'none',
                  }}
                >
                  <TextWithLinks text={text} />
                </span>
              </div>
            );
          })}
        </div>
      );
    case 'audio':
      return (
        <div className="my-3">
          {block.metadata?.dataUrl ? (
            <div className="rounded-xl p-3" style={{ background: 'rgba(244, 114, 182, 0.06)', border: '1px solid rgba(244, 114, 182, 0.12)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Music size={14} style={{ color: '#f472b6' }} />
                <span className="text-xs font-medium" style={{ color: '#f472b6' }}>
                  {block.metadata.fileName || 'Audio'}
                </span>
              </div>
              <audio controls className="w-full" style={{ height: '36px' }}>
                <source src={block.metadata.dataUrl} />
              </audio>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg p-3 text-sm" style={{ background: 'rgba(244, 114, 182, 0.06)', border: '1px solid rgba(244, 114, 182, 0.12)', color: '#f472b6' }}>
              <Music size={16} />
              <span>{block.content || 'Fichier audio'}</span>
            </div>
          )}
        </div>
      );
    case 'poem':
      return (
        <div
          className="my-4 rounded-xl p-4"
          style={{
            background: 'rgba(232, 121, 249, 0.06)',
            borderLeft: '3px solid #e879f9',
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <ScrollText size={14} style={{ color: '#e879f9' }} />
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#e879f9' }}>
              Poème
            </span>
          </div>
          <div className="space-y-1">
            {block.content.split('\n').filter(Boolean).map((line, i) => (
              <p key={i} className="text-sm italic text-center leading-[1.9]" style={{ color: 'var(--text-primary)' }}>
                {line}
              </p>
            ))}
          </div>
          {block.metadata?.source && (
            <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-muted)' }}>
              — {block.metadata.source}
            </p>
          )}
        </div>
      );
    case 'timeline':
      return (
        <div className="my-4 pl-4" style={{ borderLeft: '2px solid rgba(6, 182, 212, 0.3)' }}>
          {block.content.split('\n').filter(Boolean).map((line, i) => {
            const sep = line.indexOf('—');
            const date = sep > -1 ? line.slice(0, sep).trim() : '';
            const event = sep > -1 ? line.slice(sep + 1).trim() : line;
            return (
              <div key={i} className="relative mb-4 last:mb-0 pl-4">
                <div
                  className="absolute -left-[1.3rem] top-1.5 h-2.5 w-2.5 rounded-full"
                  style={{ background: '#06b6d4', border: '2px solid var(--bg-base)' }}
                />
                {date && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#06b6d4' }}>
                    {date}
                  </span>
                )}
                <p className="text-sm leading-[1.7]" style={{ color: 'var(--text-primary)' }}>
                  <TextWithLinks text={event} />
                </p>
              </div>
            );
          })}
        </div>
      );
    case 'divider':
      return (
        <div className="separator-ornament my-6">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>✦</span>
        </div>
      );
    default:
      return block.content ? (
        <p className="text-sm leading-[1.8] mb-2" style={{ color: 'var(--text-secondary)' }}>
          {block.content}
        </p>
      ) : null;
  }
}

// Parse pasted text into blocks (auto-format)
function parsePastedText(text: string): TopicBlock[] {
  const lines = text.split('\n');
  const blocks: TopicBlock[] = [];
  let currentListLines: string[] = [];
  let currentListType: 'bullet-list' | 'numbered-list' | null = null;

  const flushList = () => {
    if (currentListLines.length > 0 && currentListType) {
      blocks.push({
        id: generateBlockId(),
        type: currentListType,
        content: currentListLines.join('\n'),
        order: blocks.length,
      });
      currentListLines = [];
      currentListType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings
    if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push({ id: generateBlockId(), type: 'heading2', content: trimmed.slice(3), order: blocks.length });
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push({ id: generateBlockId(), type: 'heading3', content: trimmed.slice(4), order: blocks.length });
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      blocks.push({ id: generateBlockId(), type: 'heading2', content: trimmed.slice(2), order: blocks.length });
      continue;
    }

    // Dividers
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushList();
      blocks.push({ id: generateBlockId(), type: 'divider', content: '', order: blocks.length });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList();
      // Collect consecutive quote lines
      let quoteContent = trimmed.slice(2);
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('> ')) {
        i++;
        quoteContent += '\n' + lines[i].trim().slice(2);
      }
      blocks.push({ id: generateBlockId(), type: 'quote', content: quoteContent, order: blocks.length });
      continue;
    }

    // Bullet list items
    if (/^[-*+]\s/.test(trimmed)) {
      if (currentListType !== 'bullet-list') {
        flushList();
        currentListType = 'bullet-list';
      }
      currentListLines.push(trimmed.replace(/^[-*+]\s/, ''));
      continue;
    }

    // Numbered list items
    if (/^\d+[.)]\s/.test(trimmed)) {
      if (currentListType !== 'numbered-list') {
        flushList();
        currentListType = 'numbered-list';
      }
      currentListLines.push(trimmed.replace(/^\d+[.)]\s/, ''));
      continue;
    }

    // URLs become link blocks
    if (/^https?:\/\/\S+$/.test(trimmed)) {
      flushList();
      // Check if YouTube
      if (/youtube\.com|youtu\.be/.test(trimmed)) {
        blocks.push({ id: generateBlockId(), type: 'youtube', content: trimmed, order: blocks.length });
      } else {
        blocks.push({ id: generateBlockId(), type: 'link', content: trimmed, order: blocks.length });
      }
      continue;
    }

    // Default: paragraph
    flushList();
    blocks.push({ id: generateBlockId(), type: 'paragraph', content: trimmed, order: blocks.length });
  }

  flushList();

  // If nothing was parsed, return a single paragraph
  if (blocks.length === 0) {
    blocks.push({ id: generateBlockId(), type: 'paragraph', content: text, order: 0 });
  }

  return blocks;
}

// Main editor component
export default function BlockEditor({ blocks, onChange, readOnly = false }: BlockEditorProps) {
  const [showQuranModal, setShowQuranModal] = useState(false);
  const [showHadithModal, setShowHadithModal] = useState(false);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData('text/plain');
      if (!text) return;

      // Only auto-format if paste has multiple lines with markdown-like syntax
      // Single-line URLs should paste as plain text in the current block
      const hasFormatting = text.includes('\n') && /^(#{1,3}\s|[-*+]\s|\d+[.)]\s|>\s|[-*_]{3,})/m.test(text.trim());
      if (!hasFormatting) return;

      e.preventDefault();
      const newBlocks = parsePastedText(text);
      // Re-order all blocks
      const updated = [...blocks, ...newBlocks];
      updated.forEach((b, i) => (b.order = i));
      onChange(updated);
    },
    [blocks, onChange]
  );

  const addBlock = useCallback(
    (afterIndex: number, type: BlockType = 'paragraph') => {
      const newBlock: TopicBlock = {
        id: generateBlockId(),
        type,
        content: '',
        order: afterIndex + 1,
      };
      const updated = [...blocks];
      updated.splice(afterIndex + 1, 0, newBlock);
      // Re-order
      updated.forEach((b, i) => (b.order = i));
      onChange(updated);
    },
    [blocks, onChange]
  );

  const updateBlock = useCallback(
    (index: number, updates: Partial<TopicBlock>) => {
      const updated = [...blocks];
      updated[index] = { ...updated[index], ...updates };
      onChange(updated);
    },
    [blocks, onChange]
  );

  const handleInsertIslamicBlock = useCallback(
    (blockData: Partial<TopicBlock>) => {
      const newBlock: TopicBlock = {
        id: generateBlockId(),
        type: blockData.type || 'paragraph',
        content: blockData.content || '',
        metadata: blockData.metadata,
        order: blocks.length,
      };
      const updated = [...blocks, newBlock];
      updated.forEach((b, i) => (b.order = i));
      onChange(updated);
    },
    [blocks, onChange]
  );

  const deleteBlock = useCallback(
    (index: number) => {
      if (blocks.length <= 1) return; // Keep at least one block
      const updated = blocks.filter((_, i) => i !== index);
      updated.forEach((b, i) => (b.order = i));
      onChange(updated);
    },
    [blocks, onChange]
  );

  const moveBlock = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= blocks.length) return;
      const updated = [...blocks];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      updated.forEach((b, i) => (b.order = i));
      onChange(updated);
    },
    [blocks, onChange]
  );

  if (readOnly) {
    return (
      <div className="space-y-0">
        {blocks
          .sort((a, b) => a.order - b.order)
          .map((block) => (
            <ReadOnlyBlock key={block.id} block={block} />
          ))}
      </div>
    );
  }

  return (
    <div className="pl-10 space-y-2" onPaste={handlePaste}>
      {blocks
        .sort((a, b) => a.order - b.order)
        .map((block, index) => (
          <EditableBlock
            key={block.id}
            block={block}
            onUpdate={(updates) => updateBlock(index, updates)}
            onDelete={() => deleteBlock(index)}
            onAddBelow={(type) => addBlock(index, type)}
            onMoveUp={() => moveBlock(index, 'up')}
            onMoveDown={() => moveBlock(index, 'down')}
            isFirst={index === 0}
            isLast={index === blocks.length - 1}
            onOpenQuranModal={() => setShowQuranModal(true)}
            onOpenHadithModal={() => setShowHadithModal(true)}
          />
        ))}

      {/* Add block button */}
      <button
        onClick={() => addBlock(blocks.length - 1)}
        className="flex items-center gap-2 w-full py-3 px-3 rounded-lg transition-colors duration-200 cursor-pointer"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <Plus size={16} />
        <span className="text-sm">Ajouter un bloc</span>
      </button>

      {/* Islamic API modals */}
      <QuranSearchModal
        isOpen={showQuranModal}
        onClose={() => setShowQuranModal(false)}
        onInsert={handleInsertIslamicBlock}
      />
      <HadithSearchModal
        isOpen={showHadithModal}
        onClose={() => setShowHadithModal(false)}
        onInsert={handleInsertIslamicBlock}
      />
    </div>
  );
}

export { ReadOnlyBlock, BLOCK_TYPES };
