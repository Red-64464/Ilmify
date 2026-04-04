'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Type, Heading2, Heading3, Quote, List, ListOrdered,
  AlertCircle, Lightbulb, Bell, BookOpen, BookMarked,
  Image, Link2, Video, FileText, HelpCircle, Table2, Minus,
  GripVertical, Trash2, ChevronUp, ChevronDown,
  Upload, PlusCircle, MinusCircle, Columns, Rows,
} from 'lucide-react';
import type { TopicBlock, BlockType } from '@/types';

// Block type definitions with metadata
const BLOCK_TYPES: { type: BlockType; icon: React.ElementType; label: string; shortcut: string; color: string }[] = [
  { type: 'paragraph', icon: Type, label: 'Paragraphe', shortcut: '/text', color: 'var(--text-secondary)' },
  { type: 'heading2', icon: Heading2, label: 'Titre H2', shortcut: '/h2', color: 'var(--text-primary)' },
  { type: 'heading3', icon: Heading3, label: 'Sous-titre H3', shortcut: '/h3', color: 'var(--text-primary)' },
  { type: 'quote', icon: Quote, label: 'Citation', shortcut: '/quote', color: '#d4ad4a' },
  { type: 'bullet-list', icon: List, label: 'Liste à puces', shortcut: '/list', color: '#2e9e8c' },
  { type: 'numbered-list', icon: ListOrdered, label: 'Liste numérotée', shortcut: '/numbered', color: '#2e9e8c' },
  { type: 'callout', icon: AlertCircle, label: 'Important', shortcut: '/important', color: '#d4ad4a' },
  { type: 'reflection', icon: Lightbulb, label: 'Réflexion', shortcut: '/reflection', color: '#56e2cc' },
  { type: 'reminder', icon: Bell, label: 'Rappel', shortcut: '/reminder', color: '#f59e0b' },
  { type: 'source', icon: BookOpen, label: 'Source / Référence', shortcut: '/source', color: '#6366f1' },
  { type: 'hadith', icon: BookMarked, label: 'Hadith', shortcut: '/hadith', color: '#2e9e8c' },
  { type: 'verse', icon: BookOpen, label: 'Verset', shortcut: '/verse', color: '#d4ad4a' },
  { type: 'image', icon: Image, label: 'Image', shortcut: '/image', color: '#ec4899' },
  { type: 'link', icon: Link2, label: 'Lien', shortcut: '/link', color: '#3b82f6' },
  { type: 'youtube', icon: Video, label: 'YouTube', shortcut: '/youtube', color: '#ef4444' },
  { type: 'pdf', icon: FileText, label: 'PDF', shortcut: '/pdf', color: '#f97316' },
  { type: 'qa', icon: HelpCircle, label: 'Question / Réponse', shortcut: '/qa', color: '#8b5cf6' },
  { type: 'table', icon: Table2, label: 'Tableau', shortcut: '/table', color: '#14b8a6' },
  { type: 'divider', icon: Minus, label: 'Séparateur', shortcut: '/divider', color: 'var(--text-muted)' },
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
  onSelect: (type: BlockType) => void;
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
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl overflow-hidden"
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
              key={bt.type}
              onClick={() => {
                onSelect(bt.type);
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
}: {
  block: TopicBlock;
  onUpdate: (updates: Partial<TopicBlock>) => void;
  onDelete: () => void;
  onAddBelow: (type: BlockType) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [showSlash, setShowSlash] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [showActions, setShowActions] = useState(false);
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
      if (e.key === 'Enter' && !e.shiftKey && block.type !== 'bullet-list' && block.type !== 'numbered-list') {
        e.preventDefault();
        onAddBelow('paragraph');
      }
    },
    [block.content, block.type, onDelete, onAddBelow]
  );

  const getBlockStyle = (): { wrapper: React.CSSProperties; textarea: React.CSSProperties; placeholder: string } => {
    switch (block.type) {
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
            borderLeft: '3px solid #2e9e8c',
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
        className="absolute -left-10 top-1 flex flex-col gap-0.5 transition-opacity duration-200"
        style={{ opacity: showActions ? 0.7 : 0 }}
      >
        <button
          onClick={() => setShowSlash(true)}
          className="flex h-6 w-6 items-center justify-center rounded transition-colors cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
          title="Ajouter un bloc"
        >
          <Plus size={14} />
        </button>
        <button
          className="flex h-6 w-6 items-center justify-center rounded cursor-grab"
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
              <div className="rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.metadata.dataUrl} alt={block.content || 'Image'} className="max-w-full rounded-lg" />
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
            onSelect={(type) => {
              onUpdate({ type, content: '' });
              setShowSlash(false);
            }}
            onClose={() => setShowSlash(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Read-only block renderer
function ReadOnlyBlock({ block }: { block: TopicBlock }) {
  switch (block.type) {
    case 'heading2':
      return (
        <h2 className="text-xl sm:text-2xl font-bold font-heading tracking-tight mt-8 mb-3" style={{ color: 'var(--text-primary)' }}>
          {block.content}
        </h2>
      );
    case 'heading3':
      return (
        <h3 className="text-lg font-semibold tracking-tight mt-6 mb-2" style={{ color: 'var(--text-primary)' }}>
          {block.content}
        </h3>
      );
    case 'paragraph':
      return block.content ? (
        <p className="text-sm leading-[1.9] mb-3" style={{ color: 'var(--text-secondary)' }}>
          {block.content}
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
            {block.content}
          </p>
        </blockquote>
      );
    case 'bullet-list':
      return (
        <ul className="my-3 space-y-1.5 pl-5">
          {block.content.split('\n').filter(Boolean).map((item, i) => (
            <li key={i} className="text-sm leading-[1.8] list-disc" style={{ color: 'var(--text-secondary)' }}>
              {item}
            </li>
          ))}
        </ul>
      );
    case 'numbered-list':
      return (
        <ol className="my-3 space-y-1.5 pl-5">
          {block.content.split('\n').filter(Boolean).map((item, i) => (
            <li key={i} className="text-sm leading-[1.8] list-decimal" style={{ color: 'var(--text-secondary)' }}>
              {item}
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
            {block.content}
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
            {block.content}
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
            {block.content}
          </p>
        </div>
      );
    case 'hadith':
      return (
        <div
          className="my-4 rounded-xl p-4"
          style={{
            background: 'rgba(46, 158, 140, 0.06)',
            borderLeft: '3px solid #2e9e8c',
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <BookMarked size={14} style={{ color: '#2e9e8c' }} />
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#2e9e8c' }}>
              Hadith
            </span>
          </div>
          <p className="text-sm leading-[1.9]" style={{ color: 'var(--text-primary)' }}>
            {block.content}
          </p>
          {block.metadata?.source && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              — {block.metadata.source}
            </p>
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
          </div>
          {block.metadata?.arabic && (
            <p className="text-lg font-arabic text-right leading-[2] mb-3" style={{ color: '#d4ad4a' }}>
              {block.metadata.arabic}
            </p>
          )}
          <p className="text-sm leading-[1.9]" style={{ color: 'var(--text-primary)' }}>
            {block.content}
          </p>
          {block.metadata?.source && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              — {block.metadata.source}
            </p>
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
              {block.content}
            </p>
            {block.metadata?.reference && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {block.metadata.reference}
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
          className="my-3 flex items-center gap-2 rounded-lg p-3 text-sm transition-colors"
          style={{
            background: 'rgba(59, 130, 246, 0.06)',
            border: '1px solid rgba(59, 130, 246, 0.12)',
            color: '#60a5fa',
          }}
        >
          <Link2 size={16} />
          <span className="truncate">{block.content}</span>
        </a>
      );
    case 'youtube':
      return (
        <div className="my-4">
          <div
            className="flex items-center gap-2 rounded-lg p-3 text-sm"
            style={{
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.12)',
              color: '#f87171',
            }}
          >
            <Video size={16} />
            <span className="truncate">{block.content}</span>
          </div>
        </div>
      );
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

// Main editor component
export default function BlockEditor({ blocks, onChange, readOnly = false }: BlockEditorProps) {
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
    <div className="pl-10 space-y-2">
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
    </div>
  );
}

export { ReadOnlyBlock, BLOCK_TYPES };
