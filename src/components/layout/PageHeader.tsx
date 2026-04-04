'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backButton?: boolean;
  rightAction?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  backButton,
  rightAction,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-30 -mx-5 mb-8 px-5 py-5 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10"
      style={{
        background: 'rgba(6, 18, 15, 0.85)',
        backdropFilter: 'blur(20px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-3">
        {backButton && (
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer"
            style={{
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-card)',
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1
            className="text-lg font-semibold tracking-tight truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-sm truncate mt-0.5 font-arabic"
              style={{ color: 'var(--text-muted)' }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {rightAction && <div className="shrink-0">{rightAction}</div>}
      </div>
    </header>
  );
}
