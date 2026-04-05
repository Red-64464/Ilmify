'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookMarked, Search, Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import {
  getRootCategories,
  getHadithsByCategory,
  getHadithDetail,
  type HadeethCategory,
  type HadeethListItem,
  type HadeethDetail,
} from '@/lib/api/hadithApi';
import type { TopicBlock } from '@/types';

interface HadithSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (block: Partial<TopicBlock>) => void;
}

type ViewState = 'categories' | 'list' | 'detail';

export default function HadithSearchModal({ isOpen, onClose, onInsert }: HadithSearchModalProps) {
  const [view, setView] = useState<ViewState>('categories');
  const [categories, setCategories] = useState<HadeethCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<HadeethCategory | null>(null);
  const [hadiths, setHadiths] = useState<HadeethListItem[]>([]);
  const [selectedHadith, setSelectedHadith] = useState<HadeethDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Load categories
  useEffect(() => {
    if (isOpen && categories.length === 0) {
      setLoading(true);
      getRootCategories('fr')
        .then(setCategories)
        .catch(() => getRootCategories('en').then(setCategories))
        .catch(() => setError('Impossible de charger les catégories'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, categories.length]);

  const handleSelectCategory = useCallback(async (cat: HadeethCategory) => {
    setSelectedCategory(cat);
    setLoading(true);
    setError('');
    try {
      const result = await getHadithsByCategory(cat.id, 'fr');
      setHadiths(result.data || []);
      setView('list');
    } catch {
      try {
        const result = await getHadithsByCategory(cat.id, 'en');
        setHadiths(result.data || []);
        setView('list');
      } catch {
        setError('Erreur lors du chargement des hadiths');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectHadith = useCallback(async (hadith: HadeethListItem) => {
    setLoading(true);
    setError('');
    try {
      const detail = await getHadithDetail(hadith.id, 'fr');
      setSelectedHadith(detail);
      setView('detail');
    } catch {
      try {
        const detail = await getHadithDetail(hadith.id, 'en');
        setSelectedHadith(detail);
        setView('detail');
      } catch {
        setError('Erreur lors du chargement du hadith');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInsert = useCallback(() => {
    if (!selectedHadith) return;
    onInsert({
      type: 'hadith',
      content: selectedHadith.hadeeth,
      metadata: {
        source: selectedHadith.attribution || selectedHadith.reference || '',
        grade: selectedHadith.grade || '',
        explanation: selectedHadith.explanation || '',
        provider: 'hadeethenc',
        hadithId: selectedHadith.id,
      },
    });
    onClose();
    handleFullReset();
  }, [selectedHadith, onInsert, onClose]);

  const handleFullReset = () => {
    setView('categories');
    setSelectedCategory(null);
    setHadiths([]);
    setSelectedHadith(null);
    setError('');
    setSearchFilter('');
  };

  const handleBack = () => {
    setError('');
    if (view === 'detail') { setView('list'); setSelectedHadith(null); }
    else if (view === 'list') { setView('categories'); setSelectedCategory(null); setHadiths([]); }
  };

  const filteredCategories = searchFilter
    ? categories.filter((c) => c.title.toLowerCase().includes(searchFilter.toLowerCase()))
    : categories;

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); handleFullReset(); }} title="Rechercher un hadith" maxWidth="38rem">
      <div className="space-y-4">
        {/* Back button */}
        {view !== 'categories' && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm transition-colors cursor-pointer"
            style={{ color: 'var(--accent)' }}
          >
            <ArrowLeft size={14} />
            Retour
          </button>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-center" style={{ color: '#f87171' }}>{error}</p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        )}

        {/* Categories view */}
        {view === 'categories' && !loading && (
          <div className="space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Rechercher une catégorie..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div className="max-h-72 overflow-y-auto rounded-lg scrollbar-none" style={{ border: '1px solid var(--border-light)' }}>
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(46, 158, 140, 0.06)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <BookMarked size={14} style={{ color: 'var(--accent)' }} />
                  <span className="flex-1 text-left">{cat.title}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {cat.hadeeths_count} hadiths
                  </span>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hadiths list */}
        {view === 'list' && !loading && (
          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {selectedCategory?.title} — {hadiths.length} hadith(s)
            </p>
            <div className="max-h-72 overflow-y-auto rounded-lg scrollbar-none" style={{ border: '1px solid var(--border-light)' }}>
              {hadiths.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                  Aucun hadith trouvé dans cette catégorie
                </p>
              ) : (
                hadiths.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleSelectHadith(h)}
                    className="w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer"
                    style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(46, 158, 140, 0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <p className="line-clamp-2 leading-relaxed">{h.title}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Hadith detail */}
        {view === 'detail' && !loading && selectedHadith && (
          <div
            className="rounded-xl p-4 space-y-3 max-h-[60vh] overflow-y-auto scrollbar-none"
            style={{ background: 'rgba(46, 158, 140, 0.06)', borderLeft: '3px solid var(--accent)' }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <BookMarked size={14} style={{ color: 'var(--accent)' }} />
              <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                Hadith
              </span>
              {selectedHadith.grade && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(46, 158, 140, 0.12)', color: 'var(--accent)' }}>
                  {selectedHadith.grade}
                </span>
              )}
            </div>
            <p className="text-sm leading-[1.9]" style={{ color: 'var(--text-primary)' }}>
              {selectedHadith.hadeeth}
            </p>
            {selectedHadith.attribution && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                — {selectedHadith.attribution}
              </p>
            )}
            {selectedHadith.explanation && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(46, 158, 140, 0.15)' }}>
                <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--accent)' }}>
                  Explication
                </p>
                <p className="text-xs leading-[1.8]" style={{ color: 'var(--text-secondary)' }}>
                  {selectedHadith.explanation}
                </p>
              </div>
            )}
            <button
              onClick={handleInsert}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer sticky bottom-0"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              Insérer ce hadith
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
