'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RefreshCw,
  Volume2,
  Gauge,
  Repeat,
  ChevronDown,
  ChevronUp,
  Moon,
  FastForward,
} from 'lucide-react';

interface QuranAudioPlayerProps {
  audioUrls: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onProgress?: (progress: number) => void;
  autoPlay?: boolean;
  surahNumber?: number;
  onNextSurah?: () => void;
  onListenOnlyToggle?: (active: boolean) => void;
  isListenOnly?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5];

export default function QuranAudioPlayer({
  audioUrls,
  currentIndex,
  onIndexChange,
  onProgress,
  autoPlay = false,
  onNextSurah,
  onListenOnlyToggle,
  isListenOnly = false,
}: QuranAudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoContinue, setAutoContinue] = useState(false);

  // Repeat range
  const [repeatRange, setRepeatRange] = useState(false);
  const [repeatStart, setRepeatStart] = useState(1);
  const [repeatEnd, setRepeatEnd] = useState(Math.min(5, audioUrls.length));
  const [repeatCount, setRepeatCount] = useState(3);
  const repeatLoopRef = useRef(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadedRef = useRef<Map<number, HTMLAudioElement>>(new Map());

  // Preload next 3 verses
  const preloadAudio = useCallback((fromIndex: number) => {
    for (let i = fromIndex + 1; i <= Math.min(fromIndex + 3, audioUrls.length - 1); i++) {
      if (!preloadedRef.current.has(i) && audioUrls[i]) {
        const preAudio = new Audio();
        preAudio.preload = 'auto';
        preAudio.src = audioUrls[i];
        preloadedRef.current.set(i, preAudio);
      }
    }
  }, [audioUrls]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const url = audioUrls[currentIndex];
    if (!url) return;

    audio.src = url;
    audio.playbackRate = speed;
    setProgress(0);
    onProgress?.(0);
    if (playing || autoPlay) {
      audio.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
    preloadAudio(currentIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, audioUrls]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        setProgress(pct);
        onProgress?.(pct);
      }
    };
    const handleEnded = () => {
      if (loop) {
        audio.currentTime = 0;
        audio.play();
        return;
      }

      // Repeat range mode
      if (repeatRange) {
        const rangeStartIdx = repeatStart - 1;
        const rangeEndIdx = repeatEnd - 1;
        if (currentIndex < rangeEndIdx) {
          onIndexChange(currentIndex + 1);
        } else {
          repeatLoopRef.current += 1;
          if (repeatLoopRef.current < repeatCount) {
            onIndexChange(rangeStartIdx);
          } else {
            repeatLoopRef.current = 0;
            setPlaying(false);
          }
        }
        return;
      }

      // Normal progression
      if (currentIndex < audioUrls.length - 1) {
        onIndexChange(currentIndex + 1);
      } else if (autoContinue && onNextSurah) {
        onNextSurah();
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
  }, [loop, currentIndex, audioUrls.length, repeatRange, repeatStart, repeatEnd, repeatCount, autoContinue]);

  // Apply speed changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src && audioUrls[currentIndex]) {
      audio.src = audioUrls[currentIndex];
      audio.playbackRate = speed;
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

  const cycleSpeed = () => {
    const idx = SPEED_OPTIONS.indexOf(speed);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setSpeed(next);
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
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 size={14} style={{ color: '#d4ad4a' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Verset {currentIndex + 1} / {audioUrls.length}
          </span>
          {repeatRange && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(212,173,74,0.15)', color: '#d4ad4a' }}>
              🔁 {repeatStart}-{repeatEnd} ×{repeatCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Speed button */}
          <button
            onClick={cycleSpeed}
            className="px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
            style={{
              background: speed !== 1 ? 'rgba(212,173,74,0.15)' : 'var(--bg-elevated)',
              color: speed !== 1 ? '#d4ad4a' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
            title="Vitesse de lecture"
          >
            {speed}x
          </button>
          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="p-1.5 rounded-lg transition-colors"
            style={{
              background: showAdvanced ? 'rgba(46,158,140,0.15)' : 'var(--bg-elevated)',
              color: showAdvanced ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
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
          title="Répéter ce verset"
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

        {/* Listen-only mode */}
        <button
          onClick={() => onListenOnlyToggle?.(!isListenOnly)}
          className="p-2 rounded-xl transition-colors"
          style={{
            background: isListenOnly ? 'rgba(46,158,140,0.15)' : 'var(--bg-elevated)',
            color: isListenOnly ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
          title="Mode écoute seule"
        >
          <Moon size={14} />
        </button>
      </div>

      {/* Advanced controls panel */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              {/* Speed slider */}
              <div className="flex items-center gap-3">
                <Gauge size={12} style={{ color: 'var(--text-muted)' }} />
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Vitesse</span>
                <div className="flex gap-1 ml-auto">
                  {SPEED_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className="px-2 py-1 rounded-md text-[10px] font-medium transition-colors"
                      style={{
                        background: speed === s ? 'rgba(212,173,74,0.2)' : 'var(--bg-elevated)',
                        color: speed === s ? '#d4ad4a' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-continue to next surah */}
              <div className="flex items-center gap-3">
                <FastForward size={12} style={{ color: 'var(--text-muted)' }} />
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Sourate suivante auto</span>
                <button
                  onClick={() => setAutoContinue(v => !v)}
                  className="ml-auto px-3 py-1 rounded-lg text-[10px] font-medium"
                  style={{
                    background: autoContinue ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: autoContinue ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {autoContinue ? 'Activé' : 'Désactivé'}
                </button>
              </div>

              {/* Repeat range */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Repeat size={12} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Répéter plage</span>
                  <button
                    onClick={() => {
                      setRepeatRange(v => !v);
                      repeatLoopRef.current = 0;
                    }}
                    className="ml-auto px-3 py-1 rounded-lg text-[10px] font-medium"
                    style={{
                      background: repeatRange ? 'rgba(212,173,74,0.2)' : 'var(--bg-elevated)',
                      color: repeatRange ? '#d4ad4a' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {repeatRange ? 'Actif' : 'Désactivé'}
                  </button>
                </div>

                {repeatRange && (
                  <div className="flex items-center gap-2 pl-5">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Du</span>
                    <input
                      type="number"
                      min={1}
                      max={audioUrls.length}
                      value={repeatStart}
                      onChange={(e) => setRepeatStart(Math.max(1, Math.min(Number(e.target.value), repeatEnd)))}
                      className="w-12 px-1.5 py-1 rounded-md text-center text-[10px] bg-transparent"
                      style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    />
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>au</span>
                    <input
                      type="number"
                      min={1}
                      max={audioUrls.length}
                      value={repeatEnd}
                      onChange={(e) => setRepeatEnd(Math.max(repeatStart, Math.min(Number(e.target.value), audioUrls.length)))}
                      className="w-12 px-1.5 py-1 rounded-md text-center text-[10px] bg-transparent"
                      style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    />
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>×</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={repeatCount}
                      onChange={(e) => setRepeatCount(Math.max(1, Number(e.target.value)))}
                      className="w-12 px-1.5 py-1 rounded-md text-center text-[10px] bg-transparent"
                      style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    />
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>fois</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
