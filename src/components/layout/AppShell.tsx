'use client';

import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { IslamicPattern } from '../ui/IslamicPattern';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-primary-900 relative">
      <IslamicPattern opacity={0.02} />
      <Sidebar />
      <main className="lg:ml-64 pb-20 lg:pb-0 relative z-10">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
