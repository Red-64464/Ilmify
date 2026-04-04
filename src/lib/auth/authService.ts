import type { User, Session, AuthCredentials, SignupData } from '@/types';

// Auth service interface - abstracted for future Supabase migration
export interface IAuthService {
  login(credentials: AuthCredentials): Promise<{ user: User; session: Session }>;
  signup(data: SignupData): Promise<{ user: User; session: Session }>;
  logout(): Promise<void>;
  getSession(): Session | null;
  getUser(): User | null;
  isAdmin(): boolean;
}

const STORAGE_KEYS = {
  users: 'ilmify-users',
  session: 'ilmify-session',
  currentUser: 'ilmify-current-user',
} as const;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateToken(): string {
  return `tok_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

interface StoredUser extends User {
  passwordHash: string;
}

// Simple hash for local mock - NOT for production use
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

function getStoredUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.users);
  if (!stored) {
    // Seed admin user
    const adminUser: StoredUser = {
      id: 'user-admin',
      username: 'admin',
      displayName: 'Administrateur',
      role: 'admin',
      createdAt: new Date().toISOString(),
      passwordHash: simpleHash('admin'),
    };
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([adminUser]));
    return [adminUser];
  }
  return JSON.parse(stored);
}

function saveUsers(users: StoredUser[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

export class LocalAuthService implements IAuthService {
  async login(credentials: AuthCredentials): Promise<{ user: User; session: Session }> {
    const users = getStoredUsers();
    const user = users.find(
      (u) => u.username === credentials.username && u.passwordHash === simpleHash(credentials.password)
    );

    if (!user) {
      throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
    }

    const session: Session = {
      userId: user.id,
      token: generateToken(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    const { passwordHash: _, ...safeUser } = user;
    
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(safeUser));

    return { user: safeUser, session };
  }

  async signup(data: SignupData): Promise<{ user: User; session: Session }> {
    const users = getStoredUsers();
    
    if (users.some((u) => u.username === data.username)) {
      throw new Error('Ce nom d\'utilisateur est déjà pris');
    }

    const newUser: StoredUser = {
      id: `user-${generateId()}`,
      username: data.username,
      displayName: data.displayName,
      role: 'user',
      createdAt: new Date().toISOString(),
      passwordHash: simpleHash(data.password),
    };

    users.push(newUser);
    saveUsers(users);

    const session: Session = {
      userId: newUser.id,
      token: generateToken(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const { passwordHash: _, ...safeUser } = newUser;

    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(safeUser));

    return { user: safeUser, session };
  }

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.session);
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }

  getSession(): Session | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEYS.session);
    if (!stored) return null;
    const session: Session = JSON.parse(stored);
    if (new Date(session.expiresAt) < new Date()) {
      this.logout();
      return null;
    }
    return session;
  }

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const session = this.getSession();
    if (!session) return null;
    const stored = localStorage.getItem(STORAGE_KEYS.currentUser);
    return stored ? JSON.parse(stored) : null;
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  }
}

// Singleton instance
export const authService = new LocalAuthService();
