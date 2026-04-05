'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookMarked, Search, Loader2, ChevronRight, ArrowLeft, Sparkles } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import {
  getRootCategories,
  getHadithsByCategory,
  getHadithDetail,
  type HadeethCategory,
  type HadeethListItem,
  type HadeethDetail,
} from '@/lib/api/hadithApi';
import { findBestHadithCategories, rankHadithResults } from '@/lib/ai/groq';
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

  // AI search state
  const [tab, setTab] = useState<'category' | 'ai'>('category');
  const [aiQuery, setAiQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState<HadeethListItem[]>([]);

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
    setAiQuery('');
    setAiResults([]);
  };

  const handleAISearch = useCallback(async () => {
    if (!aiQuery.trim() || aiSearching) return;
    setAiSearching(true);
    setError('');
    setAiResults([]);
    try {
      // Load categories if not loaded
      let cats = categories;
      if (cats.length === 0) {
        cats = await getRootCategories('fr');
        setCategories(cats);
      }
      // Use AI to find best categories
      const bestIds = await findBestHadithCategories(
        aiQuery,
        cats.map((c) => ({ id: c.id, title: c.title })),
      );
      // Fetch hadiths from those categories
      const allHadiths: HadeethListItem[] = [];
      for (const catId of bestIds.slice(0, 3)) {
        try {
          const result = await getHadithsByCategory(catId, 'fr');
          allHadiths.push(...(result.data || []));
        } catch { /* skip */ }
      }
      if (allHadiths.length === 0) {
        setError('Aucun hadith trouvé pour cette recherche');
        setAiSearching(false);
        return;
      }
      // Rank results with AI
      const rankedIds = await rankHadithResults(
        aiQuery,
        allHadiths.map((h) => ({ id: h.id, title: h.title, text: h.title })),
      );
      const ranked = rankedIds
        .map((id) => allHadiths.find((h) => h.id === id))
        .filter(Boolean) as HadeethListItem[];
      setAiResults(ranked.length > 0 ? ranked : allHadiths.slice(0, 5));
    } catch {
      setError('Erreur lors de la recherche IA');
    }
    setAiSearching(false);
  }, [aiQuery, aiSearching, categories]);

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
        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => { setTab('category'); setView('categories'); setSelectedHadith(null); }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium cursor-pointer transition-all"
            style={{
              background: tab === 'category' ? 'rgba(46,158,140,0.1)' : 'transparent',
              color: tab === 'category' ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            <BookMarked size={13} />
            Par catégorie
          </button>
          <button
            onClick={() => { setTab('ai'); setView('categories'); setSelectedHadith(null); }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium cursor-pointer transition-all"
            style={{
              background: tab === 'ai' ? 'rgba(196,154,61,0.1)' : 'transparent',
              color: tab === 'ai' ? '#d4ad4a' : 'var(--text-muted)',
            }}
          >
            <Sparkles size={13} />
            Recherche IA
          </button>
        </div>

        {/* AI Search Tab */}
        {tab === 'ai' && view !== 'detail' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: la patience, le jeûne, l'aumône..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ background: 'var(--bg-base)', border: '1px solid rgba(196,154,61,0.2)', color: 'var(--text-primary)' }}
              />
              <button
                onClick={handleAISearch}
                disabled={aiSearching || !aiQuery.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all"
                style={{ background: 'rgba(196,154,61,0.12)', color: '#d4ad4a', opacity: aiSearching ? 0.6 : 1 }}
              >
                {aiSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              </button>
            </div>
            {aiResults.length > 0 && (
              <div className="max-h-72 overflow-y-auto rounded-lg scrollbar-none" style={{ border: '1px solid var(--border-light)' }}>
                {aiResults.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleSelectHadith(h)}
                    className="w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer"
                    style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(196,154,61,0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles size={12} className="mt-1 shrink-0" style={{ color: '#d4ad4a' }} />
                      <p className="line-clamp-2 leading-relaxed">{h.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
        {view === 'categories' && !loading && tab === 'category' && (
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
