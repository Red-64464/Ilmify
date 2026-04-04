'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Compass, Search, Brain, Layers, BookOpen, Heart, Settings } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Accueil', href: '/' },
  { icon: Compass, label: 'Explorer', href: '/themes' },
  { icon: Search, label: 'Recherche', href: '/search' },
  { icon: Brain, label: 'Quiz', href: '/quiz' },
  { icon: Layers, label: 'Flashcards', href: '/flashcards' },
  { icon: BookOpen, label: 'Bibliothèque', href: '/library' },
  { icon: Heart, label: 'Favoris', href: '/favorites' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-ilm-dark border-r border-ilm-accent/10 flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <Image src="/logo.png" alt="Ilmify" width={40} height={40} className="rounded-xl" />
        <span className="text-xl font-bold text-gradient-gold">Ilmify</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-ilm-accent/30 text-ilm-gold border-l-2 border-ilm-gold'
                  : 'text-ilm-cream hover:bg-ilm-accent/15 hover:text-ilm-ivory'
              }`}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          );
        })}

        <div className="my-4 border-t border-ilm-accent/10" />

        <Link
          href="/admin"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === '/admin'
              ? 'bg-ilm-accent/30 text-ilm-gold border-l-2 border-ilm-gold'
              : 'text-ilm-cream hover:bg-ilm-accent/15 hover:text-ilm-ivory'
          }`}
        >
          <Settings className="w-4.5 h-4.5" />
          Administration
        </Link>
      </nav>

      <div className="p-4 text-xs text-ilm-sage/50 text-center">Ilmify v1.0</div>
    </aside>
  );
}
