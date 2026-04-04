'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, FileText, GraduationCap, BookOpen, User } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/topics', label: 'Mes Topics', icon: FileText },
  { href: '/courses', label: 'Cours', icon: GraduationCap },
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/profile', label: 'Profil', icon: User },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden">
      <div
        className="safe-bottom flex items-center justify-around px-3 pt-2.5 pb-2.5"
        style={{
          background: 'rgba(6, 18, 15, 0.92)',
          backdropFilter: 'blur(24px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200"
              style={{
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
              </motion.div>
              <span
                className="text-[10px] font-medium leading-tight"
                style={{ opacity: isActive ? 1 : 0.7 }}
              >
                {label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute -top-0.5 w-5 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #1a7a6b, #12a393)' }}
                  transition={{ type: 'spring' as const, stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
