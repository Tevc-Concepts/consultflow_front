import { User, AuthResponse, LoginCredentials } from '@entities/user/types';
import { frappeApi } from '@shared/api/frappe';

class AuthService {
    private baseUrl: string;
    private currentUser: User | null = null;
    private sessionId: string | null = null;

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        this.loadSession();
    }

    private loadSession() {
        if (typeof window !== 'undefined') {
            this.sessionId = localStorage.getItem('consultflow_sid');
            const userData = localStorage.getItem('consultflow_user');
            if (userData) {
                try {
                    this.currentUser = JSON.parse(userData);
                } catch (error) {
                    console.error('Failed to parse stored user data:', error);
                    this.clearSession();
                }
            }
        }
    }

    private saveSession(user: User, sessionId: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('consultflow_sid', sessionId);
            localStorage.setItem('consultflow_user', JSON.stringify(user));
            this.currentUser = user;
            this.sessionId = sessionId;
        }
    }

    private clearSession() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('consultflow_sid');
            localStorage.removeItem('consultflow_user');
            this.currentUser = null;
            this.sessionId = null;
        }
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const frappeResponse = await frappeApi.login(credentials.email, credentials.password);
            
            // Convert Frappe response to our User interface
            const user: User = {
                id: frappeResponse.user,
                email: frappeResponse.email,
                full_name: frappeResponse.full_name,
                role: this.mapFrappeRole(frappeResponse.roles),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_active: true,
                preferences: {
                    currency: 'NGN',
                    theme: 'system',
                    notifications: {
                        email: true,
                        push: true,
                        in_app: true,
                    },
                    dashboard: {
                        default_view: 'summary',
                        default_period: '30',
                    },
                },
            };

            // Extract session ID from cookies or response
            const sessionId = this.extractSessionId();
            
            if (sessionId) {
                this.saveSession(user, sessionId);
                return {
                    success: true,
                    message: 'Login successful',
                    user,
                    session: {
                        sid: sessionId,
                        user_id: user.id,
                        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                        created_at: new Date().toISOString(),
                    },
                };
            }

            return {
                success: false,
                message: 'Failed to extract session information',
            };
        } catch (error: any) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message || 'Network error occurred during login',
                errors: { general: error.message },
            };
        }
    }

    async logout(): Promise<boolean> {
        try {
            if (this.sessionId) {
                await frappeApi.logout();
            }
            this.clearSession();
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            this.clearSession(); // Clear local session anyway
            return false;
        }
    }

    async refreshSession(): Promise<boolean> {
        try {
            if (!this.sessionId) return false;

            // Test the current session by making a simple API call
            const isValid = await frappeApi.testConnection();
            
            if (isValid && this.currentUser) {
                return true;
            }

            this.clearSession();
            return false;
        } catch (error) {
            console.error('Session refresh error:', error);
            this.clearSession();
            return false;
        }
    }

    private mapFrappeRole(roles: string[]): 'Consultant' | 'Client' | 'Accountant' | 'Admin' {
        // Map Frappe roles to our application roles
        if (roles.includes('Administrator')) return 'Admin';
        if (roles.includes('Accounts Manager') || roles.includes('Accountant')) return 'Accountant';
        if (roles.includes('Consultant')) return 'Consultant';
        return 'Client'; // Default role
    }

    private extractSessionId(): string | null {
        // Extract session ID from cookies
        if (typeof window !== 'undefined') {
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'sid' || name === 'session_id') {
                    return value;
                }
            }
        }
        return null;
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    getSessionId(): string | null {
        return this.sessionId;
    }

    isAuthenticated(): boolean {
        return this.currentUser !== null && this.sessionId !== null;
    }

    hasRole(role: string): boolean {
        return this.currentUser?.role === role;
    }

    canAccess(requiredRoles: string[]): boolean {
        return this.currentUser ? requiredRoles.includes(this.currentUser.role) : false;
    }
}

export const authService = new AuthService();
export default AuthService;