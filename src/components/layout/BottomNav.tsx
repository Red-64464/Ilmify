'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Brain, BookOpen, MoreHorizontal, Layers, Heart, Search, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { icon: Home, label: 'Accueil', href: '/' },
  { icon: Compass, label: 'Explorer', href: '/themes' },
  { icon: Brain, label: 'Quiz', href: '/quiz' },
  { icon: BookOpen, label: 'Livres', href: '/library' },
];

const moreItems = [
  { icon: Layers, label: 'Flashcards', href: '/flashcards' },
  { icon: Heart, label: 'Favoris', href: '/favorites' },
  { icon: Search, label: 'Recherche', href: '/search' },
  { icon: Settings, label: 'Admin', href: '/admin' },
];

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-20 right-4 z-50 md:hidden glass-card rounded-2xl p-3 min-w-[180px]"
            >
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-medium text-ilm-sage">Plus</span>
                <button onClick={() => setShowMore(false)}><X className="w-3.5 h-3.5 text-ilm-sage" /></button>
              </div>
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    pathname === item.href ? 'text-ilm-gold bg-ilm-accent/20' : 'text-ilm-cream hover:bg-ilm-accent/10'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-ilm-darkest/95 backdrop-blur-xl border-t border-ilm-accent/10">
        <div className="flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 py-1 px-3">
                <motion.div whileTap={{ scale: 0.9 }}>
                  <item.icon className={`w-5 h-5 ${active ? 'text-ilm-gold' : 'text-ilm-sage'}`} />
                </motion.div>
                <span className={`text-[10px] ${active ? 'text-ilm-gold font-medium' : 'text-ilm-sage'}`}>{item.label}</span>
              </Link>
            );
          })}
          <button onClick={() => setShowMore(!showMore)} className="flex flex-col items-center gap-0.5 py-1 px-3">
            <motion.div whileTap={{ scale: 0.9 }}>
              <MoreHorizontal className={`w-5 h-5 ${showMore ? 'text-ilm-gold' : 'text-ilm-sage'}`} />
            </motion.div>
            <span className={`text-[10px] ${showMore ? 'text-ilm-gold font-medium' : 'text-ilm-sage'}`}>Plus</span>
          </button>
        </div>
      </nav>
    </>
  );
}
