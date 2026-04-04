'use client';

import React from 'react';

type SkeletonVariant = 'text' | 'card' | 'circle' | 'rectangle';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

const variantStyles: Record<SkeletonVariant, { className: string; defaultStyle: React.CSSProperties }> = {
  text: {
    className: 'rounded-md',
    defaultStyle: { width: '100%', height: '1rem' },
  },
  card: {
    className: 'rounded-2xl',
    defaultStyle: { width: '100%', height: '12rem' },
  },
  circle: {
    className: 'rounded-full',
    defaultStyle: { width: '3rem', height: '3rem' },
  },
  rectangle: {
    className: 'rounded-xl',
    defaultStyle: { width: '100%', height: '6rem' },
  },
};

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}) => {
  const { className: variantClass, defaultStyle } = variantStyles[variant];
  const style: React.CSSProperties = {
    ...defaultStyle,
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
  };

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`skeleton ${variantClass} ${className}`}
      style={style}
      aria-hidden="true"
    />
  ));

  if (count === 1) return items[0];

  return <div className="space-y-3">{items}</div>;
};

export default Skeleton;
