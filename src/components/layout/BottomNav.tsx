'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  FileText,
  GraduationCap,
  BookOpen,
  MoreHorizontal,
  Compass,
  Brain,
  Layers,
  Heart,
  Clock,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/topics', label: 'Mes Topics', icon: FileText },
  { href: '/courses', label: 'Cours', icon: GraduationCap },
  { href: '/library', label: 'Library', icon: BookOpen },
] as const;

const moreItems = [
  { href: '/explore', label: 'Explorer', icon: Compass },
  { href: '/quiz', label: 'Quiz', icon: Brain },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/favorites', label: 'Favoris', icon: Heart },
  { href: '/prayer-times', label: 'Horaires de Prière', icon: Clock },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!showMore) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMore(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMore]);

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden">
      {/* Popup menu */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full right-2 mb-2 w-52 rounded-2xl overflow-hidden shadow-xl"
            style={{
              background: 'rgba(6, 18, 15, 0.96)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Plus
              </span>
              <button onClick={() => setShowMore(false)} className="p-1 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>
            {moreItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowMore(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: active ? 'var(--accent)' : 'var(--text-secondary)' }}
                >
                  <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                  <span className="font-medium">{label}</span>
                </Link>
              );
            })}
            <div className="h-1" />
          </motion.div>
        )}
      </AnimatePresence>

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

        {/* More button */}
        <button
          onClick={() => setShowMore((v) => !v)}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer"
          style={{
            color: isMoreActive || showMore ? 'var(--accent)' : 'var(--text-muted)',
          }}
        >
          <motion.div
            animate={{ scale: isMoreActive ? 1.1 : 1, y: isMoreActive ? -1 : 0 }}
            transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
          >
            <MoreHorizontal size={22} strokeWidth={isMoreActive ? 2.2 : 1.6} />
          </motion.div>
          <span
            className="text-[10px] font-medium leading-tight"
            style={{ opacity: isMoreActive || showMore ? 1 : 0.7 }}
          >
            Plus
          </span>
        </button>
      </div>
    </nav>
  );
}
