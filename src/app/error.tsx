'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('[Ilmify] Page error:', error);
  }, [error]);

  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-5 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <AlertTriangle size={28} style={{ color: '#ef4444' }} />
      </div>
      <div>
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Une erreur est survenue
        </h2>
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          La page n&apos;a pas pu se charger. Essayez de réessayer ou de retourner à l&apos;accueil.
        </p>
        {error.digest && (
          <p className="text-xs mt-2 font-mono" style={{ color: 'var(--text-muted)' }}>
            Ref: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => unstable_retry()}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer transition-all"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <RefreshCw size={14} /> Réessayer
        </button>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer transition-all"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
        >
          <Home size={14} /> Accueil
        </button>
      </div>
    </div>
  );
}
