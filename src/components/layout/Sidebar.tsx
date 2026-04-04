'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  Search,
  BookOpen,
  User,
  Brain,
  Layers,
  Heart,
  Settings,
} from 'lucide-react';

const mainNav = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/profile', label: 'Profile', icon: User },
] as const;

const secondaryNav = [
  { href: '/quiz', label: 'Quiz', icon: Brain },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/admin', label: 'Admin', icon: Settings },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200"
      style={{
        color: isActive ? '#3aaa60' : 'var(--text-secondary)',
        background: isActive ? 'var(--glow-green)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside
      className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[280px] flex-col"
      style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #3aaa60, #24ad9d)' }}
        >
          ☪
        </div>
        <span className="text-xl font-bold" style={{ color: '#3aaa60' }}>
          Ilmify
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {mainNav.map((item) => (
          <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
        ))}

        {/* Separator */}
        <div className="separator-ornament my-4 px-2">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Outils
          </span>
        </div>

        {secondaryNav.map((item) => (
          <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-6 py-4"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Ilmify v0.1.0
        </p>
      </div>
    </aside>
  );
}
