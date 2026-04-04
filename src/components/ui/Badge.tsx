'use client';

import React from 'react';

type BadgeVariant = 'default' | 'green' | 'gold' | 'teal' | 'red' | 'blue';
type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'ref'> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-[var(--text-secondary)]',
  green: 'bg-primary-500/15 text-primary-400',
  gold: 'bg-gold-500/15 text-gold-400',
  teal: 'bg-teal-500/15 text-teal-400',
  red: 'bg-red-500/15 text-red-400',
  blue: 'bg-blue-500/15 text-blue-400',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'sm', className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center font-medium rounded-full whitespace-nowrap
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
