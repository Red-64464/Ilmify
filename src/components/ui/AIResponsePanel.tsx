'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Copy, Check, Loader2 } from 'lucide-react';
import { useState, useCallback } from 'react';

interface AIResponsePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  loading?: boolean;
  error?: string;
  children?: React.ReactNode;
}

export default function AIResponsePanel({ isOpen, onClose, title, loading, error, children }: AIResponsePanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl p-5 mt-3 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(196,154,61,0.04), var(--bg-card) 40%, rgba(26,122,107,0.03))',
            border: '1px solid rgba(196,154,61,0.12)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 0 30px rgba(196,154,61,0.04)',
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(196,154,61,0.06), transparent 70%)' }}
          />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: 'rgba(196,154,61,0.12)' }}
              >
                <Sparkles size={14} style={{ color: '#d4ad4a' }} />
              </div>
              <h4 className="text-sm font-semibold tracking-tight" style={{ color: '#d4ad4a' }}>
                {title}
              </h4>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg cursor-pointer transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {loading && (
              <div className="flex items-center gap-3 py-6 justify-center">
                <Loader2 size={18} className="animate-spin" style={{ color: '#d4ad4a' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Analyse en cours...
                </span>
              </div>
            )}
            {error && (
              <p className="text-sm py-3" style={{ color: '#f87171' }}>{error}</p>
            )}
            {!loading && !error && children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Copyable text block
export function CopyableText({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <div className={`group relative ${className || ''}`}>
      <p className="text-sm leading-[1.8] pr-8" style={{ color: 'var(--text-secondary)' }}>
        {text}
      </p>
      <button
        onClick={handleCopy}
        className="absolute top-0 right-0 p-1.5 rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: copied ? '#22c55e' : 'var(--text-muted)' }}
        title="Copier"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
}

// Source badge
export function SourceBadge({ provider, grade, source }: { provider: string; grade?: string; source?: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium mt-3"
      style={{
        background: 'rgba(46,158,140,0.08)',
        border: '1px solid rgba(46,158,140,0.12)',
        color: 'var(--accent)',
      }}
    >
      <span>📖 {provider}</span>
      {grade && (
        <span
          className="px-1.5 py-0.5 rounded-md"
          style={{ background: 'rgba(46,158,140,0.15)' }}
        >
          {grade}
        </span>
      )}
      {source && <span style={{ color: 'var(--text-muted)' }}>{source}</span>}
    </div>
  );
}
