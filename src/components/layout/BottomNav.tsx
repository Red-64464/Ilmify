'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Search, Brain, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/themes', label: 'Thèmes', icon: Compass },
  { href: '/search', label: 'Recherche', icon: Search },
  { href: '/quiz', label: 'Quiz', icon: Brain },
  { href: '/library', label: 'Livres', icon: BookOpen },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-primary-900/95 backdrop-blur-xl border-t border-primary-700/30">
      <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 px-3 py-1.5 min-w-[3.5rem]"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNav"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-gold-400 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-gold-400' : 'text-ivory-500'}`} />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-gold-400' : 'text-ivory-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
