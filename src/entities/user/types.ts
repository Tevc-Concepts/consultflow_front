export interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'Consultant' | 'Client' | 'Accountant' | 'Admin';
    avatar?: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    preferences: UserPreferences;
}

export interface UserPreferences {
    currency: 'NGN' | 'USD' | 'CFA';
    theme: 'light' | 'dark' | 'system';
    notifications: {
        email: boolean;
        push: boolean;
        in_app: boolean;
    };
    dashboard: {
        default_view: 'summary' | 'detailed';
        default_period: '30' | '90' | 'ytd' | 'custom';
    };
}

export interface AuthSession {
    sid: string;
    user_id: string;
    expires_at: string;
    created_at: string;
    ip_address?: string;
    user_agent?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
    remember_me?: boolean;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    user?: User;
    session?: AuthSession;
    errors?: Record<string, string>;
}