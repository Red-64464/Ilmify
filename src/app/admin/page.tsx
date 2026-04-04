'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Star, FileText, Brain, BookOpen,
  Layers, Users, BarChart3, Plus, Trash2, Shield,
  UserCog, ChevronDown, ChevronUp,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AuthGuard from '@/components/layout/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/auth/authService';
import { themes } from '@/data/themes';
import { contentItems } from '@/data/content';
import { quizQuestions } from '@/data/quiz';
import { books } from '@/data/books';
import { flashcardDecks, flashcards } from '@/data/flashcards';
import { favorites } from '@/data/favorites';
import type { User } from '@/types';

export default function AdminPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const router = useRouter();

  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [createError, setCreateError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showUserSection, setShowUserSection] = useState(true);

  const refreshUsers = useCallback(async () => {
    try {
      const list = await authService.getAllUsersAsync();
      setUsers(list);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return null;
  }

  const stats = [
    { label: 'Utilisateurs', value: users.length, icon: Users, color: '#3b82f6' },
    { label: 'Thèmes', value: themes.length, icon: Star, color: '#3aaa60' },
    { label: 'Contenus', value: contentItems.length, icon: FileText, color: '#d4991a' },
    { label: 'Questions quiz', value: quizQuestions.length, icon: Brain, color: '#6366f1' },
    { label: 'Livres', value: books.length, icon: BookOpen, color: '#ec4899' },
    { label: 'Decks flashcards', value: flashcardDecks.length, icon: Layers, color: '#24ad9d' },
    { label: 'Flashcards', value: flashcards.length, icon: Layers, color: '#14b8a6' },
    { label: 'Favoris', value: favorites.length, icon: Star, color: '#f59e0b' },
  ];

  const handleCreateUser = async () => {
    setCreateError('');
    if (!newUsername.trim() || !newDisplayName.trim() || !newPassword.trim()) {
      setCreateError('Tous les champs sont requis');
      return;
    }
    if (newPassword.length < 6) {
      setCreateError('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    try {
      await authService.createUserAdmin({
        username: newUsername.trim(),
        displayName: newDisplayName.trim(),
        password: newPassword,
        role: newRole,
      });
      await refreshUsers();
      setShowCreateUser(false);
      setNewUsername('');
      setNewDisplayName('');
      setNewPassword('');
      setNewRole('user');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await authService.deleteUserAsync(userId);
      await refreshUsers();
    } catch { /* ignore */ }
    setShowDeleteConfirm(null);
  };

  const handleToggleRole = async (userId: string, currentRole: 'admin' | 'user') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await authService.updateUserRoleAsync(userId, newRole);
      await refreshUsers();
    } catch { /* ignore */ }
  };

  const sections = [
    {
      title: 'Thèmes',
      icon: Star,
      color: '#3aaa60',
      items: themes.map((t) => ({
        name: t.title,
        detail: `${t.contentCount} contenus · ${t.progress ?? 0}% progression`,
      })),
    },
    {
      title: 'Livres',
      icon: BookOpen,
      color: '#ec4899',
      items: books.map((b) => ({
        name: b.title,
        detail: `${b.author} · ${b.status === 'read' ? 'Terminé' : b.status === 'reading' ? 'En cours' : 'À lire'}`,
      })),
    },
    {
      title: 'Decks Flashcards',
      icon: Layers,
      color: '#24ad9d',
      items: flashcardDecks.map((d) => ({
        name: d.title,
        detail: `${d.cardCount} cartes · ${d.masteredCount} maîtrisées`,
      })),
    },
  ];

  return (
    <AuthGuard>
    <div className="pb-10">
      <PageHeader
        title="Administration"
        subtitle="Tableau de bord"
        rightAction={
          <Badge variant="gold" size="md">
            <LayoutDashboard size={14} className="mr-1" />
            Admin
          </Badge>
        }
      />

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <h3 className="text-lg font-semibold tracking-tight mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <BarChart3 size={18} style={{ color: '#d4ad4a' }} />
          Vue d&apos;ensemble
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Card className="p-4 text-center">
                <div
                  className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* User Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-10"
      >
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setShowUserSection(!showUserSection)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <UserCog size={18} style={{ color: '#3b82f6' }} />
              Gestion des utilisateurs
            </h3>
            {showUserSection ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
          </button>
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Plus size={14} />}
            onClick={() => {
              setCreateError('');
              setNewUsername('');
              setNewDisplayName('');
              setNewPassword('');
              setNewRole('user');
              setShowCreateUser(true);
            }}
          >
            Créer
          </Button>
        </div>

        <AnimatePresence>
          {showUserSection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="divide-y divide-white/[0.06]">
                {users.map((u) => (
                  <div key={u.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden"
                        style={{ background: 'rgba(46,158,140,0.15)' }}
                      >
                        {u.avatarUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Users size={14} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {u.displayName}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          @{u.username} · {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        className="cursor-pointer"
                        title={u.role === 'admin' ? 'Retirer admin' : 'Promouvoir admin'}
                      >
                        <Badge
                          variant={u.role === 'admin' ? 'gold' : 'default'}
                          size="sm"
                        >
                          <Shield size={10} className="mr-1" />
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => setShowDeleteConfirm(u.id)}
                          className="p-1.5 rounded-lg transition-colors cursor-pointer"
                          style={{ color: 'var(--text-muted)' }}
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Management Sections */}
      {sections.map((section, si) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 + si * 0.1 }}
          className="mb-10"
        >
          <h3 className="text-lg font-semibold tracking-tight mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <section.icon size={18} style={{ color: section.color }} />
            {section.title}
          </h3>
          <Card className="divide-y divide-white/[0.06]">
            {section.items.map((item, j) => (
              <div key={j} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.detail}</p>
                </div>
                <Badge variant="default" size="sm">#{j + 1}</Badge>
              </div>
            ))}
          </Card>
        </motion.div>
      ))}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        title="Créer un utilisateur"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nom d&apos;affichage
            </label>
            <input
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
              placeholder="Ex: Ahmed"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nom d&apos;utilisateur
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
              placeholder="Ex: ahmed123"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
              placeholder="Min. 4 caractères"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Rôle
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setNewRole('user')}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
                style={{
                  background: newRole === 'user' ? 'rgba(46,158,140,0.15)' : 'var(--bg-card)',
                  border: `1px solid ${newRole === 'user' ? 'rgba(46,158,140,0.3)' : 'var(--border-light)'}`,
                  color: newRole === 'user' ? '#2e9e8c' : 'var(--text-secondary)',
                }}
              >
                Utilisateur
              </button>
              <button
                onClick={() => setNewRole('admin')}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
                style={{
                  background: newRole === 'admin' ? 'rgba(196,154,61,0.15)' : 'var(--bg-card)',
                  border: `1px solid ${newRole === 'admin' ? 'rgba(196,154,61,0.3)' : 'var(--border-light)'}`,
                  color: newRole === 'admin' ? '#d4ad4a' : 'var(--text-secondary)',
                }}
              >
                Administrateur
              </button>
            </div>
          </div>
          <AnimatePresence>
            {createError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs"
                style={{ color: '#f87171' }}
              >
                {createError}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="flex gap-2">
            <Button variant="secondary" size="md" onClick={() => setShowCreateUser(false)} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" iconLeft={<Plus size={14} />} onClick={handleCreateUser} className="flex-1">
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete User Confirm */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Supprimer cet utilisateur ?"
      >
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Cette action est irréversible. L&apos;utilisateur sera définitivement supprimé.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={() => setShowDeleteConfirm(null)} className="flex-1">
            Annuler
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => showDeleteConfirm && handleDeleteUser(showDeleteConfirm)}
            className="flex-1"
          >
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
    </AuthGuard>
  );
}
