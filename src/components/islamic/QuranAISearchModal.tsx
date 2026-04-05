'use client';

import React, { useState, useCallback } from 'react';
import { BookOpen, Search, Loader2, Sparkles } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { findRelevantVerses } from '@/lib/ai/groq';
import { getVerseTranslation, getArabicVerse, getAudioUrl, SURAH_LIST } from '@/lib/api/quranApi';
import type { TopicBlock } from '@/types';

interface QuranAISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (block: Partial<TopicBlock>) => void;
}

interface VerseResult {
  surah: number;
  ayah: number;
  reason: string;
  translation?: string;
  footnotes?: string;
  arabic?: string;
  audioUrl?: string;
  loading?: boolean;
}

export default function QuranAISearchModal({ isOpen, onClose, onInsert }: QuranAISearchModalProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<VerseResult[]>([]);
  const [error, setError] = useState('');

  const handleSearch = useCallback(async () => {
    if (!query.trim() || searching) return;
    setSearching(true);
    setError('');
    setResults([]);
    try {
      const verses = await findRelevantVerses(query);
      const initial = verses.map((v) => ({ ...v, loading: true }));
      setResults(initial);

      // Fetch actual translations in parallel
      const enriched = await Promise.all(
        verses.map(async (v) => {
          try {
            const [trans, arabic] = await Promise.all([
              getVerseTranslation(v.surah, v.ayah, 'french_hameedullah'),
              getArabicVerse(v.surah, v.ayah),
            ]);
            return {
              ...v,
              translation: trans?.translation || '',
              footnotes: trans?.footnotes || '',
              arabic: arabic || '',
              audioUrl: getAudioUrl(v.surah, v.ayah),
              loading: false,
            };
          } catch {
            return { ...v, loading: false };
          }
        }),
      );
      setResults(enriched);
    } catch {
      setError('Erreur lors de la recherche IA');
    }
    setSearching(false);
  }, [query, searching]);

  const handleInsert = (verse: VerseResult) => {
    const surah = SURAH_LIST[verse.surah - 1];
    const surahName = surah?.name || `Sourate ${verse.surah}`;
    const surahNameAr = surah?.nameAr || '';
    onInsert({
      type: 'verse',
      content: verse.translation || verse.reason,
      metadata: {
        arabic: verse.arabic || '',
        source: `Sourate ${surahName} (${surahNameAr}), Verset ${verse.ayah}`,
        surah: String(verse.surah),
        ayah: String(verse.ayah),
        audioUrl: verse.audioUrl || getAudioUrl(verse.surah, verse.ayah),
        footnotes: verse.footnotes || '',
        provider: 'quranenc',
      },
    });
    onClose();
    setQuery('');
    setResults([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setQuery(''); setResults([]); setError(''); }} title="Recherche Coran par IA" maxWidth="38rem">
      <div className="space-y-4">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Décrivez un sujet et l&apos;IA trouvera les versets correspondants dans le Coran.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: la patience, le jeûne, la prière..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            autoFocus
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ background: 'var(--bg-base)', border: '1px solid rgba(196,154,61,0.2)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all flex items-center gap-1.5"
            style={{ background: 'rgba(196,154,61,0.12)', color: '#d4ad4a', opacity: searching ? 0.6 : 1 }}
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Chercher
          </button>
        </div>

        {error && <p className="text-sm text-center" style={{ color: '#f87171' }}>{error}</p>}

        {searching && (
          <div className="flex items-center justify-center py-8 gap-3">
            <Loader2 size={20} className="animate-spin" style={{ color: '#d4ad4a' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Recherche en cours...</span>
          </div>
        )}

        {results.length > 0 && !searching && (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto scrollbar-none">
            {results.map((verse, i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(196,154,61,0.04)',
                  borderLeft: '3px solid #d4ad4a',
                }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <BookOpen size={14} style={{ color: '#d4ad4a' }} />
                  <span className="text-[11px] font-medium" style={{ color: '#d4ad4a' }}>
                    {SURAH_LIST[verse.surah - 1]?.name || `Sourate ${verse.surah}`}, v.{verse.ayah}
                  </span>
                </div>
                <p className="text-xs mb-2 italic" style={{ color: 'var(--text-muted)' }}>{verse.reason}</p>
                {verse.loading ? (
                  <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <>
                    {verse.arabic && (
                      <p className="text-base font-arabic text-right leading-[2] mb-2" style={{ color: '#d4ad4a' }}>
                        {verse.arabic}
                      </p>
                    )}
                    {verse.translation && (
                      <p className="text-sm leading-[1.8] mb-3" style={{ color: 'var(--text-primary)' }}>
                        {verse.translation}
                      </p>
                    )}
                    <button
                      onClick={() => handleInsert(verse)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                      style={{ background: 'rgba(196,154,61,0.12)', color: '#d4ad4a' }}
                    >
                      <Search size={12} />
                      Insérer ce verset
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
