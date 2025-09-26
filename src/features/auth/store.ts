/**
 * Authentication Store using Zustand
 * Manages authentication state, session, and mode switching
 */

import { create, type StateCreator } from 'zustand';
import { authRepository, type User, type AuthMode, type LoginCredentials } from './repository';

export type AuthState = {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mode: AuthMode;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  setMode: (mode: AuthMode) => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  
  // Getters
  getUserDisplayName: () => string;
  hasRole: (role: 'consultant' | 'client') => boolean;
  isDemo: () => boolean;
  isLive: () => boolean;
};

const STORAGE_KEY = 'consultflow:auth:state:v1';

// Initialize auth repository and demo users
if (typeof window !== 'undefined') {
  authRepository.initDemoUsers();
}

function loadInitialState(): Pick<AuthState, 'user' | 'isAuthenticated' | 'mode'> {
  if (typeof window === 'undefined') {
    return { 
      user: null, 
      isAuthenticated: false, 
      mode: 'demo' 
    };
  }

  try {
    const session = authRepository.getSession();
    const mode = authRepository.getAuthMode();

    return {
      user: session?.user || null,
      isAuthenticated: !!session,
      mode,
    };
  } catch {
    return { 
      user: null, 
      isAuthenticated: false, 
      mode: 'demo' 
    };
  }
}

const initializer: StateCreator<AuthState> = (set, get) => {
  const initialState = loadInitialState();
  
  return {
    // Initial state from storage or defaults
    user: initialState.user,
    isAuthenticated: initialState.isAuthenticated,
    isLoading: false,
    mode: initialState.mode,
    error: null,

    // Actions
    login: async (credentials: LoginCredentials) => {
      set({ isLoading: true, error: null });

      try {
        const { mode } = get();
        const result = mode === 'demo' 
          ? await authRepository.loginDemo(credentials)
          : await authRepository.loginLive(credentials);

        if (result.success && result.user) {
          set({ 
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
            error: null 
          });
          
          // Persist state
          persistState();
          
          return true;
        } else {
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: result.error || 'Login failed' 
          });
          
          return false;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        set({ 
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: errorMessage 
        });
        
        return false;
      }
    },

    logout: async () => {
      set({ isLoading: true });

      try {
        await authRepository.logout();
        
        set({ 
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null 
        });

        // Clear persisted state
        clearPersistedState();

        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Logout error:', error);
        set({ isLoading: false });
      }
    },

    setMode: (mode: AuthMode) => {
      authRepository.setAuthMode(mode);
      set({ mode, error: null });
      persistState();
    },

    checkAuth: async () => {
      set({ isLoading: true });

      try {
        const isValid = await authRepository.validateSession();
        const session = authRepository.getSession();
        const mode = authRepository.getAuthMode();

        if (isValid && session) {
          set({ 
            user: session.user,
            isAuthenticated: true,
            mode: session.mode,
            isLoading: false,
            error: null 
          });
        } else {
          set({ 
            user: null,
            isAuthenticated: false,
            mode,
            isLoading: false,
            error: null 
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        set({ 
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null 
        });
      }
    },

    clearError: () => {
      set({ error: null });
    },

    // Getters
    getUserDisplayName: () => {
      return authRepository.getUserDisplayName();
    },

    hasRole: (role: 'consultant' | 'client') => {
      const { user } = get();
      return user?.role === role;
    },

    isDemo: () => {
      const { mode } = get();
      return mode === 'demo';
    },

    isLive: () => {
      const { mode } = get();
      return mode === 'live';
    },
  };
};

export const useAuthStore = create<AuthState>(initializer);

// Persistence helpers
function persistState() {
  if (typeof window === 'undefined') return;
  
  try {
    const { user, isAuthenticated, mode } = useAuthStore.getState();
    const stateToSave = { user, isAuthenticated, mode };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to persist auth state:', error);
  }
}

function clearPersistedState() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear persisted auth state:', error);
  }
}

// Initialize auth check on hydration
if (typeof window !== 'undefined') {
  // Check auth status on page load
  useAuthStore.getState().checkAuth();
  
  // Set up periodic session validation (every 5 minutes)
  setInterval(() => {
    const { isAuthenticated, mode } = useAuthStore.getState();
    if (isAuthenticated && mode === 'live') {
      useAuthStore.getState().checkAuth();
    }
  }, 5 * 60 * 1000);
}