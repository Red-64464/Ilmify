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

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-500 active:bg-primary-700 shadow-lg shadow-primary-600/20',
  secondary:
    'bg-transparent border border-[var(--border-light)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
  gold: 'bg-gold-600 text-white hover:bg-gold-500 active:bg-gold-700 shadow-lg shadow-gold-600/20',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-lg',
  md: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-7 py-3.5 text-base gap-2.5 rounded-xl',
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

    return (
      <motion.button
        ref={ref}
        type={type}
        id={id}
        onClick={onClick}
        whileHover={isDisabled ? undefined : { scale: 1.02 }}
        whileTap={isDisabled ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`inline-flex items-center justify-center font-medium transition-colors duration-200 cursor-pointer
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}`}
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
