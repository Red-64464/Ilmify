'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  id?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, { className: string; style: React.CSSProperties }> = {
  primary: {
    className: 'text-white font-medium',
    style: {
      background: 'linear-gradient(135deg, #1a7a6b, #12a393)',
      boxShadow: '0 2px 12px rgba(26, 122, 107, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
    },
  },
  secondary: {
    className: 'font-medium',
    style: {
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-light)',
    },
  },
  gold: {
    className: 'text-white font-medium',
    style: {
      background: 'linear-gradient(135deg, #a88031, #c49a3d)',
      boxShadow: '0 2px 12px rgba(196, 154, 61, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
    },
  },
  ghost: {
    className: '',
    style: {
      background: 'transparent',
      color: 'var(--text-secondary)',
    },
  },
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-sm gap-1.5 rounded-lg',
  md: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-8 py-3.5 text-base gap-2.5 rounded-xl',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      iconLeft,
      iconRight,
      children,
      className = '',
      disabled,
      type = 'button',
      onClick,
      id,
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const vs = variantStyles[variant];

    return (
      <motion.button
        ref={ref}
        type={type}
        id={id}
        onClick={onClick}
        whileHover={isDisabled ? undefined : { scale: 1.02, y: -1 }}
        whileTap={isDisabled ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring' as const, stiffness: 400, damping: 17 }}
        className={`inline-flex items-center justify-center transition-all duration-200 cursor-pointer
          ${vs.className}
          ${sizeClasses[size]}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}`}
        style={vs.style}
        disabled={isDisabled}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />
        ) : (
          iconLeft
        )}
        {children}
        {!loading && iconRight}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
