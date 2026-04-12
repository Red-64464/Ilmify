'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bookmark, Trash2, Play, ChevronLeft, Pencil, Check, X } from 'lucide-react';
import { SURAH_LIST, getAudioUrl, getVerseTranslation, getArabicVerse } from '@/lib/api/quranApi';
import { useQuranBookmarks, useQuranSettings } from '@/lib/quranStorage';
import type { QuranBookmark } from '@/types';

const CATEGORIES: { id: QuranBookmark['category'] | 'all'; label: string; emoji: string }[] = [
  { id: 'all', label: 'Tous', emoji: '📚' },
  { id: 'favorite', label: 'Favoris', emoji: '⭐' },
  { id: 'dua', label: "Du'a", emoji: '🤲' },
  { id: 'revision', label: 'Révision', emoji: '📖' },
  { id: 'important', label: 'Important', emoji: '🔖' },
];

interface VerseData {
  arabic: string;
  translation: string;
}

export default function BookmarksPage() {
  const { bookmarks, removeBookmark, updateBookmarkNote, updateBookmarkCategory } = useQuranBookmarks();
  const { settings } = useQuranSettings();
  const router = useRouter();
  const [filter, setFilter] = useState<QuranBookmark['category'] | 'all'>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [verseCache, setVerseCache] = useState<Record<string, VerseData>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  // Fetch Arabic text and translation for bookmarked verses (batched with concurrency limit)
  useEffect(() => {
    const pending = bookmarks.filter((bm) => !verseCache[`${bm.surahNumber}:${bm.ayahNumber}`]);
    if (pending.length === 0) return;

    let cancelled = false;
    // Process in batches of 5 to avoid overwhelming the API
    const BATCH_SIZE = 5;
    (async () => {
      for (let i = 0; i < pending.length; i += BATCH_SIZE) {
        if (cancelled) break;
        const batch = pending.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (bm) => {
            const [translationData, arabic] = await Promise.all([
              getVerseTranslation(bm.surahNumber, bm.ayahNumber),
              getArabicVerse(bm.surahNumber, bm.ayahNumber),
            ]);
            return {
              key: `${bm.surahNumber}:${bm.ayahNumber}`,
              arabic,
              translation: translationData.translation,
            };
          })
        );
        if (cancelled) break;
        const newEntries: Record<string, VerseData> = {};
        for (const r of results) {
          if (r.status === 'fulfilled') {
            newEntries[r.value.key] = { arabic: r.value.arabic, translation: r.value.translation };
          }
        }
        if (Object.keys(newEntries).length > 0) {
          setVerseCache((prev) => ({ ...prev, ...newEntries }));
        }
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarks]);

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

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback((surahNumber: number, ayahNumber: number) => {
    const id = `${surahNumber}:${ayahNumber}`;
    // Stop previous audio to prevent memory leak
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    const audio = new Audio(getAudioUrl(surahNumber, ayahNumber, settings.reciterId));
    audioRef.current = audio;
    audio.play();
    setPlayingId(id);
    audio.onended = () => {
      setPlayingId(null);
      audioRef.current = null;
    };
  }, [settings.reciterId]);

  const startEditNote = (bm: QuranBookmark) => {
    const id = `${bm.surahNumber}:${bm.ayahNumber}`;
    setEditingNote(id);
    setNoteText(bm.note || '');
  };

  const saveNote = (surahNumber: number, ayahNumber: number) => {
    updateBookmarkNote(surahNumber, ayahNumber, noteText);
    setEditingNote(null);
    setNoteText('');
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 sticky top-0 z-30"
        style={{ background: 'rgba(6,18,15,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <button
          onClick={() => { router.push('/quran'); }}
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
              onClick={() => { router.push('/quran'); }}
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
                  onClick={() => { router.push(`/quran/${surahNum}`); }}
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
                    const verse = verseCache[pid];
                    const isEditing = editingNote === pid;
                    const isEditingCat = editingCategory === pid;

                    return (
                      <motion.div
                        key={bm.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-4 space-y-2"
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
                            {isEditingCat ? (
                              <div className="flex gap-1 flex-wrap">
                                {CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                                  <button
                                    key={cat.id}
                                    onClick={() => {
                                      updateBookmarkCategory(bm.surahNumber, bm.ayahNumber, cat.id as QuranBookmark['category']);
                                      setEditingCategory(null);
                                    }}
                                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                                    style={{
                                      background: bm.category === cat.id ? 'rgba(46,158,140,0.2)' : 'var(--bg-elevated)',
                                      color: bm.category === cat.id ? 'var(--accent)' : 'var(--text-muted)',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {cat.emoji}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingCategory(pid)}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: 'rgba(46,158,140,0.1)',
                                  color: 'var(--accent)',
                                  cursor: 'pointer',
                                }}
                              >
                                {CATEGORIES.find((c) => c.id === bm.category)?.emoji}{' '}
                                {CATEGORIES.find((c) => c.id === bm.category)?.label}
                              </button>
                            )}
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
                              onClick={() => startEditNote(bm)}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                              }}
                              title="Modifier la note"
                            >
                              <Pencil size={12} />
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

                        {/* Arabic text */}
                        {verse?.arabic && (
                          <p
                            className="font-arabic text-lg leading-loose text-right"
                            style={{ color: '#d4ad4a', direction: 'rtl', lineHeight: '2' }}
                          >
                            {verse.arabic}
                          </p>
                        )}

                        {/* Translation */}
                        {verse?.translation && (
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {verse.translation}
                          </p>
                        )}

                        {/* Note section */}
                        {isEditing ? (
                          <div className="flex gap-2 items-start">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Ajouter une note..."
                              rows={2}
                              className="flex-1 text-xs rounded-lg px-3 py-2 outline-none resize-none"
                              style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                              autoFocus
                            />
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => saveNote(bm.surahNumber, bm.ayahNumber)}
                                className="p-1.5 rounded-lg"
                                style={{ background: 'rgba(58,170,96,0.15)', color: '#3aaa60', cursor: 'pointer' }}
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => setEditingNote(null)}
                                className="p-1.5 rounded-lg"
                                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'pointer' }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ) : bm.note ? (
                          <p
                            className="text-xs italic px-2 py-1.5 rounded-lg"
                            style={{ color: 'var(--text-muted)', background: 'rgba(212,173,74,0.05)', borderLeft: '2px solid rgba(212,173,74,0.3)' }}
                          >
                            📝 {bm.note}
                          </p>
                        ) : null}

                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
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
