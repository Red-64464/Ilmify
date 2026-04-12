'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Trash2, Play, ChevronLeft } from 'lucide-react';
import { SURAH_LIST, getAudioUrl } from '@/lib/api/quranApi';
import { useQuranBookmarks } from '@/lib/quranStorage';
import type { QuranBookmark } from '@/types';
import PageHeader from '@/components/layout/PageHeader';

const CATEGORIES: { id: QuranBookmark['category'] | 'all'; label: string; emoji: string }[] = [
  { id: 'all', label: 'Tous', emoji: '📚' },
  { id: 'favorite', label: 'Favoris', emoji: '⭐' },
  { id: 'dua', label: 'Du\'a', emoji: '🤲' },
  { id: 'revision', label: 'Révision', emoji: '📖' },
  { id: 'important', label: 'Important', emoji: '🔖' },
];

export default function BookmarksPage() {
  const { bookmarks, removeBookmark } = useQuranBookmarks();
  const [filter, setFilter] = useState<QuranBookmark['category'] | 'all'>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return bookmarks;
    return bookmarks.filter((b) => b.category === filter);
  }, [bookmarks, filter]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((b) => {
      const key = `${b.surahNumber}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });
    return groups;
  }, [filtered]);

  const playAudio = (surahNumber: number, ayahNumber: number) => {
    const id = `${surahNumber}:${ayahNumber}`;
    const audio = new Audio(getAudioUrl(surahNumber, ayahNumber, 7));
    audio.play();
    setPlayingId(id);
    audio.onended = () => setPlayingId(null);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 sticky top-0 z-30"
        style={{ background: 'rgba(6,18,15,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <button
          onClick={() => { window.location.href = '/quran'; }}
          className="p-2 rounded-xl"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Versets favoris
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {bookmarks.length} verset{bookmarks.length !== 1 ? 's' : ''} sauvegardé{bookmarks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Bookmark size={18} style={{ color: '#d4ad4a' }} />
      </div>

      {/* Category filter */}
      <div className="px-4 pt-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            style={{
              background: filter === cat.id ? 'var(--accent)' : 'var(--bg-card)',
              color: filter === cat.id ? '#fff' : 'var(--text-muted)',
              border: '1px solid',
              borderColor: filter === cat.id ? 'var(--accent)' : 'var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-2 space-y-4">
        {bookmarks.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="text-4xl">📖</div>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              Aucun verset sauvegardé
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Marquez des versets comme favoris en lisant le Coran
            </p>
            <button
              onClick={() => { window.location.href = '/quran'; }}
              className="mt-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}
            >
              Lire le Coran
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
            Aucun favori dans cette catégorie
          </div>
        ) : (
          Object.entries(grouped).map(([surahNum, bmarks]) => {
            const surah = SURAH_LIST.find((s) => s.number === parseInt(surahNum, 10));
            if (!surah) return null;
            return (
              <div key={surahNum}>
                {/* Surah header */}
                <button
                  onClick={() => { window.location.href = `/quran/${surahNum}`; }}
                  className="flex items-center gap-2 mb-2 group"
                  style={{ cursor: 'pointer' }}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(212,173,74,0.15)', color: '#d4ad4a' }}
                  >
                    {surah.number}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {surah.name}
                  </span>
                  <span
                    className="font-arabic text-sm"
                    style={{ color: 'var(--text-muted)', direction: 'rtl' }}
                  >
                    {surah.nameAr}
                  </span>
                </button>

                <div className="space-y-2">
                  {bmarks.map((bm) => {
                    const pid = `${bm.surahNumber}:${bm.ayahNumber}`;
                    return (
                      <motion.div
                        key={bm.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-4"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: 'rgba(212,173,74,0.15)', color: '#d4ad4a' }}
                            >
                              {bm.ayahNumber}
                            </span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: 'rgba(46,158,140,0.1)',
                                color: 'var(--accent)',
                              }}
                            >
                              {CATEGORIES.find((c) => c.id === bm.category)?.emoji}{' '}
                              {CATEGORIES.find((c) => c.id === bm.category)?.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => playAudio(bm.surahNumber, bm.ayahNumber)}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{
                                background: playingId === pid ? 'rgba(46,158,140,0.2)' : 'var(--bg-elevated)',
                                color: playingId === pid ? 'var(--accent)' : 'var(--text-muted)',
                                cursor: 'pointer',
                              }}
                            >
                              <Play size={12} />
                            </button>
                            <button
                              onClick={() => removeBookmark(bm.surahNumber, bm.ayahNumber)}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {bm.note && (
                          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {bm.note}
                          </p>
                        )}
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                          Ajouté le {new Date(bm.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
