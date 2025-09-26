'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from './store';
import Skeleton from '@shared/components/Skeleton';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    redirectTo?: string;
    fallback?: React.ReactNode;
}

export default function ProtectedRoute({
    children,
    allowedRoles = [],
    redirectTo = '/login',
    fallback
}: ProtectedRouteProps) {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, refreshSession } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (!isAuthenticated && !isLoading) {
                // Try to refresh session first
                const refreshed = await refreshSession();
                if (!refreshed) {
                    router.push(redirectTo);
                    return;
                }
            }

            // Check role permissions
            if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
                router.push('/403'); // Forbidden
                return;
            }

            setIsChecking(false);
        };

        checkAuth();
    }, [isAuthenticated, user, isLoading, refreshSession, router, redirectTo, allowedRoles]);

    if (isLoading || isChecking) {
        return fallback || (
            <div className="min-h-screen flex items-center justify-center">
                <div className="space-y-4 w-full max-w-md">
                    <Skeleton className="h-8 w-3/4 mx-auto" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null; // Will redirect
    }

    return <>{children}</>;
}