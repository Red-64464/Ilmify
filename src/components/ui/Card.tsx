'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export function Card({ children, className = '', hover = false, glow = false, onClick, padding = 'md' }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`relative bg-primary-800/60 backdrop-blur-sm border border-primary-700/40 rounded-2xl overflow-hidden
        ${hover ? 'cursor-pointer transition-shadow hover:shadow-xl hover:shadow-gold-500/5 hover:border-primary-600/60' : ''}
        ${glow ? 'shadow-lg shadow-gold-500/10' : ''}
        ${paddings[padding]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}`}
    >
      {children}
    </motion.div>
  );
}
