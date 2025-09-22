'use client';

import * as React from 'react';
import { useAppStore, type AppState } from '@shared/state/app';

export default function DemoSwitch({ className }: { className?: string }) {
    const demoMode = useAppStore((s: AppState) => s.demoMode);
    const setDemoMode = useAppStore((s: AppState) => s.setDemoMode);
    return (
        <label className={["inline-flex items-center gap-2 text-xs", className].filter(Boolean).join(' ')} title="Toggle demo data mode">
            <span className="text-deep-navy/70">Demo data</span>
            <button
                type="button"
                role="switch"
                aria-checked={demoMode}
                onClick={() => setDemoMode(!demoMode)}
                className={[
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                    demoMode ? 'bg-cobalt' : 'bg-medium/60'
                ].join(' ')}
            >
                <span
                    className={[
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        demoMode ? 'translate-x-4' : 'translate-x-1'
                    ].join(' ')}
                />
            </button>
        </label>
    );
}

export { DemoSwitch };
