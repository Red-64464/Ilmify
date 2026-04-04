'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, Session, AuthCredentials, SignupData } from '@/types';
import { authService, setCachedAuth } from '@/lib/auth/authService';
import { supabase } from '@/lib/supabase/client';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: AuthCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: { displayName?: string; username?: string; avatarUrl?: string }) => void;
  updatePassword: (oldPassword: string, newPassword: string) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Supabase auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: supaSession } }) => {
      if (supaSession?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supaSession.user.id)
          .single();

        if (profile) {
          const u: User = {
            id: profile.id,
            username: profile.username,
            displayName: profile.display_name,
            role: profile.role as 'admin' | 'user',
            createdAt: profile.created_at,
            avatarUrl: profile.avatar_url || undefined,
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
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, supaSession) => {
      if (event === 'SIGNED_OUT' || !supaSession) {
        setUser(null);
        setSession(null);
        setCachedAuth(null, null);
        return;
      }

      if (supaSession?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supaSession.user.id)
          .single();

        if (profile) {
          const u: User = {
            id: profile.id,
            username: profile.username,
            displayName: profile.display_name,
            role: profile.role as 'admin' | 'user',
            createdAt: profile.created_at,
            avatarUrl: profile.avatar_url || undefined,
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
    });

    return () => subscription.unsubscribe();
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
  }, []);

  const updateUser = useCallback((updates: { displayName?: string; username?: string; avatarUrl?: string }) => {
    if (!user) throw new Error('Non connecté');
    // Optimistic update
    const updated = { ...user, ...updates };
    setUser(updated);
    setCachedAuth(updated, session);
    // Fire async
    authService.updateUserAsync(user.id, updates).then((u) => {
      setUser(u);
      setCachedAuth(u, session);
    });
  }, [user, session]);

  const updatePassword = useCallback((_oldPassword: string, newPassword: string) => {
    if (!user) throw new Error('Non connecté');
    authService.updatePasswordAsync(newPassword);
  }, [user]);

  const refreshUser = useCallback(async () => {
    const { data: { session: supaSession } } = await supabase.auth.getSession();
    if (supaSession?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supaSession.user.id)
        .single();
      if (profile) {
        const u: User = {
          id: profile.id,
          username: profile.username,
          displayName: profile.display_name,
          role: profile.role as 'admin' | 'user',
          createdAt: profile.created_at,
          avatarUrl: profile.avatar_url || undefined,
        };
        setUser(u);
        setCachedAuth(u, session);
      }
    }
  }, [session]);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, login, signup, logout, updateUser, updatePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
