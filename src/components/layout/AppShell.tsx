'use client';

import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { SplashScreen } from './SplashScreen';
import { ToastProvider } from '@/components/ui/Toast';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SplashScreen />
      <Sidebar />
      <main className="min-h-screen lg:pl-[280px]">
        <div className="mx-auto max-w-5xl px-4 pb-nav sm:px-6 lg:px-8 lg:py-4">
          {children}
        </div>
      </main>
      <BottomNav />
    </ToastProvider>
  );
}
