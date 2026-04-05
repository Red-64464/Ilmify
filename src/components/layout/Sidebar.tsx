'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  LogOut,
  Clock,
  Video,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const savoirNav = [
  { href: '/topics', label: 'Mes Topics', icon: FileText },
  { href: '/courses', label: 'Cours', icon: GraduationCap },
  { href: '/library', label: 'Bibliothèque', icon: BookOpen },
  { href: '/media', label: 'Médiathèque', icon: Video },
] as const;

const revisionNav = [
  { href: '/quiz', label: 'Quiz', icon: Brain },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
] as const;

const decouvrirNav = [
  { href: '/explore', label: 'Explorer', icon: Compass },
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
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        background: isActive ? 'var(--accent-light)' : 'transparent',
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
  const router = useRouter();
  const { isAdmin, logout, user } = useAuth();

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
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--accent)' }}>
            Ilmify
          </span>
          <p className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            Savoir • Lumière
          </p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {/* Home */}
        <NavLink href="/" label="Home" icon={Home} isActive={isActive('/')} />

        {/* Mon Savoir */}
        <div className="my-4 px-2">
          <span className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: 'var(--text-muted)' }}>
            Mon Savoir
          </span>
        </div>
        {savoirNav.map((item) => (
          <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
        ))}

        {/* Révision */}
        <div className="my-4 px-2">
          <span className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: 'var(--text-muted)' }}>
            Révision
          </span>
        </div>
        {revisionNav.map((item) => (
          <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
        ))}

        {/* Découvrir */}
        <div className="my-4 px-2">
          <span className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: 'var(--text-muted)' }}>
            Découvrir
          </span>
        </div>
        {decouvrirNav.map((item) => (
          <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-3 py-3 space-y-0.5"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <NavLink href="/prayer-times" label="Horaires de Prière" icon={Clock} isActive={isActive('/prayer-times')} />
        <NavLink href="/profile" label="Profil" icon={User} isActive={isActive('/profile')} />
        {isAdmin && (
          <NavLink href="/admin" label="Admin" icon={Settings} isActive={isActive('/admin')} />
        )}
        {user && (
          <button
            onClick={async () => { await logout(); router.push('/login'); }}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer"
            style={{
              color: '#f87171',
              background: 'rgba(248, 113, 113, 0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(248, 113, 113, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(248, 113, 113, 0.06)';
            }}
          >
            <LogOut size={18} strokeWidth={1.8} />
            <span>Se déconnecter</span>
          </button>
        )}
        <p className="text-[11px] tracking-wide px-4 pt-1" style={{ color: 'var(--text-muted)' }}>
          Ilmify v0.1.0
        </p>
      </div>
    </aside>
  );
}
