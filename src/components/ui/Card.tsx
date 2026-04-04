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
}

const glowClasses: Record<GlowColor, string> = {
  green: 'hover:shadow-primary-500/10 hover:border-primary-500/20',
  gold: 'hover:shadow-gold-500/10 hover:border-gold-500/20',
  teal: 'hover:shadow-teal-500/10 hover:border-teal-500/20',
  none: '',
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      hoverable = true,
      glowColor = 'none',
      className = '',
      onClick,
      id,
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        id={id}
        whileHover={hoverable ? { y: -2 } : undefined}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={onClick}
        className={`rounded-2xl border transition-all duration-300
          ${hoverable ? 'hover:shadow-xl' : ''}
          ${glowClasses[glowColor]}
          ${onClick ? 'cursor-pointer' : ''}
          ${className}`}
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
