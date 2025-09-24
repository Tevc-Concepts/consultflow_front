'use client';

import * as React from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import InstallPrompt from './InstallPrompt';
import OfflineToast from './OfflineToast';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Notifications from '@shared/components/Notifications';

const KEY = 'consultflow:ui:sidebar-collapsed:v1';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = React.useState<boolean>(false);
    const pathname = usePathname();
    const hideChrome = pathname === '/' || pathname === '/onboarding' || pathname === '/login';

    React.useEffect(() => {
        try { const raw = localStorage.getItem(KEY); if (raw != null) setCollapsed(JSON.parse(raw)); } catch { }
    }, []);
    React.useEffect(() => {
        try { localStorage.setItem(KEY, JSON.stringify(collapsed)); } catch { }
    }, [collapsed]);

    if (hideChrome) {
        return (
            <div className="min-h-screen">
                <Notifications />
                <main id="content" className="relative focus:outline-none">
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                    <InstallPrompt />
                    <OfflineToast />
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen transition-[width] duration-200 ease-in-out">
            {/* Desktop sidebar */}
            <aside className={["hidden md:block shrink-0 border-r border-medium/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 transition-[width] duration-200 ease-in-out", collapsed ? 'w-16' : 'w-64'].join(' ')}>
                <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
            </aside>
            {/* Main content */}
            <main id="content" className="flex-1 relative pb-16 md:pb-0 focus:outline-none">
                <Notifications />
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        data-testid="route-transition"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
                <InstallPrompt />
                <OfflineToast />
                {/* Mobile bottom nav */}
                <nav aria-label="Primary" className="fixed md:hidden bottom-0 inset-x-0 border-t border-medium/60 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
                    <MobileNav />
                </nav>
            </main>
        </div>
    );
}

export { AppShell };
