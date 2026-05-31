'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const SPLASH_DURATION = 3000; // ms

// Particles flottantes dorées
function GoldParticle({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: 3,
        height: 3,
        background: 'radial-gradient(circle, #d4ad4a, rgba(212,173,74,0))',
      }}
      initial={{ opacity: 0, scale: 0, y: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1.5, 0.5],
        y: [-20, -60],
      }}
      transition={{ duration: 2.5, delay, ease: 'easeOut', repeat: Infinity, repeatDelay: 1 }}
    />
  );
}

const PARTICLES = [
  { x: 20, y: 70, d: 0.2 }, { x: 35, y: 80, d: 0.6 }, { x: 50, y: 75, d: 0.1 },
  { x: 65, y: 80, d: 0.9 }, { x: 80, y: 70, d: 0.4 }, { x: 15, y: 50, d: 1.2 },
  { x: 85, y: 55, d: 0.7 }, { x: 40, y: 90, d: 1.5 }, { x: 70, y: 88, d: 0.3 },
  { x: 25, y: 85, d: 1.1 }, { x: 60, y: 92, d: 0.8 }, { x: 75, y: 45, d: 1.4 },
];

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), SPLASH_DURATION - 700);
    const done = setTimeout(onDone, SPLASH_DURATION);
    return () => { clearTimeout(timer); clearTimeout(done); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {!exiting ? (
        // Écran principal
        <motion.div
          key="splash"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
          style={{ background: 'linear-gradient(145deg, #06120f 0%, #0c2420 50%, #061a14 100%)' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Pattern géométrique de fond */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(
                60deg,
                #d4ad4a 0px, #d4ad4a 1px,
                transparent 1px, transparent 60px
              ), repeating-linear-gradient(
                -60deg,
                #d4ad4a 0px, #d4ad4a 1px,
                transparent 1px, transparent 60px
              )`,
            }}
          />

          {/* Lueur centrale */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: '60vmax',
              height: '60vmax',
              background: 'radial-gradient(ellipse at center, rgba(46,158,140,0.12) 0%, rgba(6,18,15,0) 70%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Particles dorées */}
          {PARTICLES.map((p, i) => (
            <GoldParticle key={i} x={p.x} y={p.y} delay={p.d} />
          ))}

          {/* Contenu principal */}
          <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8">
            {/* Cercle doré derrière le logo */}
            <motion.div
              className="relative"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* Anneau doré extérieur pulsant */}
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                  inset: -12,
                  border: '1px solid rgba(212,173,74,0.25)',
                  borderRadius: '50%',
                }}
                animate={{ scale: [1, 1.06, 1], opacity: [0.25, 0.5, 0.25] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                  inset: -24,
                  border: '1px solid rgba(212,173,74,0.10)',
                  borderRadius: '50%',
                }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: 2.5, delay: 0.3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Logo container */}
              <motion.div
                className="relative flex items-center justify-center"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 40% 35%, rgba(46,158,140,0.3), rgba(6,18,15,0.9))',
                  boxShadow: '0 0 40px rgba(46,158,140,0.2), 0 0 80px rgba(212,173,74,0.1)',
                }}
              >
                {/* Logo taille mobile et desktop */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                  <Image
                    src="/logo.png"
                    alt="Ilmify"
                    fill
                    className="object-contain drop-shadow-lg"
                    priority
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Texte Ilmify */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.h1
                style={{
                  fontFamily: 'var(--font-playfair), Playfair Display, Georgia, serif',
                  fontSize: 'clamp(2rem, 7vw, 3.2rem)',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  background: 'linear-gradient(135deg, #d4ad4a 0%, #f0d080 45%, #b8902a 80%, #d4ad4a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.1,
                }}
              >
                Ilmify
              </motion.h1>

              <motion.p
                style={{
                  color: 'rgba(212,173,74,0.55)',
                  fontSize: 'clamp(0.65rem, 2vw, 0.8rem)',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                Votre espace de savoir islamique
              </motion.p>
            </motion.div>

            {/* Barre de progression — desktop */}
            <motion.div
              className="hidden sm:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.4 }}
            >
              <div
                style={{
                  width: '140px',
                  height: '2px',
                  background: 'rgba(212,173,74,0.12)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #2e9e8c, #d4ad4a)',
                    borderRadius: '2px',
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: (SPLASH_DURATION - 1200) / 1000, delay: 1.1, ease: 'linear' }}
                />
              </div>
            </motion.div>

            {/* Points animés — mobile uniquement */}
            <motion.div
              className="flex sm:hidden gap-1.5 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#d4ad4a' }}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </motion.div>
          </div>

          {/* Ornement bas */}
          <motion.div
            className="absolute bottom-8 flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.5 }}
          >
            <div style={{ width: 24, height: 1, background: 'rgba(212,173,74,0.3)' }} />
            <span style={{ color: 'rgba(212,173,74,0.4)', fontSize: '0.6rem', letterSpacing: '0.2em' }}>
              ﷽
            </span>
            <div style={{ width: 24, height: 1, background: 'rgba(212,173,74,0.3)' }} />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
