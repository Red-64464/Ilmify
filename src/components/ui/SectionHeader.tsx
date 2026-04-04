'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  seeAllLabel?: string;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  seeAllHref,
  seeAllLabel = 'See all',
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-6 rounded-full"
            style={{ background: 'linear-gradient(180deg, #d4ad4a, #a88031)' }}
          />
          <h2
            className="text-lg sm:text-xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h2>
        </div>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="flex items-center gap-1 text-xs font-medium transition-colors duration-200"
            style={{ color: 'var(--text-muted)' }}
          >
            {seeAllLabel}
            <ChevronRight size={14} />
          </Link>
        )}
      </div>
      {subtitle && (
        <p className="pl-[1.375rem] text-sm" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;
