'use client';

import * as React from 'react';
import { useAuthStore } from '@features/auth/store';
import { useNotifications } from '@shared/state/notifications';
import { ClientPortal } from '@features/client-portal';
import ProtectedRoute from '@features/auth/ProtectedRoute';

export default function ClientPage() {
    const role = useAuthStore(s => s.user?.role);
    const notify = useNotifications(s => s.add);

    // Redirect non-clients
    React.useEffect(() => {
        if (role && role !== 'client') {
            notify({ 
                title: 'Access Restricted', 
                message: 'This page is only available for client users.', 
                kind: 'warning' 
            });
        }
    }, [role, notify]);

    return (
        <ProtectedRoute requiredRole="client">
            <ClientPortal />
        </ProtectedRoute>
    );
}