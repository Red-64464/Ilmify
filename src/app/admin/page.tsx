'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Star, FileText, Brain, BookOpen,
  Layers, Users, BarChart3, Plus, Trash2, Shield,
  UserCog, ChevronDown, ChevronUp, Edit3, Lock, Save, X,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AuthGuard from '@/components/layout/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/auth/authService';
import { topicRepository } from '@/lib/repositories/topicRepository';
import { bookRepository } from '@/lib/repositories/bookRepository';
import { courseRepository } from '@/lib/repositories/courseRepository';
import { flashcardRepository } from '@/lib/repositories/flashcardRepository';
import { useToast } from '@/components/ui/Toast';
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
  const [creatingUser, setCreatingUser] = useState(false);
  const { toast } = useToast();

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserDisplayName, setEditUserDisplayName] = useState('');
  const [editUserUsername, setEditUserUsername] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserError, setEditUserError] = useState('');

  // Dynamic stats
  const [topicCount, setTopicCount] = useState(0);
  const [bookCount, setBookCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [flashcardDeckCount, setFlashcardDeckCount] = useState(0);

  const refreshUsers = useCallback(async () => {
    try {
      const list = await authService.getAllUsersAsync();
      setUsers(list);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    refreshUsers();
    // Fetch dynamic stats
    if (currentUser) {
      topicRepository.getByUser(currentUser.id).then(t => setTopicCount(t.length)).catch(() => {});
    }
    bookRepository.getAll().then(b => setBookCount(b.length)).catch(() => {});
    courseRepository.getAllPages().then(p => setCourseCount(p.length)).catch(() => {});
    flashcardRepository.getAllDecks().then(d => setFlashcardDeckCount(d.length)).catch(() => {});
  }, [refreshUsers, currentUser]);

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
    { label: 'Topics', value: topicCount, icon: FileText, color: '#3aaa60' },
    { label: 'Cours', value: courseCount, icon: Brain, color: '#d4991a' },
    { label: 'Livres', value: bookCount, icon: BookOpen, color: '#ec4899' },
    { label: 'Decks', value: flashcardDeckCount, icon: Layers, color: '#24ad9d' },
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
    if (creatingUser) return;
    setCreatingUser(true);
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
      toast('success', 'Utilisateur créé');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await authService.deleteUserAsync(userId);
      await refreshUsers();
      toast('success', 'Utilisateur supprimé');
    } catch {
      toast('error', 'Erreur lors de la suppression');
    }
    setShowDeleteConfirm(null);
  };

  const handleToggleRole = async (userId: string, currentRole: 'admin' | 'user') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await authService.updateUserRoleAsync(userId, newRole);
      toast('success', `Rôle mis à jour: ${newRole}`);
      await refreshUsers();
    } catch { toast('error', 'Erreur lors du changement de rôle'); }
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setEditUserDisplayName(u.displayName);
    setEditUserUsername(u.username);
    setEditUserPassword('');
    setEditUserError('');
  };

  const handleSaveEditUser = async () => {
    if (!editingUser) return;
    setEditUserError('');
    try {
      if (editUserDisplayName.trim() !== editingUser.displayName || editUserUsername.trim() !== editingUser.username) {
        await authService.adminUpdateUserProfile(editingUser.id, {
          displayName: editUserDisplayName.trim(),
          username: editUserUsername.trim(),
        });
      }
      if (editUserPassword.trim()) {
        if (editUserPassword.length < 6) {
          setEditUserError('Le mot de passe doit faire au moins 6 caractères');
          return;
        }
        try {
          await authService.adminResetPassword(editingUser.id, editUserPassword);
        } catch {
          setEditUserError('Impossible de modifier le mot de passe (clé admin requise)');
          return;
        }
      }
      toast('success', 'Utilisateur mis à jour');
      setEditingUser(null);
      await refreshUsers();
    } catch (err) {
      setEditUserError(err instanceof Error ? err.message : 'Erreur');
    }
  };

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
                        onClick={() => openEditUser(u)}
                        className="p-1.5 rounded-lg transition-colors cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                        title="Modifier"
                      >
                        <Edit3 size={14} />
                      </button>
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
                  color: newRole === 'user' ? 'var(--accent)' : 'var(--text-secondary)',
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

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Modifier ${editingUser?.displayName || ''}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nom d&apos;affichage
            </label>
            <input
              type="text"
              value={editUserDisplayName}
              onChange={(e) => setEditUserDisplayName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nom d&apos;utilisateur
            </label>
            <input
              type="text"
              value={editUserUsername}
              onChange={(e) => setEditUserUsername(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nouveau mot de passe <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(laisser vide pour ne pas changer)</span>
            </label>
            <input
              type="password"
              value={editUserPassword}
              onChange={(e) => setEditUserPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
              placeholder="Min. 6 caractères"
            />
          </div>
          <AnimatePresence>
            {editUserError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs"
                style={{ color: '#f87171' }}
              >
                {editUserError}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="flex gap-2">
            <Button variant="secondary" size="md" onClick={() => setEditingUser(null)} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" iconLeft={<Save size={14} />} onClick={handleSaveEditUser} className="flex-1">
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </AuthGuard>
  );
}
