'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Mic } from 'lucide-react';
import { RECITERS } from '@/lib/api/quranApi';

interface ReciterSelectorProps {
  value: number;
  onChange: (id: number) => void;
}

export default function ReciterSelector({ value, onChange }: ReciterSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = RECITERS.find((r) => r.id === value) ?? RECITERS[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-sm"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        <Mic size={14} style={{ color: 'var(--accent)' }} />
        <span className="truncate max-w-[120px]">{selected.name}</span>
        <ChevronDown
          size={14}
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 z-50 rounded-xl overflow-hidden min-w-[200px]"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            {RECITERS.map((reciter) => (
              <button
                key={reciter.id}
                onClick={() => {
                  onChange(reciter.id);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors text-left"
                style={{
                  background: value === reciter.id ? 'var(--accent-light)' : 'transparent',
                  color: value === reciter.id ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div className="font-medium">{reciter.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{reciter.style}</div>
                </div>
                <span
                  className="font-arabic text-sm flex-shrink-0"
                  style={{ direction: 'rtl', color: 'var(--text-muted)' }}
                >
                  {reciter.nameAr}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
