'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 md:hidden bg-ilm-darkest/95 backdrop-blur-xl border-b border-ilm-accent/10">
      <div className="flex items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Ilmify" width={32} height={32} className="rounded-lg" />
          <span className="text-lg font-bold text-gradient-gold">Ilmify</span>
        </Link>
        <Link href="/search" className="w-9 h-9 rounded-xl bg-ilm-card/60 flex items-center justify-center text-ilm-sage hover:text-ilm-ivory transition-colors">
          <Search className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}
