'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import Button from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center justify-center py-20 px-6 text-center ${className}`}
    >
      <div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <Icon size={28} style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3
        className="mb-2 text-lg font-semibold tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      <p
        className="mb-6 max-w-xs text-sm leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;
