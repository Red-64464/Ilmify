'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Bookmark, BookmarkCheck, CheckCircle2, Circle } from 'lucide-react';

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
  onPlay?: () => void;
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
  onPlay,
}: AyahDisplayProps) {
  const [localPlaying, setLocalPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playing = isPlaying || localPlaying;

  const handlePlay = () => {
    if (onPlay) {
      onPlay();
      return;
    }
    if (!audioUrl) return;
    if (audioRef.current) {
      if (localPlaying) {
        audioRef.current.pause();
        setLocalPlaying(false);
      } else {
        audioRef.current.play();
        setLocalPlaying(true);
      }
    } else {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      setLocalPlaying(true);
      audioRef.current.onended = () => setLocalPlaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Ayah number + actions row */}
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(212,173,74,0.2), rgba(212,173,74,0.08))',
            border: '1px solid rgba(212,173,74,0.25)',
            color: '#d4ad4a',
          }}
        >
          {ayah}
        </div>
        <div className="flex items-center gap-2">
          {audioUrl && (
            <button
              onClick={handlePlay}
              className="p-2 rounded-xl transition-colors"
              style={{
                background: playing ? 'rgba(46,158,140,0.15)' : 'var(--bg-elevated)',
                color: playing ? 'var(--accent)' : 'var(--text-muted)',
              }}
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
            }}
          >
            {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
          <button
            onClick={onMemorize}
            className="p-2 rounded-xl transition-colors"
            style={{
              background: isMemorized ? 'rgba(58,170,96,0.15)' : 'var(--bg-elevated)',
              color: isMemorized ? '#3aaa60' : 'var(--text-muted)',
            }}
          >
            {isMemorized ? <CheckCircle2 size={14} /> : <Circle size={14} />}
          </button>
        </div>
      </div>

      {/* Arabic text */}
      <p
        className="font-arabic text-2xl leading-loose text-right"
        style={{ color: 'var(--text-primary)', direction: 'rtl', lineHeight: '2.2' }}
      >
        {arabic}
      </p>

      {/* Transliteration */}
      {transliteration && (
        <p className="text-sm italic leading-relaxed" style={{ color: 'var(--accent)' }}>
          {transliteration}
        </p>
      )}

      {/* French translation */}
      {translation && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {translation}
        </p>
      )}
    </motion.div>
  );
}
