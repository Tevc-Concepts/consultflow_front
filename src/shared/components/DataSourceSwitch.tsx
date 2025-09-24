'use client';

import * as React from 'react';
import { useAppStore } from '@shared/state/app';

export default function DataSourceSwitch({ className }: { className?: string }) {
    const dataSource = useAppStore(s => s.dataSource || 'sqlite');
    const setDataSource = useAppStore(s => s.setDataSource);
    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => setDataSource((e.target.value as any) || 'sqlite');
    return (
        <div className={["inline-flex items-center gap-2 text-xs", className].filter(Boolean).join(' ')}>
            <span className="text-deep-navy/70">Data source</span>
            <select value={dataSource} onChange={onChange} className="border rounded px-2 py-1 text-xs">
                <option value="demo">Demo (in-memory)</option>
                <option value="sqlite">Local SQLite API</option>
                <option value="frappe">Frappe Backend</option>
            </select>
        </div>
    );
}

export { DataSourceSwitch };
