'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  action?: React.ReactNode;
  transparent?: boolean;
}

export function PageHeader({ title, subtitle, showBack = false, action, transparent = false }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className={`sticky top-0 z-30 ${transparent ? '' : 'bg-primary-900/90 backdrop-blur-xl border-b border-primary-700/20'}`}>
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl hover:bg-primary-700/50 text-ivory-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-heading font-semibold text-ivory-100 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-ivory-400 truncate">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </header>
  );
}
