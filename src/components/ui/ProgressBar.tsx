'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, max = 100, color, size = 'sm', showLabel = false, className = '' }: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-primary-700/50 rounded-full overflow-hidden ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color || '#c9a84c' }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-ivory-400 font-medium min-w-[2.5rem] text-right">{percentage}%</span>
      )}
    </div>
  );
}
