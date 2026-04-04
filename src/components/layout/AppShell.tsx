'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ilm-darkest">
      <Header />
      <Sidebar />
      <main className="pt-14 pb-20 md:pt-0 md:pb-0 md:pl-64 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
