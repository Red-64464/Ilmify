'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { SplashScreen } from './SplashScreen';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const AUTH_ROUTES = ['/login', '/signup'];

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const showNav = !isAuthRoute && !!user;

  return (
    <>
      <SplashScreen />
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
