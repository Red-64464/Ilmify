'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User, Star, Brain, Layers, BookOpen, Settings,
  Info, Shield, Heart, LogOut, GraduationCap, FileText,
  Moon, Type,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { themes } from '@/data/themes';
import { quizQuestions } from '@/data/quiz';
import { flashcards } from '@/data/flashcards';
import { books } from '@/data/books';

const menuItems = [
  { icon: Heart, label: 'Favoris', desc: 'Gérer vos favoris', href: '/favorites' },
  { icon: Settings, label: 'Paramètres', desc: 'Personnaliser l\'application' },
  { icon: Shield, label: 'Confidentialité', desc: 'Paramètres de confidentialité' },
  { icon: Info, label: 'À propos', desc: 'Ilmify v0.2.0' },
];

export default function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();

  const stats = useMemo(() => {
    const themesExplored = themes.filter((t) => t.progress && t.progress > 0).length;
    const avgQuizScore = quizQuestions.length > 0
      ? Math.round(
          quizQuestions.reduce((acc, q) => acc + q.masteryLevel, 0) / quizQuestions.length
        )
      : 0;
    const flashcardsMastered = flashcards.filter((f) => f.masteryLevel >= 80).length;
    const booksRead = books.filter((b) => b.status === 'read').length;

    return [
      { label: 'Thèmes explorés', value: themesExplored, total: themes.length, icon: Star, color: '#3aaa60' },
      { label: 'Score quiz', value: `${avgQuizScore}%`, icon: Brain, color: '#6366f1' },
      { label: 'Cartes maîtrisées', value: flashcardsMastered, total: flashcards.length, icon: Layers, color: '#24ad9d' },
      { label: 'Livres lus', value: booksRead, total: books.length, icon: BookOpen, color: '#d4991a' },
    ];
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="pb-10">
        <EmptyState
          icon={User}
          title="Non connecté"
          description="Connectez-vous pour accéder à votre profil et vos données personnelles."
          actionLabel="Se connecter"
          onAction={() => router.push('/login')}
        />
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Avatar & Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <div
          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: 'rgba(46,158,140,0.25)', border: '2px solid rgba(46,158,140,0.4)' }}
        >
          <User size={36} style={{ color: 'var(--text-secondary)' }} />
        </div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {user.displayName}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>@{user.username}</p>
        {isAdmin && (
          <Badge variant="gold" size="sm" className="mt-2">
            <Shield size={10} className="mr-1" />
            Administrateur
          </Badge>
        )}
      </motion.div>

      {/* Admin shortcuts */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8"
        >
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            Administration
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Card
              hoverable
              className="p-4 cursor-pointer"
              onClick={() => router.push('/courses')}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(196,154,61,0.12)' }}>
                  <GraduationCap size={16} style={{ color: '#d4ad4a' }} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Cours</h4>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Gérer les cours</p>
                </div>
              </div>
            </Card>
            <Card
              hoverable
              className="p-4 cursor-pointer"
              onClick={() => router.push('/admin')}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(99,102,241,0.12)' }}>
                  <Settings size={16} style={{ color: '#6366f1' }} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Admin</h4>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Panneau admin</p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className="p-4 text-center">
              <div
                className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {stat.value}
                {'total' in stat && stat.total !== undefined && (
                  <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/{stat.total}</span>
                )}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Menu */}
      <div className="space-y-2 mb-8">
        {menuItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.2 + i * 0.05 }}
          >
            <Card
              hoverable
              className="p-4 cursor-pointer"
              onClick={'href' in item && item.href ? () => router.push(item.href!) : undefined}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                  <item.icon size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          variant="ghost"
          size="md"
          iconLeft={<LogOut size={16} />}
          onClick={handleLogout}
          className="w-full"
        >
          Se déconnecter
        </Button>
      </motion.div>
    </div>
  );
}
