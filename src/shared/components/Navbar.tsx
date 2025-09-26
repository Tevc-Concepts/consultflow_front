/**
 * Responsive Navigation Bar
 * Features user info, environment badge, logout, and mobile drawer
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import { useAuthStore } from '@features/auth/store';

export interface NavbarProps {
  className?: string;
}

// Navigation items based on user role
const getNavigationItems = (role: 'consultant' | 'client' | 'superadmin') => {
  if (role === 'superadmin') {
    return [
      { href: '/dashboard', label: 'Admin Dashboard', icon: '🛡️' },
      { href: '/admin/consultants', label: 'Consultants', icon: '👩‍💼' },
      { href: '/admin/clients', label: 'Clients', icon: '👥' },
      { href: '/admin/subscriptions', label: 'Subscriptions', icon: '💰' },
      { href: '/admin/system', label: 'System', icon: '⚙️' },
    ];
  } else if (role === 'consultant') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: '📊' },
      { href: '/clients', label: 'Clients', icon: '👥' },
      { href: '/reports', label: 'Reports', icon: '📈' },
      { href: '/settings', label: 'Settings', icon: '⚙️' },
    ];
  } else {
    return [
      { href: '/client', label: 'Portal', icon: '🏠' },
      { href: '/client/documents', label: 'Documents', icon: '📄' },
      { href: '/client/reports', label: 'Reports', icon: '📊' },
      { href: '/client/support', label: 'Support', icon: '🎫' },
    ];
  }
};

// Environment badge component
const EnvironmentBadge: React.FC<{ mode: 'demo' | 'live' }> = ({ mode }) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border
        ${mode === 'demo'
          ? 'bg-amber-100 text-amber-800 border-amber-200'
          : 'bg-green-100 text-green-800 border-green-200'
        }
      `}
    >
      <span>{mode === 'demo' ? '🟠' : '🟢'}</span>
      <span className="hidden sm:inline">{mode === 'demo' ? 'Demo Mode' : 'Live Mode'}</span>
      <span className="sm:hidden">{mode === 'demo' ? 'Demo' : 'Live'}</span>
    </motion.div>
  );
};

// User menu dropdown
const UserMenu: React.FC<{ 
  user: any; 
  onLogout: () => void; 
  isOpen: boolean; 
  onToggle: () => void;
}> = ({ user, onLogout, isOpen, onToggle }) => {
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-medium/20 transition-colors"
        data-testid="user-menu-trigger"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-cobalt to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user.avatar || user.firstName?.[0] || user.username?.[0] || '?'}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-deep-navy">
            {user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user.username
            }
          </p>
          <p className="text-xs text-deep-navy/60 capitalize">
            {user.role}
          </p>
        </div>
        <motion.svg
          className="w-4 h-4 text-deep-navy/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 z-50"
          >
            <Card className="p-4 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              {/* User Info */}
              <div className="mb-3 pb-3 border-b border-medium/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cobalt to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                    {user.avatar || user.firstName?.[0] || user.username?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-deep-navy truncate">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.username
                      }
                    </p>
                    <p className="text-sm text-deep-navy/60 truncate">
                      {user.email || `${user.role} at ${user.company || 'ConsultFlow'}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                <Link
                  href="/profile"
                  onClick={onToggle}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-medium/20 transition-colors text-left"
                >
                  <span>👤</span>
                  <span className="text-sm text-deep-navy">Profile</span>
                </Link>
                
                <Link
                  href="/settings"
                  onClick={onToggle}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-medium/20 transition-colors text-left"
                >
                  <span>⚙️</span>
                  <span className="text-sm text-deep-navy">Settings</span>
                </Link>
                
                <hr className="my-2 border-medium/20" />
                
                <button
                  onClick={() => {
                    onToggle();
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-left text-red-600"
                  data-testid="logout-button"
                >
                  <span>🚪</span>
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Mobile drawer component
const MobileDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  navigationItems: Array<{ href: string; label: string; icon: string }>;
  currentPath: string;
}> = ({ isOpen, onClose, navigationItems, currentPath }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 lg:hidden"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold bg-gradient-to-r from-deep-navy to-cobalt bg-clip-text text-transparent">
                  ConsultFlow
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-medium/20 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = currentPath === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                        ${isActive
                          ? 'bg-cobalt text-white'
                          : 'text-deep-navy hover:bg-medium/20'
                        }
                      `}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function Navbar({ className = '' }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, mode, isDemo } = useAuthStore();
  
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = React.useState(false);

  // Don't show navbar on login page
  if (pathname === '/login') {
    return null;
  }

  // Don't show navbar if user is not authenticated
  if (!user) {
    return null;
  }

  const navigationItems = getNavigationItems(user.role);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      <nav className={`bg-white/90 backdrop-blur-sm border-b border-medium/20 sticky top-0 z-30 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileDrawer(true)}
                className="lg:hidden w-10 h-10 rounded-lg hover:bg-medium/20 flex items-center justify-center"
                data-testid="mobile-menu-trigger"
              >
                <svg className="w-5 h-5 text-deep-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo */}
              <Link 
                href={user.role === 'superadmin' ? '/dashboard' : user.role === 'consultant' ? '/dashboard' : '/client'}
                className="flex items-center gap-2"
              >
                <h1 className="text-xl font-bold bg-gradient-to-r from-deep-navy to-cobalt bg-clip-text text-transparent">
                  ConsultFlow
                </h1>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1 ml-8">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm
                        ${isActive
                          ? 'bg-cobalt/10 text-cobalt font-medium'
                          : 'text-deep-navy hover:bg-medium/20'
                        }
                      `}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Environment Badge */}
              <EnvironmentBadge mode={mode} />

              {/* User Menu */}
              <UserMenu
                user={user}
                onLogout={handleLogout}
                isOpen={showUserMenu}
                onToggle={() => setShowUserMenu(!showUserMenu)}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={showMobileDrawer}
        onClose={() => setShowMobileDrawer(false)}
        navigationItems={navigationItems}
        currentPath={pathname}
      />
    </>
  );
}