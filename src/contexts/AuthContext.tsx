'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, Session, AuthCredentials, SignupData } from '@/types';
import { authService } from '@/lib/auth/authService';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: AuthCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: { displayName?: string; username?: string; avatarUrl?: string }) => User;
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
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    return authService.getUser();
  });
  const [session, setSession] = useState<Session | null>(() => {
    if (typeof window === 'undefined') return null;
    return authService.getSession();
  });
  const [isLoading] = useState(() => {
    // Initialized synchronously from local storage
    return false;
  });

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
    const updated = authService.updateUser(user.id, updates);
    setUser(updated);
    return updated;
  }, [user]);

  const updatePassword = useCallback((oldPassword: string, newPassword: string) => {
    if (!user) throw new Error('Non connecté');
    authService.updatePassword(user.id, oldPassword, newPassword);
  }, [user]);

  const refreshUser = useCallback(() => {
    setUser(authService.getUser());
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, login, signup, logout, updateUser, updatePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
