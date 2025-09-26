'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@entities/user/types';
import { authService } from './service';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    sessionId: string | null;
    
    // Actions
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshSession: () => Promise<boolean>;
    initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            sessionId: null,

            setUser: (user) => {
                set({
                    user,
                    isAuthenticated: user !== null,
                    sessionId: user ? authService.getSessionId() : null,
                });
            },

            setLoading: (isLoading) => {
                set({ isLoading });
            },

            login: async (email, password, rememberMe = false) => {
                set({ isLoading: true });
                
                try {
                    const response = await authService.login({
                        email,
                        password,
                        remember_me: rememberMe,
                    });

                    if (response.success && response.user) {
                        set({
                            user: response.user,
                            isAuthenticated: true,
                            sessionId: authService.getSessionId(),
                            isLoading: false,
                        });
                        return true;
                    } else {
                        set({ isLoading: false });
                        return false;
                    }
                } catch (error) {
                    console.error('Login failed:', error);
                    set({ isLoading: false });
                    return false;
                }
            },

            logout: async () => {
                set({ isLoading: true });
                
                try {
                    await authService.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    set({
                        user: null,
                        isAuthenticated: false,
                        sessionId: null,
                        isLoading: false,
                    });
                }
            },

            refreshSession: async () => {
                const success = await authService.refreshSession();
                
                if (success) {
                    const user = authService.getCurrentUser();
                    set({
                        user,
                        isAuthenticated: true,
                        sessionId: authService.getSessionId(),
                    });
                } else {
                    set({
                        user: null,
                        isAuthenticated: false,
                        sessionId: null,
                    });
                }
                
                return success;
            },

            initialize: () => {
                const user = authService.getCurrentUser();
                const sessionId = authService.getSessionId();
                
                set({
                    user,
                    isAuthenticated: user !== null && sessionId !== null,
                    sessionId,
                });
            },
        }),
        {
            name: 'consultflow-auth',
            partialize: (state) => ({
                user: state.user,
                sessionId: state.sessionId,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// Initialize auth state on app start
if (typeof window !== 'undefined') {
    useAuthStore.getState().initialize();
}