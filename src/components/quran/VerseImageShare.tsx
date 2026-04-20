'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, X } from 'lucide-react';

interface VerseImageShareProps {
  surahName: string;
  surahNameAr: string;
  ayahNumber: number;
  arabic: string;
  translation: string;
  onClose: () => void;
}

const CANVAS_W = 1080;
const CANVAS_H = 1350;
const GOLD = '#d4ad4a';
const GOLD_DIM = 'rgba(212, 173, 74, 0.35)';

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function renderCard(
  canvas: HTMLCanvasElement,
  props: Omit<VerseImageShareProps, 'onClose'>,
): string {
  const { surahName, surahNameAr, ayahNumber, arabic, translation } = props;
  const ctx = canvas.getContext('2d')!;
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  // --- Background gradient ---
  const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  bg.addColorStop(0, '#0b1f1b');
  bg.addColorStop(1, '#06120f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // --- Decorative gold border (double-line) ---
  const inset = 40;
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 2;
  ctx.strokeRect(inset, inset, CANVAS_W - inset * 2, CANVAS_H - inset * 2);
  ctx.strokeStyle = 'rgba(212, 173, 74, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(inset + 10, inset + 10, CANVAS_W - (inset + 10) * 2, CANVAS_H - (inset + 10) * 2);

  // --- Corner accent dots ---
  const dotR = 5;
  const corners = [
    [inset, inset],
    [CANVAS_W - inset, inset],
    [inset, CANVAS_H - inset],
    [CANVAS_W - inset, CANVAS_H - inset],
  ] as const;
  ctx.fillStyle = GOLD;
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Top decorative line with diamond ---
  const topY = 130;
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, topY);
  ctx.lineTo(CANVAS_W / 2 - 20, topY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2 + 20, topY);
  ctx.lineTo(CANVAS_W - 200, topY);
  ctx.stroke();

  // Diamond shape at center
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2, topY - 8);
  ctx.lineTo(CANVAS_W / 2 + 8, topY);
  ctx.lineTo(CANVAS_W / 2, topY + 8);
  ctx.lineTo(CANVAS_W / 2 - 8, topY);
  ctx.closePath();
  ctx.fill();

  // --- Bismillah / Header area ---
  ctx.fillStyle = GOLD;
  ctx.font = '600 28px "Geist", "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('﷽', CANVAS_W / 2, 90);

  // --- Arabic text (RTL) ---
  const arabicMaxW = CANVAS_W - 180;
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.font = '36px "Traditional Arabic", "Amiri", "Noto Naskh Arabic", serif';
  ctx.fillStyle = '#ffffff';

  const arabicLines = wrapText(ctx, arabic, arabicMaxW);
  const arabicLineH = 64;
  const arabicStartY = 220;
  const totalArabicH = arabicLines.length * arabicLineH;

  for (let i = 0; i < arabicLines.length; i++) {
    ctx.fillText(arabicLines[i], CANVAS_W / 2, arabicStartY + i * arabicLineH);
  }

  // --- Separator line below Arabic ---
  const sepY = arabicStartY + totalArabicH + 30;
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2 - 80, sepY);
  ctx.lineTo(CANVAS_W / 2 + 80, sepY);
  ctx.stroke();

  // Three dots
  ctx.fillStyle = GOLD;
  for (const dx of [-20, 0, 20]) {
    ctx.beginPath();
    ctx.arc(CANVAS_W / 2 + dx, sepY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Translation text (LTR) ---
  ctx.direction = 'ltr';
  ctx.textAlign = 'center';
  ctx.font = '24px "Geist", "Inter", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';

  const transMaxW = CANVAS_W - 200;
  const transLines = wrapText(ctx, translation, transMaxW);
  const transLineH = 42;
  const transStartY = sepY + 50;

  for (let i = 0; i < transLines.length; i++) {
    ctx.fillText(transLines[i], CANVAS_W / 2, transStartY + i * transLineH);
  }

  // --- Bottom decorative line ---
  const bottomDecY = CANVAS_H - 180;
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, bottomDecY);
  ctx.lineTo(CANVAS_W - 200, bottomDecY);
  ctx.stroke();

  // --- Attribution ---
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '22px "Geist", "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.direction = 'ltr';
  ctx.fillText(
    `Sourate ${surahName} (${surahNameAr}) - Verset ${ayahNumber}`,
    CANVAS_W / 2,
    CANVAS_H - 130,
  );

  // --- Ilmify watermark ---
  ctx.fillStyle = GOLD;
  ctx.font = '600 26px "Geist", "Inter", system-ui, sans-serif';
  ctx.fillText('Ilmify', CANVAS_W / 2, CANVAS_H - 80);

  return canvas.toDataURL('image/png');
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const contentVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.96, y: 16, transition: { duration: 0.15 } },
};

export default function VerseImageShare({
  surahName,
  surahNameAr,
  ayahNumber,
  arabic,
  translation,
  onClose,
}: VerseImageShareProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const generate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = renderCard(canvas, {
      surahName,
      surahNameAr,
      ayahNumber,
      arabic,
      translation,
    });
    setDataUrl(url);
  }, [surahName, surahNameAr, ayahNumber, arabic, translation]);

  useEffect(() => {
    generate();
  }, [generate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `ilmify-${surahName}-v${ayahNumber}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `ilmify-${surahName}-v${ayahNumber}.png`, {
        type: 'image/png',
      });
      await navigator.share({ files: [file] });
    } catch (err: unknown) {
      // Only fallback to download on actual errors, not user cancellations
      if (err instanceof DOMException && err.name === 'AbortError') return;
      handleDownload();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        style={{
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      >
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full rounded-2xl flex flex-col"
          style={{
            maxWidth: '28rem',
            maxHeight: '85vh',
            background: 'var(--bg-elevated)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
            border: '1px solid var(--border-subtle)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-5 pt-5 pb-0 mb-4 flex items-center justify-between">
            <h2
              className="text-base font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Partager le verset
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 cursor-pointer"
              style={{
                color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.04)',
              }}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Preview */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-5">
            {/* Hidden canvas for rendering */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {dataUrl && (
              <div
                className="rounded-xl overflow-hidden mb-4"
                style={{ border: '1px solid var(--border-subtle)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dataUrl}
                  alt={`Sourate ${surahName} - Verset ${ayahNumber}`}
                  className="w-full h-auto block"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,173,74,0.15), rgba(212,173,74,0.05))',
                  border: '1px solid rgba(212,173,74,0.25)',
                  color: GOLD,
                }}
              >
                <Download size={16} />
                Télécharger
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer"
                  style={{
                    background: GOLD,
                    color: '#0b1f1b',
                  }}
                >
                  <Share2 size={16} />
                  Partager
                </button>
              )}
            </div>

            <p
              className="text-center text-xs mt-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Image optimisée pour Instagram (1080×1350)
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
