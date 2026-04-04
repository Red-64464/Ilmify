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
        color: isActive ? '#2e9e8c' : 'var(--text-secondary)',
        background: isActive ? 'rgba(26, 122, 107, 0.08)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
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
      <Icon size={20} strokeWidth={isActive ? 2 : 1.6} />
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
      <div className="flex items-center gap-3 px-7 py-7">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, #1a7a6b, #12a393)',
            boxShadow: '0 2px 12px rgba(26, 122, 107, 0.3)',
          }}
        >
          ☪
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight" style={{ color: '#2e9e8c' }}>
            Ilmify
          </span>
          <p className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            Savoir • Lumière
          </p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {mainNav.map((item) => (
          <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
        ))}

        {/* Separator */}
        <div className="separator-ornament my-5 px-2">
          <span className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: 'var(--text-muted)' }}>
            Outils
          </span>
        </div>

        {secondaryNav.map((item) => (
          <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-7 py-5"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <p className="text-[11px] tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Ilmify v0.1.0
        </p>
      </div>
    </aside>
  );
}
