/**
 * Authentication Repository
 * Handles both demo mode (LocalStorage) and live mode (API) authentication
 * Integrated with ConsultFlow comprehensive database
 */

import { consultFlowDB } from '../../shared/api/consultflowDB';
import { getDemoCredentials } from '../../shared/hooks/useConsultFlowDB';

export type AuthMode = 'demo' | 'live';
export type UserRole = 'consultant' | 'client' | 'superadmin';

export type User = {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  company?: string;
  avatar?: string;
  subscriptionPlan?: string;
  consultantId?: string;
  companies?: string[];
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
  SESSION: 'consultflow:auth:session:v1',
  MODE: 'consultflow:auth:mode:v1',
} as const;

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

  // Initialize demo database
  initDemoUsers(): void {
    // Database auto-initializes via consultFlowDB constructor
    // Just ensure it's ready
    try {
      const data = consultFlowDB.getAllData();
      console.log('✅ ConsultFlow Auth initialized with comprehensive database:', {
        consultants: data.consultants?.length || 0,
        clients: data.clients?.length || 0,
        superadmins: data.superAdmins?.length || 0,
      });
    } catch (error) {
      console.warn('⚠️ Failed to initialize ConsultFlow database:', error);
    }
  }

  // Demo mode authentication using comprehensive database
  async loginDemo(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let authenticatedUser: User | null = null;

    try {
      // Try SuperAdmin first
      if (credentials.username === 'admin' || credentials.username.includes('admin')) {
        const superAdmin = consultFlowDB.authenticateSuperAdmin(credentials.username, credentials.password);
        if (superAdmin) {
          authenticatedUser = {
            id: superAdmin.id,
            username: superAdmin.username,
            email: superAdmin.username + '@consultflow.com',
            firstName: 'Super',
            lastName: 'Administrator',
            role: 'superadmin',
            company: 'ConsultFlow Platform',
            avatar: '🛡️'
          };
        }
      }

      // Try Consultant authentication
      if (!authenticatedUser) {
        const consultant = consultFlowDB.authenticateConsultant(credentials.username, credentials.password);
        if (consultant) {
          const subscriptionPlans = consultFlowDB.getSubscriptionPlans();
          const plan = subscriptionPlans.find(p => p.id === consultant.subscriptionPlanId);
          
          authenticatedUser = {
            id: consultant.id,
            username: consultant.email,
            email: consultant.email,
            firstName: consultant.name.split(' ')[0],
            lastName: consultant.name.split(' ')[1] || '',
            role: 'consultant',
            company: consultant.company || 'ConsultFlow Advisory',
            avatar: consultant.avatar || '👩‍💼',
            subscriptionPlan: plan?.name || 'Unknown'
          };
        }
      }

      // Try Client authentication
      if (!authenticatedUser) {
        const client = consultFlowDB.authenticateClient(credentials.username, credentials.password);
        if (client) {
          // Get client's company names for display
          const clientCompanies = consultFlowDB.getClientCompanies(client.id);
          const primaryCompany = clientCompanies[0]?.name || 'Unknown Company';
          
          authenticatedUser = {
            id: client.id,
            username: client.email,
            email: client.email,
            firstName: client.name.split(' ')[0],
            lastName: client.name.split(' ')[1] || '',
            role: 'client',
            company: primaryCompany,
            avatar: client.avatar || '👨‍💼',
            consultantId: client.consultantId,
            companies: client.companies
          };
        }
      }

      if (!authenticatedUser) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      // Create session
      const session: AuthSession = {
        user: authenticatedUser,
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

    } catch (error) {
      console.error('Demo login error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
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

  // Get demo credentials helper
  getDemoCredentials() {
    return getDemoCredentials();
  }

  // Clear all auth data (for testing/reset)
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.removeFromStorage(key);
    });
  }

  // Legacy compatibility methods (now use comprehensive database)
  addDemoUser(): void {
    console.warn('addDemoUser is deprecated. Use consultFlowDB directly.');
  }

  getDemoUsers(): any[] {
    const credentials = getDemoCredentials();
    return [
      ...credentials.consultants.map(c => ({ ...c, role: 'consultant' })),
      ...credentials.clients.map(c => ({ ...c, role: 'client' })),
      { ...credentials.superAdmin, role: 'superadmin' }
    ];
  }
}

export const authRepository = new AuthRepository();