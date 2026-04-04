import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'gold' | 'teal' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}

const badgeVariants = {
  default: 'bg-primary-700/60 text-ivory-300 border-primary-600/40',
  gold: 'bg-gold-500/15 text-gold-400 border-gold-500/30',
  teal: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  error: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full border
      ${badgeVariants[variant]} ${badgeSizes[size]} ${className}`}>
      {children}
    </span>
  );
}
