'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotifications } from '@shared/state/notifications';

export default function Notifications() {
    const { items, dismiss } = useNotifications();

    React.useEffect(() => {
        // Auto-dismiss newest info/success after 5s
        const timers: number[] = [];
        for (const n of items.slice(0, 5)) {
            if (n.kind === 'info' || n.kind === 'success') {
                const t = window.setTimeout(() => dismiss(n.id), 5000);
                timers.push(t);
            }
        }
        return () => { timers.forEach(clearTimeout); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items.length]);

    return (
        <div className="pointer-events-none fixed top-2 right-2 z-50 space-y-2" data-testid="notifications">
            <AnimatePresence>
                {items.slice(0, 5).map((n) => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className={[
                            'pointer-events-auto w-[92vw] max-w-sm rounded-2xl p-3 shadow-soft text-white',
                            n.kind === 'success' && 'bg-gradient-to-r from-emerald to-teal',
                            n.kind === 'warning' && 'bg-gradient-to-r from-amber to-coral',
                            n.kind === 'error' && 'bg-gradient-to-r from-coral to-violet',
                            (!n.kind || n.kind === 'info') && 'bg-gradient-to-r from-deep-navy to-cobalt'
                        ].filter(Boolean).join(' ')}
                        role="status"
                    >
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5">
                                <Icon kind={n.kind ?? 'info'} />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold">{n.title}</div>
                                {n.message && <div className="text-xs opacity-90">{n.message}</div>}
                                {n.action && (
                                    <div className="mt-2">
                                        <button
                                            onClick={() => { n.action?.onClick?.(); if (n.action?.href) window.location.href = n.action.href; }}
                                            className="rounded-full bg-white/20 hover:bg-white/30 px-2 py-0.5 text-xs"
                                        >
                                            {n.action.label}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => dismiss(n.id)}
                                className="rounded-full p-1 hover:bg-white/20"
                                aria-label="Dismiss notification"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

function Icon({ kind }: { kind: 'success' | 'info' | 'warning' | 'error' }) {
    if (kind === 'success') return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    );
    if (kind === 'warning') return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
    );
    if (kind === 'error') return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
    );
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
    );
}

export { Notifications };
