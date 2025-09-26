/**
 * Authentication Feature Index
 * Exports all auth components, hooks, and types
 */

// Store and hooks
export { useAuthStore } from './store';
export type { AuthState } from './store';

// Repository and types  
export { authRepository } from './repository';
export type { 
  User, 
  AuthMode, 
  UserRole, 
  LoginCredentials, 
  AuthSession 
} from './repository';

// Components
export { default as ProtectedRoute } from './ProtectedRoute';
export type { ProtectedRouteProps } from './ProtectedRoute';