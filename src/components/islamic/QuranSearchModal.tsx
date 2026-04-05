'use client';

import React, { useState, useCallback } from 'react';
import { BookOpen, Search, Play, Pause, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { SURAH_LIST, getVerseTranslation, getArabicVerse, getAudioUrl } from '@/lib/api/quranApi';
import type { TopicBlock } from '@/types';

interface QuranSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (block: Partial<TopicBlock>) => void;
}

interface VerseResult {
  surah: number;
  ayah: number;
  arabic: string;
  translation: string;
  footnotes: string;
  audioUrl: string;
  surahName: string;
  surahNameAr: string;
}

export default function QuranSearchModal({ isOpen, onClose, onInsert }: QuranSearchModalProps) {
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedAyah, setSelectedAyah] = useState(1);
  const [surahSearch, setSurahSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerseResult | null>(null);
  const [error, setError] = useState('');
  const [playingAudio, setPlayingAudio] = useState(false);
  const [audioRef] = useState<{ current: HTMLAudioElement | null }>({ current: null });

  const surahInfo = SURAH_LIST[selectedSurah - 1];

  const filteredSurahs = surahSearch
    ? SURAH_LIST.filter(
        (s) =>
          s.name.toLowerCase().includes(surahSearch.toLowerCase()) ||
          s.nameAr.includes(surahSearch) ||
          String(s.number).includes(surahSearch)
      )
    : SURAH_LIST;

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const [translationData, arabicText] = await Promise.all([
        getVerseTranslation(selectedSurah, selectedAyah),
        getArabicVerse(selectedSurah, selectedAyah),
      ]);

      const surah = SURAH_LIST[selectedSurah - 1];
      setResult({
        surah: selectedSurah,
        ayah: selectedAyah,
        arabic: arabicText,
        translation: translationData.translation,
        footnotes: translationData.footnotes || '',
        audioUrl: getAudioUrl(selectedSurah, selectedAyah),
        surahName: surah.name,
        surahNameAr: surah.nameAr,
      });
    } catch {
      setError('Erreur lors de la récupération du verset. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, [selectedSurah, selectedAyah]);

  const handleInsert = useCallback(() => {
    if (!result) return;
    onInsert({
      type: 'verse',
      content: result.translation,
      metadata: {
        arabic: result.arabic,
        source: `Sourate ${result.surahName} (${result.surahNameAr}), Verset ${result.ayah}`,
        surah: String(result.surah),
        ayah: String(result.ayah),
        audioUrl: result.audioUrl,
        footnotes: result.footnotes,
        provider: 'quranenc',
      },
    });
    onClose();
    setResult(null);
  }, [result, onInsert, onClose]);

  const toggleAudio = useCallback(() => {
    if (!result) return;
    if (audioRef.current) {
      if (playingAudio) {
        audioRef.current.pause();
        setPlayingAudio(false);
      } else {
        audioRef.current.play();
        setPlayingAudio(true);
      }
    } else {
      const audio = new Audio(result.audioUrl);
      audioRef.current = audio;
      audio.onended = () => setPlayingAudio(false);
      audio.play();
      setPlayingAudio(true);
    }
  }, [result, playingAudio, audioRef]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rechercher un verset" maxWidth="36rem">
      <div className="space-y-4">
        {/* Surah selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Sourate
          </label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Rechercher une sourate..."
              value={surahSearch}
              onChange={(e) => setSurahSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div
            className="max-h-40 overflow-y-auto rounded-lg scrollbar-none"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-light)' }}
          >
            {filteredSurahs.map((s) => (
              <button
                key={s.number}
                onClick={() => {
                  setSelectedSurah(s.number);
                  setSelectedAyah(1);
                  setSurahSearch('');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors cursor-pointer"
                style={{
                  background: selectedSurah === s.number ? 'rgba(212, 173, 74, 0.1)' : 'transparent',
                  color: selectedSurah === s.number ? '#d4ad4a' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (selectedSurah !== s.number) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
                onMouseLeave={(e) => {
                  if (selectedSurah !== s.number) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span className="w-8 text-right text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {s.number}
                </span>
                <span className="flex-1 text-left">{s.name}</span>
                <span className="font-arabic text-base" dir="rtl">{s.nameAr}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {s.ayahCount} v.
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Ayah selector */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Verset n°
            </label>
            <input
              type="number"
              min={1}
              max={surahInfo?.ayahCount || 1}
              value={selectedAyah}
              onChange={(e) => setSelectedAyah(Math.max(1, Math.min(surahInfo?.ayahCount || 1, Number(e.target.value))))}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none mt-1"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div className="pt-5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              / {surahInfo?.ayahCount || 0} versets
            </span>
          </div>
        </div>

        {/* Search button */}
        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          style={{
            background: 'rgba(212, 173, 74, 0.15)',
            color: '#d4ad4a',
            border: '1px solid rgba(212, 173, 74, 0.25)',
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? 'Chargement...' : 'Chercher le verset'}
        </button>

        {/* Error */}
        {error && (
          <p className="text-sm text-center" style={{ color: '#f87171' }}>{error}</p>
        )}

        {/* Result preview */}
        {result && (
          <div
            className="rounded-xl p-4 space-y-3 max-h-[60vh] overflow-y-auto scrollbar-none"
            style={{
              background: 'rgba(196, 154, 61, 0.06)',
              borderLeft: '3px solid #d4ad4a',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BookOpen size={14} style={{ color: '#d4ad4a' }} />
                <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#d4ad4a' }}>
                  Verset
                </span>
              </div>
              <button
                onClick={toggleAudio}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                style={{ background: 'rgba(212, 173, 74, 0.15)', color: '#d4ad4a' }}
              >
                {playingAudio ? <Pause size={12} /> : <Play size={12} />}
                {playingAudio ? 'Pause' : 'Écouter'}
              </button>
            </div>

            {result.arabic && (
              <p className="text-lg font-arabic text-right leading-[2.2]" style={{ color: '#d4ad4a' }} dir="rtl">
                {result.arabic}
              </p>
            )}

            <p className="text-sm leading-[1.9]" style={{ color: 'var(--text-primary)' }}>
              {result.translation}
            </p>

            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              — Sourate {result.surahName} ({result.surahNameAr}), Verset {result.ayah}
            </p>

            {/* Insert button */}
            <button
              onClick={handleInsert}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer sticky bottom-0"
              style={{
                background: 'var(--accent)',
                color: 'white',
              }}
            >
              Insérer ce verset
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
