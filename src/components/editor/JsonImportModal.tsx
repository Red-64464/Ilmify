'use client';

import React, { useState, useMemo } from 'react';
import { Upload, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ReadOnlyBlock } from '@/components/editor/BlockEditor';
import { parseAndValidateBlocks, extractTitleFromJson } from '@/lib/importJson';
import type { TopicBlock } from '@/types';

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (title: string, blocks: TopicBlock[]) => void;
  importing?: boolean;
}

export default function JsonImportModal({ isOpen, onClose, onImport, importing }: JsonImportModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [title, setTitle] = useState('');

  const result = useMemo(() => {
    if (!jsonText.trim()) return null;
    return parseAndValidateBlocks(jsonText);
  }, [jsonText]);

  const extractedTitle = useMemo(() => {
    if (!jsonText.trim()) return null;
    return extractTitleFromJson(jsonText);
  }, [jsonText]);

  const effectiveTitle = title.trim() || extractedTitle || '';

  const handleImport = () => {
    if (!result || result.blocks.length === 0 || !effectiveTitle) return;
    onImport(effectiveTitle, result.blocks);
  };

  const handleClose = () => {
    setJsonText('');
    setTitle('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importer du JSON" maxWidth="42rem">
      <div className="space-y-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
        {/* Title */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Titre de la page
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={extractedTitle || 'Ex: Les piliers de l\'islam'}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:text-[var(--text-muted)]"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          />
        </div>

        {/* JSON input */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Collez votre JSON
          </label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={'[\n  { "type": "heading1", "content": "Mon titre" },\n  { "type": "paragraph", "content": "Mon texte..." }\n]'}
            rows={8}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none font-mono placeholder:text-[var(--text-muted)]"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Warnings */}
        {result && result.warnings.length > 0 && (
          <div className="rounded-xl px-4 py-3 space-y-1" style={{ background: 'rgba(239,68,68,0.08)' }}>
            {result.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-sm" style={{ color: '#ef4444' }}>
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Success summary */}
        {result && result.blocks.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ color: '#22c55e', background: 'rgba(34,197,94,0.08)' }}>
            <CheckCircle size={14} />
            <span>{result.blocks.length} bloc{result.blocks.length > 1 ? 's' : ''} prêt{result.blocks.length > 1 ? 's' : ''} à importer</span>
          </div>
        )}

        {/* Preview */}
        {result && result.blocks.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Aperçu
            </label>
            <div
              className="rounded-xl px-4 py-3 space-y-2"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              {result.blocks.slice(0, 20).map((block) => (
                <ReadOnlyBlock key={block.id} block={block} />
              ))}
              {result.blocks.length > 20 && (
                <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
                  … et {result.blocks.length - 20} bloc{result.blocks.length - 20 > 1 ? 's' : ''} de plus
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" size="md" onClick={handleClose} className="flex-1">
            Annuler
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleImport}
            disabled={!result || result.blocks.length === 0 || !effectiveTitle || importing}
            className="flex-1"
          >
            {importing ? 'Import en cours...' : (
              <span className="flex items-center justify-center gap-2">
                <Upload size={16} />
                Importer
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
