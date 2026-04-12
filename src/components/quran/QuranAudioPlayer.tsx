'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, RefreshCw, Volume2 } from 'lucide-react';

interface QuranAudioPlayerProps {
  audioUrls: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  autoPlay?: boolean;
}

export default function QuranAudioPlayer({
  audioUrls,
  currentIndex,
  onIndexChange,
  autoPlay = false,
}: QuranAudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const url = audioUrls[currentIndex];
    if (!url) return;

    audio.src = url;
    if (playing || autoPlay) {
      audio.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, audioUrls]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const handleEnded = () => {
      if (loop) {
        audio.play();
      } else if (currentIndex < audioUrls.length - 1) {
        onIndexChange(currentIndex + 1);
      } else {
        setPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop, currentIndex, audioUrls.length]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src && audioUrls[currentIndex]) {
      audio.src = audioUrls[currentIndex];
    }
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) onIndexChange(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < audioUrls.length - 1) onIndexChange(currentIndex + 1);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const pct = Number(e.target.value);
    audio.currentTime = (pct / 100) * audio.duration;
    setProgress(pct);
  };

  if (!audioUrls.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(212,173,74,0.15)',
        boxShadow: 'var(--shadow-glow-gold)',
      }}
    >
      <div className="flex items-center gap-2">
        <Volume2 size={14} style={{ color: '#d4ad4a' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Verset {currentIndex + 1} / {audioUrls.length}
        </span>
      </div>

      {/* Progress bar */}
      <input
        type="range"
        min={0}
        max={100}
        value={progress}
        onChange={handleSeek}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: '#d4ad4a' }}
      />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setLoop((v) => !v)}
          className="p-2 rounded-xl transition-colors"
          style={{
            background: loop ? 'rgba(212,173,74,0.15)' : 'var(--bg-elevated)',
            color: loop ? '#d4ad4a' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-xl transition-colors disabled:opacity-40"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <SkipBack size={16} />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: 'linear-gradient(135deg, #d4ad4a, #c49a3d)',
              color: '#06120f',
              cursor: 'pointer',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={playing ? 'pause' : 'play'}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {playing ? <Pause size={18} /> : <Play size={18} />}
              </motion.span>
            </AnimatePresence>
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex >= audioUrls.length - 1}
            className="p-2 rounded-xl transition-colors disabled:opacity-40"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <SkipForward size={16} />
          </button>
        </div>

        <div className="w-8" />
      </div>
    </motion.div>
  );
}
