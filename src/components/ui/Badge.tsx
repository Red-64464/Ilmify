import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'gold' | 'teal' | 'sage';
  size?: 'sm' | 'md';
  className?: string;
}

const badgeVariants = {
  default: 'bg-ilm-accent/20 text-ilm-cream',
  gold: 'bg-ilm-gold/15 text-ilm-gold',
  teal: 'bg-ilm-teal/15 text-ilm-teal',
  sage: 'bg-ilm-sage/15 text-ilm-sage',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${badgeVariants[variant]} ${badgeSizes[size]} ${className}`}>
      {children}
    </span>
  );
}
