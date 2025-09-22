'use client';

import Link from 'next/link';
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-7 9 7v7a2 2 0 01-2 2h-4a2 2 0 01-2-2V9" /></svg>
        )
    },
    {
        href: '/upload', label: 'Upload', icon: (props) => (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" /></svg>
        )
    },
    {
        href: '/reports', label: 'Reports', icon: (props) => (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6m6 6V7M4 21h16" /></svg>
        )
    },
    {
        href: '/builder', label: 'Builder', icon: (props) => (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
        )
    },
    {
        href: '/compliance', label: 'Compliance', icon: (props) => (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 7h14M5 12h14M5 17h14" /></svg>
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
    }
];

function classNames(...classes: Array<string | false | undefined>) {
    return classes.filter(Boolean).join(' ');
}

export default function MobileNav() {
    const pathname = usePathname() || '/';
    const { canInstall, promptInstall } = useInstallPrompt(7);
    return (
        <ul role="list" className="grid grid-cols-5 relative">
            {canInstall && (
                <li className="absolute -top-9 left-1/2 -translate-x-1/2">
                    <button
                        onClick={() => void promptInstall()}
                        className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-start to-brand-end text-white px-3 py-1 text-xs shadow-soft-1 focus-visible:ring-2 focus-visible:ring-cobalt"
                        aria-label="Install app"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" aria-hidden><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>
                        Install
                    </button>
                </li>
            )}
            {items.map((item) => {
                const active = pathname === item.href;
                return (
                    <li key={item.href} className="contents">
                        <Link
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={classNames(
                                'flex flex-col items-center justify-center gap-1 py-2 text-xs outline-none',
                                'hover:bg-medium/40 focus-visible:ring-2 focus-visible:ring-cobalt',
                                active ? 'text-deep-navy font-medium' : 'text-deep-navy/70'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="sr-only md:not-sr-only">{item.label}</span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

export { MobileNav };
