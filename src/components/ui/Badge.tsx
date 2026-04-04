'use client';

import React from 'react';

type BadgeVariant = 'default' | 'green' | 'gold' | 'teal' | 'red' | 'blue';
type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'ref'> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' },
  green: { background: 'rgba(26, 122, 107, 0.12)', color: '#5fbfae' },
  gold: { background: 'rgba(196, 154, 61, 0.12)', color: '#d4ad4a' },
  teal: { background: 'rgba(18, 163, 147, 0.12)', color: '#56e2cc' },
  red: { background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' },
  blue: { background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' },
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-0.5 text-[11px]',
  md: 'px-3 py-1 text-xs',
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'sm', className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center font-medium rounded-full whitespace-nowrap tracking-wide
          ${sizeClasses[size]}
          ${className}`}
        style={variantStyles[variant]}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
