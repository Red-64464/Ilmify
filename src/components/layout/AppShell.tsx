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
      <main className="relative z-10 min-h-screen lg:pl-[280px]">
        <div className="mx-auto max-w-4xl px-5 pb-nav sm:px-8 lg:px-10 lg:py-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </ToastProvider>
  );
}
