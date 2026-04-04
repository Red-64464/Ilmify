'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await signup({ username, password, displayName });
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #1a7a6b, #12a393)',
              boxShadow: '0 4px 20px rgba(26, 122, 107, 0.3)',
            }}
          >
            ☪
          </div>
          <h1 className="text-2xl font-bold font-heading tracking-tight" style={{ color: '#d4ad4a' }}>
            Créer un compte
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Rejoignez Ilmify et organisez votre savoir
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nom affiché
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Votre nom ou pseudonyme"
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-[var(--text-muted)]"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(26, 122, 107, 0.3)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26, 122, 107, 0.08)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nom d&apos;utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choisissez un identifiant"
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-[var(--text-muted)]"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(26, 122, 107, 0.3)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26, 122, 107, 0.08)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choisissez un mot de passe"
                required
                className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all duration-200 placeholder:text-[var(--text-muted)]"
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(26, 122, 107, 0.3)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26, 122, 107, 0.08)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-center py-2 rounded-lg"
              style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.08)' }}
            >
              {error}
            </motion.p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            iconLeft={<UserPlus size={18} />}
            className="w-full"
          >
            Créer mon compte
          </Button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Déjà un compte ?{' '}
          <Link href="/login" className="font-medium" style={{ color: '#2e9e8c' }}>
            Se connecter
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
