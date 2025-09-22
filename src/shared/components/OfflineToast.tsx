'use client';

import * as React from 'react';

export default function OfflineToast() {
    const [show, setShow] = React.useState(false);

    React.useEffect(() => {
        const origFetch = window.fetch;
        window.fetch = async (...args) => {
            const res = await origFetch(...args);
            try {
                if (res.status === 503) {
                    const ct = res.headers.get('content-type') || '';
                    if (ct.includes('application/json')) {
                        const clone = res.clone();
                        clone.json().then((data) => {
                            if (data && data.offline) {
                                setShow(true);
                                setTimeout(() => setShow(false), 3000);
                            }
                        }).catch(() => { });
                    }
                }
            } catch { }
            return res;
        };
        return () => {
            window.fetch = origFetch;
        };
    }, []);

    if (!show) return null;
    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
            <div className="rounded-full bg-deep-navy text-white text-xs px-3 py-1 shadow-soft-1">
                You are offline. Showing cached data.
            </div>
        </div>
    );
}
