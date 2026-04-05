import type { User, Session, AuthCredentials, SignupData } from '@/types';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase/client';

// Auth service interface
export interface IAuthService {
  login(credentials: AuthCredentials): Promise<{ user: User; session: Session }>;
  signup(data: SignupData): Promise<{ user: User; session: Session }>;
  logout(): Promise<void>;
  getSession(): Session | null;
  getUser(): User | null;
  isAdmin(): boolean;
}

// Cache for sync access (populated by AuthContext listener)
let cachedUser: User | null = null;
let cachedSession: Session | null = null;

export function setCachedAuth(user: User | null, session: Session | null) {
  cachedUser = user;
  cachedSession = session;
}

function profileToUser(profile: {
  id: string;
  username: string;
  display_name: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}): User {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    role: profile.role as 'admin' | 'user',
    createdAt: profile.created_at,
    avatarUrl: profile.avatar_url || undefined,
  };
}

export class SupabaseAuthService implements IAuthService {
  async login(credentials: AuthCredentials): Promise<{ user: User; session: Session }> {
    // Supabase Auth uses email — we use username@ilmify.app as convention
    const email = `${credentials.username}@ilmify.app`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: credentials.password,
    });

    if (error || !data.user || !data.session) {
      throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profil introuvable');
    }

    const user = profileToUser(profile);
    const session: Session = {
      userId: data.user.id,
      token: data.session.access_token,
      expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
    };

    setCachedAuth(user, session);
    return { user, session };
  }

  async signup(data: SignupData): Promise<{ user: User; session: Session }> {
    const email = `${data.username}@ilmify.app`;
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          display_name: data.displayName,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('Ce nom d\'utilisateur est déjà pris');
      }
      throw new Error(error.message);
    }

    if (!authData.user) {
      throw new Error('Erreur lors de l\'inscription');
    }

    // If email confirmation is enabled, session will be null.
    // Try signing in immediately (works if auto-confirm is off but user was created).
    let activeSession = authData.session;
    if (!activeSession) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      });
      if (signInError || !signInData.session) {
        throw new Error(
          'Inscription réussie mais connexion impossible. ' +
          'Désactivez la confirmation email dans Supabase : Authentication → Providers → Email → décocher "Confirm email"'
        );
      }
      activeSession = signInData.session;
    }

    // Profile is auto-created by trigger, fetch it
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    const user: User = profile ? profileToUser(profile) : {
      id: authData.user.id,
      username: data.username,
      displayName: data.displayName,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    const session: Session = {
      userId: authData.user.id,
      token: activeSession.access_token,
      expiresAt: new Date(activeSession.expires_at! * 1000).toISOString(),
    };

    setCachedAuth(user, session);
    return { user, session };
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    setCachedAuth(null, null);
  }

  getSession(): Session | null {
    return cachedSession;
  }

  getUser(): User | null {
    return cachedUser;
  }

  isAdmin(): boolean {
    return cachedUser?.role === 'admin';
  }

  // --- User management methods ---

  async getAllUsersAsync(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(profileToUser);
  }

  // Sync wrapper for backward compat (returns cached or empty)
  getAllUsers(): User[] {
    return [];
  }

  async updateUserAsync(userId: string, updates: { displayName?: string; username?: string; avatarUrl?: string }): Promise<User> {
    const dbUpdates: Record<string, string> = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        throw new Error('Ce nom d\'utilisateur est déjà pris');
      }
      throw new Error(error.message);
    }

    const user = profileToUser(data);
    if (cachedUser && cachedUser.id === userId) {
      setCachedAuth(user, cachedSession);
    }
    return user;
  }

  updateUser(userId: string, updates: { displayName?: string; username?: string; avatarUrl?: string }): User {
    // Fire async update, return optimistic cached user
    this.updateUserAsync(userId, updates);
    if (cachedUser && cachedUser.id === userId) {
      const updated = { ...cachedUser, ...updates };
      setCachedAuth(updated, cachedSession);
      return updated;
    }
    throw new Error('Utilisateur introuvable');
  }

  async updatePasswordAsync(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  updatePassword(_userId: string, _oldPassword: string, newPassword: string): void {
    this.updatePasswordAsync(newPassword);
  }

  async deleteUserAsync(userId: string): Promise<void> {
    // Delete profile (cascade will clean up data)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (error) throw new Error(error.message);
  }

  deleteUser(userId: string): void {
    this.deleteUserAsync(userId);
  }

  async createUserAdmin(data: SignupData & { role?: 'admin' | 'user' }): Promise<User> {
    // Admin creates user via signup, then updates role
    const email = `${data.username}@ilmify.app`;
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          display_name: data.displayName,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('Ce nom d\'utilisateur est déjà pris');
      }
      throw new Error(error.message);
    }

    if (!authData.user) throw new Error('Erreur lors de la création');

    // Update role if admin
    if (data.role === 'admin') {
      await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', authData.user.id);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return profile ? profileToUser(profile) : {
      id: authData.user.id,
      username: data.username,
      displayName: data.displayName,
      role: data.role || 'user',
      createdAt: new Date().toISOString(),
    };
  }

  async updateUserRoleAsync(userId: string, role: 'admin' | 'user'): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return profileToUser(data);
  }

  updateUserRole(userId: string, role: 'admin' | 'user'): User {
    this.updateUserRoleAsync(userId, role);
    return { id: userId, username: '', displayName: '', role, createdAt: '' };
  }

  async adminUpdateUserProfile(userId: string, updates: { displayName?: string; username?: string }): Promise<User> {
    const dbUpdates: Record<string, string> = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.username !== undefined) dbUpdates.username = updates.username;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        throw new Error('Ce nom d\'utilisateur est déjà pris');
      }
      throw new Error(error.message);
    }
    return profileToUser(data);
  }

  async adminResetPassword(userId: string, newPassword: string): Promise<void> {
    // Use Supabase service role or admin endpoint to reset password
    // Since we use client SDK, we call an edge function or use a workaround:
    // We sign in as the user with their email and reset via supabase auth admin
    // For now, update via supabase.auth.admin if available, otherwise use the profiles approach
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    if (!profile) throw new Error('Utilisateur introuvable');

    // We use a Supabase RPC or direct approach - since admin API isn't available on client,
    // we store a password_hash or use supabase edge function
    // Workaround: Use `supabase.auth.admin.updateUserById` if supabase service role is configured
    // For client-side, we'll create a temporary session approach
    const email = `${profile.username}@ilmify.app`;

    // Try admin API first
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!response.ok) {
        throw new Error('Impossible de réinitialiser le mot de passe (permissions insuffisantes)');
      }
    } catch {
      throw new Error('La réinitialisation de mot de passe nécessite une clé admin Supabase');
    }
  }
}

// Singleton instance
export const authService = new SupabaseAuthService();
