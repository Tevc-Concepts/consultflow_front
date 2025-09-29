'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '/superadmin/dashboard' },
  { name: 'Consultants', href: '/superadmin/consultants' },
  { name: 'Subscriptions', href: '/superadmin/subscriptions' },
  { name: 'Clients', href: '/superadmin/clients' },
  { name: 'Reports', href: '/superadmin/reports' },
  { name: 'Features', href: '/superadmin/features' },
  { name: 'Tickets', href: '/superadmin/tickets' },
  { name: 'System', href: '/superadmin/system' },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function SuperAdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex h-full w-64 flex-col bg-white shadow-lg">
      <div className="flex h-16 items-center justify-center border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Admin</h2>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 rounded-md bg-white p-2 shadow-lg text-xl"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        {sidebarContent}
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween' }}
            className="fixed inset-y-0 left-0 z-40 lg:hidden"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}