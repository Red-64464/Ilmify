'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Bookmark, BookmarkCheck, CheckCircle2, Circle, Share2, ChevronDown, BookOpen, Loader2 } from 'lucide-react';
import { getTafsir, SURAH_LIST } from '@/lib/api/quranApi';
import { generateTafsirFr } from '@/lib/ai/groq';

interface AyahDisplayProps {
  surah: number;
  ayah: number;
  arabic: string;
  transliteration: string;
  translation: string;
  audioUrl?: string;
  isBookmarked?: boolean;
  isMemorized?: boolean;
  onBookmark?: () => void;
  onMemorize?: () => void;
  isPlaying?: boolean;
  playProgress?: number;
  onPlay?: () => void;
  arabicFontSize?: number;
  showTransliteration?: boolean;
  tafsirLang?: 'fr' | 'en';
  ayahRef?: (el: HTMLDivElement | null) => void;
}

export default function AyahDisplay({
  surah,
  ayah,
  arabic,
  transliteration,
  translation,
  audioUrl,
  isBookmarked = false,
  isMemorized = false,
  onBookmark,
  onMemorize,
  isPlaying = false,
  playProgress,
  onPlay,
  arabicFontSize = 1.5,
  showTransliteration = true,
  tafsirLang = 'fr',
  ayahRef,
}: AyahDisplayProps) {
  const [localPlaying, setLocalPlaying] = useState(false);
  const audioRefEl = useRef<HTMLAudioElement | null>(null);
  const [showTafsir, setShowTafsir] = useState(false);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);

  const playing = isPlaying || localPlaying;

  // Word-by-word highlighting
  const arabicWords = arabic.split(' ');
  const activeWordIdx =
    isPlaying && playProgress !== undefined && playProgress > 0
      ? Math.min(
          Math.floor((playProgress / 100) * arabicWords.length),
          arabicWords.length - 1,
        )
      : -1;

  const handlePlay = () => {
    if (onPlay) {
      onPlay();
      return;
    }
    if (!audioUrl) return;
    if (audioRefEl.current) {
      if (localPlaying) {
        audioRefEl.current.pause();
        setLocalPlaying(false);
      } else {
        audioRefEl.current.play();
        setLocalPlaying(true);
      }
    } else {
      audioRefEl.current = new Audio(audioUrl);
      audioRefEl.current.play();
      setLocalPlaying(true);
      audioRefEl.current.onended = () => setLocalPlaying(false);
    }
  };

  const handleShare = async () => {
    const surahInfo = SURAH_LIST[surah - 1];
    const text = `${arabic}\n\n${translation}\n\n— ${surahInfo?.name || `Sourate ${surah}`}, Verset ${ayah}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${surahInfo?.name} - Verset ${ayah}`, text });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const handleTafsir = useCallback(async () => {
    if (showTafsir) {
      setShowTafsir(false);
      return;
    }
    setShowTafsir(true);
    if (tafsirText !== null) return;
    setTafsirLoading(true);
    try {
      let text: string;
      if (tafsirLang === 'fr') {
        text = await generateTafsirFr(surah, ayah, arabic, translation);
      } else {
        text = await getTafsir(surah, ayah);
      }
      setTafsirText(text || 'Tafsir non disponible pour ce verset.');
    } catch {
      setTafsirText('Impossible de charger le tafsir. Vérifiez votre connexion.');
    }
    setTafsirLoading(false);
  }, [showTafsir, tafsirText, surah, ayah, arabic, translation, tafsirLang]);

  return (
    <motion.div
      ref={ayahRef}
      data-ayah={ayah}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: isPlaying
          ? 'linear-gradient(135deg, rgba(212,173,74,0.08) 0%, rgba(46,158,140,0.06) 100%)'
          : 'var(--bg-card)',
        border: isPlaying
          ? '1.5px solid rgba(212,173,74,0.4)'
          : '1px solid var(--border-subtle)',
        boxShadow: isPlaying ? '0 0 18px rgba(212,173,74,0.12)' : 'none',
        transition: 'background 0.3s, border 0.3s, box-shadow 0.3s',
      }}
    >
      {/* Ayah number + actions row */}
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            background: isPlaying
              ? 'linear-gradient(135deg, rgba(212,173,74,0.35), rgba(212,173,74,0.15))'
              : 'linear-gradient(135deg, rgba(212,173,74,0.2), rgba(212,173,74,0.08))',
            border: isPlaying
              ? '1.5px solid rgba(212,173,74,0.5)'
              : '1px solid rgba(212,173,74,0.25)',
            color: '#d4ad4a',
          }}
        >
          {ayah}
        </div>
        <div className="flex items-center gap-1.5">
          {audioUrl && (
            <button
              onClick={handlePlay}
              className="p-2 rounded-xl transition-colors"
              style={{
                background: playing ? 'rgba(46,158,140,0.15)' : 'var(--bg-elevated)',
                color: playing ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title={playing ? 'Pause' : 'Écouter'}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={playing ? 'pause' : 'play'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {playing ? <Pause size={14} /> : <Play size={14} />}
                </motion.span>
              </AnimatePresence>
            </button>
          )}
          <button
            onClick={onBookmark}
            className="p-2 rounded-xl transition-colors"
            style={{
              background: isBookmarked ? 'rgba(212,173,74,0.15)' : 'var(--bg-elevated)',
              color: isBookmarked ? '#d4ad4a' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
            title={isBookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
          <button
            onClick={onMemorize}
            className="p-2 rounded-xl transition-colors"
            style={{
              background: isMemorized ? 'rgba(58,170,96,0.15)' : 'var(--bg-elevated)',
              color: isMemorized ? '#3aaa60' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
            title={isMemorized ? 'Verset mémorisé' : 'Marquer comme mémorisé'}
          >
            {isMemorized ? <CheckCircle2 size={14} /> : <Circle size={14} />}
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-xl transition-colors"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            title="Partager"
          >
            <Share2 size={14} />
          </button>
          <button
            onClick={handleTafsir}
            className="p-2 rounded-xl transition-colors"
            style={{
              background: showTafsir ? 'rgba(46,158,140,0.15)' : 'var(--bg-elevated)',
              color: showTafsir ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
            title="Tafsir"
          >
            <BookOpen size={14} />
          </button>
        </div>
      </div>

      {/* Arabic text — word-by-word highlighting when playing */}
      <p
        className="font-arabic leading-loose text-right"
        style={{
          color: 'var(--text-primary)',
          direction: 'rtl',
          lineHeight: '2.4',
          fontSize: `${arabicFontSize}rem`,
        }}
      >
        {activeWordIdx >= 0
          ? arabicWords.map((word, idx) => (
              <span
                key={idx}
                style={{
                  color: idx === activeWordIdx ? '#d4ad4a' : idx < activeWordIdx ? 'var(--text-muted)' : 'var(--text-primary)',
                  transition: 'color 0.2s',
                  display: 'inline-block',
                  marginRight: idx < arabicWords.length - 1 ? '0.25em' : 0,
                  background: idx === activeWordIdx ? 'rgba(212,173,74,0.12)' : 'transparent',
                  borderRadius: '4px',
                  padding: idx === activeWordIdx ? '0 2px' : '0',
                }}
              >
                {word}
              </span>
            ))
          : arabic}
      </p>

      {/* Transliteration */}
      {showTransliteration && transliteration && (
        <p className="text-sm italic leading-relaxed" style={{ color: 'var(--accent)' }}>
          {transliteration}
        </p>
      )}

      {/* Translation */}
      {translation && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {translation}
        </p>
      )}

      {/* Tafsir accordion */}
      <AnimatePresence>
        {showTafsir && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-xl p-3 mt-1"
              style={{ background: 'rgba(46,158,140,0.06)', borderLeft: '3px solid var(--accent)' }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen size={12} style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                  Tafsir {tafsirLang === 'fr' ? '🇫🇷' : '🇬🇧'}
                </span>
                <button onClick={() => setShowTafsir(false)} className="ml-auto p-0.5" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <ChevronDown size={12} style={{ transform: 'rotate(180deg)' }} />
                </button>
              </div>
              {tafsirLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Chargement du tafsir...</span>
                </div>
              ) : (
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {(tafsirText || '').replace(/<[^>]*>/g, '')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
