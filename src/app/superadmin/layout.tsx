'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SuperAdminSidebar } from '@features/superadmin/components/SuperAdminSidebar';
import { SuperAdminNavbar } from '@features/superadmin/components/SuperAdminNavbar';
import { useSuperAdminStore } from '@features/superadmin/store';

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useSuperAdminStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/superadmin/login') return;

    if (!isAuthenticated) {
      router.push('/superadmin/login');
    }
  }, [router, pathname, isAuthenticated]);

  // Don't render layout for login page
  if (pathname === '/superadmin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SuperAdminNavbar />
      <div className="flex">
        <SuperAdminSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}