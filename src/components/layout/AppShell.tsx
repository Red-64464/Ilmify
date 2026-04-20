'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { ToastProvider } from '@/components/ui/Toast';
import InstallGuide, { useInstallGuide } from '@/components/ui/InstallGuide';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const AUTH_ROUTES = ['/login', '/signup'];
// Pages that work without auth
const PUBLIC_ROUTES = ['/prayer-times'];

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showGuide, openGuide, closeGuide } = useInstallGuide();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Redirect if not authed (effect, not in render)
  useEffect(() => {
    if (!isLoading && !user && !isAuthRoute && !isPublicRoute) {
      router.replace('/login');
    }
  }, [isLoading, user, isAuthRoute, isPublicRoute, router]);

  // Schedule daily reminder notification via SW
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!user) return;
    try {
      const enabled = localStorage.getItem('ilmify-daily-reminder');
      if (enabled === null) localStorage.setItem('ilmify-daily-reminder', 'true');
      if (enabled === 'false') return;
    } catch {
      // localStorage unavailable (private mode, etc.)
      return;
    }

    if ('serviceWorker' in navigator && 'Notification' in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          navigator.serviceWorker.ready.then((reg) => {
            reg.active?.postMessage({
              type: 'SCHEDULE_DAILY_REMINDER',
              hour: 9,
              minute: 0,
              body: "N'oubliez pas votre session d'apprentissage quotidienne ! 📖",
            });
          });
        }
      });
    }
  }, [user]);

  // Keyboard shortcuts — must be before any early returns (React hooks rules)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        router.push('/search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // While auth is loading, show a loading screen
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

  // Not logged in and not on auth/public page → show nothing (redirect will fire)
  if (!user && !isAuthRoute && !isPublicRoute) {
    return null;
  }

  const showNav = !isAuthRoute && !!user;

  return (
    <>
      {showNav && <Sidebar onOpenInstallGuide={openGuide} />}
      <main className={`relative z-10 min-h-screen ${showNav ? 'lg:pl-[280px]' : ''}`}>
        <div className={isAuthRoute ? '' : 'mx-auto max-w-4xl px-5 pb-nav sm:px-8 lg:px-10 lg:py-6'}>
          {children}
        </div>
      </main>
      {showNav && <BottomNav />}
      <InstallGuide isOpen={showGuide} onClose={closeGuide} />
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
