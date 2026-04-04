'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, glow = false, onClick }: CardProps) {
  const Component = hover ? motion.div : 'div';
  const hoverProps = hover ? { whileHover: { y: -2 }, whileTap: { scale: 0.98 } } : {};

  return (
    <Component
      {...hoverProps}
      onClick={onClick}
      className={`bg-ilm-card rounded-2xl border border-ilm-accent/10 p-4 transition-shadow ${hover ? 'cursor-pointer card-hover' : ''} ${glow ? 'gold-glow' : ''} ${className}`}
    >
      {children}
    </Component>
  );
}
