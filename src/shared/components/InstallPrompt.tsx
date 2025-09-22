'use client';

import * as React from 'react';
import { useInstallPrompt } from '@shared/hooks/useInstallPrompt';

export default function InstallPrompt() {
    const { canInstall, promptInstall, snooze } = useInstallPrompt(7);
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        if (canInstall) setVisible(true);
    }, [canInstall]);

    async function onInstall() {
        await promptInstall();
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-50">
            <div className="rounded-2xl bg-white shadow-soft border border-medium/60 p-3 md:p-4 flex items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-medium text-deep-navy">Install Consultflow</div>
                    <div className="text-xs text-deep-navy/70">Add to your home screen for a faster, app-like experience.</div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { snooze(); setVisible(false); }}
                        className="text-xs rounded-full px-3 py-1 hover:bg-medium/40 text-deep-navy focus-visible:ring-2 focus-visible:ring-cobalt"
                    >
                        Not now
                    </button>
                    <button
                        onClick={onInstall}
                        className="text-xs rounded-full px-3 py-1 bg-gradient-to-r from-brand-start to-brand-end text-white shadow-soft-1 focus-visible:ring-2 focus-visible:ring-cobalt"
                    >
                        Add to Home Screen
                    </button>
                </div>
            </div>
        </div>
    );
}
