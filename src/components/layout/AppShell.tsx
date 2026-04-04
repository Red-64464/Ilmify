'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { SplashScreen } from './SplashScreen';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/contexts/AuthContext';

const AUTH_ROUTES = ['/login', '/signup'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  return (
    <AuthProvider>
      <ToastProvider>
        <SplashScreen />
        {!isAuthRoute && <Sidebar />}
        <main className={`relative z-10 min-h-screen ${isAuthRoute ? '' : 'lg:pl-[280px]'}`}>
          <div className={isAuthRoute ? '' : 'mx-auto max-w-4xl px-5 pb-nav sm:px-8 lg:px-10 lg:py-6'}>
            {children}
          </div>
        </main>
        {!isAuthRoute && <BottomNav />}
      </ToastProvider>
    </AuthProvider>
  );
}
