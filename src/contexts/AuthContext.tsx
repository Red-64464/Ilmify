'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    // Restore session on mount
    const existingUser = authService.getUser();
    const existingSession = authService.getSession();
    if (existingUser && existingSession) {
      setUser(existingUser);
      setSession(existingSession);
    }
    setIsLoading(false);
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

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
