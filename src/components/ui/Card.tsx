'use client';

import React from 'react';
import { motion } from 'framer-motion';

type GlowColor = 'green' | 'gold' | 'teal' | 'none';

export interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  glowColor?: GlowColor;
  className?: string;
  onClick?: () => void;
  id?: string;
  variant?: 'default' | 'elevated' | 'inset';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      hoverable = true,
      glowColor = 'none',
      className = '',
      onClick,
      id,
      variant = 'default',
    },
    ref
  ) => {
    const bgMap = {
      default: 'var(--bg-card)',
      elevated: 'var(--bg-elevated)',
      inset: 'var(--bg-secondary)',
    };

    const glowShadow: Record<GlowColor, string | undefined> = {
      green: 'var(--shadow-glow-green)',
      gold: 'var(--shadow-glow-gold)',
      teal: 'var(--shadow-glow-green)',
      none: undefined,
    };

    return (
      <motion.div
        ref={ref}
        id={id}
        whileHover={hoverable ? { y: -2, scale: 1.005 } : undefined}
        transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
        onClick={onClick}
        className={`rounded-2xl transition-all duration-300
          ${onClick ? 'cursor-pointer' : ''}
          ${className}`}
        style={{
          background: bgMap[variant],
          boxShadow: hoverable && glowColor !== 'none'
            ? `var(--shadow-card), ${glowShadow[glowColor]}`
            : 'var(--shadow-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
