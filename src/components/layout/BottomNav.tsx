'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Compass, Search, BookOpen, User } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/profile', label: 'Profile', icon: User },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden">
      <div
        className="glass safe-bottom flex items-center justify-around px-2 pt-2 pb-2"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors"
              style={{ color: isActive ? '#3aaa60' : 'var(--text-muted)' }}
            >
              <motion.div
                animate={{ scale: isActive ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={
                  isActive
                    ? { filter: 'drop-shadow(0 0 6px rgba(58, 170, 96, 0.4))' }
                    : undefined
                }
              >
                <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
              </motion.div>
              <span className="text-[10px] font-medium leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
