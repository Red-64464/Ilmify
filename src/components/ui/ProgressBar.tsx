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
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`flex-1 rounded-full overflow-hidden ${size === 'sm' ? 'h-1.5' : 'h-2'}`}
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{
            background: color
              ? `linear-gradient(90deg, ${color}, ${color}cc)`
              : 'linear-gradient(90deg, #d4ad4a, #c49a3d)',
          }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] font-medium min-w-[2.5rem] text-right" style={{ color: 'var(--text-muted)' }}>
          {percentage}%
        </span>
      )}
    </div>
  );
}
