'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Monitor, Share, MoreVertical, Plus, Download, ChevronRight, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'ilmify-install-shown';

type Platform = 'iphone' | 'android' | 'desktop';

interface InstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const contentVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 280, damping: 24 },
  },
  exit: { opacity: 0, scale: 0.96, y: 20, transition: { duration: 0.15 } },
};

const platforms: { id: Platform; label: string; icon: React.ReactNode }[] = [
  { id: 'iphone', label: 'iPhone', icon: <Smartphone size={16} /> },
  { id: 'android', label: 'Android', icon: <Smartphone size={16} /> },
  { id: 'desktop', label: 'PC / Mac', icon: <Monitor size={16} /> },
];

function StepNumber({ n }: { n: number }) {
  return (
    <div
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
      style={{ background: 'rgba(46,158,140,0.15)', color: 'var(--accent)' }}
    >
      {n}
    </div>
  );
}

function IPhoneSteps() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <StepNumber n={1} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Ouvrez Ilmify dans <strong>Safari</strong>
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            L&apos;installation ne fonctionne que depuis Safari sur iPhone.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <StepNumber n={2} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Appuyez sur le bouton <strong>Partager</strong>
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'rgba(59,130,246,0.12)' }}
            >
              <Share size={14} style={{ color: '#3b82f6' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              (icône en bas de l&apos;écran)
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <StepNumber n={3} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Sélectionnez <strong>&quot;Sur l&apos;écran d&apos;accueil&quot;</strong>
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'rgba(46,158,140,0.12)' }}
            >
              <Plus size={14} style={{ color: 'var(--accent)' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Faites défiler les options si nécessaire
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <StepNumber n={4} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Appuyez sur <strong>&quot;Ajouter&quot;</strong>
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Ilmify apparaîtra comme une application sur votre écran d&apos;accueil.
          </p>
        </div>
      </div>
    </div>
  );
}

function AndroidSteps() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <StepNumber n={1} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Ouvrez Ilmify dans <strong>Chrome</strong>
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            L&apos;installation fonctionne mieux depuis Chrome sur Android.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <StepNumber n={2} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Appuyez sur le menu <strong>⋮</strong>
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <MoreVertical size={14} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              (3 points en haut à droite)
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <StepNumber n={3} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Sélectionnez <strong>&quot;Installer l&apos;application&quot;</strong>
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'rgba(46,158,140,0.12)' }}
            >
              <Download size={14} style={{ color: 'var(--accent)' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ou &quot;Ajouter à l&apos;écran d&apos;accueil&quot;
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <StepNumber n={4} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Confirmez l&apos;installation
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            L&apos;appli sera ajoutée à votre écran d&apos;accueil automatiquement.
          </p>
        </div>
      </div>
    </div>
  );
}

function DesktopSteps() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <StepNumber n={1} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Ouvrez Ilmify dans <strong>Chrome</strong> ou <strong>Edge</strong>
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Firefox ne supporte pas l&apos;installation PWA sur bureau.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <StepNumber n={2} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Cliquez sur l&apos;icône d&apos;installation
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'rgba(46,158,140,0.12)' }}
            >
              <Download size={14} style={{ color: 'var(--accent)' }} />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              dans la barre d&apos;adresse (à droite)
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <StepNumber n={3} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Cliquez sur <strong>&quot;Installer&quot;</strong>
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Ilmify s&apos;ouvrira dans sa propre fenêtre, comme une app native.
          </p>
        </div>
      </div>
    </div>
  );
}

export function useInstallGuide() {
  const [showGuide, setShowGuide] = useState(false);

  // Auto-show once on first session
  useEffect(() => {
    // Already in standalone mode = already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    try {
      const shown = localStorage.getItem(STORAGE_KEY);
      if (!shown) {
        // Small delay so the app has time to render first
        const timer = setTimeout(() => setShowGuide(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const openGuide = useCallback(() => setShowGuide(true), []);

  const closeGuide = useCallback(() => {
    setShowGuide(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // localStorage unavailable
    }
  }, []);

  return { showGuide, openGuide, closeGuide };
}

export default function InstallGuide({ isOpen, onClose }: InstallGuideProps) {
  // Auto-detect platform once (SSR-guarded lazy init); user can still switch tabs.
  const [platform, setPlatform] = useState<Platform>(() => {
    if (typeof navigator === 'undefined') return 'iphone';
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'iphone';
    if (/android/.test(ua)) return 'android';
    return 'desktop';
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
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
            className="relative w-full rounded-t-2xl sm:rounded-2xl flex flex-col"
            style={{
              maxWidth: '32rem',
              maxHeight: 'min(90vh, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)))',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle on mobile */}
            <div className="sm:hidden flex justify-center pt-2 pb-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Header */}
            <div className="shrink-0 px-6 pt-4 sm:pt-6 pb-0 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Installer Ilmify
                  </h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Accédez à Ilmify en un clic, comme une vraie application.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 cursor-pointer"
                  style={{
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.04)',
                  }}
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-6">
              {/* Why install */}
              <div
                className="rounded-xl p-3.5 mb-5"
                style={{
                  background: 'rgba(46,158,140,0.06)',
                  border: '1px solid rgba(46,158,140,0.12)',
                }}
              >
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--accent)' }}>Pourquoi installer ?</strong>{' '}
                  L&apos;app installée se lance instantanément, fonctionne en plein écran,
                  et offre une meilleure expérience que le navigateur.
                </p>
              </div>

              {/* Platform Tabs */}
              <div className="flex gap-2 mb-5">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer"
                    style={{
                      background: platform === p.id ? 'rgba(46,158,140,0.12)' : 'rgba(255,255,255,0.04)',
                      color: platform === p.id ? 'var(--accent)' : 'var(--text-muted)',
                      border: platform === p.id ? '1px solid rgba(46,158,140,0.25)' : '1px solid transparent',
                    }}
                  >
                    {p.icon}
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Steps */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={platform}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {platform === 'iphone' && <IPhoneSteps />}
                  {platform === 'android' && <AndroidSteps />}
                  {platform === 'desktop' && <DesktopSteps />}
                </motion.div>
              </AnimatePresence>

              {/* Already installed hint */}
              <div
                className="mt-5 rounded-xl p-3 flex items-start gap-2.5"
                style={{
                  background: 'rgba(196,154,61,0.06)',
                  border: '1px solid rgba(196,154,61,0.1)',
                }}
              >
                <ChevronRight size={14} className="mt-0.5 shrink-0" style={{ color: '#d4ad4a' }} />
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Si vous avez déjà installé l&apos;app, vous pouvez fermer ce guide.
                  Vous pourrez toujours le retrouver dans votre <strong>Profil</strong>.
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="w-full mt-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #1a7a6b, #12a393)',
                  color: '#fff',
                  boxShadow: '0 2px 12px rgba(26, 122, 107, 0.3)',
                }}
              >
                J&apos;ai compris
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
