'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { useAuthStore } from './store';
import { useNotifications } from '@shared/state/notifications';

interface LoginFormProps {
    redirectTo?: string;
    onSuccess?: () => void;
}

export default function LoginForm({ redirectTo = '/dashboard', onSuccess }: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const isLoading = useAuthStore((state) => state.isLoading);
    const notify = useNotifications((state) => state.add);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        const success = await login(email, password, rememberMe);

        if (success) {
            notify({
                title: 'Welcome back!',
                message: 'You have successfully signed in.',
                kind: 'success',
            });
            
            if (onSuccess) {
                onSuccess();
            } else {
                router.push(redirectTo);
            }
        } else {
            notify({
                title: 'Sign in failed',
                message: 'Please check your credentials and try again.',
                kind: 'error',
            });
            
            setErrors({
                submit: 'Invalid email or password. Please try again.',
            });
        }
    };

    return (
        <Card className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center mb-6">
                    <h1 className="text-xl font-semibold mb-2">Sign in to Consultflow</h1>
                    <p className="text-sm text-deep-navy/70">
                        Enter your credentials to access your account
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-deep-navy mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={[
                                'w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors',
                                errors.email
                                    ? 'border-coral focus-visible:ring-coral'
                                    : 'border-medium/60 focus-visible:ring-cobalt focus-visible:ring-2',
                            ].join(' ')}
                            placeholder="you@example.com"
                            disabled={isLoading}
                            autoComplete="email"
                            autoFocus
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-coral">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-deep-navy mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={[
                                'w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors',
                                errors.password
                                    ? 'border-coral focus-visible:ring-coral'
                                    : 'border-medium/60 focus-visible:ring-cobalt focus-visible:ring-2',
                            ].join(' ')}
                            placeholder="Enter your password"
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                        {errors.password && (
                            <p className="mt-1 text-xs text-coral">{errors.password}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="rounded border-medium/60"
                                disabled={isLoading}
                            />
                            Remember me
                        </label>
                        
                        <button
                            type="button"
                            className="text-sm text-cobalt hover:underline"
                            disabled={isLoading}
                        >
                            Forgot password?
                        </button>
                    </div>

                    {errors.submit && (
                        <div className="rounded-xl bg-coral/10 border border-coral/20 p-3">
                            <p className="text-sm text-coral">{errors.submit}</p>
                        </div>
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    size="lg"
                >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>

                <div className="text-center">
                    <p className="text-xs text-deep-navy/70">
                        Don&apos;t have an account?{' '}
                        <button
                            type="button"
                            className="text-cobalt hover:underline"
                            disabled={isLoading}
                        >
                            Request access
                        </button>
                    </p>
                </div>
            </form>
        </Card>
    );
}