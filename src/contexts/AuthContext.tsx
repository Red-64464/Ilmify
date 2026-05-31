'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, Session, AuthCredentials, SignupData } from '@/types';
import { authService, setCachedAuth, getCachedAuth } from '@/lib/auth/authService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { prefetchUserData, resetPrefetch } from '@/lib/prefetch';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: AuthCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: { displayName?: string; username?: string; avatarUrl?: string }) => void;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from in-memory cache for instant navigation (no flash of empty state).
  // isSupabaseConfigured is a module-level constant, so we derive the initial
  // loading state from it directly instead of calling setState inside the effect.
  const cached = getCachedAuth();
  const [user, setUser] = useState<User | null>(isSupabaseConfigured ? cached.user : null);
  const [session, setSession] = useState<Session | null>(isSupabaseConfigured ? cached.session : null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured ? !cached.user : false);

  // Listen to Supabase auth state changes
  useEffect(() => {
    // Nothing to subscribe to when Supabase isn't configured — initial state is already correct.
    if (!isSupabaseConfigured) return;

    let mounted = true;

    // Safety timeout — never block loading forever (8s for slow mobile connections).
    // setIsLoading(false) is idempotent, so we don't need to read isLoading here.
    const timeout = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 8000);

    const buildUserFromSession = async (supaSession: import('@supabase/supabase-js').Session) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id' as never, supaSession.user.id)
        .single();

      if (!profile) return null;

      const p = profile as unknown as Record<string, unknown>;
      const u: User = {
        id: p.id as string,
        username: p.username as string,
        displayName: p.display_name as string,
        role: (p.role as 'admin' | 'user') || 'user',
        createdAt: p.created_at as string,
        avatarUrl: (p.avatar_url as string) || undefined,
      };
      const s: Session = {
        userId: supaSession.user.id,
        token: supaSession.access_token,
        expiresAt: new Date(supaSession.expires_at! * 1000).toISOString(),
      };
      return { user: u, session: s };
    };

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: supaSession } }) => {
      if (!mounted) return;
      if (supaSession?.user) {
        try {
          const result = await buildUserFromSession(supaSession);
          if (mounted && result) {
            setUser(result.user);
            setSession(result.session);
            setCachedAuth(result.user, result.session);
            // Warm the cache while the loading screen is still showing
            prefetchUserData(result.user.id);
          }
        } catch {
          // Profile fetch failed — still allow app to load (user stays null → redirect to login)
        }
      }
      if (mounted) setIsLoading(false);
    }).catch(() => {
      // getSession failed — still allow app to load
      if (mounted) setIsLoading(false);
    });

    // Listen for auth changes (token refresh, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, supaSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !supaSession) {
        setUser(null);
        setSession(null);
        setCachedAuth(null, null);
        return;
      }

      // TOKEN_REFRESHED: only update session token, don't re-fetch profile
      if (event === 'TOKEN_REFRESHED' && supaSession) {
        setSession(prev => prev ? {
          ...prev,
          token: supaSession.access_token,
          expiresAt: new Date(supaSession.expires_at! * 1000).toISOString(),
        } : prev);
        return;
      }

      if (supaSession?.user) {
        try {
          const result = await buildUserFromSession(supaSession);
          if (mounted && result) {
            setUser(result.user);
            setSession(result.session);
            setCachedAuth(result.user, result.session);
          }
        } catch {
          // Profile fetch failed — keep current state
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: AuthCredentials) => {
    const result = await authService.login(credentials);
    setUser(result.user);
    setSession(result.session);
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    const result = await authService.signup(data);
    setUser(result.user);
    setSession(result.session);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setSession(null);
    resetPrefetch();
  }, []);

  const updateUser = useCallback((updates: { displayName?: string; username?: string; avatarUrl?: string }) => {
    if (!user) throw new Error('Non connecté');
    // Optimistic update
    const prevUser = user;
    const updated = { ...user, ...updates };
    setUser(updated);
    setCachedAuth(updated, session);
    // Fire async
    authService.updateUserAsync(user.id, updates).then((u) => {
      setUser(u);
      setCachedAuth(u, session);
    }).catch(() => {
      // Revert on failure
      setUser(prevUser);
      setCachedAuth(prevUser, session);
    });
  }, [user, session]);

  const updatePassword = useCallback(async (_oldPassword: string, newPassword: string): Promise<void> => {
    if (!user) throw new Error('Non connecté');
    await authService.updatePasswordAsync(newPassword);
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      setCachedAuth(null, null);
      return;
    }

    const { data: { session: supaSession } } = await supabase.auth.getSession();
    if (supaSession?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id' as never, supaSession.user.id)
        .single();
      if (profile) {
        const p = profile as unknown as Record<string, unknown>;
        const u: User = {
          id: p.id as string,
          username: p.username as string,
          displayName: p.display_name as string,
          role: (p.role as 'admin' | 'user') || 'user',
          createdAt: p.created_at as string,
          avatarUrl: (p.avatar_url as string) || undefined,
        };
        const s: Session = {
          userId: supaSession.user.id,
          token: supaSession.access_token,
          expiresAt: new Date(supaSession.expires_at! * 1000).toISOString(),
        };
        setUser(u);
        setSession(s);
        setCachedAuth(u, s);
      }
    }
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, login, signup, logout, updateUser, updatePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
