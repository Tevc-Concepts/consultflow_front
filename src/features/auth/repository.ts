/**
 * Authentication Repository
 * Handles both demo mode (LocalStorage) and live mode (API) authentication
 */

export type AuthMode = 'demo' | 'live';
export type UserRole = 'consultant' | 'client';

export type User = {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  company?: string;
  avatar?: string;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type AuthSession = {
  user: User;
  token?: string;
  expiresAt?: string;
  mode: AuthMode;
};

const STORAGE_KEYS = {
  DEMO_USERS: 'consultflow:auth:demo-users:v1',
  SESSION: 'consultflow:auth:session:v1',
  MODE: 'consultflow:auth:mode:v1',
} as const;

// Demo user database
const DEFAULT_DEMO_USERS: (User & { password: string })[] = [
  {
    id: 'consultant1',
    username: 'consultant1',
    password: 'demo123',
    email: 'consultant@consultflow.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'consultant',
    company: 'ConsultFlow Advisory',
    avatar: '👩‍💼'
  },
  {
    id: 'consultant2',
    username: 'accountant1',
    password: 'demo123',
    email: 'accountant@consultflow.com',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'consultant',
    company: 'ConsultFlow Advisory',
    avatar: '👨‍💻'
  },
  {
    id: 'client1',
    username: 'client1',
    password: 'demo123',
    email: 'client@techstartup.com',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    role: 'client',
    company: 'TechStartup Inc.',
    avatar: '👩‍🚀'
  },
  {
    id: 'client2',
    username: 'ceo1',
    password: 'demo123',
    email: 'ceo@retailcorp.com',
    firstName: 'David',
    lastName: 'Kim',
    role: 'client',
    company: 'RetailCorp Ltd.',
    avatar: '👨‍💼'
  }
];

class AuthRepository {
  private getFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private saveToStorage<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private removeFromStorage(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }

  // Initialize demo users database
  initDemoUsers(): void {
    const existingUsers = this.getFromStorage(STORAGE_KEYS.DEMO_USERS, []);
    if (existingUsers.length === 0) {
      this.saveToStorage(STORAGE_KEYS.DEMO_USERS, DEFAULT_DEMO_USERS);
    }
  }

  // Demo mode authentication
  async loginDemo(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = this.getFromStorage(STORAGE_KEYS.DEMO_USERS, DEFAULT_DEMO_USERS);
    const user = users.find(u => 
      u.username === credentials.username && 
      u.password === credentials.password
    );

    if (!user) {
      return {
        success: false,
        error: 'Invalid username or password'
      };
    }

    // Create session
    const session: AuthSession = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company,
        avatar: user.avatar,
      },
      token: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      mode: 'demo'
    };

    this.saveToStorage(STORAGE_KEYS.SESSION, session);
    this.saveToStorage(STORAGE_KEYS.MODE, 'demo');

    return {
      success: true,
      user: session.user
    };
  }

  // Live mode authentication (API integration ready)
  async loginLive(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // In a real implementation, this would call the actual API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        return {
          success: false,
          error: errorData.message || 'Authentication failed'
        };
      }

      const data = await response.json();
      
      // Create session from API response
      const session: AuthSession = {
        user: data.user,
        token: data.token || data.sid,
        expiresAt: data.expiresAt,
        mode: 'live'
      };

      this.saveToStorage(STORAGE_KEYS.SESSION, session);
      this.saveToStorage(STORAGE_KEYS.MODE, 'live');

      return {
        success: true,
        user: session.user
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  // Get current session
  getSession(): AuthSession | null {
    const session = this.getFromStorage<AuthSession | null>(STORAGE_KEYS.SESSION, null);
    
    if (!session) return null;

    // Check if session is expired
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      this.logout();
      return null;
    }

    return session;
  }

  // Get current user
  getCurrentUser(): User | null {
    const session = this.getSession();
    return session?.user || null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  // Get current auth mode
  getAuthMode(): AuthMode {
    return this.getFromStorage(STORAGE_KEYS.MODE, 'demo');
  }

  // Set auth mode
  setAuthMode(mode: AuthMode): void {
    this.saveToStorage(STORAGE_KEYS.MODE, mode);
  }

  // Check if user has specific role
  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Get user's display name
  getUserDisplayName(): string {
    const user = this.getCurrentUser();
    if (!user) return 'Unknown User';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    return user.username || user.email || 'User';
  }

  // Logout
  async logout(): Promise<void> {
    const session = this.getSession();
    
    if (session?.mode === 'live' && session.token) {
      // In live mode, notify the server about logout
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.warn('Failed to notify server about logout:', error);
      }
    }

    // Clear local session
    this.removeFromStorage(STORAGE_KEYS.SESSION);
  }

  // Validate session token (for live mode)
  async validateSession(): Promise<boolean> {
    const session = this.getSession();
    
    if (!session) return false;
    
    // Demo mode sessions are always valid until expiry
    if (session.mode === 'demo') return true;
    
    // For live mode, validate with server
    if (session.token) {
      try {
        const response = await fetch('/api/auth/validate', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.token}`,
          },
        });
        
        if (!response.ok) {
          this.logout();
          return false;
        }
        
        return true;
      } catch (error) {
        console.warn('Session validation failed:', error);
        return false;
      }
    }
    
    return false;
  }

  // Add a demo user (for testing)
  addDemoUser(user: User & { password: string }): void {
    const users = this.getFromStorage(STORAGE_KEYS.DEMO_USERS, DEFAULT_DEMO_USERS);
    users.push(user);
    this.saveToStorage(STORAGE_KEYS.DEMO_USERS, users);
  }

  // Get all demo users (for admin/testing purposes)
  getDemoUsers(): (User & { password: string })[] {
    return this.getFromStorage(STORAGE_KEYS.DEMO_USERS, DEFAULT_DEMO_USERS);
  }

  // Clear all auth data (for testing/reset)
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.removeFromStorage(key);
    });
  }
}

export const authRepository = new AuthRepository();