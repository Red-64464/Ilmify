'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Home,
  FileText,
  GraduationCap,
  BookOpen,
  User,
  Brain,
  Layers,
  Heart,
  Settings,
  Compass,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const mainNav = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/topics', label: 'Mes Topics', icon: FileText },
  { href: '/courses', label: 'Cours', icon: GraduationCap },
  { href: '/library', label: 'Bibliothèque', icon: BookOpen },
  { href: '/profile', label: 'Profil', icon: User },
] as const;

const toolsNav = [
  { href: '/explore', label: 'Explorer (Thèmes)', icon: Compass },
  { href: '/quiz', label: 'Quiz', icon: Brain },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/favorites', label: 'Favoris', icon: Heart },
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
  const { isAdmin } = useAuth();

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
        <div className="relative h-10 w-10 shrink-0">
          <Image src="/logo.png" alt="Ilmify" fill className="object-contain" />
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

        {toolsNav.map((item) => (
          <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
        ))}
        {isAdmin && (
          <NavLink href="/admin" label="Admin" icon={Settings} isActive={isActive('/admin')} />
        )}
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
