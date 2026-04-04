'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ username, password });
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
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
          <div className="relative mx-auto mb-4 h-20 w-20">
            <Image src="/logo.png" alt="Ilmify" fill className="object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold font-heading tracking-tight" style={{ color: '#d4ad4a' }}>
            Ilmify
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Votre espace de savoir islamique
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nom d&apos;utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre nom d'utilisateur"
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
                placeholder="Entrez votre mot de passe"
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
            iconLeft={<LogIn size={18} />}
            className="w-full"
          >
            Se connecter
          </Button>
        </form>

        {/* Signup link */}
        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Pas encore de compte ?{' '}
          <Link href="/signup" className="font-medium" style={{ color: '#2e9e8c' }}>
            Créer un compte
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
