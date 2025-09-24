'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useInstallPrompt } from '@shared/hooks/useInstallPrompt';

type NavItem = {
    href: string;
    label: string;
    icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
};

const items: NavItem[] = [
    {
        href: '/', label: 'Dashboard', icon: (props) => (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" /></svg>
        )
    },
    {
        href: '/dashboard', label: 'Dashboard (alt)', icon: (props) => (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4z" /></svg>
        )
    },
    {
        href: '/reports', label: 'Reports', icon: (props) => (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6m6 6V7M4 21h16" /></svg>
        )
    },
    {
        href: '/client', label: 'Client', icon: (props) => (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}>
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 12a4 4 0 100-8 4 4 0 000 8z" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20 8a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        )
    },
    {
        href: '/builder', label: 'Builder', icon: (props) => (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
        )
    },
    {
        href: '/forecast', label: 'Forecast', icon: (props) => (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 18l6-6 4 4 6-6" /></svg>
        )
    },
    {
        href: '/upload', label: 'Upload', icon: (props) => (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" /></svg>
        )
    },
    {
        href: '/compliance', label: 'Compliance', icon: (props) => (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 7h14M5 12h14M5 17h14" /></svg>
        )
    },
    {
        href: '/settings', label: 'Settings', icon: (props) => (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06A1.65 1.65 0 0015 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 008.6 15a1.65 1.65 0 00-1.82-.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06A2 2 0 117.04 4.3l.06.06A1.65 1.65 0 009 4.6c.3 0 .59.06.86.17" /></svg>
        )
    }
];

function classNames(...classes: Array<string | false | undefined>) {
    return classes.filter(Boolean).join(' ');
}

export default function Sidebar({ collapsed = false, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
    const pathname = usePathname() || '/';
    const [logoOk, setLogoOk] = React.useState(true);
    const { canInstall, promptInstall } = useInstallPrompt(7);
    return (
        <nav aria-label="Sidebar" className="h-screen sticky top-0 p-3">
            <div className="mb-4 px-3 py-2 rounded-2xl bg-gradient-to-r from-deep-navy to-cobalt text-white shadow-soft flex items-center justify-between gap-2">
                <Link href="/" className="flex items-center gap-2">
                    {logoOk ? (
                        collapsed ? (
                            <Image src="/images/consultflow_primary.png" alt="Consultflow" width={24} height={24} className="rounded" priority onError={() => setLogoOk(false)} />
                        ) : (
                            <Image src="/images/consultflow_primary.png" alt="Consultflow" width={120} height={28} className="h-7 w-auto" priority onError={() => setLogoOk(false)} />
                        )
                    ) : (
                        <span className="font-semibold">{collapsed ? 'CF' : 'Consultflow'}</span>
                    )}
                </Link>
                <div className="flex items-center gap-2">
                    {canInstall && (
                        <button
                            onClick={() => void promptInstall()}
                            className="hidden md:inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-xs hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white"
                            title="Install app"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
                            <span>Install</span>
                        </button>
                    )}
                    <button
                        type="button"
                        aria-pressed={collapsed}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        onClick={onToggle}
                        className="rounded-full p-1 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={["h-5 w-5 transition-transform", collapsed ? 'rotate-180' : ''].join(' ')} aria-hidden="true"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 6l6 6-6 6" /></svg>
                    </button>
                </div>
            </div>
            <ul role="list" className="space-y-1" aria-label="Primary">
                {items.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                aria-current={active ? 'page' : undefined}
                                className={classNames(
                                    'relative flex items-center rounded-xl outline-none',
                                    collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2',
                                    'hover:bg-medium/40 focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2',
                                    active ? 'bg-medium/60 text-deep-navy font-semibold' : 'text-deep-navy/90'
                                )}
                                title={collapsed ? item.label : undefined}
                            >
                                {active && <span aria-hidden className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-cobalt" />}
                                <item.icon className="h-5 w-5" />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export { Sidebar };
