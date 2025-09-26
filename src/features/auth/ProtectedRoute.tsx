/**
 * Protected Route Component
 * Provides role-based access control and authentication checks
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from './store';
import type { UserRole } from './repository';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireAuth?: boolean;
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  requireAuth = true,
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    checkAuth 
  } = useAuthStore();
  
  const [isChecking, setIsChecking] = React.useState(true);

  // Check authentication status on mount
  React.useEffect(() => {
    const performAuthCheck = async () => {
      if (requireAuth) {
        await checkAuth();
      }
      setIsChecking(false);
    };

    performAuthCheck();
  }, [checkAuth, requireAuth]);

  // Redirect logic
  React.useEffect(() => {
    if (!isChecking && !isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push(fallbackPath);
        return;
      }

      if (requiredRole && user && user.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        if (user.role === 'consultant') {
          router.push('/dashboard');
        } else if (user.role === 'client') {
          router.push('/client');
        } else {
          router.push(fallbackPath);
        }
        return;
      }
    }
  }, [isChecking, isLoading, isAuthenticated, user, requiredRole, requireAuth, router, fallbackPath]);

  // Show loading state while checking authentication
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-12 h-12 border-4 border-cobalt border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-lg font-semibold text-deep-navy mb-2">
            Checking Authentication...
          </h2>
          <p className="text-sm text-deep-navy/70">
            Please wait while we verify your access.
          </p>
        </motion.div>
      </div>
    );
  }

  // Show access denied if not authenticated and auth is required
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">🔐</div>
            <h1 className="text-2xl font-semibold text-deep-navy mb-2">
              Authentication Required
            </h1>
            <p className="text-deep-navy/70 mb-6">
              You need to sign in to access this page.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push(fallbackPath)}
                className="w-full"
              >
                Go to Login
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show access denied if wrong role
  if (requiredRole && user && user.role !== requiredRole) {
    const roleDisplayName = requiredRole === 'consultant' ? 'Consultant' : 'Client';
    const currentRoleDisplayName = user.role === 'consultant' ? 'Consultant' : 'Client';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-semibold text-deep-navy mb-2">
              Access Restricted
            </h1>
            <p className="text-deep-navy/70 mb-4">
              This page is only available for <strong>{roleDisplayName}</strong> users.
            </p>
            <p className="text-sm text-deep-navy/60 mb-6">
              You are currently logged in as a <strong>{currentRoleDisplayName}</strong>.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  // Redirect to appropriate dashboard based on role
                  if (user.role === 'consultant') {
                    router.push('/dashboard');
                  } else if (user.role === 'client') {
                    router.push('/client');
                  }
                }}
                className="w-full"
              >
                Go to My Dashboard
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
}