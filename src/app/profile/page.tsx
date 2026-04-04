'use client';

import { useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Star, Brain, Layers, BookOpen, Settings,
  Info, Shield, Heart, LogOut, GraduationCap,
  Camera, Edit3, Lock, Save, X, Check,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/layout/AuthGuard';
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
  const { user, isAdmin, logout, updateUser, updatePassword } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit profile state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editError, setEditError] = useState('');

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        updateUser({ avatarUrl: ev.target?.result as string });
      } catch { /* ignore */ }
    };
    reader.readAsDataURL(file);
  };

  const openEditProfile = () => {
    if (!user) return;
    setEditDisplayName(user.displayName);
    setEditUsername(user.username);
    setEditError('');
    setShowEditProfile(true);
  };

  const handleSaveProfile = () => {
    if (!editDisplayName.trim() || !editUsername.trim()) {
      setEditError('Tous les champs sont requis');
      return;
    }
    try {
      updateUser({ displayName: editDisplayName.trim(), username: editUsername.trim() });
      setShowEditProfile(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleChangePassword = () => {
    setPasswordError('');
    setPasswordSuccess(false);
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tous les champs sont requis');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError('Le nouveau mot de passe doit faire au moins 4 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      updatePassword(oldPassword, newPassword);
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowChangePassword(false), 1200);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <AuthGuard>
    <div className="pb-10">
      {/* Avatar & Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <div className="relative inline-block mb-4">
          <div
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full overflow-hidden"
            style={{ background: 'rgba(46,158,140,0.25)', border: '2px solid rgba(46,158,140,0.4)' }}
          >
            {user.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <User size={40} style={{ color: 'var(--text-secondary)' }} />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, #2e9e8c, #1a7a6b)',
              boxShadow: '0 2px 8px rgba(46,158,140,0.3)',
              border: '2px solid var(--bg-primary)',
            }}
            title="Changer la photo"
          >
            <Camera size={14} style={{ color: '#fff' }} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
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

        {/* Edit & Password buttons */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Edit3 size={14} />}
            onClick={openEditProfile}
          >
            Modifier le profil
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<Lock size={14} />}
            onClick={() => {
              setPasswordError('');
              setPasswordSuccess(false);
              setOldPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setShowChangePassword(true);
            }}
          >
            Mot de passe
          </Button>
        </div>
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

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Modifier le profil"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nom d&apos;affichage
            </label>
            <input
              type="text"
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nom d&apos;utilisateur
            </label>
            <input
              type="text"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <AnimatePresence>
            {editError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs"
                style={{ color: '#f87171' }}
              >
                {editError}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="flex gap-2">
            <Button variant="secondary" size="md" onClick={() => setShowEditProfile(false)} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" iconLeft={<Save size={14} />} onClick={handleSaveProfile} className="flex-1">
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        title="Changer le mot de passe"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Ancien mot de passe
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <AnimatePresence>
            {passwordError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs"
                style={{ color: '#f87171' }}
              >
                {passwordError}
              </motion.p>
            )}
            {passwordSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-xs"
                style={{ color: '#3aaa60' }}
              >
                <Check size={14} />
                Mot de passe modifié avec succès
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex gap-2">
            <Button variant="secondary" size="md" onClick={() => setShowChangePassword(false)} className="flex-1">
              Annuler
            </Button>
            <Button variant="primary" size="md" iconLeft={<Lock size={14} />} onClick={handleChangePassword} className="flex-1">
              Changer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </AuthGuard>
  );
}
