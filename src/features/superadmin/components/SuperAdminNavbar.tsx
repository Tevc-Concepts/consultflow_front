'use client';

import { useRouter } from 'next/navigation';
import { useSuperAdminStore } from '../store';

export function SuperAdminNavbar() {
  const router = useRouter();
  const logout = useSuperAdminStore((state) => state.logout);

  // For demo, environment is always 'demo'
  const environment = 'demo' as const;
  const badgeColor = 'bg-orange-500';
  const badgeText = '🟠 Demo';

  const handleLogout = () => {
    logout();
    router.push('/superadmin/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">ConsultFlow SuperAdmin</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${badgeColor}`}>
              {badgeText}
            </span>
            <button
              onClick={handleLogout}
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}