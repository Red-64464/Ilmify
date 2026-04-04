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
      className="sticky top-0 z-30 -mx-4 mb-6 px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      style={{
        background: 'rgba(13, 17, 23, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-3">
        {backButton && (
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            aria-label="Go back"
          >
            <ArrowLeft size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1
            className="text-lg font-semibold truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-sm truncate mt-0.5"
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
