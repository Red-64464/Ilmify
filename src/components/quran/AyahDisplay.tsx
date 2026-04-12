'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Bookmark, BookmarkCheck, CheckCircle2, Circle, Share2, ChevronDown, BookOpen, Loader2, Link2, BookMarked, Languages, HelpCircle } from 'lucide-react';
import { getTafsir, SURAH_LIST } from '@/lib/api/quranApi';
import { generateTafsirFr, generateHadithSuggestions, generateVerseConnections, generateAsbabNuzul, generateWordByWord } from '@/lib/ai/groq';
import type { HadithSuggestion, WordTranslation } from '@/lib/ai/groq';

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
  translationFontSize?: number;
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
  translationFontSize = 0.875,
}: AyahDisplayProps) {
  const [localPlaying, setLocalPlaying] = useState(false);
  const audioRefEl = useRef<HTMLAudioElement | null>(null);
  const [showTafsir, setShowTafsir] = useState(false);
  const [tafsirText, setTafsirText] = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  // AI features per-verse
  const [hadithSuggestions, setHadithSuggestions] = useState<HadithSuggestion[] | null>(null);
  const [hadithLoading, setHadithLoading] = useState(false);
  const [showHadith, setShowHadith] = useState(false);
  const [wordByWord, setWordByWord] = useState<WordTranslation[] | null>(null);
  const [wordByWordLoading, setWordByWordLoading] = useState(false);
  const [showWordByWord, setShowWordByWord] = useState(false);
  const [verseConnections, setVerseConnections] = useState<{ surah: number; ayah: number; surahName: string; reason: string }[] | null>(null);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [asbabNuzul, setAsbabNuzul] = useState<string | null>(null);
  const [asbabLoading, setAsbabLoading] = useState(false);
  const [showAsbab, setShowAsbab] = useState(false);

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

  const handleHadith = useCallback(async () => {
    if (showHadith) { setShowHadith(false); return; }
    setShowHadith(true);
    if (hadithSuggestions !== null) return;
    setHadithLoading(true);
    try {
      const results = await generateHadithSuggestions(surah, ayah, arabic, translation);
      setHadithSuggestions(results);
    } catch { setHadithSuggestions([]); }
    setHadithLoading(false);
  }, [showHadith, hadithSuggestions, surah, ayah, arabic, translation]);

  const handleWordByWord = useCallback(async () => {
    if (showWordByWord) { setShowWordByWord(false); return; }
    setShowWordByWord(true);
    if (wordByWord !== null) return;
    setWordByWordLoading(true);
    try {
      const results = await generateWordByWord(surah, ayah, arabic);
      setWordByWord(results);
    } catch { setWordByWord([]); }
    setWordByWordLoading(false);
  }, [showWordByWord, wordByWord, surah, ayah, arabic]);

  const handleConnections = useCallback(async () => {
    if (showConnections) { setShowConnections(false); return; }
    setShowConnections(true);
    if (verseConnections !== null) return;
    setConnectionsLoading(true);
    try {
      const results = await generateVerseConnections(surah, ayah, arabic, translation);
      setVerseConnections(results);
    } catch { setVerseConnections([]); }
    setConnectionsLoading(false);
  }, [showConnections, verseConnections, surah, ayah, arabic, translation]);

  const handleAsbab = useCallback(async () => {
    if (showAsbab) { setShowAsbab(false); return; }
    setShowAsbab(true);
    if (asbabNuzul !== null) return;
    setAsbabLoading(true);
    try {
      const result = await generateAsbabNuzul(surah, ayah, arabic, translation);
      setAsbabNuzul(result);
    } catch { setAsbabNuzul('Information non disponible.'); }
    setAsbabLoading(false);
  }, [showAsbab, asbabNuzul, surah, ayah, arabic, translation]);

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
          {/* More AI actions toggle */}
          <button
            onClick={() => setShowMoreActions(v => !v)}
            className="p-2 rounded-xl transition-colors"
            style={{
              background: showMoreActions ? 'rgba(212,173,74,0.15)' : 'var(--bg-elevated)',
              color: showMoreActions ? '#d4ad4a' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
            title="Plus d'outils IA"
          >
            <ChevronDown size={14} style={{ transform: showMoreActions ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
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
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: `${translationFontSize}rem` }}>
          {translation}
        </p>
      )}

      {/* More AI actions row */}
      <AnimatePresence>
        {showMoreActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button onClick={handleHadith} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium" style={{ background: showHadith ? 'rgba(212,173,74,0.15)' : 'var(--bg-elevated)', color: showHadith ? '#d4ad4a' : 'var(--text-muted)', cursor: 'pointer' }}>
                {hadithLoading ? <Loader2 size={10} className="animate-spin" /> : <BookMarked size={10} />} Hadiths liés
              </button>
              <button onClick={handleWordByWord} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium" style={{ background: showWordByWord ? 'rgba(46,158,140,0.15)' : 'var(--bg-elevated)', color: showWordByWord ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer' }}>
                {wordByWordLoading ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />} Mot à mot
              </button>
              <button onClick={handleConnections} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium" style={{ background: showConnections ? 'rgba(46,158,140,0.15)' : 'var(--bg-elevated)', color: showConnections ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer' }}>
                {connectionsLoading ? <Loader2 size={10} className="animate-spin" /> : <Link2 size={10} />} Versets liés
              </button>
              <button onClick={handleAsbab} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium" style={{ background: showAsbab ? 'rgba(212,173,74,0.15)' : 'var(--bg-elevated)', color: showAsbab ? '#d4ad4a' : 'var(--text-muted)', cursor: 'pointer' }}>
                {asbabLoading ? <Loader2 size={10} className="animate-spin" /> : <HelpCircle size={10} />} Asbab al-Nuzul
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Hadith suggestions */}
      <AnimatePresence>
        {showHadith && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="rounded-xl p-3 mt-1" style={{ background: 'rgba(212,173,74,0.04)', borderLeft: '3px solid #d4ad4a' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <BookMarked size={12} style={{ color: '#d4ad4a' }} />
                <span className="text-xs font-medium" style={{ color: '#d4ad4a' }}>Hadiths liés</span>
              </div>
              {hadithLoading ? (
                <div className="flex items-center gap-2 py-2"><Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Recherche de hadiths...</span></div>
              ) : hadithSuggestions && hadithSuggestions.length > 0 ? (
                <div className="space-y-2">
                  {hadithSuggestions.map((h, i) => (
                    <div key={i} className="text-xs space-y-0.5">
                      <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>« {h.text} »</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>📚 {h.source} · {h.relevance}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Aucun hadith trouvé.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word by word */}
      <AnimatePresence>
        {showWordByWord && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="rounded-xl p-3 mt-1" style={{ background: 'rgba(46,158,140,0.04)', borderLeft: '3px solid var(--accent)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Languages size={12} style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Traduction mot à mot</span>
              </div>
              {wordByWordLoading ? (
                <div className="flex items-center gap-2 py-2"><Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Analyse en cours...</span></div>
              ) : wordByWord && wordByWord.length > 0 ? (
                <div className="flex flex-wrap gap-2" style={{ direction: 'rtl' }}>
                  {wordByWord.map((w, i) => (
                    <div key={i} className="text-center rounded-lg px-2 py-1.5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', minWidth: '50px' }}>
                      <p className="font-arabic text-sm" style={{ color: '#d4ad4a' }}>{w.arabic}</p>
                      <p className="text-[9px] italic" style={{ color: 'var(--accent)' }}>{w.transliteration}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{w.meaning}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Analyse non disponible.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verse connections */}
      <AnimatePresence>
        {showConnections && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="rounded-xl p-3 mt-1" style={{ background: 'rgba(46,158,140,0.04)', borderLeft: '3px solid var(--accent)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Link2 size={12} style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Versets liés</span>
              </div>
              {connectionsLoading ? (
                <div className="flex items-center gap-2 py-2"><Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Recherche de liens...</span></div>
              ) : verseConnections && verseConnections.length > 0 ? (
                <div className="space-y-1.5">
                  {verseConnections.map((v, i) => (
                    <div key={i} className="text-xs rounded-lg p-2" style={{ background: 'var(--bg-elevated)' }}>
                      <span className="font-medium" style={{ color: '#d4ad4a' }}>{v.surahName} {v.surah}:{v.ayah}</span>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{v.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Aucune connexion trouvée.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Asbab al-Nuzul */}
      <AnimatePresence>
        {showAsbab && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="rounded-xl p-3 mt-1" style={{ background: 'rgba(212,173,74,0.04)', borderLeft: '3px solid #d4ad4a' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <HelpCircle size={12} style={{ color: '#d4ad4a' }} />
                <span className="text-xs font-medium" style={{ color: '#d4ad4a' }}>Asbab al-Nuzul (contexte de révélation)</span>
              </div>
              {asbabLoading ? (
                <div className="flex items-center gap-2 py-2"><Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Recherche du contexte...</span></div>
              ) : (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{asbabNuzul}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
