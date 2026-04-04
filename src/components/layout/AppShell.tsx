'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const AUTH_ROUTES = ['/login', '/signup'];

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // While auth is loading, show a loading screen to avoid flash of no-nav content
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Chargement...</span>
        </div>
      </div>
    );
  }

  // Not logged in and not on auth page → redirect to login
  if (!user && !isAuthRoute) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Redirection...</span>
        </div>
      </div>
    );
  }

  const showNav = !isAuthRoute && !!user;

  return (
    <>
      {showNav && <Sidebar />}
      <main className={`relative z-10 min-h-screen ${showNav ? 'lg:pl-[280px]' : ''}`}>
        <div className={isAuthRoute ? '' : 'mx-auto max-w-4xl px-5 pb-nav sm:px-8 lg:px-10 lg:py-6'}>
          {children}
        </div>
      </main>
      {showNav && <BottomNav />}
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <AppShellInner>{children}</AppShellInner>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
