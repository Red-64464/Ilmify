'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Home, Compass, Search, Brain, Layers, BookOpen, Heart, Settings, Sparkles
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/themes', label: 'Thèmes', icon: Compass },
  { href: '/search', label: 'Recherche', icon: Search },
  { href: '/quiz', label: 'Quiz', icon: Brain },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/library', label: 'Bibliothèque', icon: BookOpen },
  { href: '/favorites', label: 'Favoris', icon: Heart },
  { href: '/admin', label: 'Gestion', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-primary-900/95 backdrop-blur-xl border-r border-primary-700/30 z-40">
      {/* Logo */}
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden">
            <Image src="/logo.png" alt="Ilmify" fill className="object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold text-gold-400">Ilmify</h1>
            <p className="text-[10px] text-ivory-500 tracking-wider uppercase">Savoir • Lumière • Sérénité</p>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-primary-600/50 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20 shadow-sm shadow-gold-500/5'
                  : 'text-ivory-400 hover:text-ivory-200 hover:bg-primary-800/50'
                }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary-700/30">
        <div className="flex items-center gap-2 px-4 py-2">
          <Sparkles className="w-4 h-4 text-gold-500/50" />
          <span className="text-xs text-ivory-500">Version 1.0</span>
        </div>
      </div>
    </aside>
  );
}
